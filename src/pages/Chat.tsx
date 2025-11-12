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
import { ChatDetail, ChatSummary, ChatMessage } from "@/types/chat.types";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const NEW_CHAT_KEY = "__new_chat__";

const getMessageSignature = (message: ChatMessage) =>
  `${message.role}-${message.content}`;

const ChatPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [composerValue, setComposerValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [optimisticMessagesByChat, setOptimisticMessagesByChat] = useState<
    Record<string, ChatMessage[]>
  >({});

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

  useEffect(() => {
    if (!selectedChatId || !selectedChat?.messages?.length) {
      return;
    }

    const serverSignatures = new Set(
      selectedChat.messages.map((message) => getMessageSignature(message))
    );

    setOptimisticMessagesByChat((prev) => {
      const currentPending = prev[selectedChatId];
      if (!currentPending?.length) {
        return prev;
      }

      const filtered = currentPending.filter(
        (message) => !serverSignatures.has(getMessageSignature(message))
      );

      if (filtered.length === currentPending.length) {
        return prev;
      }

      const updated = { ...prev };
      if (filtered.length > 0) {
        updated[selectedChatId] = filtered;
      } else {
        delete updated[selectedChatId];
      }
      return updated;
    });
  }, [selectedChatId, selectedChat?.messages]);

  const selectChatFromList = (chatId: string) => {
    setIsCreatingNewChat(false);
    setSelectedChatId(chatId);
    setIsMobileListOpen(false);
  };

  type SendMessageContext = {
    chatKey: string;
    tempMessage: ChatMessage;
  };

  const { mutate: mutateSendMessage, isPending: isSendingMessage } =
    useMutation<
      Awaited<ReturnType<typeof sendChatMessage>>,
      AxiosError<{ message?: string }>,
      SendChatMessagePayload,
      SendMessageContext
    >({
      mutationFn: sendChatMessage,
      onMutate: (variables) => {
        const trimmedMessage = variables.message.trim();
        const chatKey = variables.chatId ?? NEW_CHAT_KEY;
        const tempMessage: ChatMessage = {
          _id: `temp-${Date.now()}`,
          chatId: variables.chatId ?? "temp",
          role: "user",
          content: trimmedMessage,
          createdAt: new Date().toISOString(),
        };

        setComposerValue("");
        setPendingFile(null);
        setOptimisticMessagesByChat((prev) => ({
          ...prev,
          [chatKey]: [...(prev[chatKey] ?? []), tempMessage],
        }));

        return { chatKey, tempMessage };
      },
      onSuccess: (response, variables) => {
        const newChatId = response.data.chatId;

        if (newChatId) {
          if (!variables.chatId) {
            setSelectedChatId(newChatId);
          }

          setOptimisticMessagesByChat((prev) => {
            if (variables.chatId) {
              return prev;
            }

            const pendingNewMessages = prev[NEW_CHAT_KEY];
            if (!pendingNewMessages?.length) {
              return prev;
            }

            const updated = { ...prev };
            delete updated[NEW_CHAT_KEY];
            updated[newChatId] = pendingNewMessages.map((message) => ({
              ...message,
              chatId: newChatId,
            }));
            return updated;
          });

          queryClient.invalidateQueries({ queryKey: ["chatDetail", newChatId] });
        } else if (variables.chatId) {
          queryClient.invalidateQueries({
            queryKey: ["chatDetail", variables.chatId],
          });
        }

        queryClient.invalidateQueries({ queryKey: ["chatList"] });
      },
      onError: (
        error: AxiosError<{ message?: string }>,
        variables,
        context
      ) => {
        if (context?.chatKey) {
          setOptimisticMessagesByChat((prev) => {
            const pendingMessages = prev[context.chatKey];
            if (!pendingMessages?.length) {
              return prev;
            }

            const filtered = pendingMessages.filter(
              (message) => message._id !== context.tempMessage._id
            );

            if (filtered.length === pendingMessages.length) {
              return prev;
            }

            const updated = { ...prev };
            if (filtered.length > 0) {
              updated[context.chatKey] = filtered;
            } else {
              delete updated[context.chatKey];
            }
            return updated;
          });
        }

        setComposerValue(variables.message);
        setPendingFile(variables.file ?? null);

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
    if (isSendingMessage) {
      return;
    }

    const trimmedMessage = composerValue.trim();
    if (!trimmedMessage) {
      return;
    }

    mutateSendMessage({
      message: trimmedMessage,
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

  const currentChatKey = selectedChatId ?? NEW_CHAT_KEY;
  const optimisticMessages = optimisticMessagesByChat[currentChatKey] ?? [];

  const selectedMessages = useMemo(() => {
    const apiMessages = selectedChat?.messages ?? [];

    if (!apiMessages.length) {
      return optimisticMessages;
    }

    if (!optimisticMessages.length) {
      return apiMessages;
    }

    const apiSignatures = new Set(
      apiMessages.map((message) => getMessageSignature(message))
    );

    const filteredOptimistic = optimisticMessages.filter(
      (message) => !apiSignatures.has(getMessageSignature(message))
    );

    return [...apiMessages, ...filteredOptimistic];
  }, [optimisticMessages, selectedChat?.messages]);

  const hasActiveConversation =
    Boolean(selectedChatId) || optimisticMessages.length > 0;

  const isConversationLoading =
    Boolean(selectedChatId) &&
    (isChatDetailLoading || isChatDetailFetching) &&
    optimisticMessages.length === 0;

  return (
    <DashboardLayout>
      <Sheet open={isMobileListOpen} onOpenChange={setIsMobileListOpen}>
        <main className="relative mt-24 flex w-full flex-1 min-h-0 max-h-[calc(100vh-6rem)] justify-center overflow-hidden px-4 pb-6 sm:px-6 md:px-10 lg:px-12 xl:px-16">
          <div className="flex w-full max-w-7xl flex-1 min-h-0 flex-col gap-6 overflow-hidden">
            <section className="flex flex-1 min-h-0 flex-col gap-6 overflow-hidden lg:flex-row lg:items-stretch">
              <div className="hidden lg:flex lg:h-full lg:shrink-0">
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

              <div className="flex flex-1 min-h-0 flex-col gap-5 rounded-[32px] bg-transparent">
                <ChatMessages
                  chatTitle={resolvedChatTitle}
                  hasSelection={hasActiveConversation}
                  isLoading={isConversationLoading}
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
                    isAwaitingResponse={isSendingMessage}
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
