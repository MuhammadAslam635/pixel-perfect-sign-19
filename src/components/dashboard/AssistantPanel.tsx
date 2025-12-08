import { List, Pencil, Plus } from "lucide-react";
import { FC, useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchChatList, deleteChatById } from "@/services/chat.service";
import { ChatMessage, ChatSummary } from "@/types/chat.types";
import ChatInterface from "./ChatInterface";
import ChatHistoryList from "./ChatHistoryList";
import { toast } from "sonner";

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
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
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

  const handleDeleteChat = async (chatId: string) => {
    if (!chatId) return;
    setDeletingChatId(chatId);
    try {
      await deleteChatById(chatId);
      setChatHistory((prev) => {
        const updated = prev.filter((chat) => chat._id !== chatId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setLocalMessages([]);
        localStorage.removeItem(CURRENT_CHAT_KEY);
      }

      toast.success("Chat deleted");
      await queryClient.invalidateQueries({ queryKey: ["chatList"] });
      await queryClient.invalidateQueries({ queryKey: ["chatDetail", chatId] });
    } catch (error: any) {
      console.error("Failed to delete chat", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to delete the chat. Please try again."
      );
    } finally {
      setDeletingChatId(null);
    }
  };

  const hasActiveChat = currentChatId || localMessages.length > 0;


  return (
    <section 
      ref={panelRef}
      className="hidden assistant-panel mx-auto w-full h-full lg:flex flex-col overflow-hidden relative sm:order-1 animate-in fade-in duration-700"
    >
      <div
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
              background:
                !showChatList && !hasActiveChat ? "#5D5D5D" : "transparent",
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
          selectedChatId={currentChatId}
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
