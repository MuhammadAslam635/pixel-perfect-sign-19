import { useMemo } from "react";
import { Search, MessageCircle, Loader2, PenSquare, EllipsisVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ChatSummary } from "@/types/chat.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type ChatListProps = {
  chats: ChatSummary[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onChatOptions?: (chatId: string) => void;
  onStartNewChat: () => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  isLoading?: boolean;
};

const ChatList = ({
  chats,
  selectedChatId,
  onSelectChat,
  onChatOptions,
  onStartNewChat,
  searchTerm,
  onSearchTermChange,
  isLoading = false,
}: ChatListProps) => {
  const truncateText = (text: string, limit: number) =>
    text.length > limit ? `${text.slice(0, limit - 1)}…` : text;

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

  const handleChatOptions = (chatId: string) => {
    onChatOptions?.(chatId);
  };

  return (
    <aside className="flex h-screen w-full max-w-[17rem] flex-col overflow-hidden rounded-[40px] border border-[#FFFFFF1A] bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0.00002)_38.08%,_rgba(255,255,255,0.00002)_56.68%,_rgba(255,255,255,0.02)_95.1%)] p-5 backdrop-blur-xl lg:max-w-[18rem] lg:self-stretch">
      <div className="mb-6 space-y-4">
        <Button
          variant="ghost"
          className="group flex w-full items-center justify-start gap-3 rounded-2xl px-2 py-2 text-left text-sm font-medium text-white transition hover:bg-transparent hover:text-white/90"
          onClick={onStartNewChat}
        >
          <PenSquare className="size-5 text-white/70 transition group-hover:text-white/90" />
          <span>New Chat</span>
        </Button>

        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-white/60" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search.."
            className="h-12 rounded-full border border-white/5 bg-transparent pl-12 text-sm text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/30"
            style={{
              borderRadius: "9999px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          />
        </div>
      </div>

      <div className="mb-3 text-sm font-semibold text-white/80">Chats</div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" hideScrollbars>
          <div className="space-y-1.5 pr-1">
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
              filteredChats.map((chat) => {
                const lastMessage = chat.messages?.at(-1);
                const fullTitle = chat.title || "Untitled Conversation";
                const truncatedTitle = truncateText(fullTitle, 18);

                return (
                  <div
                    key={chat._id}
                    className={cn(
                      "group flex w-full items-center rounded-2xl border border-[#2B2A38]/40 bg-[#FFFFFF0A] px-4 py-4 shadow-[0_0_80px_rgba(0,0,0,0.08)] transition-all duration-300",
                      selectedChatId === chat._id
                        ? "border-white/60 bg-white/10 shadow-[0_0_90px_rgba(0,0,0,0.15)]"
                        : "hover:border-white/30 hover:bg-white/12 hover:shadow-[0_0_90px_rgba(0,0,0,0.12)]"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectChat(chat._id)}
                      className="flex min-w-0 flex-1 flex-col text-left"
                    >
                      <div className="flex items-center gap-2">
                        <p
                          className="flex-1 truncate text-sm font-semibold text-white"
                          title={chat.title || "Untitled Conversation"}
                        >
                          {truncatedTitle}
                        </p>
                      </div>
                      {lastMessage ? (
                        <p
                          className="mt-1 truncate text-[12px] text-white/60"
                          title={lastMessage.content}
                        >
                          {truncateText(lastMessage.content, 25)}
                        </p>
                      ) : (
                        <p className="mt-1 text-[12px] text-white/45">
                          No messages yet
                        </p>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChatOptions(chat._id)}
                      className="ml-3 flex size-6 items-center justify-center rounded-full border border-transparent transition"
                      aria-label="Chat options"
                    >
                      <EllipsisVertical className="size-4 text-white " />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
};

export default ChatList;
