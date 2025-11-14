import { Sparkles, Mic, Send, Loader2 } from "lucide-react";
import { FC, useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  sendChatMessage,
  SendChatMessagePayload,
} from "@/services/chat.service";
import { ChatMessage } from "@/types/chat.types";
import { cn } from "@/lib/utils";
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
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(initialMessages);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const user = useSelector((state: RootState) => state.auth.user);
  const userName = user?.name || user?.email?.split("@")[0] || "User";
  const greeting = getTimeBasedGreeting();

  // Sync local messages with parent
  useEffect(() => {
    setLocalMessages(initialMessages);
  }, [initialMessages]);

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
      SendChatMessagePayload
    >({
      mutationFn: sendChatMessage,
      onMutate: (variables) => {
        const trimmedMessage = variables.message.trim();
        const tempMessage: ChatMessage = {
          _id: `temp-${Date.now()}`,
          chatId: currentChatId ?? "temp",
          role: "user",
          content: trimmedMessage,
          createdAt: new Date().toISOString(),
        };

        setMessage("");
        setLocalMessages((prev) => [...prev, tempMessage]);
        onMessagesChange([...localMessages, tempMessage]);

        return { tempMessage };
      },
      onSuccess: (response) => {
        const newChatId = response.data.chatId;
        const newMessages = response.data.messages || [];

        if (newChatId) {
          onChatIdChange(newChatId);
          // Use all messages from server response (includes both user and assistant)
          if (newMessages.length > 0) {
            setLocalMessages(newMessages);
            onMessagesChange(newMessages);
          } else {
            // If no messages in response, keep user message and wait for assistant response
            setLocalMessages((prev) => {
              onMessagesChange(prev);
              return prev;
            });
          }

          // Invalidate queries to refresh chat list
          queryClient.invalidateQueries({ queryKey: ["chatList"] });
          queryClient.invalidateQueries({
            queryKey: ["chatDetail", newChatId],
          });
        }
      },
      onError: (error, variables, context) => {
        // Remove the last user message on error
        setLocalMessages((prev) => {
          const updated = prev.slice(0, -1);
          onMessagesChange(updated);
          return updated;
        });
        setMessage(variables.message);

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
    if (message.trim() && !isSendingMessage) {
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
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full h-full">
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
          className="flex-1 min-h-0 space-y-4 overflow-y-auto scrollbar-hide px-2 py-4"
        >
          {localMessages.map((msg) => {
            const isAssistant = msg.role !== "user";
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
                    "max-w-[80%] rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-lg",
                    isAssistant
                      ? "rounded-bl-md bg-white/5 text-white"
                      : "rounded-br-md bg-[linear-gradient(226.23deg,_#3E65B4_0%,_#68B3B7_100%)] text-white"
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="my-4 max-w-[600px] overflow-x-auto rounded-lg border border-white/20">
                          <table
                            className="w-full table-auto border-collapse"
                            {...props}
                          />
                        </div>
                      ),
                      thead: ({ node, ...props }) => (
                        <thead className="bg-white/10" {...props} />
                      ),
                      tbody: ({ node, ...props }) => (
                        <tbody
                          className="divide-y divide-white/10"
                          {...props}
                        />
                      ),
                      tr: ({ node, ...props }) => (
                        <tr
                          className="transition-colors hover:bg-white/5"
                          {...props}
                        />
                      ),
                      th: ({ node, ...props }) => (
                        <th
                          className="max-w-[200px] break-words border border-white/20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                          {...props}
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td
                          className="max-w-[200px] break-words border border-white/20 px-4 py-3 text-sm text-white/90"
                          {...props}
                        />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className="max-w-full break-all text-blue-400 underline hover:text-blue-300"
                          {...props}
                        />
                      ),
                      code: ({ node, inline, ...props }: any) =>
                        inline ? (
                          <code
                            className="max-w-full break-all rounded bg-white/10 px-1 py-0.5 text-xs"
                            {...props}
                          />
                        ) : (
                          <code
                            className="my-2 block max-w-[600px] overflow-x-auto rounded bg-white/10 p-2 text-xs"
                            {...props}
                          />
                        ),
                      p: ({ node, ...props }) => (
                        <p
                          className="mb-2 max-w-[600px] break-words"
                          style={{ overflowWrap: "anywhere" }}
                          {...props}
                        />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            );
          })}
          {isSendingMessage && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-3xl bg-white/5 px-4 py-2 text-xs text-white/80">
                <Loader2 className="size-4 animate-spin" />
                Thinking…
              </div>
            </div>
          )}
        </div>
      )}

      <div className="assistant-composer mt-auto">
        <div className="assistant-composer__chip font-poppins">
          <Sparkles size={20} />
          AI
        </div>
        <div className="assistant-composer__entry">
          <input
            className="assistant-composer__input font-poppins"
            type="text"
            placeholder="Ask CSOA Assistant"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSendingMessage}
          />
        </div>
        <div className="assistant-composer__actions">
          <div className="round-icon-btn--outline">
            <Mic size={14} />
          </div>
          <div
            className="round-icon-btn cursor-pointer"
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

