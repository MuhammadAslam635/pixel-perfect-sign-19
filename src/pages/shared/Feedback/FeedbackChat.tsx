import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RootState } from "@/store/store";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { feedbackService } from "@/services/feedback.service";
import { useToast } from "@/hooks/use-toast";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import { ArrowLeft, Send, Loader2, MessageSquare } from "lucide-react";

const FEEDBACK_CHAT_QUERY_KEY = "feedbackChat";

const FeedbackChat = () => {
  const { feedbackId } = useParams<{ feedbackId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = currentUser?._id ?? "";
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    data: chatData,
    isLoading: loading,
    error,
    isError,
  } = useQuery({
    queryKey: [FEEDBACK_CHAT_QUERY_KEY, feedbackId],
    queryFn: () => feedbackService.getFeedbackChat(feedbackId!),
    enabled: !!feedbackId,
    refetchInterval: 5000,
    retry: 1,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({
      feedbackId: id,
      content,
    }: {
      feedbackId: string;
      content: string;
    }) => feedbackService.sendFeedbackChatMessage(id, content),
    onSuccess: (_, variables) => {
      setInput("");
      queryClient.invalidateQueries({
        queryKey: [FEEDBACK_CHAT_QUERY_KEY, variables.feedbackId],
      });
    },
    onError: (error: any) => {
      toast({
        title: sanitizeErrorMessage(error, "Failed to send message"),
        variant: "destructive",
      });
    },
  });

  const messages = chatData?.messages ?? [];

  useEffect(() => {
    if (!feedbackId) {
      toast({ title: "Feedback ID required", variant: "destructive" });
      navigate("/feedback");
    }
  }, [feedbackId, navigate, toast]);

  useEffect(() => {
    if (isError && error) {
      toast({
        title: sanitizeErrorMessage(error, "Failed to load chat"),
        variant: "destructive",
      });
      navigate("/feedback");
    }
  }, [isError, error, navigate, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!feedbackId || !text || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ feedbackId, content: text });
  };

  if (!feedbackId) return null;

  return (
    <DashboardLayout>
      <main className="relative mt-32 mb-4 h-[calc(100vh-12rem)] flex-1 overflow-hidden px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 text-white">
        <div className="mx-auto flex flex-col h-full w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl border border-white/10 rounded-2xl bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%)]">
          <div className="flex items-center gap-2 p-4 border-b border-white/10 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <MessageSquare className="w-5 h-5 text-cyan-400 shrink-0" />
            <h1 className="text-lg font-semibold truncate">Support chat</h1>
            <span className="text-white/50 text-sm ml-1 shrink-0 hidden sm:inline">
              (Feedback)
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center min-h-0">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 md:p-6 space-y-3 min-h-0 scrollbar-hide">
                {messages.length === 0 ? (
                  <p className="text-white/50 text-center py-8">
                    No messages yet. Start the conversation.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const sender =
                      typeof msg.senderId === "object" ? msg.senderId : null;
                    const senderId =
                      typeof msg.senderId === "object"
                        ? (msg.senderId as any)?._id
                        : msg.senderId;
                    const isFromCurrentUser =
                      senderId &&
                      currentUserId &&
                      String(senderId) === String(currentUserId);
                    const name =
                      sender?.name ||
                      sender?.email ||
                      (isFromCurrentUser ? "You" : "Support");
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[80%] md:max-w-[75%] rounded-xl px-4 py-2.5 ${
                          isFromCurrentUser
                            ? "ml-auto text-right bg-cyan-500/20 border border-cyan-400/30"
                            : "mr-auto text-left bg-white/5 border border-white/10"
                        }`}
                      >
                        <p className="text-white/70 text-xs font-medium">
                          {name}
                        </p>
                        <p
                          className={`text-white text-sm whitespace-pre-wrap break-words ${
                            isFromCurrentUser ? "text-right" : "text-left"
                          }`}
                        >
                          {msg.content}
                        </p>
                        <p
                          className={`text-white/40 text-xs ${
                            isFromCurrentUser ? "text-right" : "text-left"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 sm:p-4 border-t border-white/10 flex gap-2 shrink-0">
                <Textarea
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="min-h-[44px] max-h-32 resize-none bg-black/30 border-white/10 text-white placeholder:text-white/50 flex-1 min-w-0"
                  rows={1}
                />
                <Button
                  onClick={handleSend}
                  disabled={sendMessageMutation.isPending || !input.trim()}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 shrink-0"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default FeedbackChat;
