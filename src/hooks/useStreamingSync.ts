import { useEffect, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { 
  setRemoteStreamingChatIds, 
  CURRENT_TAB_ID, 
  addStreamingEvent 
} from "@/store/slices/chatSlice";
import { StreamEvent } from "@/services/chat.service";

const STORAGE_PREFIX = "chat_streams_";

/**
 * Hook to synchronize streaming status and events across tabs.
 * Uses localStorage for rough "is streaming" status and BroadcastChannel for fine-grained events.
 */
export const useStreamingSync = () => {
  const dispatch = useDispatch();
  const streamingStatusByChat = useSelector((state: RootState) => state.chat.streamingStatusByChat);
  const tabId = useSelector((state: RootState) => state.chat.tabId);
  
  // Ref to track local instance identity
  const instanceId = useRef(Math.random().toString(36).substr(2, 9)).current;
  const MY_STORAGE_KEY = `${STORAGE_PREFIX}${tabId}_${instanceId}`;
  
  // Broadcast Channel for high-frequency events
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // 1. Compute active local streaming IDs
  const activeChatIds = useMemo(() => {
    return Object.keys(streamingStatusByChat).filter(
      (id) => streamingStatusByChat[id]?.isStreaming
    );
  }, [streamingStatusByChat]);

  // 2. Sync local status to storage with timestamp
  useEffect(() => {
    if (activeChatIds.length > 0) {
      // Store with timestamp to detect stale entries
      const data = {
        chatIds: activeChatIds,
        timestamp: Date.now()
      };
      localStorage.setItem(MY_STORAGE_KEY, JSON.stringify(data));
    } else {
      // Immediately remove from localStorage when no active streams
      localStorage.removeItem(MY_STORAGE_KEY);
    }
  }, [activeChatIds, MY_STORAGE_KEY]);

  // 3. Cleanup storage on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem(MY_STORAGE_KEY);
    };
  }, [MY_STORAGE_KEY]);

  // Ref to track last dispatched remote IDs to avoid redundant updates
  const lastRemoteIdsRef = useRef<string[]>([]);

  // 4. Function to sync remote streams by scanning all keys
  const syncRemoteStreams = useCallback(() => {
    const allKeys = Object.keys(localStorage);
    const remoteKeys = allKeys.filter(
      (key) => key.startsWith(STORAGE_PREFIX) && key !== MY_STORAGE_KEY
    );
    
    const aggregatedRemoteIds = new Set<string>();
    const now = Date.now();
    const STALE_THRESHOLD = 30000; // 30 seconds
    
    remoteKeys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          
          // Handle both old format (array) and new format (object with timestamp)
          let ids: string[] = [];
          let timestamp = now;
          
          if (Array.isArray(parsed)) {
            // Old format - assume it's current
            ids = parsed;
          } else if (parsed.chatIds && Array.isArray(parsed.chatIds)) {
            // New format with timestamp
            ids = parsed.chatIds;
            timestamp = parsed.timestamp || now;
          }
          
          // Filter out stale entries
          if (now - timestamp < STALE_THRESHOLD) {
            ids.forEach(id => aggregatedRemoteIds.add(id));
          } else {
            // Remove stale entry
            console.log('[StreamingSync] Removing stale entry:', key);
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.error("Error parsing remote stream sync key:", key, e);
        // Remove corrupted entry
        localStorage.removeItem(key);
      }
    });
    
    const newRemoteIds = Array.from(aggregatedRemoteIds).sort();
    
    // Only dispatch if the IDs have actually changed (simple sort + join check)
    if (newRemoteIds.join(',') !== lastRemoteIdsRef.current.join(',')) {
      lastRemoteIdsRef.current = newRemoteIds;
      dispatch(setRemoteStreamingChatIds(newRemoteIds));
    }
  }, [dispatch, MY_STORAGE_KEY]);

  // 5. Listen for storage events (from other tabs)
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key.startsWith(STORAGE_PREFIX)) {
        syncRemoteStreams();
      }
    };

    window.addEventListener("storage", handleStorage);
    // Initial sync
    syncRemoteStreams();
    
    // Fallback polling for tab closes that don't trigger storage/unload events
    const interval = setInterval(syncRemoteStreams, 5000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [syncRemoteStreams]);

  // 6. Setup BroadcastChannel for fine-grained events
  useEffect(() => {
    broadcastChannelRef.current = new BroadcastChannel("chat_streaming_sync");

    broadcastChannelRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      
      // Ignore events from self
      if (payload?.originTabId === tabId) return;

      if (type === "STREAM_EVENT") {
        const { chatId, event: streamEvent } = payload;
        dispatch(addStreamingEvent({ chatId, event: streamEvent }));
      }
    };

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [dispatch, tabId]);

  // 8. Clean up stale entries on mount
  useEffect(() => {
    const cleanupStaleEntries = () => {
      const allKeys = Object.keys(localStorage);
      const streamKeys = allKeys.filter(key => key.startsWith(STORAGE_PREFIX));
      const now = Date.now();
      const STALE_THRESHOLD = 30000; // 30 seconds
      
      streamKeys.forEach(key => {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            
            // Check if entry has timestamp and is stale
            if (parsed.timestamp && (now - parsed.timestamp > STALE_THRESHOLD)) {
              console.log('[StreamingSync] Cleaning up stale entry on mount:', key);
              localStorage.removeItem(key);
            }
            // Also remove old format entries (arrays without timestamp)
            else if (Array.isArray(parsed)) {
              console.log('[StreamingSync] Cleaning up old format entry:', key);
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Remove corrupted entries
          console.log('[StreamingSync] Removing corrupted entry:', key);
          localStorage.removeItem(key);
        }
      });
    };
    
    cleanupStaleEntries();
  }, []); // Run once on mount


  // 7. Helper to broadcast an event
  const broadcastEvent = useCallback((chatId: string, event: StreamEvent) => {
    broadcastChannelRef.current?.postMessage({
      type: "STREAM_EVENT",
      payload: { 
        chatId, 
        event, 
        originTabId: tabId 
      },
    });
  }, [tabId]);

  return { broadcastEvent };
};
