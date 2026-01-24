import { useEffect, useMemo, useRef } from "react";
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
import MultipleTabsWarning from "@/components/chat/MultipleTabsWarning";
import { useTabIsolation } from "@/hooks/useTabIsolation";
import {
  fetchChatById,
  fetchChatList,
  sendChatMessage,
  SendChatMessagePayload,
  deleteChatById,
} from "@/services/chat.service";
import { ChatDetail, ChatSummary, ChatMessage } from "@/types/chat.types";
import { useToast } from "@/components/ui/use-toast";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { StreamEvent, sendStreamingChatMessage } from "@/services/chat.service";
import {
  setSelectedChatId,
  setIsMobileListOpen,
  setSearchTerm,
  setPendingFile,
  setIsCreatingNewChat,
  setDeletingChatId,
  addOptimisticMessage,
  removeOptimisticMessages,
  addStreamingEvent,
  clearStreamingEvents,
  addStreamingChat,
  removeStreamingChat,
  migrateStreamingEvents,
  createTemporaryChat,
  addMessageToTemporaryChat,
  clearTemporaryChat,
  convertTemporaryChat,
  handleUrlMessage,
  updateTemporaryChatTitle,
  saveComposerValueToCache,
  setComposerValue,
  initializeTab,
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

  // Tab isolation - prevents state conflicts between multiple tabs
  const { hasMultipleTabs } = useTabIsolation();

  // Redux selectors
  const selectedChatId = useSelector(
    (state: RootState) => state.chat.selectedChatId
  );
  const temporaryChat = useSelector(
    (state: RootState) => state.chat.temporaryChat
  );
  const searchTerm = useSelector((state: RootState) => state.chat.searchTerm);
  const pendingFile = useSelector((state: RootState) => state.chat.pendingFile);
  const isCreatingNewChat = useSelector(
    (state: RootState) => state.chat.isCreatingNewChat
  );
  const isMobileListOpen = useSelector(
    (state: RootState) => state.chat.isMobileListOpen
  );
  const deletingChatId = useSelector(
    (state: RootState) => state.chat.deletingChatId
  );
  const optimisticMessagesByChat = useSelector(
    (state: RootState) => state.chat.optimisticMessagesByChat
  );
  const streamingEventsByChat = useSelector(
    (state: RootState) => state.chat.streamingEventsByChat
  );
  const streamingChatIds = useSelector(
    (state: RootState) => state.chat.streamingChatIds
  );
  const useStreaming = useSelector(
    (state: RootState) => state.chat.useStreaming
  );

  // Local state for timing (not in Redux as it's UI-specific)
  const streamingStartTimeRef = useRef<number | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef<boolean>(false);
  const streamingChatIdRef = useRef<string | null>(null); // Track which chat is currently streaming
  const selectedChatIdRef = useRef<string | null>(null); // Track the current selected chat

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

  // Helper to derive a conversation title from messages when server doesn't provide one
  const deriveTitleFromMessages = (messages: any[] | undefined) => {
    if (!messages || !messages.length) return null;
    const assistantMsg =
      messages.find((m) => m.role === "assistant" || m.role === "system") ||
      messages[0];
    if (!assistantMsg || !assistantMsg.content) return null;
    try {
      const text = assistantMsg.content
        .replace(/```[\s\S]*?```/g, "") // remove code blocks
        .replace(/[#>*_`\[\]]/g, "")
        .split("\n")[0]
        .trim();
      if (!text) return null;
      const truncated = text.length > 50 ? `${text.slice(0, 47)}...` : text;
      return truncated;
    } catch (e) {
      return null;
    }
  };

  const {
    data: fetchedChatList = [],
    isLoading: isFetchedChatListLoading,
    isFetching: isChatListFetching,
  } = useQuery({
    queryKey: ["chatList"],
    queryFn: fetchChatList,
    staleTime: 30_000,
    // Always filter out temp chats when reading from cache or fresh data
    select: (data) => data.filter(chat => !chat._id.startsWith("temp_")),
  });

  // Use the already filtered list
  const filteredChatList = fetchedChatList;

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
  const chatList = filteredChatList;
  const isChatListLoading = isFetchedChatListLoading;
  const isChatDetailLoading = isFetchedChatDetailLoading;
  const selectedChatDetail = selectedChat;

  // Include temporary chat in the list AND active temp chats (being processed)
  const fullChatList = useMemo(() => {
    const list = [...chatList];

    // Include temporaryChat if we're viewing it (before first message)
    if (temporaryChat && selectedChatId === "__new_chat__") {
      list.unshift({
        _id: temporaryChat.id,
        title: temporaryChat.title,
        createdAt: temporaryChat.createdAt,
        updatedAt: temporaryChat.createdAt,
        messages: temporaryChat.messages,
      });
    }

    // Include ALL active temp chats (currently being processed)
    // Check all temp chats in optimisticMessagesByChat
    Object.keys(optimisticMessagesByChat).forEach(chatId => {
      if (chatId.startsWith("temp_") && optimisticMessagesByChat[chatId]?.length > 0) {
        // Only include if not already in the list
        if (!list.some(chat => chat._id === chatId)) {
          const firstMessage = optimisticMessagesByChat[chatId][0];
          list.unshift({
            _id: chatId,
            title: firstMessage.content.length > 50
              ? firstMessage.content.substring(0, 50) + "..."
              : firstMessage.content,
            createdAt: firstMessage.createdAt,
            updatedAt: firstMessage.createdAt,
          });
        }
      }
    });

    return list;
  }, [chatList, temporaryChat, optimisticMessagesByChat]);

  // Note: Removed sync effects to prevent infinite loops
  // Components will use query data directly instead of Redux state for chat data

  // Initialize tab on mount - clears stale state from other tabs/sessions
  useEffect(() => {
    dispatch(initializeTab());

    // Clear selected chat if it's a stale temp chat (no messages)
    if (selectedChatId && selectedChatId.startsWith("temp_")) {
      const hasMessages = optimisticMessagesByChat[selectedChatId]?.length > 0;
      if (!hasMessages) {
        // This is a stale temp chat, clear it
        dispatch(setSelectedChatId(null));
      }
    }
  }, [dispatch]);

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

    if (
      !selectedChatExists &&
      !isCreatingNewChat &&
      selectedChatId !== "__new_chat__" &&
      !selectedChatId?.startsWith("temp_")
    ) {
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

    dispatch(
      handleUrlMessage({
        message: messageFromUrl || undefined,
        chatId: chatIdFromUrl || undefined,
      })
    );

    const nextParams = new URLSearchParams(searchParams);
    if (messageFromUrl) nextParams.delete("message");
    if (chatIdFromUrl) nextParams.delete("chatId");
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams, dispatch]);

  // Focus input when navigating from widget
  useEffect(() => {
    if (location.state?.focusInput) {
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        const textarea = document.querySelector(
          'textarea[placeholder="Type Message"]'
        ) as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Keep ref in sync with selectedChatId for async operations
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  const selectChatFromList = (chatId: string) => {
    // If selecting a different chat (not the temporary chat), we should allow the selection
    // The temporary chat will remain in the state and list even if isCreatingNewChat is false
    // Only clear isCreatingNewChat if we're not selecting the temporary chat
    // If selecting the temporary chat itself, keep isCreatingNewChat true
    if (chatId !== "__new_chat__") {
      dispatch(setIsCreatingNewChat(false));
    }

    // Save current composer value to cache before switching
    dispatch(saveComposerValueToCache());

    dispatch(setSelectedChatId(chatId));
    dispatch(setIsMobileListOpen(false));
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

        // Clear pending file (composer is already cleared locally)
        dispatch(setPendingFile(null));

        // Add optimistic message
        dispatch(
          addOptimisticMessage({ chatId: chatKey, message: tempMessage })
        );

        return { chatKey, tempMessage };
      },
      onSuccess: (response, variables) => {
        const newChatId = response.data.chatId;

        if (newChatId) {
          if (!variables.chatId) {
            dispatch(setSelectedChatId(newChatId));
          }

          // Ensure query cache has the chat detail (even if messages not present)
          const computedTitle =
            response.data.title ||
            deriveTitleFromMessages(response.data.messages) ||
            "New Conversation";

          queryClient.setQueryData(["chatDetail", newChatId], {
            _id: newChatId,
            title: computedTitle,
            messages: response.data.messages || [],
            createdAt: response.data.createdAt || new Date().toISOString(),
            updatedAt: response.data.updatedAt || new Date().toISOString(),
          });

          // Move optimistic messages from NEW_CHAT_KEY to the actual chat ID for new chats
          if (!variables.chatId) {
            dispatch(removeOptimisticMessages(NEW_CHAT_KEY));
            // Add messages to new chat - optimistic messages will be replaced by real messages
          }

          // If this was a new chat, update temporary chat title and convert it to the real chat
          if (!variables.chatId && newChatId) {
            // Update temporary title if available or derived
            dispatch(updateTemporaryChatTitle(computedTitle));
            dispatch(
              convertTemporaryChat({
                realChatId: newChatId,
                title: computedTitle,
              })
            );
          }

          // Ensure chatList contains the new chat and update title if it exists
          queryClient.setQueryData<ChatSummary[] | undefined>(
            ["chatList"],
            (old = []) => {
              if (!old) return old;
              const exists = old.some((c) => c._id === newChatId);
              const newChatSummary: ChatSummary = {
                _id: newChatId,
                title: computedTitle,
                createdAt: response.data.createdAt || new Date().toISOString(),
                updatedAt: response.data.updatedAt || new Date().toISOString(),
                messages:
                  (response.data.messages as ChatMessage[]) || undefined,
              };

              if (exists) {
                // Update title/updatedAt for existing entry and move to top
                const updated = old.map((c) =>
                  c._id === newChatId ? { ...c, ...newChatSummary } : c
                );
                const found = updated.find((c) => c._id === newChatId)!;
                return [found, ...updated.filter((c) => c._id !== newChatId)];
              }

              return [newChatSummary, ...old];
            }
          );

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

        // Restore pending file on error (can't restore input as it's local state)
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

  const handleSendMessage = (message: string) => {
    // Check if this specific chat is already streaming
    const isThisChatStreaming = streamingChatIds.includes(selectedChatId || "");

    // For streaming mode, only check if THIS chat is streaming
    // For non-streaming mode, check the global mutation status
    if (useStreaming) {
      if (isThisChatStreaming) {
        return;
      }
    } else {
      if (isSendingMessage || isThisChatStreaming) {
        return;
      }
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    if (useStreaming) {
      handleSendStreamingMessage(trimmedMessage);
    } else {
      mutateSendMessage({
        message: trimmedMessage,
        chatId: selectedChatId,
        file: pendingFile ?? undefined,
      });
    }
  };

  const handleSendStreamingMessage = async (message: string) => {
    // Check if this specific chat is already streaming
    const isThisChatStreaming = streamingChatIds.includes(selectedChatId || "");
    if (isThisChatStreaming) {
      return;
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    isStreamingRef.current = true;

    // Generate temporary chat ID if this is a new chat
    const isNewChat = selectedChatId === "__new_chat__" || !selectedChatId;
    const actualChatId = isNewChat
      ? `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : selectedChatId;
    streamingChatIdRef.current = actualChatId; // Track which chat is streaming (local ref)

    // CRITICAL: Store the chat ID we're sending from, to check later if user switched away
    const chatIdWhenSent = actualChatId;

    dispatch(addStreamingChat(actualChatId)); // Add to streaming chats set
    dispatch(clearStreamingEvents(actualChatId)); // Clear events for this specific chat

    // Track final chat ID for cleanup
    let finalChatId = actualChatId;

    const tempMessage: ChatMessage = {
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId: actualChatId,
      role: "user",
      content: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    // Clear pending file (composer is already cleared locally)
    dispatch(setPendingFile(null));

    // Add optimistic message
    if (isNewChat) {
      // For new chats, ensure we have a temporary chat and add the message
      if (!temporaryChat) {
        dispatch(createTemporaryChat());
      }
      dispatch(addMessageToTemporaryChat(tempMessage));

      // CRITICAL: ALSO add to optimisticMessagesByChat with the temp chat ID
      // This is required because once we switch to temp ID, messages come from optimisticMessagesByChat
      dispatch(
        addOptimisticMessage({ chatId: actualChatId, message: tempMessage })
      );

      // Temp chats are managed in fullChatList via optimisticMessagesByChat
      // Don't add to cache - will be added when server responds with real ID

      // CRITICAL: Save current composer value before switching to temp chat ID
      dispatch(saveComposerValueToCache());

      // CRITICAL: Update selectedChatId to the temp chat ID immediately
      // This ensures the chat is properly tracked and visible in the list
      dispatch(setSelectedChatId(actualChatId));

      // Set composer value to empty for the new temp chat ID
      // This ensures when we switch back, it's properly empty
      dispatch(setComposerValue(""));
    } else {
      // Add to optimistic messages for existing chats
      dispatch(
        addOptimisticMessage({ chatId: actualChatId, message: tempMessage })
      );
    }

    // Start long-running task tracking
    streamingStartTimeRef.current = Date.now();

    // Set timeout to start long-running task only after 10 seconds if still processing
    streamingTimeoutRef.current = setTimeout(() => {
      if (isStreamingRef.current) {
        // Task is still running after 10 seconds, start tracking it
        dispatch(
          startStreamingTask({
            chatId: actualChatId,
            messageId: tempMessage._id,
            title: `Generating response for: "${
              trimmedMessage.length > 60
                ? trimmedMessage.substring(0, 60) + "..."
                : trimmedMessage
            }"`,
            description: "",
          })
        );
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
          // Use actualChatId for events, but if we get a result event, we know the real chat ID
          const eventChatId =
            event.type === "result" && event.data?.chatId
              ? event.data.chatId
              : actualChatId;

          dispatch(addStreamingEvent({ chatId: eventChatId, event }));

          // Update long-running task with streaming progress
          if (event.step) {
            dispatch(
              updateStreamingTask({
                chatId: actualChatId,
                messageId: tempMessage._id,
                step: event.step,
              })
            );
          }

          // If this is a result event, update finalChatId and update query cache immediately
          if (event.type === "result" && event.data?.chatId) {
            const realChatId = event.data.chatId;
            finalChatId = realChatId; // Update final chat ID for cleanup

            if (realChatId !== actualChatId) {
              // Migrate events from temp to real chat ID
              dispatch(
                migrateStreamingEvents({
                  oldChatId: actualChatId,
                  newChatId: realChatId,
                })
              );
            }

            // Update query cache immediately with messages from result
            if (event.data.messages) {
              const computedTitle =
                event.data.title ||
                deriveTitleFromMessages(event.data.messages) ||
                "New Conversation";
              queryClient.setQueryData(["chatDetail", realChatId], {
                _id: realChatId,
                title: computedTitle,
                messages: event.data.messages,
                createdAt: event.data.createdAt || new Date().toISOString(),
                updatedAt: event.data.updatedAt || new Date().toISOString(),
              });
            }

            // Clear streaming state when result is received
            dispatch(removeStreamingChat(realChatId));
            // Clear events after a brief delay to allow UI to show completion
            setTimeout(() => {
              dispatch(clearStreamingEvents(realChatId));
            }, 500);
          }
        }
      );

      // Handle the response - backend may or may not create a chat
      if (result.data.chatId) {
        // Backend created a chat
        const newChatId = result.data.chatId;
        finalChatId = newChatId; // Update final chat ID

        const computedTitle =
          (result.data.title as string) ||
          deriveTitleFromMessages(result.data.messages) ||
          "New Conversation";

        // Only update selectedChatId if the user is still viewing this specific chat
        if (isNewChat) {
          // Use the ref to check current state (most up-to-date value)
          const currentlyViewing = selectedChatIdRef.current;

          // Only switch if user is still viewing this specific chat (by temp ID or already migrated ID)
          // This ensures we migrate temp_A → real_A only when user is on temp_A
          // If user switched to temp_B, currentlyViewing will be temp_B, and this won't match
          if (currentlyViewing === chatIdWhenSent || currentlyViewing === newChatId) {
            // User is still on this chat - migrate to real ID
            dispatch(setSelectedChatId(newChatId));
          }
          // Otherwise, user switched away to another chat - don't force them back
          // Example: User on temp_B, temp_A completes → stay on temp_B
        }

        // Ensure chat detail cache is set and includes a sensible title
        queryClient.setQueryData(["chatDetail", newChatId], {
          _id: newChatId,
          title: computedTitle,
          messages: result.data.messages || [],
          createdAt:
            (result.data.createdAt as string) || new Date().toISOString(),
          updatedAt:
            (result.data.updatedAt as string) || new Date().toISOString(),
        });

        // Only add new chat to chatList if it's actually a new chat
        // For existing chats, just update the existing entry's updatedAt timestamp
        queryClient.setQueryData<ChatSummary[]>(["chatList"], (oldChatList) => {
          if (!oldChatList) return oldChatList;

          if (isNewChat) {
            // Add new chat to the beginning of the list, but avoid duplicates
            const existing = oldChatList.find((c) => c._id === newChatId);
            const newChat: ChatSummary = {
              _id: newChatId,
              title: computedTitle,
              createdAt:
                (result.data.createdAt as string) || new Date().toISOString(),
              updatedAt:
                (result.data.updatedAt as string) || new Date().toISOString(),
              messages: (result.data.messages as ChatMessage[]) || undefined,
            };

            if (existing) {
              // If the chat already exists, update its title/updatedAt and move it to top
              const updated = oldChatList.map((c) =>
                c._id === newChatId ? { ...c, ...newChat } : c
              );
              const found = updated.find((c) => c._id === newChatId)!;
              return [found, ...updated.filter((c) => c._id !== newChatId)];
            }

            return [newChat, ...oldChatList];
          } else {
            // Update existing chat's updatedAt and move it to the top
            const updatedChatList = oldChatList.map((chat) => {
              if (chat._id === newChatId) {
                return {
                  ...chat,
                  title: (result.data.title as string) || chat.title,
                  updatedAt:
                    (result.data.updatedAt as string) ||
                    new Date().toISOString(),
                  messages:
                    (result.data.messages as ChatMessage[]) || chat.messages,
                };
              }
              return chat;
            });

            // Move the updated chat to the top
            const updatedChat = updatedChatList.find(
              (chat) => chat._id === newChatId
            );
            if (updatedChat) {
              return [
                updatedChat,
                ...updatedChatList.filter((chat) => chat._id !== newChatId),
              ];
            }

            return updatedChatList;
          }
        });

        // Convert temporary chat to real chat if it was a new chat
        if (isNewChat && temporaryChat) {
          // Migrate streaming events from temp chat ID to real chat ID
          dispatch(
            migrateStreamingEvents({
              oldChatId: actualChatId,
              newChatId: newChatId,
            })
          );

          // Temp chats are not in cache, no cleanup needed

          dispatch(
            convertTemporaryChat({
              realChatId: newChatId,
              title: computedTitle,
            })
          );

          // Update long-running task's chatId to the real chat ID if it exists
          if (tempMessage._id) {
            dispatch(
              updateTask({
                id: tempMessage._id,
                updates: { chatId: newChatId },
              })
            );
          }

          // Clear optimistic messages after converting temporary chat (messages are now in server response)
          dispatch(removeOptimisticMessages(newChatId));

          // Clear streaming state for the new chat ID (result received)
          dispatch(removeStreamingChat(newChatId));
          dispatch(clearStreamingEvents(newChatId));
        } else {
          // For existing chats, clear optimistic messages after server response
          dispatch(removeOptimisticMessages(actualChatId));
          // Clear streaming state (result received)
          dispatch(removeStreamingChat(actualChatId));
          dispatch(clearStreamingEvents(actualChatId));
        }

        // Don't invalidate queries - we've already updated the cache with setQueryData
        // Invalidating would cause a full refetch and refresh the whole chat
      } else {
        // Backend handled as temporary chat - add assistant response
        if (result.data.messages && result.data.messages.length > 0) {
          // The backend already returns the full conversation including assistant response
          // Add all messages from the response to the temporary chat
          result.data.messages.forEach((msg: any) => {
            if (msg.role === "assistant") {
              const assistantMessage: ChatMessage = {
                _id:
                  msg._id ||
                  `assistant-${Date.now()}-${Math.random()
                    .toString(36)
                    .substr(2, 9)}`,
                chatId: actualChatId,
                role: "assistant",
                content: msg.content,
                createdAt: msg.createdAt || new Date().toISOString(),
                confidence: msg.confidence,
              };

              if (isNewChat && temporaryChat) {
                dispatch(addMessageToTemporaryChat(assistantMessage));
              }
            }
          });
          // Update temporary chat title from messages if possible
          if (isNewChat && temporaryChat) {
            const computedTempTitle =
              deriveTitleFromMessages(result.data.messages) ||
              temporaryChat.title ||
              "New Conversation";
            dispatch(updateTemporaryChatTitle(computedTempTitle));
          }
        }
      }

      // Don't invalidate queries - we've already updated the cache with setQueryData
      // Invalidating would cause a full refetch and refresh the whole chat
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
      dispatch(
        errorTask({
          id: tempMessage._id,
          errorMessage: sanitizeErrorMessage(error, "Failed to send message"),
        })
      );

      // Restore pending file on error (can't restore input as it's local state)
      dispatch(setPendingFile(pendingFile));

      toast({
        title: "Unable to send message",
        description: sanitizeErrorMessage(
          error,
          "We could not deliver your message. Please check your internet connection and try again."
        ),
        variant: "destructive",
      });
    } finally {
      isStreamingRef.current = false;
      // Only clear streaming chat ID if this was the chat that was streaming
      if (streamingChatIdRef.current === actualChatId) {
        streamingChatIdRef.current = null;
      }
      // Remove from streaming chats set (if not already removed in success handler)
      dispatch(removeStreamingChat(finalChatId));
      dispatch(clearStreamingEvents(finalChatId));

      // Complete or clear the long-running task
      dispatch(
        completeStreamingTask({
          chatId: actualChatId,
          messageId: tempMessage._id,
        })
      );

      // Clear timeout
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
        streamingTimeoutRef.current = null;
      }
      streamingStartTimeRef.current = null;
    }
  };

  const handleStartNewChat = () => {
    // Save current composer value before switching
    dispatch(saveComposerValueToCache());

    // Clear any pending state
    dispatch(setPendingFile(null));

    // Create new temporary chat (this will set selectedChatId to "__new_chat__")
    dispatch(createTemporaryChat());
    dispatch(setIsMobileListOpen(false));
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!chatId) {
      return;
    }
    dispatch(setDeletingChatId(chatId));
    try {
      // Handle temporary chat deletion (newly created chats that haven't been saved yet)
      if (chatId === "__new_chat__" || chatId === NEW_CHAT_KEY) {
        // Clear temporary chat state
        dispatch(clearTemporaryChat());
        dispatch(removeOptimisticMessages(NEW_CHAT_KEY));

        // Clear pending file (composer is already cleared locally)
        dispatch(setPendingFile(null));

        // Select the first available chat if there are any
        if (chatList.length > 0) {
          dispatch(setSelectedChatId(chatList[0]._id));
        } else {
          dispatch(setSelectedChatId(null));
        }

        toast({
          title: "Chat deleted",
          description: "The conversation has been removed.",
        });

        dispatch(setDeletingChatId(null));
        return;
      }

      // Handle real chat deletion (existing chats in database)
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
        // Select the first available chat if there are any
        if (chatList.length > 1) {
          const remainingChats = chatList.filter((chat) => chat._id !== chatId);
          if (remainingChats.length > 0) {
            dispatch(setSelectedChatId(remainingChats[0]._id));
          } else {
            dispatch(setSelectedChatId(null));
          }
        } else {
          dispatch(setSelectedChatId(null));
        }
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
    // CRITICAL: Only use temporaryChat for "__new_chat__" (before first message is sent)
    // Once a message is sent, the chat gets a temp ID and messages go to optimisticMessagesByChat
    if (selectedChatId === "__new_chat__" && temporaryChat) {
      return temporaryChat.messages;
    }

    // For temp chat IDs (temp_123_abc, temp_456_def, etc.), use optimisticMessagesByChat
    // Each temp chat has its own entry in optimisticMessagesByChat
    const isTempChatId = selectedChatId?.startsWith("temp_");
    if (isTempChatId) {
      // Return messages specific to this temp chat ID
      return optimisticMessagesByChat[selectedChatId] || [];
    }

    // For real chat IDs, combine API messages with optimistic messages
    const apiMessages = selectedChat?.messages ?? [];
    const optimisticMessages =
      optimisticMessagesByChat[selectedChatId || ""] || [];

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
        const matchingServerMessage = apiMessages.find((serverMsg) => {
          if (`${serverMsg.role}-${serverMsg.content}` !== signature) {
            return false;
          }
          const serverTimestamp = new Date(serverMsg.createdAt).getTime();
          const timeDiff = serverTimestamp - tempTimestamp;
          // Server message should be created after temp message, within 30 seconds
          return timeDiff >= 0 && timeDiff <= 30000;
        });

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
  }, [
    optimisticMessages,
    selectedChat?.messages,
    temporaryChat,
    selectedChatId,
  ]);

  const hasActiveConversation =
    Boolean(selectedChatId) ||
    optimisticMessages.length > 0 ||
    (selectedChatId === "__new_chat__" &&
      temporaryChat &&
      temporaryChat.messages.length > 0);

  const isConversationLoading =
    Boolean(selectedChatId) &&
    (isChatDetailLoading || isChatDetailFetching) &&
    optimisticMessages.length === 0;

  // Helper to get the correct chat ID for looking up streaming events
  // This handles temp-to-real ID conversion
  const getStreamingChatId = useMemo(() => {
    // First check if current chat is in streaming list
    if (streamingChatIds.includes(selectedChatId || "")) {
      return selectedChatId;
    }
    // Check if any streaming chat ID matches (handles temp IDs)
    const matchingStreamingId = streamingChatIds.find((id) => {
      // If selectedChatId is a real ID and we have a temp ID streaming, check if they're related
      if (
        id.startsWith("temp_") &&
        selectedChatId &&
        !selectedChatId.startsWith("temp_")
      ) {
        // Events might have been migrated, so check both
        return false; // Will check events by selectedChatId
      }
      return (
        id === selectedChatId ||
        (id.startsWith("temp_") && selectedChatId === "__new_chat__")
      );
    });
    return matchingStreamingId || selectedChatId || streamingChatIdRef.current;
  }, [streamingChatIds, selectedChatId]);

  // Make sending state chat-specific - only show thinking indicator for the chat that's currently processing
  const isCurrentChatSending = useMemo(() => {
    // For new/empty chats, never show as sending unless it has optimistic messages
    if (!selectedChatId || selectedChatId === "__new_chat__") {
      // Check if we have a temporary chat with messages (means we sent a message)
      const hasTemporaryChatMessages =
        temporaryChat && temporaryChat.messages.length > 0;

      // If we have temporary chat messages, check if any temp chat is streaming
      if (hasTemporaryChatMessages) {
        // Check if the temporary chat's ID is streaming (it would have been assigned when message was sent)
        return streamingChatIds.some(id => id.startsWith("temp_"));
      }

      return false; // New empty chat is never sending
    }

    // For existing chats (with real IDs or temp IDs), check if THIS specific chat is streaming
    const isStreamingThisChat =
      streamingChatIds.includes(selectedChatId) ||
      streamingChatIdRef.current === selectedChatId;

    // For temporary chats, check if we have messages in temporary chat
    const isTempChatId = selectedChatId?.startsWith("temp_");
    const hasTemporaryChatMessages =
      (isTempChatId) &&
      temporaryChat &&
      temporaryChat.messages.length > 0;

    // For regular chats, check optimistic messages
    const hasOptimisticMessages = optimisticMessages.length > 0;

    // Show indicator if streaming for this specific chat OR if this chat has optimistic/temporary messages
    return (
      isStreamingThisChat || hasOptimisticMessages || hasTemporaryChatMessages
    );
  }, [
    streamingChatIds,
    optimisticMessages.length,
    selectedChatId,
    temporaryChat,
  ]);

  return (
    <DashboardLayout>
      {/* Warning when multiple tabs are detected */}
      <MultipleTabsWarning show={hasMultipleTabs} />

      <Sheet
        open={isMobileListOpen}
        onOpenChange={(open) => dispatch(setIsMobileListOpen(open))}
      >
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
                    onSearchTermChange={(term) => dispatch(setSearchTerm(term))}
                    selectedChatId={selectedChatId}
                    className="h-full"
                    onDeleteChat={handleDeleteChat}
                    deletingChatId={deletingChatId}
                    isCreatingNewChat={isCreatingNewChat}
                    streamingChatIds={streamingChatIds}
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
                  streamingEvents={
                    streamingEventsByChat[getStreamingChatId || ""] ||
                    streamingEventsByChat[selectedChatId || ""] ||
                    streamingEventsByChat[streamingChatIdRef.current || ""] ||
                    []
                  }
                  isStreaming={isCurrentChatSending}
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
                      key={selectedChatId || "__new_chat__"}
                      onSend={handleSendMessage}
                      isSending={isCurrentChatSending}
                      isAwaitingResponse={isCurrentChatSending}
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
              streamingChatIds={streamingChatIds}
            />
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default ChatPage;
