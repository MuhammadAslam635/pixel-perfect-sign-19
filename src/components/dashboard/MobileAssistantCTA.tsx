import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Mic, Send, Loader2, Sparkles } from "lucide-react";
import {
  sendChatMessage,
  SendChatMessagePayload,
} from "@/services/chat.service";
import { useToast } from "@/components/ui/use-toast";

const MobileAssistantCTA = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");

  const { mutate: sendQuickChat, isPending: isSending } = useMutation({
    mutationFn: (payload: SendChatMessagePayload) => sendChatMessage(payload),
    onSuccess: (response) => {
      setPrompt("");
      const chatId = response.data.chatId;
      if (chatId) {
        navigate(`/chat?chatId=${chatId}`);
      } else {
        navigate("/chat");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Unable to send message",
        description:
          error?.response?.data?.message ??
          "We couldn't reach the assistant. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    const trimmed = prompt.trim();
    if (!trimmed || isSending) return;
    sendQuickChat({ message: trimmed });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="assistant-composer mobile-assistant-cta__composer mt-40 transition-all duration-300 hover:shadow-lg hover:shadow-white/5">
      <div className="assistant-composer__chip font-poppins animate-in fade-in duration-500">
        <Sparkles size={20} />
        AI
      </div>
      <div className="assistant-composer__entry">
        <input
          className="assistant-composer__input font-poppins"
          type="text"
          placeholder="Ask Skylar"
          aria-label="Ask CSOA Assistant"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
      </div>
      <div className="assistant-composer__actions">
        <button
          type="button"
          className="round-icon-btn--outline"
          aria-label="Record a voice prompt"
          disabled
        >
          <Mic size={14} />
        </button>
        <button
          type="button"
          className="round-icon-btn cursor-pointer"
          aria-label="Send message to CSOA assistant"
          onClick={handleSend}
          disabled={!prompt.trim() || isSending}
        >
          {isSending ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Send size={17} />
          )}
        </button>
      </div>
    </div>
  );
};

export default MobileAssistantCTA;
