import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { 
  setRemoteStreamingChatIds, 
  CURRENT_TAB_ID, 
  addStreamingEvent 
} from "@/store/slices/chatSlice";
import { StreamEvent } from "@/services/chat.service";
import { useCallback } from "react";

export const useStreamingSync = () => {
  const dispatch = useDispatch();
  const streamingChatIds = useSelector((state: RootState) => state.chat.streamingChatIds);

  const STORAGE_PREFIX = "chat_streams_";
  const MY_STORAGE_KEY = `${STORAGE_PREFIX}${CURRENT_TAB_ID}`;

  // Sync LOCAL changes to STORAGE
  useEffect(() => {
    // Write my local streaming IDs to my specific key
    localStorage.setItem(MY_STORAGE_KEY, JSON.stringify(streamingChatIds));
    
    // Clear my key on unmount
    return () => {
      localStorage.removeItem(MY_STORAGE_KEY);
    };
  }, [streamingChatIds, MY_STORAGE_KEY]);

  // Sync STORAGE changes to REMOTE STATE
  useEffect(() => {
    const syncRemoteStreams = () => {
      const allKeys = Object.keys(localStorage);
      const streamKeys = allKeys.filter(key => key.startsWith(STORAGE_PREFIX) && key !== MY_STORAGE_KEY);
      
      const aggregatedIds = new Set<string>();
      
      streamKeys.forEach(key => {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const ids: string[] = JSON.parse(item);
            ids.forEach(id => aggregatedIds.add(id));
          }
        } catch (e) {
          console.error("Error parsing stream sync key:", key, e);
        }
      });
      
      dispatch(setRemoteStreamingChatIds(Array.from(aggregatedIds)));
    };

    // Initial Sync
    syncRemoteStreams();

    // Listen for storage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith(STORAGE_PREFIX)) {
        syncRemoteStreams();
      }
    };

    window.addEventListener("storage", handleStorage);
    
    // Also poll periodically to catch cleanup/tab closes that might not trigger event reliably in all browsers
    // or if we missed an event
    const interval = setInterval(syncRemoteStreams, 2000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [dispatch, MY_STORAGE_KEY]);

  // Broadcast specific streaming events (like "Thinking..." steps) to other tabs
  useEffect(() => {
    const channel = new BroadcastChannel("empa_stream_events");
    
    channel.onmessage = (event) => {
        if (event.data && event.data.type === "EVENT" && event.data.chatId && event.data.event) {
            dispatch(addStreamingEvent({ 
                chatId: event.data.chatId, 
                event: event.data.event 
            }));
        }
    };

    return () => {
        channel.close();
    };
  }, [dispatch]);

  const broadcastEvent = useCallback((chatId: string, event: StreamEvent) => {
    const channel = new BroadcastChannel("empa_stream_events");
    channel.postMessage({ type: "EVENT", chatId, event });
    channel.close();
  }, []);

  return { broadcastEvent };
};
