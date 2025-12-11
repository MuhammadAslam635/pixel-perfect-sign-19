import { useEffect, useMemo, useState, useRef } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
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
import {
  setSelectedChatId,
  setIsMobileListOpen,
  setComposerValue,
  setSearchTerm,
  setPendingFile,
  setIsCreatingNewChat,
  setDeletingChatId,
  addOptimisticMessage,
  removeOptimisticMessages,
  setStreamingEvents,
  addStreamingEvent,
  clearStreamingEvents,
  setIsStreaming,
  setChatList,
  setIsChatListLoading,
  setIsChatDetailLoading,
  setSelectedChatDetail,
  addChatToList,
  createTemporaryChat,
  addMessageToTemporaryChat,
  clearTemporaryChat,
  convertTemporaryChat,
  handleUrlMessage,
  resetChatState,
} from "@/store/slices/chatSlice";
import {
  startStreamingTask,
  updateStreamingTask,
  completeStreamingTask,
  errorTask,
  cleanupOldTasks,
  updateTask,
} from "@/store/slices/longRunningTasksSlice";

const NEW_CHAT_KEY = "__new_chat__";

const ChatPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux selectors
  const selectedChatId = useSelector((state: RootState) => state.chat.selectedChatId);
  const temporaryChat = useSelector((state: RootState) => state.chat.temporaryChat);
  const composerValue = useSelector((state: RootState) => state.chat.composerValue);
  const composerValuesByChat = useSelector((state: RootState) => state.chat.composerValuesByChat);
  const searchTerm = useSelector((state: RootState) => state.chat.searchTerm);
  const pendingFile = useSelector((state: RootState) => state.chat.pendingFile);
  const isCreatingNewChat = useSelector((state: RootState) => state.chat.isCreatingNewChat);
  const isMobileListOpen = useSelector((state: RootState) => state.chat.isMobileListOpen);
  const deletingChatId = useSelector((state: RootState) => state.chat.deletingChatId);
  const optimisticMessagesByChat = useSelector((state: RootState) => state.chat.optimisticMessagesByChat);
  const streamingEvents = useSelector((state: RootState) => state.chat.streamingEvents);
  const isStreaming = useSelector((state: RootState) => state.chat.isStreaming);
  const useStreaming = useSelector((state: RootState) => state.chat.useStreaming);

  // Local state for timing (not in Redux as it's UI-specific)
  const streamingStartTimeRef = useRef<number | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef<boolean>(false);

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
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: {
        duration: 0.3,
      },
    },
  } as any;

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
    } as any,
  };

  const {
    data: fetchedChatList = [],
    isLoading: isFetchedChatListLoading,
    isFetching: isChatListFetching,
  } = useQuery({
    queryKey: ["chatList"],
    queryFn: fetchChatList,
    staleTime: 30_000,
  });

  const {
    data: selectedChat,
    isFetching: isChatDetailFetching,
    isLoading: isFetchedChatDetailLoading,
  } = useQuery<ChatDetail | null>({
    queryKey: ["chatDetail", selectedChatId],
    queryFn: () => fetchChatById(selectedChatId ?? ""),
    enabled: Boolean(selectedChatId && selectedChatId !== "__new_chat__"),
    staleTime: 10_000,
  });

  // Use query data directly instead of Redux state to avoid sync loops
  const chatList = fetchedChatList;
  const isChatListLoading = isFetchedChatListLoading;
  const isChatDetailLoading = isFetchedChatDetailLoading;
  const selectedChatDetail = selectedChat;

  // Include temporary chat in the list
  const fullChatList = useMemo(() => {
    const list = [...chatList];
    if (temporaryChat) {
      list.unshift({
        _id: temporaryChat.id,
        title: temporaryChat.title,
        createdAt: temporaryChat.createdAt,
        updatedAt: temporaryChat.createdAt,
      });
    }
    return list;
  }, [chatList, temporaryChat]);

  // Note: Removed sync effects to prevent infinite loops
  // Components will use query data directly instead of Redux state for chat data

  // Cleanup old completed tasks every 5 minutes
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      dispatch(cleanupOldTasks(5)); // Clean tasks older than 5 minutes
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(cleanupInterval);
  }, [dispatch]);

  useEffect(() => {
    if (chatList.length === 0) {
      return;
    }

    const selectedChatExists = selectedChatId
      ? chatList.some((chat) => chat._id === selectedChatId)
      : false;

    if (!selectedChatId) {
      if (!isCreatingNewChat) {
        dispatch(setSelectedChatId(chatList[0]._id));
      }
      return;
    }

    if (!selectedChatExists && !isCreatingNewChat && selectedChatId !== "__new_chat__" && !selectedChatId?.startsWith("temp_")) {
      dispatch(setSelectedChatId(chatList[0]._id));
    }
  }, [chatList, isCreatingNewChat, selectedChatId, dispatch]);

  useEffect(() => {
    if (!isCreatingNewChat || !selectedChatId) {
      return;
    }

    const newChatIsInList = chatList.some(
      (chat) => chat._id === selectedChatId
    );

    if (newChatIsInList) {
      dispatch(setIsCreatingNewChat(false));
    }
  }, [chatList, isCreatingNewChat, selectedChatId, dispatch]);

  // Handle incoming message from URL parameter
  useEffect(() => {
    const messageFromUrl = searchParams.get("message");
    const chatIdFromUrl = searchParams.get("chatId");

    if (!messageFromUrl && !chatIdFromUrl) {
      return;
    }

    dispatch(handleUrlMessage({ message: messageFromUrl || undefined, chatId: chatIdFromUrl || undefined }));

    const nextParams = new URLSearchParams(searchParams);
    if (messageFromUrl) nextParams.delete("message");
    if (chatIdFromUrl) nextParams.delete("chatId");
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams, dispatch]);

  // Restore composer value when selected chat changes
  useEffect(() => {
    const chatKey = selectedChatId ?? NEW_CHAT_KEY;
    const savedValue = composerValuesByChat[chatKey] ?? "";
    dispatch(setComposerValue(savedValue));
  }, [selectedChatId]); // Only depend on selectedChatId


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
    // If selecting a different chat (not the temporary chat), we should allow the selection
    // The temporary chat will remain in the state and list even if isCreatingNewChat is false
    // Only clear isCreatingNewChat if we're not selecting the temporary chat
    // If selecting the temporary chat itself, keep isCreatingNewChat true
    if (chatId !== "__new_chat__") {
      dispatch(setIsCreatingNewChat(false));
    }
    
    dispatch(setSelectedChatId(chatId));
    dispatch(setIsMobileListOpen(false));

    // Restore composer value for the selected chat
    dispatch(setComposerValue(composerValuesByChat[chatId] ?? ""));
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

        // Clear composer value and pending file
        dispatch(setComposerValue(""));
        dispatch(setPendingFile(null));

        // Add optimistic message
        dispatch(addOptimisticMessage({ chatId: chatKey, message: tempMessage }));

        return { chatKey, tempMessage };
      },
      onSuccess: (response, variables) => {
        const newChatId = response.data.chatId;

        if (newChatId) {
          if (!variables.chatId) {
            dispatch(setSelectedChatId(newChatId));
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
          if (!variables.chatId) {
            dispatch(removeOptimisticMessages(NEW_CHAT_KEY));
            // Add messages to new chat - optimistic messages will be replaced by real messages
          }

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
          dispatch(removeOptimisticMessages(context.chatKey));
        }

        // Restore composer value and pending file on error
        dispatch(setComposerValue(variables.message));
        dispatch(setPendingFile(variables.file ?? null));

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

    dispatch(setIsStreaming(true));
    dispatch(clearStreamingEvents());
    isStreamingRef.current = true;

    // Generate temporary chat ID if this is a new chat
    const isNewChat = selectedChatId === "__new_chat__" || !selectedChatId;
    const actualChatId = isNewChat ? `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : selectedChatId;

    const tempMessage: ChatMessage = {
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId: actualChatId,
      role: "user",
      content: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    // Clear composer value and pending file
    dispatch(setComposerValue(""));
    dispatch(setPendingFile(null));

    // Add optimistic message
    if (isNewChat) {
      // For new chats, ensure we have a temporary chat and add the message
      if (!temporaryChat) {
        dispatch(createTemporaryChat());
      }
      dispatch(addMessageToTemporaryChat(tempMessage));
    } else {
      // Add to optimistic messages for existing chats
      dispatch(addOptimisticMessage({ chatId: actualChatId, message: tempMessage }));
    }

    // Start long-running task tracking
    streamingStartTimeRef.current = Date.now();
    
    // Set timeout to start long-running task only after 10 seconds if still processing
    streamingTimeoutRef.current = setTimeout(() => {
      if (isStreamingRef.current) {
        // Task is still running after 10 seconds, start tracking it
        dispatch(startStreamingTask({
          chatId: actualChatId,
          messageId: tempMessage._id,
          title: `Generating response for ${selectedChatDetail?.title || "new chat"}`,
          description: "AI is processing your message...",
        }));
      }
    }, 10000);

    try {
      const result = await sendStreamingChatMessage(
        {
          message: trimmedMessage,
          chatId: isNewChat ? null : actualChatId, // Don't send chatId for new chats
          file: null, // File is already cleared
        },
        (event: StreamEvent) => {
          dispatch(addStreamingEvent(event));

          // Update long-running task with streaming progress
          if (event.step) {
            dispatch(updateStreamingTask({
              chatId: actualChatId,
              messageId: tempMessage._id,
              step: event.step,
            }));
          }
        }
      );

      // Handle the response - backend may or may not create a chat
      if (result.data.chatId) {
        // Backend created a chat
        const newChatId = result.data.chatId;

        if (isNewChat) {
          dispatch(setSelectedChatId(newChatId));
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

        // Only add new chat to chatList if it's actually a new chat
        // For existing chats, just update the existing entry's updatedAt timestamp
        queryClient.setQueryData<ChatSummary[]>(["chatList"], (oldChatList) => {
          if (!oldChatList) return oldChatList;
          
          if (isNewChat) {
            // Add new chat to the beginning of the list
            const newChat: ChatSummary = {
              _id: newChatId,
              title: result.data.title || "New Conversation",
              createdAt: result.data.createdAt || new Date().toISOString(),
              updatedAt: result.data.updatedAt || new Date().toISOString(),
            };
            return [newChat, ...oldChatList];
          } else {
            // Update existing chat's updatedAt and move it to the top
            const updatedChatList = oldChatList.map(chat => {
              if (chat._id === newChatId) {
                return {
                  ...chat,
                  title: result.data.title || chat.title,
                  updatedAt: result.data.updatedAt || new Date().toISOString(),
                };
              }
              return chat;
            });
            
            // Move the updated chat to the top
            const updatedChat = updatedChatList.find(chat => chat._id === newChatId);
            if (updatedChat) {
              return [updatedChat, ...updatedChatList.filter(chat => chat._id !== newChatId)];
            }
            
            return updatedChatList;
          }
        });

        // Convert temporary chat to real chat if it was a new chat
        if (isNewChat && temporaryChat) {
          dispatch(convertTemporaryChat({
            realChatId: newChatId,
            title: result.data.title as string
          }));
          
          // Update long-running task's chatId to the real chat ID if it exists
          if (tempMessage._id) {
            dispatch(updateTask({
              id: tempMessage._id,
              updates: { chatId: newChatId }
            }));
          }
        }

        queryClient.invalidateQueries({
          queryKey: ["chatDetail", newChatId],
        });
        queryClient.invalidateQueries({
          queryKey: ["chatList"],
        });
      } else {
        // Backend handled as temporary chat - add assistant response
        if (result.data.messages && result.data.messages.length > 0) {
          // The backend already returns the full conversation including assistant response
          // Add all messages from the response to the temporary chat
          result.data.messages.forEach((msg: any) => {
            if (msg.role === 'assistant') {
              const assistantMessage: ChatMessage = {
                _id: msg._id || `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                chatId: actualChatId,
                role: "assistant",
                content: msg.content,
                createdAt: msg.createdAt || new Date().toISOString(),
              };

              if (isNewChat && temporaryChat) {
                dispatch(addMessageToTemporaryChat(assistantMessage));
              }
            }
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["chatList"] });
    } catch (error: any) {
      console.error("Streaming error:", error);

      // Remove the failed optimistic message
      if (isNewChat && temporaryChat) {
        // For temporary chats, we need to remove the message from the temporary chat
        // This would require a new action to remove messages from temporary chat
      } else {
        dispatch(removeOptimisticMessages(actualChatId));
      }

      // Mark long-running task as error
      dispatch(errorTask({
        id: tempMessage._id,
        errorMessage: error?.message || "Failed to send message",
      }));

      // Restore composer value and pending file on error
      dispatch(setComposerValue(trimmedMessage));
      dispatch(setPendingFile(pendingFile));

      toast({
        title: "Unable to send message",
        description: error?.message || "We could not deliver your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      isStreamingRef.current = false;
      dispatch(setIsStreaming(false));
      dispatch(clearStreamingEvents());

      // Complete or clear the long-running task
      dispatch(completeStreamingTask({
        chatId: actualChatId,
        messageId: tempMessage._id,
      }));

      // Clear timeout
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }
      streamingStartTimeRef.current = null;
    }
  };

  const handleStartNewChat = () => {
    dispatch(createTemporaryChat());
    dispatch(setIsMobileListOpen(false));
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!chatId) {
      return;
    }
    dispatch(setDeletingChatId(chatId));
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
        dispatch(setSelectedChatId(null));
        dispatch(setComposerValue(""));
        dispatch(setPendingFile(null));
        dispatch(setIsCreatingNewChat(false));
      }

      dispatch(removeOptimisticMessages(chatId));

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
      dispatch(setDeletingChatId(null));
    }
  };

  const resolvedChatTitle = useMemo(() => {
    // Handle temporary chat
    if (selectedChatId === "__new_chat__" && temporaryChat) {
      return temporaryChat.title;
    }

    if (selectedChat?.title) {
      return selectedChat.title;
    }
    const summary =
      fullChatList.find((chat) => chat._id === selectedChatId) ?? null;
    return summary?.title;
  }, [fullChatList, selectedChat, selectedChatId, temporaryChat]);

  const currentChatKey = selectedChatId ?? NEW_CHAT_KEY;
  const optimisticMessages = optimisticMessagesByChat[currentChatKey] ?? [];

  const selectedMessages = useMemo(() => {
    // If we have a temporary chat selected, use its messages
    // Also check if selectedChatId is a temp chat ID (starts with "temp_") and we have a temporary chat
    const isTempChatId = selectedChatId?.startsWith("temp_");
    if ((selectedChatId === "__new_chat__" || isTempChatId) && temporaryChat) {
      return temporaryChat.messages;
    }

    const apiMessages = selectedChat?.messages ?? [];
    const optimisticMessages = optimisticMessagesByChat[selectedChatId || ""] || [];

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
        const tempTimestamp = parseInt(message._id.replace("temp-", ""));
        const signature = `${message.role}-${message.content}`;

        // Only match with server messages created within 30 seconds after the temp message
        const matchingServerMessage = apiMessages.find(
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
        if (matchingServerMessage) {
          return false;
        }

        // Keep temp messages for up to 30 seconds, then remove them (in case of errors)
        const tempAge = Date.now() - tempTimestamp;
        return tempAge < 30000;
      }

      // For non-temp messages, keep them if ID doesn't match
      return true;
    });

    return [...apiMessages, ...filteredOptimistic];
  }, [optimisticMessages, selectedChat?.messages, temporaryChat, selectedChatId]);

  const hasActiveConversation =
    Boolean(selectedChatId) || optimisticMessages.length > 0 ||
    (selectedChatId === "__new_chat__" && temporaryChat && temporaryChat.messages.length > 0);

  const isConversationLoading =
    Boolean(selectedChatId) &&
    (isChatDetailLoading || isChatDetailFetching) &&
    optimisticMessages.length === 0;

  // Make sending state chat-specific - only show thinking indicator for the chat that's currently processing
  const isCurrentChatSending = useMemo(() => {
    if (isSendingMessage || isStreaming) {
      // If we're sending a message, check if it's for the current chat
      const hasOptimisticMessages = optimisticMessages.length > 0;
      // If current chat has optimistic messages, it's the one being processed
      if (hasOptimisticMessages) {
        return true;
      }
      // If no optimistic messages but we're in NEW_CHAT_KEY state, it's a new chat being created
      if (currentChatKey === NEW_CHAT_KEY && (isSendingMessage || isStreaming)) {
        return true;
      }
    }
    return false;
  }, [isSendingMessage, isStreaming, optimisticMessages.length, currentChatKey]);

  return (
    <DashboardLayout>
      <Sheet open={isMobileListOpen} onOpenChange={(open) => dispatch(setIsMobileListOpen(open))}>
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
                    chats={fullChatList as ChatSummary[]}
                    isLoading={isChatListLoading}
                    onSelectChat={selectChatFromList}
                    onStartNewChat={handleStartNewChat}
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    selectedChatId={selectedChatId}
                    className="h-full"
                    onDeleteChat={handleDeleteChat}
                    deletingChatId={deletingChatId}
                    isCreatingNewChat={isCreatingNewChat}
                  />
                </div>
              </div>

              <div className="flex h-full flex-1 flex-col gap-5 rounded-[32px] bg-transparent lg:overflow-hidden">
                <ChatMessages
                  chatTitle={resolvedChatTitle}
                  hasSelection={hasActiveConversation}
                  isLoading={isConversationLoading}
                  isSending={isCurrentChatSending}
                  messages={selectedMessages}
                  onOpenChatList={() => dispatch(setIsMobileListOpen(true))}
                  streamingEvents={streamingEvents}
                  isStreaming={isStreaming && isCurrentChatSending}
                />


                <AnimatePresence mode="sync">
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
                          onClick={() => dispatch(setPendingFile(null))}
                        >
                          <X className="size-4" />
                        </Button>
                      </motion.div>
                    ) : null}

                    <ChatComposer
                      value={composerValue}
                      onChange={(value) => dispatch(setComposerValue(value))}
                      onSend={handleSendMessage}
                      isSending={isSendingMessage}
                      isAwaitingResponse={isSendingMessage}
                      disabled={isConversationLoading}
                      onUploadFile={(file) => dispatch(setPendingFile(file))}
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
              chats={fullChatList as ChatSummary[]}
              isLoading={isChatListLoading}
              onSelectChat={selectChatFromList}
              onStartNewChat={handleStartNewChat}
              searchTerm={searchTerm}
              onSearchTermChange={(term) => dispatch(setSearchTerm(term))}
              selectedChatId={selectedChatId}
              className="h-full max-w-none rounded-none border-none"
              onDeleteChat={handleDeleteChat}
              deletingChatId={deletingChatId}
              isCreatingNewChat={isCreatingNewChat}
            />
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default ChatPage;