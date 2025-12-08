import { Sparkles, Mic, Send, Loader2 } from "lucide-react";
import { FC, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";
import {
  sendChatMessage,
  SendChatMessagePayload,
  fetchChatById,
} from "@/services/chat.service";
import { deepgramTranscription } from "@/services/deepgram.service";
import { ChatMessage } from "@/types/chat.types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useToast } from "@/components/ui/use-toast";

const CURRENT_CHAT_KEY = "assistant_panel_current_chat";

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
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
  const [message, setMessage] = useState("");
  const [localMessages, setLocalMessages] =
    useState<ChatMessage[]>(initialMessages);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isSendingRef = useRef(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const user = useSelector((state: RootState) => state.auth.user);
  const userName = user?.name || user?.email?.split("@")[0] || "User";
  const greeting = getTimeBasedGreeting();

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

    const success = await deepgramTranscription.startListening(
      (transcript, isFinal) => {
        // Update interim transcript for real-time feedback
        setInterimTranscript(transcript);

        // If it's a final result, add it to the message
        if (transcript && isFinal) {
          setMessage((prev) => prev + (prev ? " " : "") + transcript);
          setInterimTranscript("");
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
      },
      () => {
        // On end
        setIsListening(false);
        // Move any remaining interim transcript to final message
        if (interimTranscript.trim()) {
          setMessage(
            (prev) => prev + (prev ? " " : "") + interimTranscript.trim()
          );
          setInterimTranscript("");
        }
      }
    );

    if (success) {
      setIsListening(true);
    }
  };

  const stopRealtimeTranscription = () => {
    deepgramTranscription.stopListening();
    setIsListening(false);
    // Move any remaining interim transcript to final message
    if (interimTranscript.trim()) {
      setMessage((prev) => prev + (prev ? " " : "") + interimTranscript.trim());
      setInterimTranscript("");
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopRealtimeTranscription();
    } else {
      startRealtimeTranscription();
    }
  };

  // Fetch chat details when currentChatId changes
  const { data: chatDetail } = useQuery({
    queryKey: ["chatDetail", currentChatId],
    queryFn: () => fetchChatById(currentChatId ?? ""),
    enabled: Boolean(currentChatId),
    staleTime: 10_000,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [localMessages.length]);

  // Save current chat to localStorage whenever it changes
  useEffect(() => {
    if (currentChatId || localMessages.length > 0) {
      localStorage.setItem(
        CURRENT_CHAT_KEY,
        JSON.stringify({
          chatId: currentChatId,
          messages: localMessages,
        })
      );
      onMessagesChange(localMessages);
    } else {
      localStorage.removeItem(CURRENT_CHAT_KEY);
      onMessagesChange([]);
    }
  }, [currentChatId, localMessages, onMessagesChange]);

  const { mutate: mutateSendMessage, isPending: isSendingMessage } =
    useMutation<
      Awaited<ReturnType<typeof sendChatMessage>>,
      AxiosError<{ message?: string }>,
      SendChatMessagePayload,
      { tempMessage: ChatMessage }
    >({
      mutationFn: sendChatMessage,
      onMutate: (variables) => {
        // Prevent multiple simultaneous sends
        if (isSendingRef.current) {
          throw new Error("Already sending a message");
        }
        isSendingRef.current = true;

        const trimmedMessage = variables.message.trim();
        const tempMessage: ChatMessage = {
          _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          chatId: currentChatId ?? "temp",
          role: "user",
          content: trimmedMessage,
          createdAt: new Date().toISOString(),
        };

        setMessage("");
        // Use functional update to ensure we have the latest state
        setLocalMessages((prev) => {
          // Check if this exact message is already in the list to prevent duplicates
          const messageExists = prev.some(
            msg => msg.role === "user" && msg.content === trimmedMessage && !msg._id.startsWith("temp-")
          );
          if (messageExists) {
            return prev; // Don't add duplicate
          }

          const updated = [...prev, tempMessage];
          onMessagesChange(updated);
          return updated;
        });

        return { tempMessage };
      },
      onSuccess: async (response) => {
        isSendingRef.current = false;

        const newChatId = response.data.chatId;
        const newMessages = response.data.messages || [];

        if (newChatId) {
          const isNewChat = newChatId !== currentChatId;

          if (isNewChat) {
            onChatIdChange(newChatId);
          }

          // Invalidate queries to refresh chat list and chat detail
          queryClient.invalidateQueries({ queryKey: ["chatList"] });
          queryClient.invalidateQueries({
            queryKey: ["chatDetail", newChatId],
          });

          // Refetch chat details to get complete message list (including assistant response)
          try {
            const chatDetail = await queryClient.fetchQuery({
              queryKey: ["chatDetail", newChatId],
              queryFn: () => fetchChatById(newChatId),
            });

            if (chatDetail?.messages && chatDetail.messages.length > 0) {
              // Use functional update to replace all messages with server data
              // Remove any temp messages as server should have the real messages now
              setLocalMessages(chatDetail.messages);
              onMessagesChange(chatDetail.messages);
            } else if (newMessages.length > 0) {
              // Fallback to response messages if refetch doesn't return messages yet
              setLocalMessages(newMessages);
              onMessagesChange(newMessages);
            }
          } catch (error) {
            // If refetch fails, use messages from response
            if (newMessages.length > 0) {
              setLocalMessages(newMessages);
              onMessagesChange(newMessages);
            }
          }
        }
      },
      onError: (error, variables, context) => {
        isSendingRef.current = false;

        // Remove only the temp message that failed, not all messages
        if (context?.tempMessage) {
          setLocalMessages((prev) => {
            const updated = prev.filter(msg => msg._id !== context.tempMessage._id);
            onMessagesChange(updated);
            return updated;
          });
        }

        // Only restore the message if it's not already restored and user hasn't typed something new
        if (message.trim() === "") {
          setMessage(variables.message);
        }

        toast({
          title: "Unable to send message",
          description:
            error.response?.data?.message ??
            "We could not deliver your message. Please try again.",
          variant: "destructive",
        });
      },
    });

  // Cleanup sending ref when mutation state changes
  useEffect(() => {
    if (!isSendingMessage) {
      isSendingRef.current = false;
    }
  }, [isSendingMessage]);

  // Sync local messages with parent and chat detail
  // Skip syncing when sending a message to preserve optimistic updates
  useEffect(() => {
    // Don't sync if we're currently sending a message (to preserve optimistic updates)
    if (isSendingRef.current) {
      return;
    }

    // Only sync if we have a currentChatId and chatDetail messages
    // This ensures we get the latest messages when selecting a chat from history
    if (
      currentChatId &&
      chatDetail?.messages &&
      chatDetail.messages.length > 0
    ) {
      setLocalMessages(chatDetail.messages);
      onMessagesChange(chatDetail.messages);
    } else if (!currentChatId && initialMessages.length > 0) {
      // Only use initialMessages if we don't have a chatId (new chat scenario)
      setLocalMessages(initialMessages);
    }
  }, [
    currentChatId,
    chatDetail?.messages,
    initialMessages,
    onMessagesChange,
  ]);

  const handleSendMessage = () => {
    if (message.trim() && !isSendingRef.current && !isListening) {
      mutateSendMessage({
        message: message.trim(),
        chatId: currentChatId,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const hasActiveChat = currentChatId || localMessages.length > 0;

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
          {localMessages.map((msg) => {
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
                    "max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-lg sm:max-w-[75%]",
                    isAssistant
                      ? "rounded-bl-md bg-white/5 text-white"
                      : "rounded-br-md bg-[linear-gradient(226.23deg,_#3E65B4_0%,_#68B3B7_100%)] text-white"
                  )}
                >
                  <div className="text-left">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      components={{
                        table: ({ node, ...props }) => (
                          <div className="my-4 max-w-full overflow-x-auto rounded-lg border border-white/20 scrollbar-hide">
                            <table
                              // let table grow to the width of its content
                              style={{ tableLayout: "auto", width: "max-content" }}
                              className="border-collapse text-sm"
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
                            className="break-words border border-white/20 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-white overflow-hidden"
                            style={{
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              whiteSpace: 'normal',
                              maxWidth: '400px'
                            }}
                            {...props}
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <td
                            className="break-words border border-white/20 px-3 py-2 text-left text-sm text-white/90 overflow-hidden"
                            style={{
                              wordBreak: 'break-word',
                              overflowWrap: 'break-word',
                              whiteSpace: 'normal',
                              maxWidth: '400px'
                            }}
                            {...props}
                          />
                        ),
                        a: ({ node, ...props }) => (
                          <a
                            className="max-w-full break-all text-left text-blue-400 underline hover:text-blue-300"
                            {...props}
                          />
                        ),
                        code: ({ node, inline, ...props }: any) =>
                          inline ? (
                            <code
                              className="max-w-full break-all rounded bg-white/10 px-1 py-0.5 text-left text-xs"
                              {...props}
                            />
                          ) : (
                            <code
                              className="my-2 block max-w-[600px] overflow-x-auto rounded bg-white/10 p-2 text-left text-xs"
                              {...props}
                            />
                          ),
                        p: ({ node, ...props }) => (
                          <p
                            className="break-words text-left"
                            style={{ overflowWrap: "anywhere" }}
                            {...props}
                          />
                        ),
                        div: ({ node, ...props }: any) => (
                          <div className="text-left" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            className="list-inside list-disc text-left"
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="list-inside list-decimal text-left"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="text-left" {...props} />
                        ),
                        h1: ({ node, ...props }) => (
                          <h1 className="text-left" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-left" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-left" {...props} />
                        ),
                        h4: ({ node, ...props }) => (
                          <h4 className="text-left" {...props} />
                        ),
                        h5: ({ node, ...props }) => (
                          <h5 className="text-left" {...props} />
                        ),
                        h6: ({ node, ...props }) => (
                          <h6 className="text-left" {...props} />
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}
          {isSendingMessage && (
            <motion.div
              key="typing-indicator"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={typingVariants}
              className="flex justify-start"
            >
              <div className="flex items-center gap-3 rounded-3xl bg-white/5 px-4 py-3 text-xs text-white/80">
                <div className="flex items-center gap-1">
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
                <span className="text-white/70">Thinking…</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <div className="assistant-composer mt-auto">
        <div className="assistant-composer__entry">
          <input
            ref={inputRef}
            className="assistant-composer__input font-poppins"
            type="text"
            placeholder={
              isListening ? "Listening... Click mic to stop" : "Ask Skylar"
            }
            value={message + (interimTranscript ? ` ${interimTranscript}` : "")}
            onChange={(e) => setMessage(e.target.value)}
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
