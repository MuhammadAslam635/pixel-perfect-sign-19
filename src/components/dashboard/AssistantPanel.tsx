import {
  List,
  Pencil,
  Sparkles,
  Mic,
  Send,
  Loader2,
  Search,
  MessageCircle,
  PenSquare,
  EllipsisVertical,
} from "lucide-react";
import { FC, useState, useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  sendChatMessage,
  SendChatMessagePayload,
  fetchChatList,
} from "@/services/chat.service";
import { ChatMessage, ChatSummary } from "@/types/chat.types";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const STORAGE_KEY = "assistant_panel_chat_history";
const CURRENT_CHAT_KEY = "assistant_panel_current_chat";

type AssistantPanelProps = {
  isDesktop: boolean;
};

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const AssistantPanel: FC<AssistantPanelProps> = ({ isDesktop }) => {
  const panelStyle = undefined;
  const [message, setMessage] = useState("");
  const [showChatList, setShowChatList] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSummary[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const user = useSelector((state: RootState) => state.auth.user);
  const userName = user?.name || user?.email?.split("@")[0] || "User";
  const greeting = getTimeBasedGreeting();

  // Load chat history from localStorage on mount
  // On reload, clear current chat to show greeting (chat remains in list)
  useEffect(() => {
    const storedHistory = localStorage.getItem(STORAGE_KEY);

    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        setChatHistory(parsed);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }

    // Clear current chat on page reload to show greeting
    // The chat will still be available in the chat list
    localStorage.removeItem(CURRENT_CHAT_KEY);
    setCurrentChatId(null);
    setLocalMessages([]);
  }, []);

  // Fetch chat list from API
  const { data: apiChatList = [], isLoading: isChatListLoading } = useQuery({
    queryKey: ["chatList"],
    queryFn: fetchChatList,
    staleTime: 30_000,
  });

  // Merge API chat list with local history
  useEffect(() => {
    if (apiChatList.length > 0) {
      setChatHistory(apiChatList);
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apiChatList));
    }
  }, [apiChatList]);

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
    } else {
      localStorage.removeItem(CURRENT_CHAT_KEY);
    }
  }, [currentChatId, localMessages]);

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

        return { tempMessage };
      },
      onSuccess: (response) => {
        const newChatId = response.data.chatId;
        const newMessages = response.data.messages || [];

        if (newChatId) {
          setCurrentChatId(newChatId);
          // Use all messages from server response (includes both user and assistant)
          if (newMessages.length > 0) {
            setLocalMessages(newMessages);
          } else {
            // If no messages in response, keep user message and wait for assistant response
            setLocalMessages((prev) => prev);
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
        setLocalMessages((prev) => prev.slice(0, -1));
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

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowChatList(false);
    // Fetch chat messages for selected chat
    queryClient
      .fetchQuery({
        queryKey: ["chatDetail", chatId],
        queryFn: async () => {
          const { fetchChatById } = await import("@/services/chat.service");
          return fetchChatById(chatId);
        },
      })
      .then((chatDetail) => {
        if (chatDetail?.messages) {
          setLocalMessages(chatDetail.messages);
        }
      });
  };

  const handleStartNewChat = () => {
    setCurrentChatId(null);
    setLocalMessages([]);
    setShowChatList(false);
    setSearchTerm("");
    localStorage.removeItem(CURRENT_CHAT_KEY);
  };

  const truncateText = (text: string, limit: number) =>
    text.length > limit ? `${text.slice(0, limit - 1)}…` : text;

  const filteredChats = useMemo(() => {
    if (!searchTerm) {
      return chatHistory;
    }

    const query = searchTerm.toLowerCase();
    return chatHistory.filter((chat) => {
      const titleMatch = chat.title?.toLowerCase().includes(query);
      const messageMatch = chat.messages?.some((message) =>
        message.content.toLowerCase().includes(query)
      );
      return titleMatch || messageMatch;
    });
  }, [chatHistory, searchTerm]);

  const hasActiveChat = currentChatId || localMessages.length > 0;

  return (
    <section
      className="assistant-panel mx-auto w-full h-full flex flex-col overflow-hidden relative"
      style={panelStyle}
    >
      <div
        className="assistant-tools flex gap-2 mb-4"
        style={{ background: "#404040" }}
      >
        <div
          className="assistant-tool cursor-pointer"
          onClick={() => setShowChatList(!showChatList)}
          style={{ background: showChatList ? "#5D5D5D" : "transparent" }}
        >
          <List size={12} />
        </div>
        <div
          className="assistant-tool cursor-pointer"
          onClick={handleStartNewChat}
          style={{
            background:
              !showChatList && !hasActiveChat ? "#5D5D5D" : "transparent",
          }}
        >
          <Pencil size={12} />
        </div>
      </div>
      {/* Chat List or Greeting/Chat Messages */}
      {showChatList ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="mb-6 space-y-4">
            <Button
              variant="ghost"
              className="group flex w-full items-center justify-start gap-3 rounded-2xl px-2 py-2 text-left text-sm font-medium text-white transition hover:bg-transparent hover:text-white/90"
              onClick={handleStartNewChat}
            >
              <PenSquare className="size-5 text-white/70 transition group-hover:text-white/90" />
              <span>New Chat</span>
            </Button>

            <div className="relative">
              <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-white/60" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search.."
                className="h-12 rounded-full border border-white/5 bg-transparent pl-12 text-sm text-white placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-white/30"
                style={{
                  borderRadius: "9999px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              />
            </div>
          </div>

          <div className="mb-3 text-sm font-semibold text-white/80">Chats</div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full" hideScrollbars>
              <div className="space-y-1.5 pr-1">
                {isChatListLoading ? (
                  <div className="flex h-64 items-center justify-center text-muted-foreground/70">
                    <Loader2 className="size-5 animate-spin" />
                    <span className="ml-2 text-sm">Loading chats…</span>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground/70">
                    <MessageCircle className="mx-auto mb-3 size-6 text-muted-foreground/40" />
                    <p>No conversations found.</p>
                    <Button
                      size="sm"
                      className="mt-4 rounded-full bg-primary px-4"
                      onClick={handleStartNewChat}
                    >
                      Start a new chat
                    </Button>
                  </div>
                ) : (
                  filteredChats.map((chat) => {
                    const lastMessage = chat.messages?.at(-1);
                    const fullTitle = chat.title || "Untitled Conversation";
                    const truncatedTitle = truncateText(fullTitle, 18);

                    return (
                      <div
                        key={chat._id}
                        className={cn(
                          "group flex w-full items-center rounded-2xl border border-[#2B2A38]/40 bg-[#FFFFFF0A] px-4 py-4 shadow-[0_0_80px_rgba(0,0,0,0.08)] transition-all duration-300",
                          currentChatId === chat._id
                            ? "border-white/60 bg-white/10 shadow-[0_0_90px_rgba(0,0,0,0.15)]"
                            : "hover:border-white/30 hover:bg-white/12 hover:shadow-[0_0_90px_rgba(0,0,0,0.12)]"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectChat(chat._id)}
                          className="flex min-w-0 flex-1 flex-col text-left"
                        >
                          <div className="flex items-center gap-2">
                            <p
                              className="flex-1 truncate text-sm font-semibold text-white"
                              title={chat.title || "Untitled Conversation"}
                            >
                              {truncatedTitle}
                            </p>
                          </div>
                          {lastMessage ? (
                            <p
                              className="mt-1 truncate text-[12px] text-white/60"
                              title={lastMessage.content}
                            >
                              {truncateText(lastMessage.content, 25)}
                            </p>
                          ) : (
                            <p className="mt-1 text-[12px] text-white/45">
                              No messages yet
                            </p>
                          )}
                        </button>
                        <button
                          type="button"
                          className="ml-3 flex size-6 items-center justify-center rounded-full border border-transparent transition"
                          aria-label="Chat options"
                        >
                          <EllipsisVertical className="size-4 text-white" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      ) : !hasActiveChat ? (
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

      {!showChatList && (
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
      )}
    </section>
  );
};

export default AssistantPanel;
