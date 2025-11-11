import { useMemo } from "react";
import { Plus, Search, MessageCircle, Loader2 } from "lucide-react";
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
  onStartNewChat: () => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  isLoading?: boolean;
};

const ChatList = ({
  chats,
  selectedChatId,
  onSelectChat,
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

  return (
    <aside className="flex h-[80vh] w-full max-w-[17rem] flex-col rounded-3xl border border-white/5 bg-[#121216]/85 p-5 backdrop-blur-xl overflow-hidden lg:max-w-[18rem] lg:self-stretch">
      <div className="mb-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
              Chats
            </p>
            <h2 className="text-2xl font-semibold text-white">EmpaTech OS</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={onStartNewChat}
          >
            <Plus className="size-5" />
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search conversations"
            className="h-10 rounded-full border border-white/5 bg-white/5 pl-11 text-xs text-white placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/60"
          />
        </div>
      </div>

      <div className="mb-2.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground/60">
        <span className="inline-flex size-2 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        Active Conversations
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
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
                const truncatedTitle = truncateText(fullTitle, 20);

                return (
                  <button
                    key={chat._id}
                    type="button"
                    onClick={() => onSelectChat(chat._id)}
                    className={cn(
                      "group w-full rounded-xl border border-transparent bg-white/0 px-3 py-2.5 text-left transition-all duration-300",
                      selectedChatId === chat._id
                        ? "border-primary/40 bg-primary/10 shadow-[0_12px_40px_rgba(56,189,248,0.08)]"
                        : "hover:border-white/10 hover:bg-white/5"
                    )}
                  >
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <p
                        className="flex-1 truncate text-[13px] font-medium text-white"
                        title={chat.title || "Untitled Conversation"}
                      >
                        {truncatedTitle}
                      </p>
                      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40">
                        Active
                      </span>
                    </div>
                    {lastMessage ? (
                      <>
                        <p
                          className="mt-1 truncate text-[11px] text-muted-foreground/70"
                          title={lastMessage.content}
                        >
                          {truncateText(lastMessage.content, 35)}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-[11px] text-muted-foreground/50">
                        No messages yet
                      </p>
                    )}
                  </button>
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
