import { useMemo } from "react";
import {
  Search,
  MessageCircle,
  Loader2,
  PenSquare,
  EllipsisVertical,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatSummary } from "@/types/chat.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChatListProps = {
  chats: ChatSummary[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onChatOptions?: (chatId: string) => void;
  onStartNewChat: () => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  isLoading?: boolean;
  className?: string;
  onDeleteChat?: (chatId: string) => void;
  deletingChatId?: string | null;
  isCreatingNewChat?: boolean;
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
  className,
  onDeleteChat,
  deletingChatId = null,
  isCreatingNewChat = false,
}: ChatListProps) => {
  const truncateText = (text: string, limit: number) =>
    text.length > limit ? `${text.slice(0, limit - 1)}…` : text;

  // Animation variants
  const chatItemVariants = {
    hidden: {
      opacity: 0,
      x: -20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94] as any,
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  const newChatButtonVariants = {
    idle: { scale: 1 },
    hover: {
      scale: 1.02,
      transition: { duration: 0.2, ease: "easeOut" as any },
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  };

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
    <aside
      className={cn(
        "flex h-full w-full max-w-[20rem] flex-col overflow-hidden rounded-[32px] border border-[#FFFFFF1A] bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0.00002)_38.08%,_rgba(255,255,255,0.00002)_56.68%,_rgba(255,255,255,0.02)_95.1%)] p-5 backdrop-blur-xl",
        "lg:max-w-[18rem]",
        className
      )}
    >
      <div className="mb-6 space-y-4">
        <motion.div
          variants={newChatButtonVariants}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="ghost"
            className="group flex w-full items-center justify-start gap-3 rounded-2xl px-2 py-2 text-left text-sm font-medium text-white transition hover:bg-transparent hover:text-white/90"
            onClick={onStartNewChat}
          >
            <PenSquare className="size-5 text-white/70 transition group-hover:text-white/90" />
            <span>New Chat</span>
          </Button>
        </motion.div>

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
              <AnimatePresence mode="popLayout">
                {filteredChats.map((chat) => {
                  const isDeletingThisChat = deletingChatId === chat._id;
                  const lastMessage = chat.messages?.at(-1);
                  const fullTitle = chat.title || "Untitled Conversation";
                  const truncatedTitle = truncateText(fullTitle, 18);

                  return (
                    <motion.div
                      key={chat._id}
                      layout
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={chatItemVariants}
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
                            onClick={(event) => {
                              event.stopPropagation();
                              handleChatOptions(chat._id);
                            }}
                            className={cn(
                              "ml-3 flex size-7 items-center justify-center rounded-full border border-transparent transition",
                              selectedChatId === chat._id
                                ? "bg-white/20"
                                : "hover:bg-white/10"
                            )}
                            aria-label="Chat options"
                            disabled={isDeletingThisChat}
                          >
                            {isDeletingThisChat ? (
                              <Loader2 className="size-4 animate-spin text-white" />
                            ) : (
                              <EllipsisVertical className="size-4 text-white " />
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
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
};

export default ChatList;
