import { useEffect, useMemo, useRef } from "react";
import { Download, Loader2, Sparkles } from "lucide-react";
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
      <div className="flex h-full flex-1 flex-col items-center justify-center px-6 text-center text-muted-foreground/70">
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
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground/70">
          Loading conversation…
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center">
            <svg
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid meet"
              className="h-full w-full"
              style={{ transform: "translateY(20%)" }}
            >
              <g filter="url(#filter0_d_269_544)" data-figma-bg-blur-radius="38.8358">
                <rect
                  x="19.418"
                  width="60.1955"
                  height="60.1955"
                  rx="30.0978"
                  fill="url(#paint0_linear_269_544)"
                  fillOpacity="0.5"
                  shapeRendering="crispEdges"
                />
                <rect
                  x="19.9034"
                  y="0.485448"
                  width="59.2246"
                  height="59.2246"
                  rx="29.6123"
                  stroke="url(#paint1_linear_269_544)"
                  strokeWidth="0.970895"
                  shapeRendering="crispEdges"
                />
                <path
                  d="M49.5157 20.3888C54.878 20.3888 59.2247 24.7355 59.2247 30.0978C59.2247 35.46 54.878 39.8067 49.5157 39.8067C44.1535 39.8067 39.8068 35.46 39.8068 30.0978C39.8068 24.7355 44.1535 20.3888 49.5157 20.3888ZM49.5157 33.0105C47.2953 33.0105 45.2923 33.9435 43.8768 35.4377C44.6017 36.2051 45.4759 36.8163 46.4456 37.2337C47.4153 37.6511 48.46 37.8659 49.5157 37.8649C50.5713 37.8657 51.6158 37.6509 52.5853 37.2335C53.5549 36.8161 54.4289 36.205 55.1537 35.4377C54.4289 34.6704 53.5549 34.0593 52.5853 33.6419C51.6158 33.2245 50.5713 33.0096 49.5157 33.0105ZM49.972 23.6122C49.9356 23.5209 49.8727 23.4426 49.7913 23.3875C49.71 23.3324 49.614 23.3029 49.5157 23.3029C49.4174 23.3029 49.3214 23.3324 49.2401 23.3875C49.1587 23.4426 49.0958 23.5209 49.0594 23.6122L48.8128 24.2044C48.4007 25.2094 47.6188 26.018 46.6283 26.4637L45.9312 26.7744C45.842 26.8156 45.7666 26.8815 45.7137 26.9643C45.6608 27.047 45.6327 27.1432 45.6327 27.2414C45.6327 27.3396 45.6608 27.4358 45.7137 27.5185C45.7666 27.6013 45.842 27.6671 45.9312 27.7084L46.6691 28.0366C47.6349 28.4703 48.4037 29.2495 48.8244 30.2211L49.0623 30.7706C49.2371 31.1725 49.7934 31.1725 49.9691 30.7706L50.2089 30.222C50.6284 29.2497 51.3971 28.4699 52.3634 28.0366L53.1012 27.7084C53.1906 27.6673 53.2664 27.6014 53.3195 27.5185C53.3726 27.4357 53.4008 27.3393 53.4008 27.2409C53.4008 27.1425 53.3726 27.0462 53.3195 26.9633C53.2664 26.8804 53.1906 26.8145 53.1012 26.7734L52.4041 26.4627C51.4136 26.0177 50.6314 25.2098 50.2186 24.2054L49.972 23.6122Z"
                  fill="white"
                />
              </g>
              <defs>
                <filter
                  id="filter0_d_269_544"
                  x="-19.4178"
                  y="-38.8358"
                  width="137.867"
                  height="137.867"
                  filterUnits="userSpaceOnUse"
                  colorInterpolationFilters="sRGB"
                >
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix
                    in="SourceAlpha"
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                    result="hardAlpha"
                  />
                  <feOffset dy="19.4179" />
                  <feGaussianBlur stdDeviation="9.70895" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix
                    type="matrix"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                  />
                  <feBlend
                    mode="normal"
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_269_544"
                  />
                  <feBlend
                    mode="normal"
                    in="SourceGraphic"
                    in2="effect1_dropShadow_269_544"
                    result="shape"
                  />
                </filter>
                <clipPath id="bgblur_0_269_544_clip_path" transform="translate(19.4178 38.8358)">
                  <rect x="19.418" width="60.1955" height="60.1955" rx="30.0978" />
                </clipPath>
                <linearGradient
                  id="paint0_linear_269_544"
                  x1="49.5157"
                  y1="0"
                  x2="49.5157"
                  y2="60.1955"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="white" stopOpacity="0" />
                  <stop offset="1" stopColor="white" stopOpacity="0.52" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_269_544"
                  x1="24.5776"
                  y1="-1.67649e-05"
                  x2="83.3323"
                  y2="3.87989"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="white" stopOpacity="0.21" />
                  <stop offset="1" stopColor="white" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col justify-center gap-1">
            <h2 className="text-lg font-semibold leading-tight text-white">
              {chatTitle ?? "A Simple Hello"}
            </h2>
            <p className="text-xs text-muted-foreground/70">The Sales Outreach Agent</p>
          </div>
        </div>
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-white/20 hover:bg-white/10"
          aria-label="Download conversation"
        >
          <Download className="size-4" />
        </button>
      </header>

      <div
        ref={scrollAreaRef}
        className="flex-1 space-y-4 overflow-y-auto scrollbar-hide px-6 py-6 sm:px-10 sm:py-8 max-h-[70vh]"
      >
        {conversation.map((message) => {
          const isAssistant = message.role !== "user";
          return (
            <div
              key={message._id}
              className={cn(
                "flex w-full",
                isAssistant ? "justify-start" : "justify-end"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-lg sm:max-w-[70%]",
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
