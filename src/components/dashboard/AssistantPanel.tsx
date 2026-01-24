import { List, Plus } from "lucide-react";
import { FC, useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { fetchChatList, deleteChatById } from "@/services/chat.service";
import { ChatMessage, ChatSummary } from "@/types/chat.types";
import ChatInterface from "./ChatInterface";
import ChatHistoryList from "./ChatHistoryList";
import { toast } from "sonner";
import { getAuthToken } from "@/utils/authHelpers";
import { useTabIsolation } from "@/hooks/useTabIsolation";
import {
  setSelectedChatId,
  setDeletingChatId,
  removeOptimisticMessages,
  setComposerValue,
  removeStreamingChat,
} from "@/store/slices/chatSlice";

type AssistantPanelProps = {
  isDesktop: boolean;
};

const AssistantPanel: FC<AssistantPanelProps> = ({ isDesktop }) => {
  const dispatch = useDispatch();
  const [showChatList, setShowChatList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSummary[]>([]);
  const panelRef = useRef<HTMLElement>(null);
  const toolsContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const hasAutoLoadedRef = useRef(false); // Track if we've already auto-loaded a chat
  const currentAuthTokenRef = useRef<string | null>(null); // Track current auth token

  // Tab isolation - prevents state conflicts between multiple tabs
  useTabIsolation();

  // Redux selectors - MUST be declared before any hooks that use them
  const selectedChatId = useSelector((state: RootState) => state.chat.selectedChatId);
  const deletingChatId = useSelector((state: RootState) => state.chat.deletingChatId);
  const streamingChatIds = useSelector((state: RootState) => state.chat.streamingChatIds);
  const optimisticMessagesByChat = useSelector((state: RootState) => state.chat.optimisticMessagesByChat);

  // Clear selected chat if it's a temp chat without messages on mount
  const hasInitialSelectionCleanupRef = useRef(false);
  useEffect(() => {
    if (!hasInitialSelectionCleanupRef.current) {
      hasInitialSelectionCleanupRef.current = true;

      // Clear selected chat if it's a temp chat without messages
      if (selectedChatId && selectedChatId.startsWith("temp_")) {
        const hasMessages = optimisticMessagesByChat[selectedChatId]?.length > 0;
        if (!hasMessages) {
          dispatch(setSelectedChatId(null));
          setLocalMessages([]);
        }
      }
    }
  }, [selectedChatId, optimisticMessagesByChat, dispatch]);

  // Get current auth token to identify user changes
  const getCurrentAuthToken = (): string | null => {
    return getAuthToken();
  };

  // Use auth token as the identifier since it changes when users switch
  const currentAuthToken = getCurrentAuthToken();

  // Fetch chat list from API (always from database, filtered by userId)
  // Use consistent query key with Chat page
  const { data: apiChatList = [], isLoading: isChatListLoading } = useQuery({
    queryKey: ["chatList"],
    queryFn: fetchChatList,
    staleTime: 30_000,
    enabled: !!currentAuthToken, // Only fetch if we have an auth token
    // Always filter out temp chats when reading from cache or fresh data
    select: (data) => data.filter(chat => !chat._id.startsWith("temp_")),
  });

  // Detect user/company change and reset state
  useEffect(() => {
    const authToken = getCurrentAuthToken();

    // If auth token has changed, reset everything
    if (
      currentAuthTokenRef.current !== null &&
      currentAuthTokenRef.current !== authToken
    ) {
      // User/company has changed - clear cache and reset state
      queryClient.clear(); // Clear all queries to avoid stale data from previous user
      dispatch(setSelectedChatId(null));
      setLocalMessages([]);
      setChatHistory([]);
      hasAutoLoadedRef.current = false; // Reset auto-load flag for new user
    }

    // Update current auth token reference
    currentAuthTokenRef.current = authToken;
  }, [currentAuthToken, queryClient]);

  // Clean up stale temporary chats from cache
  const lastCleanupTimeRef = useRef<number>(0);
  useEffect(() => {
    const now = Date.now();
    // Only run cleanup once per second to avoid excessive updates
    if (now - lastCleanupTimeRef.current < 1000) {
      return;
    }
    lastCleanupTimeRef.current = now;

    // Remove temp chats from cache
    queryClient.setQueryData<ChatSummary[]>(
      ["chatList"],
      (oldList = []) => {
        if (!oldList) return [];
        const filtered = oldList.filter(chat => !chat._id.startsWith("temp_"));
        // Only return new array if something changed to avoid infinite loops
        return filtered.length !== oldList.length ? filtered : oldList;
      }
    );

    // If selected chat is a temp chat that no longer has optimistic messages, clear it
    if (selectedChatId && selectedChatId.startsWith("temp_")) {
      const hasOptimisticMessages = optimisticMessagesByChat[selectedChatId]?.length > 0;
      if (!hasOptimisticMessages) {
        dispatch(setSelectedChatId(null));
        setLocalMessages([]);
      }
    }
  }, [queryClient, selectedChatId, dispatch, chatHistory, optimisticMessagesByChat]);

  // Update chat history from API response
  // Use a ref to track previous chat list to avoid unnecessary updates
  const prevChatListRef = useRef<string>("");
  useEffect(() => {
    // Double-check: filter out temp chats (apiChatList should already be filtered by select)
    const filteredList = apiChatList.filter(chat => !chat._id.startsWith("temp_"));
    const chatListKey = filteredList.map(chat => chat._id).join(",");
    if (prevChatListRef.current !== chatListKey) {
      prevChatListRef.current = chatListKey;
      setChatHistory(filteredList);
    }
  }, [apiChatList]);

  // Compute full chat list including active temp chats (currently being processed)
  const fullChatHistory = useMemo(() => {
    const list = [...chatHistory];

    // Include ALL active temp chats (currently being processed)
    // Check all temp chats in optimisticMessagesByChat
    Object.keys(optimisticMessagesByChat).forEach(chatId => {
      if (chatId.startsWith("temp_") && optimisticMessagesByChat[chatId]?.length > 0) {
        // Only include if not already in the list
        if (!list.some(chat => chat._id === chatId)) {
          const firstMessage = optimisticMessagesByChat[chatId][0];
          list.unshift({
            _id: chatId,
            title: firstMessage.content.length > 50
              ? firstMessage.content.substring(0, 50) + "..."
              : firstMessage.content,
            createdAt: firstMessage.createdAt,
            updatedAt: firstMessage.createdAt,
          });
        }
      }
    });

    return list;
  }, [chatHistory, optimisticMessagesByChat]);

  // Auto-load the most recent chat on initial mount only (for current user)
  // Use a ref to track the first chat ID to avoid re-triggering
  const firstChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    const authToken = getCurrentAuthToken();
    const firstChatId = apiChatList.length > 0 ? apiChatList[0]?._id : null;

    // Only auto-load if:
    // 1. We have a current auth token
    // 2. The auth token matches the current one OR ref is null (first mount) - to prevent loading stale data
    // 3. We haven't auto-loaded yet for this user
    // 4. We have chat data
    // 5. No chat is currently selected
    // 6. Data is fresh (not loading)
    // 7. The first chat ID hasn't changed (to prevent re-loading when list updates)
    if (
      authToken &&
      (currentAuthTokenRef.current === null ||
        authToken === currentAuthTokenRef.current) &&
      !hasAutoLoadedRef.current &&
      firstChatId &&
      firstChatId !== firstChatIdRef.current &&
      !selectedChatId &&
      localMessages.length === 0 &&
      !isChatListLoading // Only auto-load when data is fresh (not loading)
    ) {
      // Mark as loaded and track the chat ID BEFORE calling handleSelectChat to prevent re-triggering
      hasAutoLoadedRef.current = true;
      firstChatIdRef.current = firstChatId;
      handleSelectChat(firstChatId);
    }
  }, [
    apiChatList.length, // Only depend on length, not the array itself
    selectedChatId,
    // Removed localMessages.length - it causes infinite loop when handleSelectChat sets it
    isChatListLoading,
    currentAuthToken,
    // Removed dispatch - it's stable and doesn't need to be in deps
  ]);

  // Restore chat when returning from navigation
  // If selectedChatId exists and chat is/was streaming, refetch to get latest state
  const isRestoringRef = useRef(false);
  useEffect(() => {
    // Check if this chat was streaming (might have completed while away)
    const wasStreaming = streamingChatIds.includes(selectedChatId || "");
    const hasOptimisticMessages = selectedChatId && optimisticMessagesByChat[selectedChatId]?.length > 0;

    if (
      selectedChatId &&
      !isChatListLoading &&
      !isRestoringRef.current &&
      !selectedChatId.startsWith("temp_") && // Don't refetch temp chats
      (wasStreaming || hasOptimisticMessages) // Only refetch if chat was in progress
    ) {
      isRestoringRef.current = true;

      // Invalidate and refetch to get latest state from server
      queryClient.invalidateQueries({ queryKey: ["chatDetail", selectedChatId] });

      queryClient
        .fetchQuery({
          queryKey: ["chatDetail", selectedChatId],
          queryFn: async () => {
            const { fetchChatById } = await import("@/services/chat.service");
            return fetchChatById(selectedChatId);
          },
        })
        .then((chatDetail) => {
          if (chatDetail?.messages) {
            setLocalMessages(chatDetail.messages);
            // If we got complete messages from server, clear optimistic messages
            if (chatDetail.messages.length > 0) {
              dispatch(removeOptimisticMessages(selectedChatId));
              // Also clear from streaming state if it's complete
              const lastMessage = chatDetail.messages[chatDetail.messages.length - 1];
              if (lastMessage?.role === "assistant") {
                // Response is complete, remove from streaming
                dispatch(removeStreamingChat(selectedChatId));
              }
            }
          }
        })
        .catch((error) => {
          console.error("Failed to restore chat:", error);
          // Don't clear selection on error - keep showing optimistic messages
        })
        .finally(() => {
          isRestoringRef.current = false;
        });
    }
  }, [selectedChatId, isChatListLoading, queryClient, dispatch, streamingChatIds, optimisticMessagesByChat]);

  const handleSelectChat = (chatId: string) => {
    dispatch(setSelectedChatId(chatId));
    setShowChatList(false);
    // Don't fetch chat messages for temporary IDs - they only exist in optimistic state
    if (chatId?.startsWith("temp_")) {
      setLocalMessages([]);
      return;
    }
    // Fetch chat messages for selected chat
    queryClient
      .fetchQuery({
        queryKey: ["chatDetail", chatId],
        queryFn: async () => {
          const { fetchChatById } = await import("@/services/chat.service");
          return fetchChatById(chatId);
        },
      })
      .then((chatDetail) => {
        if (chatDetail?.messages) {
          setLocalMessages(chatDetail.messages);
        }
      });
  };

  const handleStartNewChat = () => {
    // Clear selected chat ID
    dispatch(setSelectedChatId(null));

    // Clear composer input value
    dispatch(setComposerValue(""));

    // Clear local messages
    setLocalMessages([]);

    // Clear optimistic messages for new chat
    dispatch(removeOptimisticMessages("__new_chat__"));

    // Close chat list and clear search
    setShowChatList(false);
    setSearchTerm("");
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!chatId) return;
    dispatch(setDeletingChatId(chatId));
    try {
      await deleteChatById(chatId);
      setChatHistory((prev) => prev.filter((chat) => chat._id !== chatId));

      if (selectedChatId === chatId) {
        dispatch(setSelectedChatId(null));
        setLocalMessages([]);
      }

      // Remove optimistic messages for deleted chat
      dispatch(removeOptimisticMessages(chatId));

      toast.success("Chat deleted");
      await queryClient.invalidateQueries({
        queryKey: ["chatList"],
      });
      await queryClient.invalidateQueries({ queryKey: ["chatDetail", chatId] });
    } catch (error: any) {
      console.error("Failed to delete chat", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to delete the chat. Please try again."
      );
    } finally {
      dispatch(setDeletingChatId(null));
    }
  };

  const hasActiveChat = selectedChatId || localMessages.length > 0;

  // Set width with !important using DOM API
  useEffect(() => {
    if (toolsContainerRef.current) {
      toolsContainerRef.current.style.setProperty("width", "fit-content", "important");
    }
  }, []);

  return (
    <section
      ref={panelRef}
      className="hidden assistant-panel mx-auto w-full h-full lg:flex flex-col overflow-hidden relative sm:order-1 animate-in fade-in duration-700"
    >
      <div
        ref={toolsContainerRef}
        style={{
          position: "absolute",
          top: "15px",
          left: "28px",
          zIndex: 10,
        }}
      >
        <div
          className="assistant-tools flex gap-2"
          style={{
            background: "#404040",
            position: "relative",
            top: "0",
            left: "0",
            width: "fit-content",
            padding: "12px",
            borderRadius: "25px",
          }}
        >
          <div
            className="assistant-tool cursor-pointer"
            onClick={() => setShowChatList(!showChatList)}
            style={{ background: showChatList ? "#5D5D5D" : "transparent" }}
          >
            <List size={14} />
          </div>
          <div
            className="assistant-tool cursor-pointer"
            onClick={handleStartNewChat}
            style={{
              background: !showChatList ? "#5D5D5D" : "transparent",
            }}
          >
            <Plus size={14} />
          </div>
        </div>
      </div>
      {/* Render Chat List or Chat Interface */}
        <div 
    className="flex-1 overflow-y-auto"
    style={{
      paddingTop: "90px",
    }}
  >
      {showChatList ? (
        <ChatHistoryList
          chats={fullChatHistory}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onStartNewChat={handleStartNewChat}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          isLoading={isChatListLoading}
          onDeleteChat={handleDeleteChat}
          deletingChatId={deletingChatId}
          streamingChatIds={streamingChatIds}
        />
      ) : (
        <ChatInterface
          currentChatId={selectedChatId}
          onChatIdChange={(chatId) => dispatch(setSelectedChatId(chatId))}
          onMessagesChange={setLocalMessages}
          initialMessages={localMessages}
        />
      )}
      </div>
    </section>
  );
};

export default AssistantPanel;
