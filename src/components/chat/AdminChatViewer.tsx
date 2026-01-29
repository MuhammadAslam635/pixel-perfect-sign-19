import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import {
  fetchCompanyUsers,
  fetchUserChatList,
  fetchUserChatDetail,
  CompanyUser,
} from "@/services/chat.service";
import { ChatDetail, ChatSummary } from "@/types/chat.types";
import ChatMessages from "./ChatMessages";
import { toast } from "sonner";

type AdminChatViewerProps = {
  onClose?: () => void;
};

const AdminChatViewer = ({ onClose }: AdminChatViewerProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch company users
  const { data: companyUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["companyUsers"],
    queryFn: fetchCompanyUsers,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's chat list
  const { data: userChatData, isLoading: isLoadingChats } = useQuery({
    queryKey: ["userChatList", selectedUserId],
    queryFn: () => (selectedUserId ? fetchUserChatList(selectedUserId) : null),
    enabled: !!selectedUserId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch specific chat detail
  const { data: chatDetail, isLoading: isLoadingChatDetail } = useQuery({
    queryKey: ["userChatDetail", selectedUserId, selectedChatId],
    queryFn: () =>
      selectedUserId && selectedChatId
        ? fetchUserChatDetail(selectedUserId, selectedChatId)
        : null,
    enabled: !!selectedUserId && !!selectedChatId,
    staleTime: 2 * 60 * 1000,
  });

  // Filter chats based on search term
  const filteredChats = useMemo(() => {
    if (!userChatData?.chats) return [];

    if (!searchTerm) {
      return userChatData.chats;
    }

    const query = searchTerm.toLowerCase();
    return userChatData.chats.filter((chat) => {
      const titleMatch = chat.title?.toLowerCase().includes(query);
      const messageMatch = chat.messages?.some((message) =>
        message.content.toLowerCase().includes(query)
      );
      return titleMatch || messageMatch;
    });
  }, [userChatData?.chats, searchTerm]);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedChatId(""); // Reset chat selection
    setSearchTerm("");
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  const selectedUser = companyUsers.find((u) => u._id === selectedUserId);
  const isLoadingData = isLoadingChats || isLoadingChatDetail;

  return (
    <div className="flex h-full w-full gap-4 bg-[#070716] rounded-[32px]">
      {/* Sidebar - User and Chat Selection */}
      <div className="w-80 flex flex-col border-r border-white/10 bg-[#0A0A12] rounded-l-[32px]">
        {/* User Selection */}
        <div className="flex-shrink-0 space-y-4 border-b border-white/10 p-6">
          <label className="block text-sm font-medium text-white">
            Select User
          </label>
          <Select value={selectedUserId} onValueChange={handleUserSelect}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Choose a user..." />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A24] border-white/10">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-white/50" />
                </div>
              ) : companyUsers.length === 0 ? (
                <div className="py-4 text-center text-white/50 text-sm">
                  No users found
                </div>
              ) : (
                companyUsers.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-white/60">{user.email}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Chat List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedUserId ? (
            <>
              <div className="flex-shrink-0 space-y-4 border-b border-white/10 p-6">
                <div className="text-sm font-medium text-white/80">
                  Chat History
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    placeholder="Search chats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoadingChats ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-white/50" />
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="p-6 text-center text-white/50 text-sm">
                    {searchTerm ? "No chats match your search" : "No chats found"}
                  </div>
                ) : (
                  <div className="space-y-2 p-4">
                    {filteredChats.map((chat) => {
                      const lastMessage = chat.messages?.at(-1);
                      const isSelected = selectedChatId === chat._id;

                      return (
                        <button
                          key={chat._id}
                          onClick={() => handleChatSelect(chat._id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            isSelected
                              ? "bg-white/15 border-white/30"
                              : "hover:bg-white/5 border-white/10"
                          } border`}
                        >
                          <div className="truncate font-medium text-sm text-white">
                            {chat.title}
                          </div>
                          {lastMessage && (
                            <div className="truncate text-xs text-white/50 mt-1">
                              {lastMessage.content.substring(0, 50)}...
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white/50 text-sm">
                Select a user to view their chat history
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Chat View */}
      <div className="flex-1 flex flex-col rounded-r-[32px]">
        {selectedUserId && selectedChatId && chatDetail ? (
          <>
            {/* Chat Header */}
            <div className="flex-shrink-0 border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/60">Viewing chat of:</div>
                  <div className="font-medium text-white">
                    {selectedUser?.name} ({selectedUser?.email})
                  </div>
                  <div className="text-sm text-white/50 mt-1">
                    {chatDetail.title}
                  </div>
                </div>
                {onClose && (
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    Close
                  </Button>
                )}
              </div>
            </div>

            {/* Chat Messages - Read Only */}
            <div className="flex-1 overflow-hidden">
              {isLoadingChatDetail ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                </div>
              ) : (
                <ChatMessages
                  chatTitle={chatDetail.title}
                  messages={chatDetail.messages}
                  isLoading={false}
                  isSending={false}
                  hasSelection={false}
                  isReadOnly={true}
                />
              )}
            </div>

            {/* Read-Only Notice */}
            <div className="flex-shrink-0 border-t border-white/10 bg-blue-500/10 p-4 text-center text-sm text-blue-400">
              📋 This is a read-only view. You cannot send messages as this user.
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/50">
              {selectedUserId
                ? "Select a chat to view conversation history"
                : "Select a user and chat to view conversation"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminChatViewer;
