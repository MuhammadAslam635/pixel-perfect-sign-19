import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { feedbackService } from "@/services/feedback.service";
import { useToast } from "@/hooks/use-toast";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import { ArrowLeft, Send, Loader2, MessageSquare } from "lucide-react";
import type { FeedbackChatMessage as FeedbackChatMessageType } from "@/types/feedback.types";

const FeedbackChat = () => {
  const { feedbackId } = useParams<{ feedbackId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<FeedbackChatMessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!feedbackId) {
      toast({ title: "Feedback ID required", variant: "destructive" });
      navigate("/feedback");
      return;
    }
    loadChat();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [feedbackId]);

  const loadChat = async () => {
    if (!feedbackId) return;
    setLoading(true);
    try {
      const { chat, messages: msgs } = await feedbackService.getFeedbackChat(
        feedbackId
      );
      setMessages(msgs || []);
    } catch (error: any) {
      console.error("Error loading feedback chat:", error);
      toast({
        title: sanitizeErrorMessage(error, "Failed to load chat"),
        variant: "destructive",
      });
      navigate("/feedback");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!feedbackId) return;
    try {
      const msgs = await feedbackService.getFeedbackChatMessages(feedbackId);
      setMessages(msgs || []);
    } catch {
      // ignore poll errors
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!feedbackId || !text || sending) return;
    setSending(true);
    try {
      const newMsg = await feedbackService.sendFeedbackChatMessage(
        feedbackId,
        text
      );
      setMessages((prev) => [...prev, newMsg]);
      setInput("");
    } catch (error: any) {
      toast({
        title: sanitizeErrorMessage(error, "Failed to send message"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!feedbackId) return null;

  return (
    <DashboardLayout>
      <main className="relative mt-32 mb-4 h-[calc(100vh-12rem)] flex-1 overflow-hidden px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] text-white">
        <div className="mx-auto flex flex-col h-full max-w-3xl border border-white/10 rounded-2xl bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%)]">
          <div className="flex items-center gap-2 p-4 border-b border-white/10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-semibold">Support chat</h1>
            <span className="text-white/50 text-sm ml-1">(Feedback)</span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.length === 0 ? (
                  <p className="text-white/50 text-center py-8">
                    No messages yet. Start the conversation.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const sender =
                      typeof msg.senderId === "object" ? msg.senderId : null;
                    const name = sender?.name || sender?.email || "User";
                    return (
                      <div
                        key={msg._id}
                        className="flex flex-col gap-1 max-w-[85%] rounded-xl px-4 py-2 bg-white/5 border border-white/10"
                      >
                        <p className="text-white/70 text-xs font-medium">
                          {name}
                        </p>
                        <p className="text-white text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <p className="text-white/40 text-xs">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-white/10 flex gap-2">
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
                  className="min-h-[44px] max-h-32 resize-none bg-black/30 border-white/10 text-white placeholder:text-white/50"
                  rows={1}
                />
                <Button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30 shrink-0"
                >
                  {sending ? (
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
