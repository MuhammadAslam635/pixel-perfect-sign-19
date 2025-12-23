import { Sparkles, Mic, Send, Loader2 } from "lucide-react";
import { FC, useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/store";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";
import {
  sendChatMessage,
  SendChatMessagePayload,
  fetchChatById,
  sendStreamingChatMessage,
  StreamEvent,
} from "@/services/chat.service";
import { deepgramTranscription } from "@/services/deepgram.service";
import { ChatMessage, ChatSummary } from "@/types/chat.types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useToast } from "@/components/ui/use-toast";
import {
  setSelectedChatId,
  addOptimisticMessage,
  removeOptimisticMessages,
  setStreamingEvents,
  addStreamingEvent,
  clearStreamingEvents,
  setIsStreaming,
  setComposerValue,
} from "@/store/slices/chatSlice";
import {
  startStreamingTask,
  updateStreamingTask,
  completeStreamingTask,
  errorTask,
  updateTask,
} from "@/store/slices/longRunningTasksSlice";

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

// Function to transform markdown tables: remove Website column and make company names clickable
const transformCompanyTable = (content: string): string => {
  // Match markdown tables
  const tableRegex = /(\|.*\|[\r\n]+(?:\|[-: ]+\|[\r\n]+)?(?:\|.*\|[\r\n]+)*)/g;

  return content.replace(tableRegex, (tableMatch) => {
    const lines = tableMatch
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    if (lines.length < 2) return tableMatch; // Need at least header and separator

    // Parse header row
    const headerRow = lines[0]
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell);

    // Find Website or Domain column index
    const websiteIndex = headerRow.findIndex(
      (header) =>
        header.toLowerCase().includes("website") ||
        header.toLowerCase().includes("domain")
    );

    // If no Website/Domain column found, return original table
    if (websiteIndex === -1) return tableMatch;

    // Find NAME column index
    const nameIndex = headerRow.findIndex((header) =>
      header.toLowerCase().includes("name")
    );

    // Process separator row (second line)
    const separatorRow = lines[1]
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell);

    // Process data rows
    const dataRows = lines.slice(2).map((line) => {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell);
      const domainUrl = cells[websiteIndex]?.trim() || "";

      // Make domain/website clickable if it's not already a link
      if (domainUrl) {
        // Check if it's already a markdown link
        const isAlreadyLink = /\[([^\]]+)\]\(([^)]+)\)/.test(domainUrl);

        if (!isAlreadyLink) {
          // Clean the domain URL
          let cleanUrl = domainUrl.trim();

          // Remove any existing markdown link syntax if present
          const urlMatch = cleanUrl.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (urlMatch) {
            cleanUrl = urlMatch[2]; // Extract URL from markdown link
          }

          // Ensure URL has protocol
          if (
            cleanUrl &&
            !cleanUrl.startsWith("http://") &&
            !cleanUrl.startsWith("https://")
          ) {
            cleanUrl = "https://" + cleanUrl;
          }

          // Replace domain with markdown link
          if (cleanUrl) {
            cells[websiteIndex] = `[${domainUrl}](${cleanUrl})`;
          }
        }
      }

      return cells;
    });

    // Reconstruct the table
    const newTable = [
      "| " + headerRow.join(" | ") + " |",
      "| " + separatorRow.join(" | ") + " |",
      ...dataRows.map((cells) => "| " + cells.join(" | ") + " |"),
    ].join("\n");

    return newTable;
  });
};

// Animation variants for typing indicator
const typingVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

// Bouncing dots animation for typing indicator
const dotVariants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity as number,
      ease: "easeInOut" as const,
    },
  },
};

const dotVariants2 = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity as number,
      ease: "easeInOut" as const,
      delay: 0.2,
    },
  },
};

const dotVariants3 = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity as number,
      ease: "easeInOut" as const,
      delay: 0.4,
    },
  },
};

