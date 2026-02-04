import { useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChatList from "@/components/chat/ChatList";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatComposer from "@/components/chat/ChatComposer";
import MultipleTabsWarning from "@/components/chat/MultipleTabsWarning";
import { useTabIsolation } from "@/hooks/useTabIsolation";
import { useStreamingSync } from "@/hooks/useStreamingSync";
import { useChatSync } from "@/hooks/useChatSync";
import { useChatDrafts } from "@/hooks/useChatDrafts";
import {
  fetchChatById,
  fetchChatList,
  sendChatMessage,
  SendChatMessagePayload,
  deleteChatById,
  fetchUserChatList,
  fetchUserChatDetail,
  fetchCompanyUsers,
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
  selectIsChatStreaming,
  selectStreamingChatIds,
} from "@/store/slices/chatSlice";
import { startStreamingTask, updateStreamingTask, completeStreamingTask, errorTask, cleanupOldTasks, updateTask, } from "@/store/slices/longRunningTasksSlice";
import { composerVariants, deriveTitleFromMessages, pageVariants } from "@/helpers/skylarChat";

const NEW_CHAT_KEY = "__new_chat__";
// Delay the assistant response display slightly to avoid indicator flicker
const RESPONSE_APPEAR_DELAY_MS = 1000;

const ChatPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const dispatch = useDispatch();
  // Tab isolation - prevents state conflicts between multiple tabs
  const { hasMultipleTabs } = useTabIsolation();
  // Sync streaming status across tabs
  const { broadcastEvent } = useStreamingSync();
  // Sync chat list across tabs
  const { triggerRefresh, triggerMigration } = useChatSync();
  const { useRemoteDrafts } = useChatDrafts();

  // Redux selectors
  const selectedChatId = useSelector((state: RootState) => state.chat.selectedChatId);

  // Keep ref in sync with selectedChatId for async operations
  const selectedChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  // Listen for chat migration events (from other tabs)
  useEffect(() => {
    const handleMigration = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { oldChatId, newChatId } = customEvent.detail;
      console.log("[Chat] Handle migration event:", {
        oldChatId,
        newChatId,
        currentSelected: selectedChatIdRef.current,
      });

      // Update streaming events map in this tab too
      dispatch(
        migrateStreamingEvents({
          oldChatId: oldChatId,
          newChatId: newChatId,
        })
      );

      if (selectedChatIdRef.current === oldChatId) {
        dispatch(setSelectedChatId(newChatId));
      }
    };

    window.addEventListener("chat-migration", handleMigration);
    return () => {
      window.removeEventListener("chat-migration", handleMigration);
    };
  }, [dispatch]);

  const temporaryChat = useSelector((state: RootState) => state.chat.temporaryChat);
  const searchTerm = useSelector((state: RootState) => state.chat.searchTerm);
  const pendingFile = useSelector((state: RootState) => state.chat.pendingFile);
  const isCreatingNewChat = useSelector((state: RootState) => state.chat.isCreatingNewChat);
  const isMobileListOpen = useSelector((state: RootState) => state.chat.isMobileListOpen);
  const deletingChatId = useSelector((state: RootState) => state.chat.deletingChatId);
  const optimisticMessagesByChat = useSelector((state: RootState) => state.chat.optimisticMessagesByChat);
  const streamingEventsByChat = useSelector((state: RootState) => state.chat.streamingEventsByChat);

  // Derived or legacy array for components that still need it (though we should minimize)
  const streamingChatIds = useSelector((state: RootState) => selectStreamingChatIds(state));
  // Granular status for the CURRENT selected chat
  const isSelectedChatStreaming = useSelector((state: RootState) => selectIsChatStreaming(state, selectedChatId));

  const useStreaming = useSelector((state: RootState) => state.chat.useStreaming);
  const remoteStreamingChatIds = useSelector((state: RootState) => state.chat.remoteStreamingChatIds);

  // Get drafts for remote streaming chats so we can show content
  const remoteDrafts = useRemoteDrafts(remoteStreamingChatIds || []);

  // Local state for timing (not in Redux as it's UI-specific)
  const streamingStartTimeRef = useRef<number | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef<boolean>(false);
  const streamingChatIdRef = useRef<string | null>(null); // Track which chat is currently streaming
  const [localStreamingChatId, setLocalStreamingChatId] = useState<
    string | null
  >(null); // State to trigger re-renders
  const lastCompletionTimeRef = useRef<Record<string, number>>({}); // Track when we last finished a stream per chat
  // Note: selectedChatIdRef is already declared and synced higher up via useEffect.

  const authState = useSelector((state: RootState) => state.auth);
  const currentUser = authState.user;

  // Get user's role to determine if they're a company admin
  const getUserRole = (): string | null => {
    if (!currentUser) return null;
    if (currentUser.roleId && typeof currentUser.roleId === "object") {
      return (currentUser.roleId as any).name;
    }
    if (currentUser.role && typeof currentUser.role === "string") {
      return currentUser.role;
    }
    return null;
  };

  const userRole = getUserRole();
  const isCompanyAdmin = userRole === "CompanyAdmin" || userRole === "Company";

  // Check if user is company owner (parentCompany === null) - only they can view other users' chats
  const isCompanyOwner =
    isCompanyAdmin &&
    (!currentUser?.parentCompany || currentUser.parentCompany === null);

  // Admin user view state
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string | null>(
    null
  );
  const [adminUserChats, setAdminUserChats] = useState<ChatSummary[]>([]);
  const [selectedAdminChatId, setSelectedAdminChatId] = useState<string | null>(
    null
  );
  const [adminChatDetail, setAdminChatDetail] = useState<ChatDetail | null>(
    null
  );
  const [loadingAdminChats, setLoadingAdminChats] = useState(false);
  const [loadingAdminChatDetail, setLoadingAdminChatDetail] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);


  const {
    data: fetchedChatList = [],
    isLoading: isFetchedChatListLoading,
    isFetching: isChatListFetching,
  } = useQuery({
    queryKey: ["chatList"],
    queryFn: fetchChatList,
    staleTime: 30_000,
    // Always filter out temp chats when reading from cache or fresh data
    select: (data) => data.filter((chat) => !chat._id.startsWith("temp_")),
  });

  // Use the already filtered list
  const filteredChatList = fetchedChatList;
  const { data: selectedChat, isFetching: isChatDetailFetching, isLoading: isFetchedChatDetailLoading, } = useQuery<ChatDetail | null>({
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
    Object.keys(optimisticMessagesByChat).forEach((chatId) => {
      if (
        chatId.startsWith("temp_") &&
        optimisticMessagesByChat[chatId]?.length > 0
      ) {
        // Only include if not already in the list
        if (!list.some((chat) => chat._id === chatId)) {
          // Check for potential duplicates (real chats created very recently)
          // Temp ID format: temp_TIMESTAMP_RANDOM
          const parts = chatId.split("_");
          let isDuplicate = false;

          if (parts.length >= 2) {
            const tempTimestamp = parseInt(parts[1]);
            const firstMessage = optimisticMessagesByChat[chatId]?.[0];
            const firstContent = firstMessage?.content?.trim();

            if (!isNaN(tempTimestamp) && firstContent) {
              isDuplicate = list.some((realChat) => {
                // IMPORTANT: Never deduplicate against other temporary chats
                if (
                  realChat._id.startsWith("temp_") ||
                  realChat._id === "__new_chat__"
                ) {
                  return false;
                }

                const realTime = new Date(realChat.createdAt).getTime();
                // Check if created within 60 seconds of temp chat
                const isTimeClose = Math.abs(realTime - tempTimestamp) < 60000;

                if (!isTimeClose) return false;

                // If time is close, verify content match to avoid false positives
                // (e.g. user sending two different chats in quick succession)
                if (realChat.messages && realChat.messages.length > 0) {
                  const realFirstContent = realChat.messages[0].content.trim();
                  // Return true only if content roughly matches
                  return realFirstContent === firstContent;
                }

                // If no messages available in summary, rely on time overlap (fallback)
                // But strictly requires time overlap
                return true;
              });
            }
          }

          if (!isDuplicate) {
            const firstMessage = optimisticMessagesByChat[chatId][0];
            list.unshift({
              _id: chatId,
              title:
                firstMessage.content.length > 50
                  ? firstMessage.content.substring(0, 50) + "..."
                  : firstMessage.content,
              createdAt: firstMessage.createdAt,
              updatedAt: firstMessage.createdAt,
            });
          }
        }
      }
    });

    // Also include Remote Streaming Chats (that might not be in our local list yet)
    if (remoteStreamingChatIds && remoteStreamingChatIds.length > 0) {
      remoteStreamingChatIds.forEach((remoteId) => {
        // Check if it's already in the list (as real or temp)
        // Direct ID match
        let exists = list.some((c) => c._id === remoteId);

        // Fuzzy match for temp IDs against real chats
        if (!exists && remoteId.startsWith("temp_")) {
          const draft = remoteDrafts[remoteId];
          const parts = remoteId.split("_");
          if (parts.length >= 2) {
            const tempTimestamp = parseInt(parts[1]);
            const draftContent = draft?.message?.trim();

            if (!isNaN(tempTimestamp)) {
              exists = list.some((realChat) => {
                // Don't match against other temps
                if (realChat._id.startsWith("temp_")) return false;

                const realTime = new Date(realChat.createdAt).getTime();
                const isTimeClose = Math.abs(realTime - tempTimestamp) < 60000;

                if (!isTimeClose) return false;

                // If we have draft content, check that too
                if (
                  draftContent &&
                  realChat.messages &&
                  realChat.messages.length > 0
                ) {
                  const realFirstContent = realChat.messages[0].content.trim();
                  // Loose match
                  return realFirstContent === draftContent;
                }

                // Fallback to just time if no content to check
                return true;
              });
            }
          }
        }

        if (!exists) {
          // It's a remote chat we don't know about yet (local temp chat in another tab)
          const draft = remoteDrafts[remoteId];
          const placeholderTitle = draft?.message
            ? draft.message.length > 30
              ? draft.message.substring(0, 30) + "..."
              : draft.message
            : "Thinking...";

          const placeholderMessages: ChatMessage[] = draft
            ? [
              {
                _id: `temp-${remoteId}`,
                chatId: remoteId,
                role: "user",
                content: draft.message,
                createdAt: draft.createdAt || new Date().toISOString(),
              },
            ]
            : [];

          list.unshift({
            _id: remoteId,
            title: placeholderTitle,
            createdAt: draft?.createdAt || new Date().toISOString(),
            updatedAt: draft?.createdAt || new Date().toISOString(),
            messages: placeholderMessages,
          });
        }
      });
    }

    return list;
  }, [
    chatList,
    temporaryChat,
    optimisticMessagesByChat,
    remoteStreamingChatIds,
    remoteDrafts,
    selectedChatId,
  ]);

  // Note: Removed sync effects to prevent infinite loops
  // Components will use query data directly instead of Redux state for chat data
  // Initialize tab on mount - clears stale state from other tabs/sessions
  useEffect(() => {
    dispatch(initializeTab());
    // Clear selected chat if it's a stale temp chat (no messages)
    if (selectedChatId && selectedChatId.startsWith("temp_")) {
      const hasMessages = optimisticMessagesByChat[selectedChatId]?.length > 0;
      if (!hasMessages) { dispatch(setSelectedChatId(null)); }
    }
  }, [dispatch, selectedChatId, optimisticMessagesByChat]);
  // Cleanup old completed tasks every 5 minutes
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      dispatch(cleanupOldTasks(5)); // Clean tasks older than 5 minutes
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(cleanupInterval);
  }, [dispatch]);
  // Fetch company users for admin dropdown when admin is logged in
  useEffect(() => {
    if (!isCompanyOwner) {
      return;
    }

    const fetchAdminUsers = async () => {
      try {
        setLoadingAdminUsers(true);
        const users = await fetchCompanyUsers();
        if (users) {
          setAdminUsers(users);
        }
      } catch (error) {
        console.error("Failed to fetch company users:", error);
        toast({
          description: "Failed to load company users",
          variant: "destructive",
        });
      } finally {
        setLoadingAdminUsers(false);
      }
    };

    fetchAdminUsers();
  }, [isCompanyOwner, toast]);

  // Fetch admin user's chat list when selected
  useEffect(() => {
    if (!selectedAdminUserId) {
      setAdminUserChats([]);
      setSelectedAdminChatId(null);
      return;
    }

    const fetchAdminChats = async () => {
      try {
        setLoadingAdminChats(true);
        const data = await fetchUserChatList(selectedAdminUserId);
        if (data?.chats) {
          setAdminUserChats(data.chats);
        }
      } catch (error) {
        console.error("Failed to fetch admin user chats:", error);
        toast({
          description: "Failed to load user chats",
          variant: "destructive",
        });
      } finally {
        setLoadingAdminChats(false);
      }
    };

    fetchAdminChats();
  }, [selectedAdminUserId, toast]);

  // Fetch admin user's specific chat detail when selected
  useEffect(() => {
    if (!selectedAdminUserId || !selectedAdminChatId) {
      setAdminChatDetail(null);
      return;
    }

    const fetchAdminChatDetail = async () => {
      try {
        setLoadingAdminChatDetail(true);
        const data = await fetchUserChatDetail(
          selectedAdminUserId,
          selectedAdminChatId
        );
        if (data) {
          setAdminChatDetail(data);
        }
      } catch (error) {
        console.error("Failed to fetch admin user chat detail:", error);
        toast({
          description: "Failed to load chat details",
          variant: "destructive",
        });
      } finally {
        setLoadingAdminChatDetail(false);
      }
    };

    fetchAdminChatDetail();
  }, [selectedAdminUserId, selectedAdminChatId, toast]);
  useEffect(() => {
    if (chatList.length === 0) {
      return;
    }
    const selectedChatExists = selectedChatId ? chatList.some((chat) => chat._id === selectedChatId) : false;
    if (!selectedChatId) {
      if (!isCreatingNewChat) { dispatch(setSelectedChatId(chatList[0]._id)); }
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
        const textarea = document.querySelector('textarea[placeholder="Type Message"]') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Helper to get the correct chat ID for looking up streaming events
  const getStreamingChatId = useMemo(() => {
    // First check if current chat is in streaming list (local or remote)
    if (isSelectedChatStreaming && selectedChatId) {
      return selectedChatId;
    }
    // Check local state (preferred over ref for rendering)
    if (
      localStreamingChatId &&
      (localStreamingChatId === selectedChatId ||
        selectedChatId === "__new_chat__")
    ) {
      return localStreamingChatId;
    }

    return selectedChatId || localStreamingChatId;
  }, [isSelectedChatStreaming, selectedChatId, localStreamingChatId]);

  // Determine if the typing/loading indicator should be shown for the current chat
  const isCurrentChatSending = useMemo(() => {
    // Check if THIS specific chat is streaming (local or remote)
    // We already have isSelectedChatStreaming which is granular

    // Also check for optimistic messages for this chat
    const optimisticMessages =
      (selectedChatId && optimisticMessagesByChat[selectedChatId]) || [];
    const hasOptimisticMessages = optimisticMessages.length > 0;

    // Check if we are currently in the middle of sending (local state)
    const isStreamingLocal =
      !!localStreamingChatId && localStreamingChatId === selectedChatId;

    // Check if THIS specific chat is streaming (local or remote)
    const isLocalStream = isSelectedChatStreaming || isStreamingLocal;
    const isStreamingRemote =
      remoteStreamingChatIds &&
      remoteStreamingChatIds.includes(selectedChatId || "");

    // Auto-fix for "Thinking..." stutter:
    // If we just finished streaming locally (within last 3 seconds), ignore any "remote" status.
    const lastCompletion = selectedChatId
      ? lastCompletionTimeRef.current[selectedChatId] || 0
      : 0;
    const timeSinceLastCompletion = Date.now() - lastCompletion;
    const isRecentlyFinished = timeSinceLastCompletion < 3000;

    // We treat it as sending if:
    // 1. Locally streaming (Redux or local state says yes)
    // 2. Remote streaming (AND we didn't just finish it ourselves)
    // 3. We have optimistic messages waiting
    const result =
      isLocalStream ||
      (isStreamingRemote && !isRecentlyFinished) ||
      hasOptimisticMessages;

    // Debug logging as requested - using console.dir for full depth
    const isCurrentChatSendingState = {
      result,
      selectedChatId,
      isSelectedChatStreaming,
      hasOptimisticMessages,
      optimisticCount: optimisticMessages.length,
      isStreamingLocal,
      localStreamingChatId,
      streamingChatIdRef: streamingChatIdRef.current,
      isStreamingRemote,
      isRecentlyFinished,
      lastCompletion,
      // Additional debug info
      optimisticMessagesForChat: optimisticMessages,
      remoteStreamingChatIds,
    };
    console.log(
      "[ChatPage] isCurrentChatSending state:",
      isCurrentChatSendingState
    );
    console.dir(isCurrentChatSendingState, { depth: null });

    return result;
  }, [
    isSelectedChatStreaming,
    optimisticMessagesByChat,
    selectedChatId,
    localStreamingChatId,
    remoteStreamingChatIds,
  ]);

  // Typing indicator should reflect actual streaming/pending states, not optimistic bubbles.
  const isThinkingIndicatorVisible = useMemo(() => {
    const isStreamingLocal =
      !!localStreamingChatId && localStreamingChatId === selectedChatId;
    const isLocalStream = isSelectedChatStreaming || isStreamingLocal;
    const isStreamingRemote =
      remoteStreamingChatIds &&
      remoteStreamingChatIds.includes(selectedChatId || "");

    // Indicator should reflect actual streaming only; do not hold after completion.
    // The assistant message display delay is handled in selectedMessages.
    return isLocalStream || isStreamingRemote;
  }, [
    isSelectedChatStreaming,
    selectedChatId,
    localStreamingChatId,
    remoteStreamingChatIds,
  ]);

  // Removed event-based title update effect as it caused re-renders
  // Titles are handled by API success or Optimistic updates now.

  const selectChatFromList = (chatId: string) => {
    if (chatId !== "__new_chat__") {
      dispatch(setIsCreatingNewChat(false));
    }
    dispatch(saveComposerValueToCache());
    dispatch(setSelectedChatId(chatId));
    dispatch(setIsMobileListOpen(false));
  };

  type SendMessageContext = {
    chatKey: string;
    tempMessage: ChatMessage;
  };

  const { mutate: mutateSendMessage, isPending: isSendingMessage } = useMutation<Awaited<ReturnType<typeof sendChatMessage>>,
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
      dispatch(addOptimisticMessage({ chatId: chatKey, message: tempMessage }));
      return { chatKey, tempMessage };
    },
    onSuccess: (response, variables) => {
      const newChatId = response.data.chatId;

      if (newChatId) {
        if (!variables.chatId) {
          dispatch(setSelectedChatId(newChatId));
        }

        // Ensure query cache has the chat detail (even if messages not present)
        const computedTitle = response.data.title || deriveTitleFromMessages(response.data.messages) || "New Conversation";
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
    setLocalStreamingChatId(actualChatId); // Trigger re-render

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
      // CRITICAL: For existing chats, use actualChatId (not selectedChatId) to ensure consistency
      // This prevents creating duplicate chats or adding messages to wrong chat
      dispatch(
        addOptimisticMessage({ chatId: actualChatId, message: tempMessage })
      );
    }

    // Start long-running task tracking
    streamingStartTimeRef.current = Date.now();

    // Set timeout to start long-running task only after 10 seconds if still processing
    const taskCreatedRef = { current: false }; // Track if task was actually created
    streamingTimeoutRef.current = setTimeout(() => {
      if (isStreamingRef.current) {
        // Task is still running after 10 seconds, start tracking it
        taskCreatedRef.current = true; // Mark that task was created
        console.log(
          "[CHAT] Creating long-running task (10s threshold reached):",
          {
            chatId: actualChatId,
            messageId: tempMessage._id,
          }
        );
        dispatch(
          startStreamingTask({
            chatId: actualChatId,
            messageId: tempMessage._id,
            title: `Generating response for: "${trimmedMessage.length > 60
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
          // CRITICAL: If we get a real ID from ANY event (not just result), we should migrate immediately
          const eventChatId = event.data?.chatId || actualChatId;
          const realChatId = event.data?.chatId;

          dispatch(addStreamingEvent({ chatId: eventChatId, event }));

          // If we have a real chat ID and we are currently tracking a temp ID, migrate to real ID
          if (realChatId && realChatId !== actualChatId && isNewChat) {
            // 1. Migrate events
            dispatch(
              migrateStreamingEvents({
                oldChatId: actualChatId,
                newChatId: realChatId,
              })
            );

            // 2. Migrate streaming tracking
            dispatch(removeStreamingChat(actualChatId));
            dispatch(addStreamingChat(realChatId));

            // 3. Update local ref
            finalChatId = realChatId;

            // 4. Trigger refresh in other tabs
            triggerRefresh();

            // 5. Update optimistic messages
            const optimisticMsgs = optimisticMessagesByChat[actualChatId] || [];
            if (optimisticMsgs.length > 0) {
              optimisticMsgs.forEach((msg) => {
                dispatch(
                  addOptimisticMessage({
                    chatId: realChatId,
                    message: { ...msg, chatId: realChatId },
                  })
                );
              });
              dispatch(removeOptimisticMessages(actualChatId));
            }

            // 6. Switch selection to real chat if user hasn't switched away
            const currentlyViewing = selectedChatIdRef.current;
            const isStillOnSameChat =
              currentlyViewing === chatIdWhenSent ||
              currentlyViewing === realChatId ||
              (chatIdWhenSent === "__new_chat__" &&
                currentlyViewing === "__new_chat__") ||
              (chatIdWhenSent === actualChatId &&
                currentlyViewing === actualChatId);

            if (isStillOnSameChat) {
              dispatch(setSelectedChatId(realChatId));
            }

            // CRITICAL: Update long-running task's chatId to the real chat ID
            // This ensures subsequent updateStreamingTask and completeStreamingTask calls can find the task
            console.log("[CHAT] Updating task chatId during event migration:", {
              messageId: tempMessage._id,
              oldChatId: actualChatId,
              newChatId: realChatId,
            });
            dispatch(
              updateTask({
                id: tempMessage._id,
                updates: { chatId: realChatId },
              })
            );
          }

          // Update long-running task with streaming progress
          // Use the real chatId if available (after migration), otherwise use actualChatId
          // Only update if task was actually created (i.e., processing took >10 seconds)
          const taskChatId = finalChatId || actualChatId;
          if (event.step && taskCreatedRef.current) {
            console.log("[CHAT] Updating task step:", {
              messageId: tempMessage._id,
              chatId: taskChatId,
              step: event.step,
            });
            dispatch(
              updateStreamingTask({
                chatId: taskChatId,
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

            // IMMEDIATE CLEANUP: Clean up streaming state as soon as result arrives
            // This prevents the "Thinking..." indicator from lingering after the response is visible
            console.log("[CHAT] Immediate cleanup on result event:", {
              actualChatId,
              finalChatId: realChatId,
            });

            // Update refs immediately
            isStreamingRef.current = false;
            if (
              streamingChatIdRef.current === actualChatId ||
              streamingChatIdRef.current === realChatId
            ) {
              streamingChatIdRef.current = null;
              setLocalStreamingChatId(null);
            }

            // Defer optimistic cleanup to guarded effect once server data is confirmed.

            // Clear streaming state for BOTH IDs to ensure complete cleanup
            // This is critical: if actualChatId is a temp ID and realChatId is different,
            // we need to clear streaming status for BOTH to prevent the thinking animation from persisting
            dispatch(removeStreamingChat(actualChatId)); // Clear temp ID first
            if (realChatId !== actualChatId) {
              dispatch(removeStreamingChat(realChatId)); // Clear real ID if different
            }
            dispatch(clearStreamingEvents(actualChatId)); // Clear events for temp ID
            if (realChatId !== actualChatId) {
              dispatch(clearStreamingEvents(realChatId)); // Clear events for real ID if different
            }

            // Mark completion time for recent finish check
            lastCompletionTimeRef.current[actualChatId] = Date.now();
            if (realChatId !== actualChatId) {
              lastCompletionTimeRef.current[realChatId] = Date.now();
            }

            // Complete or clear the long-running task
            if (taskCreatedRef.current) {
              console.log("[CHAT] Completing long-running task on result:", {
                actualChatId,
                finalChatId: realChatId,
                messageId: tempMessage._id,
              });
              dispatch(
                completeStreamingTask({
                  chatId: realChatId,
                  messageId: tempMessage._id,
                })
              );
            } else {
              console.log(
                "[CHAT] Skipping task completion (completed in <10s):",
                {
                  actualChatId,
                  finalChatId: realChatId,
                  messageId: tempMessage._id,
                }
              );
            }

            // Clear timeout
            if (streamingTimeoutRef.current) {
              clearTimeout(streamingTimeoutRef.current);
              streamingTimeoutRef.current = null;
            }
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
          const isStillOnSameChat =
            currentlyViewing === chatIdWhenSent ||
            currentlyViewing === newChatId ||
            (chatIdWhenSent === "__new_chat__" &&
              currentlyViewing === "__new_chat__");

          if (isStillOnSameChat) {
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

        // Trigger refresh in other tabs so they see the new chat immediately
        triggerRefresh();

        // Only add new chat to chatList if it's actually a new chat

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

          // DON'T call convertTemporaryChat here - it re-adds optimistic messages!
          // We already have real messages from the server, so just clear the temp chat
          // and update the selected chat ID
          dispatch(clearTemporaryChat());

          // Update selected chat ID if user is still on this chat
          const currentlyViewing = selectedChatIdRef.current;
          const isStillOnSameChat =
            currentlyViewing === actualChatId ||
            currentlyViewing === newChatId ||
            currentlyViewing === "__new_chat__";

          if (isStillOnSameChat) {
            dispatch(setSelectedChatId(newChatId));
          }

          // Update long-running task's chatId to the real chat ID if it exists
          if (tempMessage._id) {
            dispatch(
              updateTask({
                id: tempMessage._id,
                updates: { chatId: newChatId },
              })
            );
          }

          // Note: Optimistic messages and streaming state cleanup moved to finally block
          // to prevent duplicate cleanup calls that can affect other active chats
        } else {
          // Note: Optimistic messages and streaming state cleanup moved to finally block
          // to prevent duplicate cleanup calls that can affect other active chats
          lastCompletionTimeRef.current[actualChatId] = Date.now(); // Mark completion time
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
    } catch (error) {
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
      // FALLBACK CLEANUP: Only clean up if not already done in result event handler
      // This handles error cases, timeouts, or if result event didn't trigger cleanup

      // Check if cleanup was already done (isStreamingRef will be false if result handler ran)
      const needsCleanup = isStreamingRef.current;

      if (needsCleanup) {
        console.log("[CHAT] Finally block cleanup (error/timeout case):", {
          actualChatId,
          finalChatId,
        });

        isStreamingRef.current = false;
        // Only clear streaming chat ID if this was the chat that was streaming
        if (
          streamingChatIdRef.current === actualChatId ||
          streamingChatIdRef.current === finalChatId
        ) {
          streamingChatIdRef.current = null;
          setLocalStreamingChatId(null);
        }

        // Defer optimistic cleanup; a guarded effect will remove them
        // after confirming the server has the matching user message.

        // Clear streaming state ONLY for the final chat ID (or actual if no migration)
        const chatIdToClean = finalChatId || actualChatId;
        dispatch(removeStreamingChat(chatIdToClean));
        dispatch(clearStreamingEvents(chatIdToClean));

        // Mark completion time for recent finish check
        lastCompletionTimeRef.current[actualChatId] = Date.now();
        if (finalChatId !== actualChatId) {
          lastCompletionTimeRef.current[finalChatId] = Date.now();
        }

        // Complete or clear the long-running task
        if (taskCreatedRef.current) {
          console.log("[CHAT] Completing long-running task (error/timeout):", {
            actualChatId,
            finalChatId,
            messageId: tempMessage._id,
            usingChatId: finalChatId || actualChatId,
          });
          dispatch(
            completeStreamingTask({
              chatId: finalChatId || actualChatId,
              messageId: tempMessage._id,
            })
          );
        }

        // Clear timeout
        if (streamingTimeoutRef.current) {
          clearTimeout(streamingTimeoutRef.current);
          streamingTimeoutRef.current = null;
        }
      } else {
        console.log(
          "[CHAT] Skipping finally cleanup (already done in result handler):",
          { actualChatId, finalChatId }
        );
      }

      streamingStartTimeRef.current = null;
    }
  };

  const handleStartNewChat = () => {
    // If viewing another user's chat as admin, go back to own chats first
    if (selectedAdminUserId) {
      setSelectedAdminUserId(null);
      setSelectedAdminChatId(null);
      setAdminChatDetail(null);
    }

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
    } catch (error) {
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
    // If viewing an admin user's chat, show their chat title
    if (selectedAdminUserId && selectedAdminChatId && adminChatDetail) {
      return adminChatDetail.title || "Chat";
    }

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
  }, [
    fullChatList,
    selectedChat,
    selectedChatId,
    temporaryChat,
    selectedAdminUserId,
    selectedAdminChatId,
    adminChatDetail,
  ]);

  const currentChatKey = selectedChatId ?? NEW_CHAT_KEY;
  const optimisticMessages = optimisticMessagesByChat[currentChatKey] ?? [];

  const selectedMessages = useMemo(() => {
    // If viewing an admin user's chat, show their messages
    if (selectedAdminUserId && selectedAdminChatId && adminChatDetail) {
      return adminChatDetail.messages || [];
    }

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
      const messages = optimisticMessagesByChat[selectedChatId] || [];

      // If no local optimistic messages (e.g. this is a remote temp chat in another tab),
      // try to find it in drafts to show the user query
      if (messages.length === 0 && remoteDrafts[selectedChatId]) {
        const draft = remoteDrafts[selectedChatId];
        return [
          {
            _id: `temp-draft-${selectedChatId}`,
            chatId: selectedChatId,
            role: "user" as const,
            content: draft.message,
            createdAt: draft.createdAt,
          },
        ];
      }

      return messages;
    }

    // For real chat IDs, combine API messages with optimistic messages
    const apiMessages = selectedChat?.messages ?? [];
    const optimisticMessages =
      optimisticMessagesByChat[selectedChatId || ""] || [];

    // If we have no messages at all (no API, no optimistic), check for a remote draft
    // This handles page refresh where we haven't fetched messages yet but have a local draft
    if (
      !apiMessages.length &&
      !optimisticMessages.length &&
      selectedChatId &&
      remoteDrafts[selectedChatId]
    ) {
      const draft = remoteDrafts[selectedChatId];
      return [
        {
          _id: `temp-draft-${selectedChatId}`,
          chatId: selectedChatId,
          role: "user" as const,
          content: draft.message,
          createdAt: draft.createdAt,
        },
      ];
    }

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

    // Stabilize keys without mutating source objects
    const optimisticUsersForKey = filteredOptimistic.filter(
      (m) => m.role === "user"
    );
    const optimisticIdByContent = new Map<string, string>();
    optimisticUsersForKey.forEach((m) => {
      if (m.content) optimisticIdByContent.set(m.content, m._id);
    });

    const serverWithStableIds = apiMessages.map((m) => {
      if (m.role === "user" && m.content) {
        const optId = optimisticIdByContent.get(m.content);
        if (optId) {
          return { ...m, _id: optId };
        }
      }
      return { ...m };
    });

    // Optionally delay showing the latest assistant response to avoid micro flicker
    let delayedServer = serverWithStableIds;
    if (selectedChatId) {
      const lastCompletion = lastCompletionTimeRef.current[selectedChatId] || 0;
      const withinDelay =
        Date.now() - lastCompletion < RESPONSE_APPEAR_DELAY_MS;
      if (withinDelay && serverWithStableIds.length > 0) {
        const lastIdx = serverWithStableIds.length - 1;
        const lastMsg = serverWithStableIds[lastIdx];
        if (lastMsg.role === "assistant") {
          delayedServer = serverWithStableIds.slice(0, lastIdx);
        }
      }
    }

    // After stabilizing server IDs, ensure no duplicate keys remain
    const serverStableIds = new Set(delayedServer.map((m) => m._id));
    const dedupedOptimistic = filteredOptimistic.filter(
      (m) => !serverStableIds.has(m._id)
    );

    const combinedMessages = [...delayedServer, ...dedupedOptimistic];

    // Final safeguard: ensure unique message IDs to prevent React key collisions
    const seenIds = new Set<string>();
    const uniqueCombined = combinedMessages.filter((m) => {
      if (seenIds.has(m._id)) return false;
      seenIds.add(m._id);
      return true;
    });

    // Check if we have a pending draft (user query) that isn't shown yet
    // This happens in other tabs where optimistic messages don't exist
    if (selectedChatId && remoteDrafts[selectedChatId]) {
      const draft = remoteDrafts[selectedChatId];
      // Check if this draft is already in the messages (avoid duplication)
      const lastMessage = combinedMessages[combinedMessages.length - 1];
      const isDraftAlreadyShown =
        lastMessage &&
        (lastMessage.content === draft.message ||
          (lastMessage.role === "user" &&
            lastMessage.content === draft.message));

      if (!isDraftAlreadyShown) {
        combinedMessages.push({
          _id: `temp-draft-${selectedChatId}-${Date.now()}`,
          chatId: selectedChatId,
          role: "user",
          content: draft.message,
          createdAt: draft.createdAt,
        });
      }
    }

    return uniqueCombined;
  }, [
    selectedChat?.messages,
    temporaryChat,
    optimisticMessagesByChat,
    selectedChatId,
    remoteDrafts,
    selectedAdminUserId,
    selectedAdminChatId,
    adminChatDetail,
  ]);

  // Guarded optimistic cleanup: only remove optimistic messages when the server
  // contains the matching user message for this chat. This prevents the
  // disappear/reappear effect during pending states.
  useEffect(() => {
    if (!selectedChatId) return;
    const serverMsgs = selectedChat?.messages || [];
    const optimisticMsgs = optimisticMessagesByChat[selectedChatId] || [];
    if (!serverMsgs.length || !optimisticMsgs.length) return;

    const hasMatch = optimisticMsgs.some((opt) => {
      if (opt.role !== "user") return false;
      const tempTs = opt._id.startsWith("temp-")
        ? parseInt(opt._id.replace("temp-", ""))
        : 0;
      const signature = `${opt.role}-${opt.content}`;
      return serverMsgs.some((sm) => {
        if (`${sm.role}-${sm.content}` !== signature) return false;
        const serverTs = new Date(sm.createdAt).getTime();
        const diff = serverTs - tempTs;
        return isNaN(tempTs) ? true : diff >= -2000 && diff <= 30000;
      });
    });

    if (!hasMatch) return;

    const timer = setTimeout(() => {
      dispatch(removeOptimisticMessages(selectedChatId));
    }, 500);

    return () => clearTimeout(timer);
  }, [
    selectedChat?.messages,
    selectedChatId,
    optimisticMessagesByChat,
    dispatch,
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

  return (
    <DashboardLayout>
      {/* Warning when multiple tabs are detected */}
      <MultipleTabsWarning show={hasMultipleTabs} />
      <Sheet open={isMobileListOpen} onOpenChange={(open) => dispatch(setIsMobileListOpen(open))} >
        <motion.main initial="hidden" animate="visible" exit="exit" variants={pageVariants} className="mt-28 flex w-full justify-center px-4 pb-6 sm:px-6 md:px-10 lg:fixed lg:inset-0 lg:mt-0 lg:px-12 lg:pt-28 xl:px-16">
          <div className="flex w-full lg:h-full flex-col gap-6 relative">
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
                    isCompanyAdmin={isCompanyOwner}
                    selectedAdminUserId={selectedAdminUserId}
                    onAdminUserChange={setSelectedAdminUserId}
                    adminUsers={adminUsers}
                    loadingAdminUsers={loadingAdminUsers}
                    adminUserChats={adminUserChats}
                    selectedAdminChatId={selectedAdminChatId}
                    onSelectAdminChat={setSelectedAdminChatId}
                    loadingAdminChats={loadingAdminChats}
                  />
                </div>
              </div>

              <div className="flex h-full flex-1 flex-col gap-5 rounded-[32px] bg-transparent lg:overflow-hidden">
                <ChatMessages
                  chatTitle={resolvedChatTitle}
                  hasSelection={hasActiveConversation}
                  isLoading={isConversationLoading}
                  isSending={isThinkingIndicatorVisible}
                  messages={selectedMessages}
                  onOpenChatList={() => dispatch(setIsMobileListOpen(true))}
                  streamingEvents={(() => {
                    const events =
                      streamingEventsByChat[getStreamingChatId || ""] ||
                      streamingEventsByChat[selectedChatId || ""] ||
                      streamingEventsByChat[streamingChatIdRef.current || ""] ||
                      [];

                    // If we are sending/thinking but have no events (e.g. after refresh),
                    // inject a placeholder event so the UI shows the "Thinking" state
                    if (isThinkingIndicatorVisible && events.length === 0) {
                      return [
                        {
                          id: "temp-thinking",
                          type: "step",
                          title: "Thinking...",
                          status: "pending",
                          message: "Processing request...",
                        },
                      ];
                    }

                    return events;
                  })()}
                  isStreaming={isThinkingIndicatorVisible}
                  isReadOnly={!!selectedAdminUserId}
                />


                {selectedAdminUserId ? (
                  <div
                    className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center"
                  >
                    <p className="text-sm text-white/60">
                      Viewing user's chat in read-only mode. You cannot send
                      messages on behalf of this user.
                    </p>
                  </div>
                ) : (
                  <div
                    key={hasActiveConversation ? "composer" : "empty"}
                    className="space-y-3"
                  >
                    {pendingFile ? (
                      <div
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
                      </div>
                    ) : null}

                    <ChatComposer
                      key={selectedChatId || "__new_chat__"}
                      onSend={handleSendMessage}
                      isSending={isThinkingIndicatorVisible}
                      isAwaitingResponse={isThinkingIndicatorVisible}
                      disabled={isConversationLoading}
                      onUploadFile={(file) => dispatch(setPendingFile(file))}
                    />
                  </div>
                )}

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