import { FC, forwardRef } from "react";
import { useSelector } from "react-redux";
import { motion, Variants } from "framer-motion";
import { Loader2, EllipsisVertical, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

import { cn } from "@/lib/utils";
import { ChatSummary } from "@/types/chat.types";
import { RootState } from "@/store/store";
import { selectIsChatStreaming } from "@/store/slices/chatSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatListItemProps {
  chat: ChatSummary;
  isSelected: boolean;
  isDeleting: boolean;
  onSelect: (chatId: string) => void;
  onOption: (chatId: string) => void;
  onDelete?: (chatId: string) => void;
}

const truncateText = (text: string, limit: number) =>
  text.length > limit ? `${text.slice(0, limit - 1)}…` : text;

const chatItemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { 
      duration: 0.3, 
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] 
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

const ChatListItem = forwardRef<HTMLDivElement, ChatListItemProps>(
  ({ chat, isSelected, isDeleting, onSelect, onOption, onDelete }, ref) => {
  // Granular subscription - only re-renders when THIS chat's streaming status changes
  const isStreaming = useSelector((state: RootState) =>
    selectIsChatStreaming(state, chat._id)
  );

  const lastMessage = chat.messages?.at(-1);
  const fullTitle = chat.title || "Untitled Conversation";
  const truncatedTitle = truncateText(fullTitle, 18);

  return (
    <motion.div
      ref={ref}
      layout
      exit="exit"
      variants={chatItemVariants}
      className={cn(
        "group flex w-full items-center rounded-2xl border border-[#2B2A38]/40 bg-[#FFFFFF0A] px-4 py-4 shadow-[0_0_80px_rgba(0,0,0,0.08)] transition-all duration-300",
        isSelected
          ? "border-white/60 bg-white/10 shadow-[0_0_90px_rgba(0,0,0,0.15)]"
          : "hover:border-white/30 hover:bg-white/12 hover:shadow-[0_0_90px_rgba(0,0,0,0.12)]"
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(chat._id)}
        className="flex min-w-0 flex-1 flex-col text-left"
      >
        <div className="flex items-center gap-2">
          {isStreaming && (
            <Loader2 className="size-3 animate-spin text-cyan-400 flex-shrink-0" />
          )}
          <p
            className="flex-1 truncate text-sm font-semibold text-white"
            title={chat.title || "Untitled Conversation"}
          >
            {truncatedTitle}
          </p>
        </div>
        {isStreaming ? (
          <p className="mt-1 text-[12px] text-cyan-400/80 animate-pulse">
            Generating response...
          </p>
        ) : lastMessage ? (
          <div
            className="mt-1 text-[12px] text-white/60"
            title={lastMessage.content}
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw, rehypeSanitize]}
              components={{
                p: ({ children }) => <span>{children}</span>,
              }}
            >
              {lastMessage.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="mt-1 text-[12px] text-white/45">No messages yet</p>
        )}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOption(chat._id);
            }}
            className={cn(
              "ml-3 flex size-7 items-center justify-center rounded-full border border-transparent transition",
              isSelected ? "bg-white/20" : "hover:bg-white/10"
            )}
            aria-label="Chat options"
            disabled={isDeleting}
          >
            {isDeleting ? (
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
              if (!isDeleting) {
                onDelete?.(chat._id);
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
  }
);

export default ChatListItem;
