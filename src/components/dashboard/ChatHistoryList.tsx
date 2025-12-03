import {
  Search,
  MessageCircle,
  Loader2,
  PenSquare,
  EllipsisVertical,
  Trash2,
} from "lucide-react";
import { FC, useMemo } from "react";
import { ChatSummary } from "@/types/chat.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="pt-24 mb-6 space-y-4 flex-shrink-0 ">
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

      <div className="mb-4 text-sm font-semibold text-white/80 flex-shrink-0">
        Chats
      </div>

      {/* <div className="h-[700px] bg-blue-600 overflow-hidden"> */}
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
        <style>{`
      .h-full.overflow-y-auto.overflow-x-hidden::-webkit-scrollbar {
        display: none;
      }
    `}</style>
        <div className="">
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
              filteredChats.map((chat) => {
                const lastMessage = chat.messages?.at(-1);
                const fullTitle = chat.title || "Untitled Conversation";
                const truncatedTitle = truncateText(fullTitle, 18);

                const isDeletingThisChat = deletingChatId === chat._id;

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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "ml-3 flex size-7 items-center justify-center rounded-full border border-transparent transition",
                            selectedChatId === chat._id
                              ? "bg-white/20"
                              : "hover:bg-white/10"
                          )}
                          aria-label="Chat options"
                          onClick={(event) => event.stopPropagation()}
                          disabled={isDeletingThisChat}
                        >
                          {isDeletingThisChat ? (
                            <Loader2 className="size-4 animate-spin text-white" />
                          ) : (
                            <EllipsisVertical className="size-4 text-white" />
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-300"
                          onSelect={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            if (!isDeletingThisChat) {
                              onDeleteChat?.(chat._id);
                            }
                          }}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete chat
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
    // </div>
  );
};

export default ChatHistoryList;
