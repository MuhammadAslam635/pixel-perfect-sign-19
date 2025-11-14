import { List, Pencil } from "lucide-react";
import { FC, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChatList } from "@/services/chat.service";
import { ChatMessage, ChatSummary } from "@/types/chat.types";
import ChatInterface from "./ChatInterface";
import ChatHistoryList from "./ChatHistoryList";

const STORAGE_KEY = "assistant_panel_chat_history";
const CURRENT_CHAT_KEY = "assistant_panel_current_chat";

type AssistantPanelProps = {
  isDesktop: boolean;
};

const AssistantPanel: FC<AssistantPanelProps> = ({ isDesktop }) => {
  const [showChatList, setShowChatList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSummary[]>([]);
  const queryClient = useQueryClient();

  // Load chat history from localStorage on mount
  // On reload, clear current chat to show greeting (chat remains in list)
  useEffect(() => {
    const storedHistory = localStorage.getItem(STORAGE_KEY);

    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        setChatHistory(parsed);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }

    // Clear current chat on page reload to show greeting
    // The chat will still be available in the chat list
    localStorage.removeItem(CURRENT_CHAT_KEY);
    setCurrentChatId(null);
    setLocalMessages([]);
  }, []);

  // Fetch chat list from API
  const { data: apiChatList = [], isLoading: isChatListLoading } = useQuery({
    queryKey: ["chatList"],
    queryFn: fetchChatList,
    staleTime: 30_000,
  });

  // Merge API chat list with local history
  useEffect(() => {
    if (apiChatList.length > 0) {
      setChatHistory(apiChatList);
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apiChatList));
    }
  }, [apiChatList]);

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowChatList(false);
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
    setCurrentChatId(null);
    setLocalMessages([]);
    setShowChatList(false);
    setSearchTerm("");
    localStorage.removeItem(CURRENT_CHAT_KEY);
  };

  const hasActiveChat = currentChatId || localMessages.length > 0;

  return (
    <section className="assistant-panel mx-auto w-full h-full flex flex-col overflow-hidden relative">
      <div
        className="assistant-tools flex gap-2 mb-4"
        style={{ background: "#404040" }}
      >
        <div
          className="assistant-tool cursor-pointer"
          onClick={() => setShowChatList(!showChatList)}
          style={{ background: showChatList ? "#5D5D5D" : "transparent" }}
        >
          <List size={12} />
        </div>
        <div
          className="assistant-tool cursor-pointer"
          onClick={handleStartNewChat}
          style={{
            background:
              !showChatList && !hasActiveChat ? "#5D5D5D" : "transparent",
          }}
        >
          <Pencil size={12} />
        </div>
      </div>

      {/* Render Chat List or Chat Interface */}
      {showChatList ? (
        <ChatHistoryList
          chats={chatHistory}
          selectedChatId={currentChatId}
          onSelectChat={handleSelectChat}
          onStartNewChat={handleStartNewChat}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          isLoading={isChatListLoading}
        />
      ) : (
        <ChatInterface
          key={currentChatId || "new-chat"}
          currentChatId={currentChatId}
          onChatIdChange={setCurrentChatId}
          onMessagesChange={setLocalMessages}
          initialMessages={localMessages}
        />
      )}
    </section>
  );
};

export default AssistantPanel;
