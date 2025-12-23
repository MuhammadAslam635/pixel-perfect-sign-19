import { List, Pencil, Plus } from "lucide-react";
import { FC, useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { fetchChatList, deleteChatById } from "@/services/chat.service";
import { ChatMessage, ChatSummary } from "@/types/chat.types";
import ChatInterface from "./ChatInterface";
import ChatHistoryList from "./ChatHistoryList";
import { toast } from "sonner";
import { getUserData, getAuthToken } from "@/utils/authHelpers";
import {
  setSelectedChatId,
  setDeletingChatId,
  removeOptimisticMessages,
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

  // Redux selectors
  const selectedChatId = useSelector((state: RootState) => state.chat.selectedChatId);
  const deletingChatId = useSelector((state: RootState) => state.chat.deletingChatId);

  // Get current auth token to identify user changes
  const getCurrentAuthToken = (): string | null => {
    return getAuthToken();
  };

  // Get current user ID from auth data (for query key)
  const getCurrentUserId = (): string | null => {
    const userData = getUserData();
    // Try to get user ID from various possible fields
    return (
      userData?.userId ||
      userData?.user?._id ||
      userData?._id ||
      userData?.id ||
      null
    );
  };

  // Use auth token as the identifier since it changes when users switch
  const currentAuthToken = getCurrentAuthToken();
  const currentUserId = getCurrentUserId();

  // Fetch chat list from API (always from database, filtered by userId)
  // Include auth token in query key to ensure different users get different cache entries
  const { data: apiChatList = [], isLoading: isChatListLoading } = useQuery({
    queryKey: ["chatList", currentAuthToken],
    queryFn: fetchChatList,
    staleTime: 30_000,
    enabled: !!currentAuthToken, // Only fetch if we have an auth token
  });

  // Detect user/company change and reset state
  useEffect(() => {
    const authToken = getCurrentAuthToken();

    // If auth token has changed, reset everything
    if (
      currentAuthTokenRef.current !== null &&
      currentAuthTokenRef.current !== authToken
    ) {
      // User/company has changed - invalidate queries and reset state
      queryClient.invalidateQueries({ queryKey: ["chatList"] });
      queryClient.invalidateQueries({ queryKey: ["chatDetail"] });
      dispatch(setSelectedChatId(null));
      setLocalMessages([]);
      setChatHistory([]);
      hasAutoLoadedRef.current = false; // Reset auto-load flag for new user
    }

    // Update current auth token reference
    currentAuthTokenRef.current = authToken;
  }, [currentAuthToken, queryClient]);

  // Update chat history from API response
  // Use a ref to track previous chat list to avoid unnecessary updates
  const prevChatListRef = useRef<string>("");
  useEffect(() => {
    const chatListKey = apiChatList.map(chat => chat._id).join(",");
    if (prevChatListRef.current !== chatListKey) {
      prevChatListRef.current = chatListKey;
      setChatHistory(apiChatList);
    }
  }, [apiChatList]);

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
    dispatch(setSelectedChatId(null));
    setLocalMessages([]);
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
      const authToken = getCurrentAuthToken();
      await queryClient.invalidateQueries({
        queryKey: ["chatList", authToken],
      });
      await queryClient.invalidateQueries({ queryKey: ["chatDetail", chatId] });
    } catch (error: any) {
      console.error("Failed to delete chat", error);
      toast.error(
        error?.response?.data?.message ||
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
      {showChatList ? (
        <ChatHistoryList
          chats={chatHistory}
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
          onStartNewChat={handleStartNewChat}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          isLoading={isChatListLoading}
          onDeleteChat={handleDeleteChat}
          deletingChatId={deletingChatId}
        />
      ) : (
        <ChatInterface
          key={selectedChatId || "new-chat"}
          currentChatId={selectedChatId}
          onChatIdChange={(chatId) => dispatch(setSelectedChatId(chatId))}
          onMessagesChange={setLocalMessages}
          initialMessages={localMessages}
        />
      )}
    </section>
  );
};

export default AssistantPanel;
