import { useEffect, useMemo, useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ChatMessage } from "@/types/chat.types";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

type ChatMessagesProps = {
  chatTitle?: string;
  messages?: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  hasSelection: boolean;
};

const ChatMessages = ({
  chatTitle,
  messages,
  isLoading,
  isSending,
  hasSelection,
}: ChatMessagesProps) => {
  const conversation = useMemo(() => messages ?? [], [messages]);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollAreaRef.current) {
      return;
    }

    const container = scrollAreaRef.current;
    container.scrollTop = container.scrollHeight;
  }, [conversation.length, isLoading, isSending]);

  if (!hasSelection) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 text-center text-muted-foreground/70">
        <Sparkles className="mb-4 size-10 text-primary/70" />
        <h3 className="text-lg font-semibold text-white">Start a Conversation</h3>
        <p className="mt-2 max-w-sm text-sm">
          Choose an existing chat on the left or create a new one to begin
          collaborating with your AI assistant.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center rounded-3xl border border-white/10 bg-black/30">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground/70">
          Loading conversation…
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0e1015]/90 via-[#11131a]/90 to-[#121212]/90 shadow-[0_24px_80px_rgba(14,23,43,0.45)] backdrop-blur-3xl">
      <header className="flex flex-col gap-2 border-b border-white/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground/60">
            The Sales Outreach Agent
          </p>
          <h2 className="text-2xl font-semibold text-white">
            {chatTitle ?? "A Simple Hello"}
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/80">
          Live
          <span className="inline-flex size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
        </div>
      </header>

      <div
        ref={scrollAreaRef}
        className="flex-1 space-y-4 overflow-y-auto px-6 py-6 sm:px-10 sm:py-8 max-h-[55vh]"
      >
        {conversation.map((message) => {
          const isAssistant = message.role !== "user";
          return (
            <div
              key={message._id}
              className={cn(
                "flex w-full",
                isAssistant ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-lg sm:max-w-[70%]",
                  isAssistant
                    ? "rounded-br-md bg-gradient-to-br from-[#5ba7ff]/90 to-[#6be5f5]/90 text-black"
                    : "rounded-bl-md bg-white/5 text-white"
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
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
        {isSending ? (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 rounded-3xl bg-gradient-to-r from-primary/20 to-primary/10 px-4 py-2 text-xs text-primary/80">
              <Loader2 className="size-4 animate-spin" />
              Sending…
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ChatMessages;