type ChatInterfaceProps = {
  currentChatId: string | null;
  onChatIdChange: (chatId: string | null) => void;
  onMessagesChange: (messages: ChatMessage[]) => void;
  initialMessages?: ChatMessage[];
};

const ChatInterface: FC<ChatInterfaceProps> = ({
  currentChatId,
  onChatIdChange,
  onMessagesChange,
  initialMessages = [],
}) => {
  const dispatch = useDispatch();
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isSendingRef = useRef(false);
  const streamingStartTimeRef = useRef<number | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef<boolean>(false);
  const streamingChatIdRef = useRef<string | null>(null); // Track which chat is currently streaming
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track silence timeout
  const lastSpeechTimeRef = useRef<number | null>(null); // Track last time speech was detected
  const hasReceivedSpeechRef = useRef<boolean>(false); // Track if we've received any speech
  const maxListeningTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track max listening timeout
  const accumulatedMessageRef = useRef<string>(""); // Track accumulated message during transcription
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redux selectors
  const selectedChatId = useSelector(
    (state: RootState) => state.chat.selectedChatId
  );
  const streamingEvents = useSelector(
    (state: RootState) => state.chat.streamingEvents
  );
  const isStreaming = useSelector((state: RootState) => state.chat.isStreaming);
  const optimisticMessagesByChat = useSelector(
    (state: RootState) => state.chat.optimisticMessagesByChat
  );
  const temporaryChat = useSelector(
    (state: RootState) => state.chat.temporaryChat
  );
  const composerValue = useSelector(
    (state: RootState) => state.chat.composerValue
  );

  // Use Redux composerValue for message input, but keep local state for interim transcript
  const message = composerValue;

  // Use Redux selectedChatId if currentChatId is not provided (for widget)
  const activeChatId = currentChatId ?? selectedChatId;
  const NEW_CHAT_KEY = "__new_chat__";
  const currentChatKey = activeChatId ?? NEW_CHAT_KEY;
  const optimisticMessages = optimisticMessagesByChat[currentChatKey] ?? [];

  const user = useSelector((state: RootState) => state.auth.user);
  const userName = user?.name || user?.email?.split("@")[0] || "User";
  const greeting = getTimeBasedGreeting();

  // Computed value to replace the old isSendingMessage from mutation
  // Make it chat-specific - only show typing indicator for the current chat being processed
  const isCurrentChatSending = useMemo(() => {
    // Only show thinking indicator if:
    // 1. We're streaming AND the current chat is the one being streamed, OR
    // 2. The current chat has optimistic messages (user message waiting for response)
    const isStreamingThisChat =
      isStreaming && streamingChatIdRef.current === activeChatId;
    const hasOptimisticMessages = optimisticMessages.length > 0;

    // Show indicator if streaming for this specific chat OR if this chat has optimistic messages
    if (isStreamingThisChat || hasOptimisticMessages) {
      return true;
    }

    return false;
  }, [isStreaming, optimisticMessages.length, activeChatId]);

  const isSendingMessage = isCurrentChatSending;

  // Auto-scroll input to show latest text
  useEffect(() => {
    if (inputRef.current) {
      // Scroll to the end of the input
      inputRef.current.scrollLeft = inputRef.current.scrollWidth;
    }
  }, [message, interimTranscript]);

  // Real-time transcription functions
  const startRealtimeTranscription = async () => {
    if (!deepgramTranscription.isSupported()) {
      toast({
        title: "Not Supported",
        description:
          "Real-time speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    // Reset speech tracking
    hasReceivedSpeechRef.current = false;
    lastSpeechTimeRef.current = null;
    accumulatedMessageRef.current = message || ""; // Initialize with current message

    // Clear any existing silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    const SILENCE_TIMEOUT = 2000; // 2 seconds of silence before auto-sending
    const MAX_LISTENING_TIME = 30000; // 30 seconds max listening time as fallback

    // Set a maximum listening time as fallback
    maxListeningTimeoutRef.current = setTimeout(() => {
      if (hasReceivedSpeechRef.current) {
        // If we've received speech, stop and send
        stopRealtimeTranscriptionAndSend();
      } else {
        // If no speech received, just stop without sending
        stopRealtimeTranscription();
      }
    }, MAX_LISTENING_TIME);

    const success = await deepgramTranscription.startListening(
      (transcript, isFinal, speechFinal) => {
        // Update interim transcript for real-time feedback
        setInterimTranscript(transcript);

        // If we received any transcript, mark that we've received speech
        if (transcript && transcript.trim()) {
          hasReceivedSpeechRef.current = true;
          lastSpeechTimeRef.current = Date.now();

          // Clear existing silence timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }

          // If it's a final result, add it to the accumulated message
          if (transcript && isFinal) {
            accumulatedMessageRef.current =
              accumulatedMessageRef.current +
              (accumulatedMessageRef.current ? " " : "") +
              transcript;
            dispatch(setComposerValue(accumulatedMessageRef.current));
            setInterimTranscript("");

            // If we got a final transcript, set up auto-send timeout as fallback
            // This ensures we send even if speechFinal flag isn't received
            if (hasReceivedSpeechRef.current && !silenceTimeoutRef.current) {
              silenceTimeoutRef.current = setTimeout(() => {
                // Auto-stop and send after silence period
                stopRealtimeTranscriptionAndSend();
              }, SILENCE_TIMEOUT);
            }
          }

          // If speech is final (user stopped speaking), handle it
          if (speechFinal && hasReceivedSpeechRef.current) {
            // Clear any existing timeout
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current);
              silenceTimeoutRef.current = null;
            }

            // If there's a current transcript (even if not final), add it to accumulated message
            if (transcript && transcript.trim() && !isFinal) {
              accumulatedMessageRef.current =
                accumulatedMessageRef.current +
                (accumulatedMessageRef.current ? " " : "") +
                transcript.trim();
              dispatch(setComposerValue(accumulatedMessageRef.current));
              setInterimTranscript("");
            }

            // Set up auto-send timeout after a brief delay to ensure final transcript is processed
            silenceTimeoutRef.current = setTimeout(() => {
              // Auto-stop and send after silence period
              stopRealtimeTranscriptionAndSend();
            }, SILENCE_TIMEOUT);
          }
        }
      },
      (error) => {
        console.error("Speech recognition error:", error);
        toast({
          title: "Speech Recognition Error",
          description: error,
          variant: "destructive",
        });
        setIsListening(false);
        setInterimTranscript("");
        // Clear silence timeout on error
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        // Clear max listening timeout on error
        if (maxListeningTimeoutRef.current) {
          clearTimeout(maxListeningTimeoutRef.current);
          maxListeningTimeoutRef.current = null;
        }
      },
      () => {
        // On end
        setIsListening(false);
        // Move any remaining interim transcript to final message
        if (interimTranscript.trim()) {
          const newValue =
            message + (message ? " " : "") + interimTranscript.trim();
          dispatch(setComposerValue(newValue));
          setInterimTranscript("");
        }
        // Clear silence timeout on end
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        // Clear max listening timeout on end
        if (maxListeningTimeoutRef.current) {
          clearTimeout(maxListeningTimeoutRef.current);
          maxListeningTimeoutRef.current = null;
        }
      }
    );

    if (success) {
      setIsListening(true);
    }
  };

  const stopRealtimeTranscription = () => {
    // Clear silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Clear max listening timeout
    if (maxListeningTimeoutRef.current) {
      clearTimeout(maxListeningTimeoutRef.current);
      maxListeningTimeoutRef.current = null;
    }

    deepgramTranscription.stopListening();
    setIsListening(false);

    // Get accumulated message and add any interim transcript
    let finalMessage = accumulatedMessageRef.current || "";
    if (interimTranscript.trim()) {
      finalMessage =
        finalMessage + (finalMessage ? " " : "") + interimTranscript.trim();
    }

    // Fallback to current message if ref is empty
    if (!finalMessage.trim()) {
      finalMessage = message || "";
    }

    // Update Redux state
    if (finalMessage.trim()) {
      dispatch(setComposerValue(finalMessage));
      setInterimTranscript("");
    }

    // Reset speech tracking
    hasReceivedSpeechRef.current = false;
    lastSpeechTimeRef.current = null;
    accumulatedMessageRef.current = "";
  };

  const stopRealtimeTranscriptionAndSend = () => {
    // Clear silence timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    // Clear max listening timeout
    if (maxListeningTimeoutRef.current) {
      clearTimeout(maxListeningTimeoutRef.current);
      maxListeningTimeoutRef.current = null;
    }

    deepgramTranscription.stopListening();
    setIsListening(false);

    // Get the accumulated message from ref (most reliable)
    let finalMessage = accumulatedMessageRef.current || "";

    // Also check for any remaining interim transcript
    if (interimTranscript.trim()) {
      finalMessage =
        finalMessage + (finalMessage ? " " : "") + interimTranscript.trim();
    }

    // Fallback to Redux state if ref is empty
    if (!finalMessage.trim()) {
      finalMessage = composerValue || "";
    }

    // Update Redux state with final message
    if (finalMessage.trim()) {
      dispatch(setComposerValue(finalMessage));
      setInterimTranscript("");
    }

    // Reset speech tracking
    hasReceivedSpeechRef.current = false;
    lastSpeechTimeRef.current = null;
    accumulatedMessageRef.current = ""; // Reset accumulated message

    // Auto-send the message if we have content and we're not already sending
    if (finalMessage.trim() && !isSendingRef.current && !isStreaming) {
      // Send immediately with the final message
      handleSendStreamingMessage(finalMessage);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      // If listening, stop and send the message
      stopRealtimeTranscriptionAndSend();
    } else {
      startRealtimeTranscription();
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (maxListeningTimeoutRef.current) {
        clearTimeout(maxListeningTimeoutRef.current);
      }
    };
  }, []);

  // Fetch chat details when activeChatId changes
  const { data: chatDetail } = useQuery({
    queryKey: ["chatDetail", activeChatId],
    queryFn: () => fetchChatById(activeChatId ?? ""),
    enabled: Boolean(
      activeChatId &&
        activeChatId !== NEW_CHAT_KEY &&
        !activeChatId.startsWith("temp_")
    ),
    staleTime: 10_000,
  });

  // Get chat title for long-running task
  const chatTitle = chatDetail?.title || "new chat";

  // Combine API messages and optimistic messages with deduplication
  const selectedMessages = useMemo(() => {
    // For widget: check if we have optimistic messages for a temp chat ID
    // Only use temporary chat if we're on the chat page (activeChatId === NEW_CHAT_KEY)
    const isTempChatId = activeChatId?.startsWith("temp_");
    if (activeChatId === NEW_CHAT_KEY && temporaryChat) {
      // Only use temporary chat for NEW_CHAT_KEY (chat page)
      return temporaryChat.messages;
    }

    const apiMessages = chatDetail?.messages ?? [];
    // For widget with temp chat ID, use optimistic messages with that ID
    const optimisticMessages =
      optimisticMessagesByChat[activeChatId || ""] || [];

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
    chatDetail?.messages,
    temporaryChat,
    activeChatId,
    optimisticMessagesByChat,
  ]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [selectedMessages.length]);

  // Update parent component with messages
  // Use a ref to track previous messages to avoid infinite loops
  const prevMessagesRef = useRef<string>("");
  useEffect(() => {
    // Create a stable string representation of messages to compare
    const messagesKey = selectedMessages.map((m) => m._id).join(",");

    // Only call onMessagesChange if messages actually changed
    if (prevMessagesRef.current !== messagesKey) {
      prevMessagesRef.current = messagesKey;
      onMessagesChange(selectedMessages);
    }
  }, [selectedMessages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendMessage = () => {
    if (message.trim() && !isSendingRef.current && !isListening) {
      handleSendStreamingMessage();
    }
  };

  const handleSendStreamingMessage = async (messageToSend?: string) => {
    if (isSendingRef.current || isStreaming) {
      return;
    }

    // Use provided message or fall back to current message from state
    const messageText = messageToSend || message;
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage) {
      return;
    }

    isSendingRef.current = true;
    isStreamingRef.current = true;
    dispatch(setIsStreaming(true));
    dispatch(clearStreamingEvents());

    const isNewChat = !activeChatId || activeChatId === NEW_CHAT_KEY;
    const actualChatId = isNewChat
      ? `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : activeChatId;
    streamingChatIdRef.current = actualChatId; // Track which chat is streaming

    const tempMessage: ChatMessage = {
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      chatId: actualChatId,
      role: "user",
      content: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    dispatch(setComposerValue(""));

    // For new chats in widget, use optimistic messages with actualChatId (not temporary chat)
    // This prevents creating a temporary chat that would appear on the chat page
    if (isNewChat) {
      // Use the actualChatId (temp ID) as the chat key for optimistic messages
      // This keeps the widget's new chat isolated from the chat page
      dispatch(
        addOptimisticMessage({ chatId: actualChatId, message: tempMessage })
      );

      // Update the chat ID to the temp ID so messages show immediately
      if (!activeChatId || activeChatId === NEW_CHAT_KEY) {
        dispatch(setSelectedChatId(actualChatId));
        onChatIdChange(actualChatId);
      }
    } else {
      // For existing chats, add optimistic message
      dispatch(
        addOptimisticMessage({ chatId: currentChatKey, message: tempMessage })
      );
    }

    // For new chats, immediately add to chat list optimistically
    if (isNewChat) {
      const optimisticChat: ChatSummary = {
        _id: actualChatId, // Use temp chat ID for now
        title:
          trimmedMessage.length > 50
            ? trimmedMessage.substring(0, 50) + "..."
            : trimmedMessage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatSummary[]>(
        ["chatList"],
        (oldChatList = []) => {
          // Check if chat already exists (shouldn't for new chats, but just in case)
          const exists = oldChatList.some((chat) => chat._id === actualChatId);
          if (exists) {
            return oldChatList;
          }
          return [optimisticChat, ...oldChatList];
        }
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
            title: `Generating response for ${chatTitle}`,
            description: "AI is processing your message...",
          })
        );
      }
    }, 10000);

    try {
      const result = await sendStreamingChatMessage(
        {
          message: trimmedMessage,
          chatId: isNewChat ? null : actualChatId,
        },
        (event: StreamEvent) => {
          dispatch(addStreamingEvent(event));

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
        }
      );

      const newChatId = result.data.chatId;

      if (newChatId) {
        const isNewChatCreated = newChatId !== activeChatId;

        if (isNewChatCreated) {
          dispatch(setSelectedChatId(newChatId));
          onChatIdChange(newChatId);
        }

        // Update query cache with response data
        if (result.data.messages) {
          queryClient.setQueryData(["chatDetail", newChatId], {
            _id: newChatId,
            title: result.data.title || "New Conversation",
            messages: result.data.messages,
            createdAt: result.data.createdAt || new Date().toISOString(),
            updatedAt: result.data.updatedAt || new Date().toISOString(),
          });
        }

        // Update chat list - replace optimistic chat with real chat
        queryClient.setQueryData<ChatSummary[]>(
          ["chatList"],
          (oldChatList = []) => {
            if (isNewChatCreated) {
              // Remove the optimistic chat (with temp ID) and add the real chat
              const filteredList = oldChatList.filter(
                (chat) => chat._id !== actualChatId
              );
              const newChat: ChatSummary = {
                _id: newChatId,
                title: (result.data.title as string) || "New Conversation",
                createdAt:
                  (result.data.createdAt as string) || new Date().toISOString(),
                updatedAt:
                  (result.data.updatedAt as string) || new Date().toISOString(),
              };
              return [newChat, ...filteredList];
            } else {
              // For existing chats, update the chat's updatedAt and move it to the top
              const updatedChatList = oldChatList.map((chat) => {
                if (chat._id === newChatId) {
                  return {
                    ...chat,
                    title: (result.data.title as string) || chat.title,
                    updatedAt:
                      (result.data.updatedAt as string) ||
                      new Date().toISOString(),
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
          }
        );

        // Clear optimistic messages for the old chat key and move to new chat
        if (isNewChatCreated) {
          // For widget: move optimistic messages from temp chat ID to real chat ID
          // Get optimistic messages from the temp chat ID
          const tempOptimisticMessages =
            optimisticMessagesByChat[actualChatId] || [];
          if (tempOptimisticMessages.length > 0) {
            // Move messages to the real chat ID
            tempOptimisticMessages.forEach((msg) => {
              dispatch(
                addOptimisticMessage({ chatId: newChatId, message: msg })
              );
            });
            // Remove optimistic messages from temp chat ID
            dispatch(removeOptimisticMessages(actualChatId));
          } else {
            // Fallback: remove optimistic messages if none found
            dispatch(removeOptimisticMessages(currentChatKey));
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
        } else {
          // For existing chats, clear optimistic messages after server response
          dispatch(removeOptimisticMessages(actualChatId));
        }

        // Don't invalidate queries - we've already updated the cache with setQueryData
        // Invalidating would cause a full refetch and refresh the whole chat
      }
    } catch (error: any) {
      console.error("Streaming error:", error);

      // For new chats in widget, remove optimistic messages from temp chat ID
      if (isNewChat) {
        // Remove optimistic messages from the temp chat ID
        dispatch(removeOptimisticMessages(actualChatId));
      } else {
        // For existing chats, remove optimistic messages
        dispatch(removeOptimisticMessages(currentChatKey));
      }

      // Remove optimistic chat entry if it was a new chat
      if (isNewChat) {
        queryClient.setQueryData<ChatSummary[]>(
          ["chatList"],
          (oldChatList = []) => {
            return oldChatList.filter((chat) => chat._id !== actualChatId);
          }
        );
      }

      // Mark long-running task as error
      dispatch(
        errorTask({
          id: tempMessage._id,
          errorMessage: error?.message || "Failed to send message",
        })
      );

      dispatch(setComposerValue(trimmedMessage));

      toast({
        title: "Unable to send message",
        description:
          error?.message ||
          "We could not deliver your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      isSendingRef.current = false;
      isStreamingRef.current = false;
      // Only clear streaming chat ID if this was the chat that was streaming
      if (streamingChatIdRef.current === actualChatId) {
        streamingChatIdRef.current = null;
      }
      dispatch(setIsStreaming(false));
      dispatch(clearStreamingEvents());

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const hasActiveChat = activeChatId || selectedMessages.length > 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-[calc(100%-2rem)] h-full">
      {/* Greeting or Chat Messages */}
      {!hasActiveChat ? (
        <div className="assistant-greeting flex-1 flex flex-col justify-center">
          <h1 className="assistant-greeting__headline font-poppins">
            {greeting}, {userName}!
          </h1>
          <p className="assistant-greeting__subtitle font-poppins">
            How can I assist You?
          </p>
        </div>
      ) : (
        <div
          ref={scrollAreaRef}
          className="flex-1 min-h-0 space-y-4 overflow-y-auto scrollbar-hide px-2 py-28"
        >
          {selectedMessages.map((msg) => {
            const isAssistant = msg.role === "assistant";
            return (
              <div
                key={msg._id}
                className={cn(
                  "flex w-full",
                  isAssistant ? "justify-start" : "justify-end"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-lg",
                    isAssistant
                      ? "max-w-[90%] sm:max-w-[90%] rounded-bl-md bg-white/5 text-white"
                      : "max-w-[100%] sm:max-w-[100%] rounded-br-md bg-[linear-gradient(226.23deg,_#3E65B4_0%,_#68B3B7_100%)] text-white"
                  )}
                >
                  <div className="text-left max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={{
                        // Headings with proper hierarchy and spacing
                        h1: ({ node, ...props }) => (
                          <h1
                            className="text-2xl font-bold mb-4 mt-6 text-white first:mt-0 leading-tight"
                            {...props}
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            className="text-xl font-semibold mb-3 mt-5 text-white first:mt-0 leading-tight"
                            {...props}
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            className="text-lg font-semibold mb-2 mt-4 text-white first:mt-0 leading-tight"
                            {...props}
                          />
                        ),
                        h4: ({ node, ...props }) => (
                          <h4
                            className="text-base font-semibold mb-2 mt-3 text-white first:mt-0 leading-tight"
                            {...props}
                          />
                        ),
                        h5: ({ node, ...props }) => (
                          <h5
                            className="text-sm font-semibold mb-1 mt-2 text-white first:mt-0 leading-tight"
                            {...props}
                          />
                        ),
                        h6: ({ node, ...props }) => (
                          <h6
                            className="text-xs font-semibold mb-1 mt-2 text-white/90 first:mt-0 leading-tight"
                            {...props}
                          />
                        ),
                        // Paragraphs with proper spacing
                        p: ({ node, ...props }) => (
                          <p
                            className="mb-3 text-white/90 leading-relaxed break-words last:mb-0"
                            style={{ overflowWrap: "anywhere" }}
                            {...props}
                          />
                        ),
                        // Links with better styling
                        a: ({ node, ...props }) => (
                          <a
                            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors duration-200 break-all"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                          />
                        ),
                        // Inline and block code
                        code: ({ node, inline, className, ...props }: any) => {
                          return inline ? (
                            <code
                              className="bg-white/15 text-blue-300 rounded px-1.5 py-0.5 text-xs font-mono break-all"
                              {...props}
                            />
                          ) : (
                            <code
                              className="block p-0 text-white/90 text-xs font-mono whitespace-pre overflow-x-auto max-w-full"
                              {...props}
                            />
                          );
                        },
                        // Preformatted text (code blocks)
                        pre: ({ node, ...props }) => (
                          <pre
                            className="my-3 p-3 rounded-lg bg-white/10 overflow-x-auto max-w-full scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                            {...props}
                          />
                        ),
                        // Lists with proper indentation and spacing
                        ul: ({ node, ...props }) => (
                          <ul
                            className="mb-3 ml-0 list-none space-y-1.5 text-white/90 py-2"
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="mb-3 ml-4 list-none space-y-1.5 text-white/90"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li
                            className="pl-1 break-words leading-relaxed"
                            style={{ overflowWrap: "anywhere" }}
                            {...props}
                          />
                        ),
                        // Blockquotes
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            className="border-l-4 border-white/30 pl-4 my-4 italic text-white/80"
                            {...props}
                          />
                        ),
                        // Horizontal rule
                        hr: ({ node, ...props }) => (
                          <hr
                            className="my-6 border-0 border-t border-white/20"
                            {...props}
                          />
                        ),
                        // Strong (bold) text
                        strong: ({ node, ...props }) => (
                          <strong
                            className="font-semibold text-white"
                            {...props}
                          />
                        ),
                        // Emphasis (italic) text
                        em: ({ node, ...props }) => (
                          <em className="italic text-white/95" {...props} />
                        ),
                        // Tables with improved styling
                        table: ({ node, ...props }) => (
                          <div className="my-4 max-w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                            <table
                              style={{
                                tableLayout: "auto",
                                width: "max-content",
                              }}
                              className="border-collapse text-sm w-full"
                              {...props}
                            />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead className="bg-white/10 text-left" {...props} />
                        ),
                        tbody: ({ node, ...props }) => (
                          <tbody
                            className="divide-y divide-white/10 text-left"
                            {...props}
                          />
                        ),
                        tr: ({ node, ...props }) => (
                          <tr
                            className="transition-colors hover:bg-white/5 text-left"
                            {...props}
                          />
                        ),
                        th: ({ node, ...props }) => (
                          <th
                            className="break-words border border-white/20 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-white"
                            style={{
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              whiteSpace: "normal",
                            }}
                            {...props}
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <td
                            className="break-words border border-white/20 px-4 py-2.5 text-left text-sm text-white/90"
                            style={{
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              whiteSpace: "normal",
                            }}
                            {...props}
                          />
                        ),
                        // Images
                        img: ({ node, ...props }) => (
                          <img
                            className="my-4 rounded-lg max-w-full h-auto"
                            {...props}
                          />
                        ),
                        // Div wrapper
                        div: ({ node, ...props }: any) => (
                          <div className="text-left" {...props} />
                        ),
                      }}
                    >
                      {transformCompanyTable(msg.content)}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}
          {isCurrentChatSending && (
            <motion.div
              key="typing-indicator"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={typingVariants}
              className="flex justify-start"
            >
              <div className="flex items-start gap-3 rounded-3xl bg-white/5 px-4 py-3 text-sm text-white/80">
                <div className="flex items-center gap-1 pt-2">
                  <motion.div
                    animate="animate"
                    variants={dotVariants}
                    className="w-2 h-2 bg-white/60 rounded-full"
                  />
                  <motion.div
                    animate="animate"
                    variants={dotVariants2}
                    className="w-2 h-2 bg-white/60 rounded-full"
                  />
                  <motion.div
                    animate="animate"
                    variants={dotVariants3}
                    className="w-2 h-2 bg-white/60 rounded-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-white/70 text-left">Thinking…</span>
                  {isStreaming &&
                    isCurrentChatSending &&
                    streamingEvents.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-gray-400 italic flex items-center gap-2"
                      >
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>
                          {streamingEvents[streamingEvents.length - 1]?.step
                            ?.replace(/^[^\w\s]+/, "")
                            .trim() || "Processing..."}
                        </span>
                      </motion.div>
                    )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <div className="assistant-composer mt-auto">
        <div className="assistant-composer__entry">
          <input
            ref={inputRef}
            className="assistant-composer__input font-poppins focus:outline-none"
            type="text"
            placeholder={
              isListening ? "Listening... Click mic to stop" : "Ask Skylar"
            }
            value={
              (message || "") +
              (interimTranscript ? ` ${interimTranscript}` : "")
            }
            onChange={(e) => {
              // Remove interim transcript from the value before updating
              const valueWithoutInterim = interimTranscript
                ? e.target.value.replace(interimTranscript, "").trim()
                : e.target.value;
              dispatch(setComposerValue(valueWithoutInterim));
            }}
            onKeyPress={handleKeyPress}
            disabled={isSendingMessage || isListening}
          />
        </div>
        <div className="assistant-composer__actions">
          <div
            className={cn(
              "round-icon-btn--outline cursor-pointer",
              isListening && "bg-red-500 text-white animate-pulse"
            )}
            onClick={handleMicClick}
          >
            <Mic size={22} />
          </div>
          <div
            className={cn(
              "round-icon-btn cursor-pointer",
              isListening && "opacity-50 cursor-not-allowed"
            )}
            onClick={handleSendMessage}
          >
            {isSendingMessage ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Send size={17} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
