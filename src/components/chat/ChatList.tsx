import { useMemo, useState } from "react";
import {
  Search,
  MessageCircle,
  Loader2,
  PenSquare,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatSummary } from "@/types/chat.types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import ChatListItem from "./ChatListItem";

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
  isCompanyAdmin?: boolean;
  selectedAdminUserId?: string | null;
  onAdminUserChange?: (userId: string | null) => void;
  adminUsers?: any[];
  loadingAdminUsers?: boolean;
  adminUserChats?: ChatSummary[];
  selectedAdminChatId?: string | null;
  onSelectAdminChat?: (chatId: string | null) => void;
  loadingAdminChats?: boolean;
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
  isCompanyAdmin = false,
  selectedAdminUserId = null,
  onAdminUserChange,
  adminUsers = [],
  loadingAdminUsers = false,
  adminUserChats = [],
  selectedAdminChatId = null,
  onSelectAdminChat,
  loadingAdminChats = false,
}: ChatListProps) => {
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
    // If viewing admin user's chats, show those instead
    const baseChats = selectedAdminUserId ? adminUserChats : chats;

    if (!searchTerm) {
      return baseChats;
    }

    const query = searchTerm.toLowerCase();
    return baseChats.filter((chat) => {
      const titleMatch = chat.title?.toLowerCase().includes(query);
      const messageMatch = chat.messages?.some((message) =>
        message.content.toLowerCase().includes(query)
      );
      return titleMatch || messageMatch;
    });
  }, [chats, searchTerm, selectedAdminUserId, adminUserChats]);

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

        {/* Admin View User Chats Dropdown */}
        {isCompanyAdmin && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2">
              <Users className="size-4 text-white/60" />
              <label className="text-xs font-medium text-white/60">View User</label>
              {selectedAdminUserId && (
                <Button
                  onClick={() => onAdminUserChange?.(null)}
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-8 px-3 text-white/60 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="size-4 mr-1.5" />
                  <span className="text-xs">Cancel</span>
                </Button>
              )}
            </div>
            <Select 
              value={selectedAdminUserId || ""} 
              onValueChange={(value) => onAdminUserChange?.(value || null)}
            >
            <SelectTrigger className="bg-white/[0.06] border-white/10 text-white min-h-12 h-auto py-2.5 px-3 text-sm hover:bg-white/[0.08] focus:ring-2 focus:ring-cyan-500/40 transition-all">
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1B1B1B] border-white/10 text-white py-2 backdrop-blur-xl">
                {loadingAdminUsers ? (
                  <div className="flex items-center justify-center py-4 text-white/60 text-sm">
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    Loading users...
                  </div>
                ) : adminUsers.length === 0 ? (
                  <div className="py-4 text-center text-white/60 text-sm">
                    No users found
                  </div>
                ) : (
                  adminUsers.map((user) => {
                    const fullName = [user.firstName, user.lastName]
                      .filter(Boolean)
                      .join(" ") || user.name || "";
                    return (
                      <SelectItem
                        key={user._id}
                        value={user._id}
                        textValue={fullName}
                        className="py-2.5 px-3 pl-3 text-white/90 focus:text-white focus:bg-white/10 data-[highlighted]:bg-white/10 data-[highlighted]:text-white"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">{fullName}</span>
                          <span className="text-xs text-white/60">{user.email}</span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 z-10 size-4 -translate-y-1/2 text-white/60" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search.."
            className="relative z-0 h-12 rounded-full border border-white/5 bg-transparent pl-12 text-sm text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/30"
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
            {(isLoading || (selectedAdminUserId && loadingAdminChats)) ? (
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
                {filteredChats.map((chat) => (
                  <ChatListItem
                    key={chat._id}
                    chat={chat}
                    isSelected={selectedAdminUserId ? selectedAdminChatId === chat._id : selectedChatId === chat._id}
                    isDeleting={deletingChatId === chat._id}
                    onSelect={selectedAdminUserId ? (chatId) => onSelectAdminChat?.(chatId) : onSelectChat}
                    onOption={handleChatOptions}
                    onDelete={onDeleteChat}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
};

export default ChatList;
