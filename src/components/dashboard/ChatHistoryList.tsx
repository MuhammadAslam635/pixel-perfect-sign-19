import { Search, MessageCircle, Loader2 } from "lucide-react";
import { FC, useMemo } from "react";
import { ChatSummary } from "@/types/chat.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ChatHistoryItem from "./ChatHistoryItem";

type ChatHistoryListProps = {
  chats: ChatSummary[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onStartNewChat: () => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  isLoading?: boolean;
  onDeleteChat?: (chatId: string) => void;
  deletingChatId?: string | null;
};

const ChatHistoryList: FC<ChatHistoryListProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  onStartNewChat,
  searchTerm,
  onSearchTermChange,
  isLoading = false,
  onDeleteChat,
  deletingChatId = null,
}) => {
  const filteredChats = useMemo(() => {
    if (!searchTerm) {
      return chats;
    }

    const query = searchTerm.toLowerCase();
    return chats.filter((chat) => {
      const titleMatch = chat.title?.toLowerCase().includes(query);
      const messageMatch = chat.messages?.some((message) =>
        message.content.toLowerCase().includes(query)
      );
      return titleMatch || messageMatch;
    });
  }, [chats, searchTerm]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="mb-6 space-y-4 flex-shrink-0 ">
        <div className="relative mt-8">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-white/60" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search.."
            className="h-12 rounded-full border border-white/5 bg-transparent pl-12 text-sm text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/30"
          />
        </div>
      </div>

      <div className="mb-4 text-sm font-semibold text-white/80 flex-shrink-0">
        Chats
      </div>

      <div
        className="h-4/5 overflow-y-auto overflow-x-hidden pr-2"
        style={
          {
            scrollbarWidth: "none",
            scrollbarColor: "transparent transparent",
          } as React.CSSProperties
        }
        onWheel={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground/70">
              <Loader2 className="size-5 animate-spin" />
              <span className="ml-2 text-sm">Loading chats…</span>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground/70">
              <MessageCircle className="mx-auto mb-3 size-6 text-muted-foreground/40" />
              <p>No conversations found.</p>
              <Button
                size="sm"
                className="mt-4 rounded-full bg-primary px-4"
                onClick={onStartNewChat}
              >
                Start a new chat
              </Button>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatHistoryItem
                key={chat._id}
                chat={chat}
                selectedChatId={selectedChatId}
                onSelectChat={onSelectChat}
                onDeleteChat={onDeleteChat}
                deletingChatId={deletingChatId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryList;
