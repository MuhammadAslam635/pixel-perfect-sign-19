import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChatList from "@/components/chat/ChatList";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatComposer from "@/components/chat/ChatComposer";
import {
  fetchChatById,
  fetchChatList,
  sendChatMessage,
  SendChatMessagePayload,
  deleteChatById,
} from "@/services/chat.service";
import { ChatDetail, ChatSummary, ChatMessage } from "@/types/chat.types";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { StreamEvent, sendStreamingChatMessage } from "@/services/chat.service";

const NEW_CHAT_KEY = "__new_chat__";

const ChatPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Animation variants for page transitions
  const pageVariants = {
    hidden: {
      opacity: 0,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.3,
      },
    },
  };

  const composerVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
        delay: 0.1,
      },
    },
  };

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [composerValue, setComposerValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [optimisticMessagesByChat, setOptimisticMessagesByChat] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [streamingEvents, setStreamingEvents] = useState<StreamEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true); // Default to streaming mode

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

    const newChatIsInList = chatList.some(
      (chat) => chat._id === selectedChatId
    );

    if (newChatIsInList) {
      setIsCreatingNewChat(false);
    }
  }, [chatList, isCreatingNewChat, selectedChatId]);

  // Handle incoming message from URL parameter
  useEffect(() => {
    const messageFromUrl = searchParams.get("message");
    const chatIdFromUrl = searchParams.get("chatId");

    if (!messageFromUrl && !chatIdFromUrl) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);

    if (messageFromUrl) {
      setComposerValue(messageFromUrl);
      setIsCreatingNewChat(true);
      setSelectedChatId(null);
      nextParams.delete("message");
    }

    if (chatIdFromUrl) {
      setSelectedChatId(chatIdFromUrl);
      setIsCreatingNewChat(false);
      setIsMobileListOpen(false);
      nextParams.delete("chatId");
    }

    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!selectedChatId || !selectedChat?.messages?.length) {
      return;
    }

    const serverMessageIds = new Set(
      selectedChat.messages.map((message) => message._id)
    );

    setOptimisticMessagesByChat((prev) => {
      const currentPending = prev[selectedChatId];
      if (!currentPending?.length) {
        return prev;
      }

      const filtered = currentPending.filter((message) => {
        // If message ID exists in server messages, filter it out
        if (serverMessageIds.has(message._id)) {
          return false;
        }

        // If this is a temp message, check if there's a recent server message with same content+role
        if (message._id.startsWith("temp-")) {
          // Extract timestamp from temp ID (format: temp-1234567890)
          const tempTimestamp = parseInt(message._id.replace("temp-", ""));
          const signature = `${message.role}-${message.content}`;

          // Only match with server messages created within 30 seconds after the temp message
          const matchingServerMessage = selectedChat.messages.find(
            (serverMsg) => {
              if (`${serverMsg.role}-${serverMsg.content}` !== signature) {
                return false;
              }
              const serverTimestamp = new Date(serverMsg.createdAt).getTime();
              const timeDiff = serverTimestamp - tempTimestamp;
              // Server message should be created after temp message, within 30 seconds
              return timeDiff >= 0 && timeDiff <= 30000;
            }
          );

          // If we found a matching recent server message, filter out the temp message
          return !matchingServerMessage;
        }

        // For non-temp messages, keep them if ID doesn't match
        return true;
      });

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

  // Focus input when navigating from widget
  useEffect(() => {
    if (location.state?.focusInput) {
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder="Type Message"]') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

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
          _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

          // Set the query data directly from the response when messages are available
          // This ensures immediate cache update and proper deduplication
          if (response.data.messages) {
            queryClient.setQueryData(["chatDetail", newChatId], {
              _id: newChatId,
              title: response.data.title || "New Conversation",
              messages: response.data.messages,
              createdAt: response.data.createdAt || new Date().toISOString(),
              updatedAt: response.data.updatedAt || new Date().toISOString(),
            });
          }

          // Move optimistic messages from NEW_CHAT_KEY to the actual chat ID for new chats
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

          // Invalidate to ensure fresh data
          queryClient.invalidateQueries({
            queryKey: ["chatDetail", newChatId],
          });
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
    if (isSendingMessage || isStreaming) {
      return;
    }

    const trimmedMessage = composerValue.trim();
    if (!trimmedMessage) {
      return;
    }

    if (useStreaming) {
      handleSendStreamingMessage();
    } else {
      mutateSendMessage({
        message: trimmedMessage,
        chatId: selectedChatId,
        file: pendingFile ?? undefined,
      });
    }
  };

  const handleSendStreamingMessage = async () => {
    if (isSendingMessage || isStreaming) {
      return;
    }

    const trimmedMessage = composerValue.trim();
    if (!trimmedMessage) {
      return;
    }

    setIsStreaming(true);
    setStreamingEvents([]);

    const tempMessage: ChatMessage = {
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId: selectedChatId ?? "temp",
      role: "user",
      content: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    setComposerValue("");
    setPendingFile(null);
    setOptimisticMessagesByChat((prev) => ({
      ...prev,
      [selectedChatId ?? NEW_CHAT_KEY]: [...(prev[selectedChatId ?? NEW_CHAT_KEY] ?? []), tempMessage],
    }));

    try {
      const result = await sendStreamingChatMessage(
        {
          message: trimmedMessage,
          chatId: selectedChatId,
          file: pendingFile ?? undefined,
        },
        (event: StreamEvent) => {
          setStreamingEvents(prev => [...prev, event]);
        }
      );

      const newChatId = result.data.chatId;

      if (newChatId) {
        if (!selectedChatId) {
          setSelectedChatId(newChatId);
        }

        if (result.data.messages) {
          queryClient.setQueryData(["chatDetail", newChatId], {
            _id: newChatId,
            title: result.data.title || "New Conversation",
            messages: result.data.messages,
            createdAt: result.data.createdAt || new Date().toISOString(),
            updatedAt: result.data.updatedAt || new Date().toISOString(),
          });
        }

        // Move optimistic messages from NEW_CHAT_KEY to the actual chat ID for new chats
        setOptimisticMessagesByChat((prev) => {
          if (selectedChatId) {
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

        queryClient.invalidateQueries({
          queryKey: ["chatDetail", newChatId],
        });
      } else if (selectedChatId) {
        queryClient.invalidateQueries({
          queryKey: ["chatDetail", selectedChatId],
        });
      }

      queryClient.invalidateQueries({ queryKey: ["chatList"] });
    } catch (error: any) {
      console.error("Streaming error:", error);
      setOptimisticMessagesByChat((prev) => {
        const chatKey = selectedChatId ?? NEW_CHAT_KEY;
        const pendingMessages = prev[chatKey];
        if (!pendingMessages?.length) {
          return prev;
        }

        const filtered = pendingMessages.filter(
          (message) => message._id !== tempMessage._id
        );

        if (filtered.length === pendingMessages.length) {
          return prev;
        }

        const updated = { ...prev };
        if (filtered.length > 0) {
          updated[chatKey] = filtered;
        } else {
          delete updated[chatKey];
        }
        return updated;
      });

      setComposerValue(trimmedMessage);
      setPendingFile(pendingFile);

      toast({
        title: "Unable to send message",
        description: error?.message || "We could not deliver your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      setStreamingEvents([]);
    }
  };

  const handleStartNewChat = () => {
    setIsCreatingNewChat(true);
    setSelectedChatId(null);
    setComposerValue("");
    setPendingFile(null);
    setIsMobileListOpen(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!chatId) {
      return;
    }
    setDeletingChatId(chatId);
    try {
      await deleteChatById(chatId);

      queryClient.setQueryData<ChatSummary[] | undefined>(
        ["chatList"],
        (previous = []) =>
          previous ? previous.filter((chat) => chat._id !== chatId) : previous
      );

      queryClient.removeQueries({
        queryKey: ["chatDetail", chatId],
        exact: true,
      });

      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setComposerValue("");
        setPendingFile(null);
        setIsCreatingNewChat(false);
      }

      setOptimisticMessagesByChat((prev) => {
        if (!prev[chatId]) {
          return prev;
        }
        const updated = { ...prev };
        delete updated[chatId];
        return updated;
      });

      toast({
        title: "Chat deleted",
        description: "The conversation has been removed.",
      });

      await queryClient.invalidateQueries({ queryKey: ["chatList"] });
    } catch (error: any) {
      console.error("Failed to delete chat", error);
      toast({
        title: "Unable to delete chat",
        description:
          error?.response?.data?.message ||
          "Something went wrong while deleting the chat.",
        variant: "destructive",
      });
    } finally {
      setDeletingChatId(null);
    }
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

    const apiMessageIds = new Set(apiMessages.map((message) => message._id));

    const filteredOptimistic = optimisticMessages.filter((message) => {
      // If message ID exists in server messages, filter it out
      if (apiMessageIds.has(message._id)) {
        return false;
      }

      // If this is a temp message, check if it should be replaced by a server message
      if (message._id.startsWith("temp-")) {
        const tempTimestamp = parseInt(message._id.split('-')[1]);
        const now = Date.now();
        const tempAge = now - tempTimestamp;

        // For user messages, check if there's a server user message that should replace this temp
        if (message.role === "user") {
          // Look for server user messages with the same content
          const matchingUserMessages = apiMessages.filter((serverMsg) =>
            serverMsg.role === "user" && serverMsg.content === message.content
          );

          // If we found matching server messages and the temp message is older than 2 seconds,
          // assume it has been replaced by the server message
          if (matchingUserMessages.length > 0 && tempAge > 2000) {
            return false;
          }
        }

        // Keep temp messages for up to 30 seconds, then remove them (in case of errors)
        return tempAge < 30000;
      }

      // For non-temp messages, keep them if ID doesn't match
      return true;
    });

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
        <motion.main
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={pageVariants}
          className="mt-28 flex w-full justify-center px-4 pb-6 sm:px-6 md:px-10 lg:fixed lg:inset-0 lg:mt-0 lg:px-12 lg:pt-28 xl:px-16"
        >
          <div className="flex w-full lg:h-full flex-col gap-6">
            <section className="flex flex-col gap-6 lg:h-full lg:flex-row lg:items-stretch lg:overflow-hidden">
              <div className="hidden lg:flex lg:h-full lg:shrink-0">
                <div className="overflow-visible p-1 -m-1">
                  <ChatList
                    chats={chatList as ChatSummary[]}
                    isLoading={isChatListLoading}
                    onSelectChat={selectChatFromList}
                    onStartNewChat={handleStartNewChat}
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    selectedChatId={selectedChatId}
                    className="h-full"
                    onDeleteChat={handleDeleteChat}
                    deletingChatId={deletingChatId}
                  />
                </div>
              </div>

              <div className="flex h-full flex-1 flex-col gap-5 rounded-[32px] bg-transparent lg:overflow-hidden">
                <ChatMessages
                  chatTitle={resolvedChatTitle}
                  hasSelection={hasActiveConversation}
                  isLoading={isConversationLoading}
                  isSending={isSendingMessage || isStreaming}
                  messages={selectedMessages}
                  onOpenChatList={() => setIsMobileListOpen(true)}
                  streamingEvents={streamingEvents}
                  isStreaming={isStreaming}
                />


                <AnimatePresence mode="wait">
                  <motion.div
                    key={hasActiveConversation ? "composer" : "empty"}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={composerVariants}
                    className="space-y-3"
                  >
                    {pendingFile ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary"
                      >
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
                      </motion.div>
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
                  </motion.div>
                </AnimatePresence>
              </div>
            </section>
          </div>
        </motion.main>

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
              onDeleteChat={handleDeleteChat}
              deletingChatId={deletingChatId}
            />
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default ChatPage;