import { FC } from "react";
import { useSelector } from "react-redux";
import { Loader2, EllipsisVertical, Trash2 } from "lucide-react";
import { RootState } from "@/store/store";
import { selectIsChatStreaming } from "@/store/slices/chatSlice";
import { ChatSummary } from "@/types/chat.types";
import { cn } from "@/lib/utils";
import { cleanMarkdown } from "@/utils/commonFunctions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChatHistoryItemProps = {
  chat: ChatSummary;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  deletingChatId?: string | null;
};

const ChatHistoryItem: FC<ChatHistoryItemProps> = ({
  chat,
  selectedChatId,
  onSelectChat,
  onDeleteChat,
  deletingChatId,
}) => {
  // Granular subscription - this component only re-renders when THIS specific chat's streaming status changes
  const isStreaming = useSelector((state: RootState) =>
    selectIsChatStreaming(state, chat._id)
  );

  const lastMessage = chat.messages?.at(-1);
  const cleanedTitle = cleanMarkdown(chat.title || "Untitled Conversation");
  const cleanedLastMessage = lastMessage ? cleanMarkdown(lastMessage.content) : "";
  const isDeleting = deletingChatId === chat._id;

  return (
    <div
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
          {isStreaming && (
            <Loader2 className="size-3 animate-spin text-cyan-400 flex-shrink-0" />
          )}
          <p
            className="flex-1 truncate text-sm font-semibold text-white"
            title={cleanedTitle}
          >
            {cleanedTitle}
          </p>
        </div>
        {isStreaming ? (
          <p className="mt-1 text-[12px] text-cyan-400/80 animate-pulse">
            Generating response...
          </p>
        ) : lastMessage ? (
          <p
            className="mt-1 truncate text-[12px] text-white/60"
            title={cleanedLastMessage}
          >
            {cleanedLastMessage}
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
              selectedChatId === chat._id ? "bg-white/20" : "hover:bg-white/10"
            )}
            onClick={(e) => e.stopPropagation()}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin text-white" />
            ) : (
              <EllipsisVertical className="size-4 text-white" />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            className="text-red-400 focus:text-red-300"
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isDeleting) onDeleteChat?.(chat._id);
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Delete chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ChatHistoryItem;
