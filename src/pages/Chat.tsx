import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChatList from "@/components/chat/ChatList";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatComposer from "@/components/chat/ChatComposer";
import {
  fetchChatById,
  fetchChatList,
  sendChatMessage,
  SendChatMessagePayload,
} from "@/services/chat.service";
import { ChatDetail, ChatSummary } from "@/types/chat.types";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const ChatPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [composerValue, setComposerValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

  const {
    data: chatList = [],
    isLoading: isChatListLoading,
    isFetching: isChatListFetching,
  } = useQuery({
    queryKey: ["chatList"],
    queryFn: fetchChatList,
    staleTime: 30_000,
  });

  const {
    data: selectedChat,
    isFetching: isChatDetailFetching,
    isLoading: isChatDetailLoading,
  } = useQuery<ChatDetail | null>({
    queryKey: ["chatDetail", selectedChatId],
    queryFn: () => fetchChatById(selectedChatId ?? ""),
    enabled: Boolean(selectedChatId),
    staleTime: 10_000,
  });

  useEffect(() => {
    if (chatList.length === 0) {
      return;
    }

    const selectedChatExists = selectedChatId
      ? chatList.some((chat) => chat._id === selectedChatId)
      : false;

    if (!selectedChatId) {
      if (!isCreatingNewChat) {
        setSelectedChatId(chatList[0]._id);
      }
      return;
    }

    if (!selectedChatExists && !isCreatingNewChat) {
      setSelectedChatId(chatList[0]._id);
    }
  }, [chatList, isCreatingNewChat, selectedChatId]);

  useEffect(() => {
    if (!isCreatingNewChat || !selectedChatId) {
      return;
    }

    const newChatIsInList = chatList.some((chat) => chat._id === selectedChatId);

    if (newChatIsInList) {
      setIsCreatingNewChat(false);
    }
  }, [chatList, isCreatingNewChat, selectedChatId]);

  const selectChatFromList = (chatId: string) => {
    setIsCreatingNewChat(false);
    setSelectedChatId(chatId);
    setIsMobileListOpen(false);
  };

  const { mutate: mutateSendMessage, isPending: isSendingMessage } =
    useMutation({
      mutationFn: (payload: SendChatMessagePayload) => sendChatMessage(payload),
      onSuccess: (response) => {
        const newChatId = response.data.chatId;
        setComposerValue("");
        setPendingFile(null);

        if (!newChatId) {
          queryClient.invalidateQueries({ queryKey: ["chatList"] });
          return;
        }

        setSelectedChatId(newChatId);
        queryClient.invalidateQueries({ queryKey: ["chatList"] });
        queryClient.invalidateQueries({
          queryKey: ["chatDetail", newChatId],
        });
      },
      onError: (error: AxiosError<{ message?: string }>) => {
        toast({
          title: "Unable to send message",
          description:
            error.response?.data?.message ??
            "We could not deliver your message. Please try again.",
          variant: "destructive",
        });
      },
    });

  const handleSendMessage = () => {
    if (!composerValue.trim()) {
      return;
    }

    mutateSendMessage({
      message: composerValue.trim(),
      chatId: selectedChatId,
      file: pendingFile ?? undefined,
    });
  };

  const handleStartNewChat = () => {
    setIsCreatingNewChat(true);
    setSelectedChatId(null);
    setComposerValue("");
    setPendingFile(null);
    setIsMobileListOpen(false);
  };

  const resolvedChatTitle = useMemo(() => {
    if (selectedChat?.title) {
      return selectedChat.title;
    }
    const summary =
      chatList.find((chat) => chat._id === selectedChatId) ?? null;
    return summary?.title;
  }, [chatList, selectedChat, selectedChatId]);

  const isConversationLoading =
    isChatDetailLoading || isChatDetailFetching || isChatListFetching;

  const selectedMessages = selectedChat?.messages ?? [];

  return (
    <DashboardLayout>
      <Sheet open={isMobileListOpen} onOpenChange={setIsMobileListOpen}>
        <main className="relative mt-24 flex w-full flex-1 justify-center px-4 pb-10 sm:px-6 md:px-10 lg:px-12 xl:px-16">
          <div className="flex w-full max-w-7xl flex-col gap-6 pb-10">
            <section className="flex flex-col gap-6 lg:h-[70vh] lg:flex-row lg:items-stretch">
              <div className="hidden lg:block lg:h-full lg:shrink-0">
                <ChatList
                  chats={chatList as ChatSummary[]}
                  isLoading={isChatListLoading}
                  onSelectChat={selectChatFromList}
                  onStartNewChat={handleStartNewChat}
                  searchTerm={searchTerm}
                  onSearchTermChange={setSearchTerm}
                  selectedChatId={selectedChatId}
                  className="h-full"
                />
              </div>

              <div className="flex min-h-[70vh] flex-1 flex-col gap-5 rounded-[32px] bg-transparent lg:min-h-0">
                <ChatMessages
                  chatTitle={resolvedChatTitle}
                  hasSelection={Boolean(selectedChatId)}
                  isLoading={isConversationLoading && Boolean(selectedChatId)}
                  isSending={isSendingMessage}
                  messages={selectedMessages}
                  onOpenChatList={() => setIsMobileListOpen(true)}
                />

                <div className="space-y-3">
                  {pendingFile ? (
                    <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
                      <span className="truncate">
                        Attached file: {pendingFile.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-primary hover:text-primary"
                        onClick={() => setPendingFile(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : null}

                  <ChatComposer
                    value={composerValue}
                    onChange={setComposerValue}
                    onSend={handleSendMessage}
                    isSending={isSendingMessage}
                    disabled={isConversationLoading}
                    onUploadFile={setPendingFile}
                  />
                </div>
              </div>
            </section>
          </div>
        </main>

        <SheetContent
          side="left"
          className="w-full border-none bg-[#070716] p-0 text-white shadow-[0_25px_60px_rgba(0,0,0,0.4)] sm:max-w-sm"
        >
          <div className="flex h-full flex-col">
            <ChatList
              chats={chatList as ChatSummary[]}
              isLoading={isChatListLoading}
              onSelectChat={selectChatFromList}
              onStartNewChat={handleStartNewChat}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              selectedChatId={selectedChatId}
              className="h-full max-w-none rounded-none border-none"
            />
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default ChatPage;
