
import React, { useState, useEffect } from "react";
import { Loader2, Copy, Check, Mail, MessageSquare, Send } from "lucide-react";
import API from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface FollowupGeneratorProps {
  callLogId: string;
  transcript: string;
}

type Channel = "email" | "sms" | "whatsapp";

export const FollowupGenerator: React.FC<FollowupGeneratorProps> = ({
  callLogId,
  transcript,
}) => {
  const [activeChannel, setActiveChannel] = useState<Channel>("email");
  const [messages, setMessages] = useState<Record<Channel, string>>({
    email: "",
    sms: "",
    whatsapp: "",
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<Channel | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!callLogId) return;
      setLoading(true);
      try {
        const response = await API.get(`/twilio/calls/${callLogId}/followup-messages`);
        setMessages(response.data);
      } catch (error: any) {
        console.error("Failed to generate follow-up messages", error);
        toast({
          title: "Error",
          description: "Failed to generate follow-up messages. Using transcript to create draft...",
          variant: "destructive",
        });
        // Fallback or empty state handled by UI
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [callLogId, toast]);

  const handleCopy = (channel: Channel) => {
    navigator.clipboard.writeText(messages[channel]);
    setCopied(channel);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copied!",
      description: `${channel.toUpperCase()} message copied to clipboard.`,
    });
  };

  const channels: Array<{ id: Channel; label: string; icon: any }> = [
    { id: "email", label: "Email", icon: Mail },
    { id: "sms", label: "SMS", icon: Send },
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => setActiveChannel(channel.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-md transition-all ${
              activeChannel === channel.id
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "text-white/40 hover:text-white/60 border border-transparent"
            }`}
          >
            <channel.icon className="w-3.5 h-3.5" />
            {channel.label}
          </button>
        ))}
      </div>

      <div className="relative min-h-[150px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            <p className="text-xs text-white/40">Generating personalized {activeChannel} draft...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 group">
            <div className="relative">
              <textarea
                value={messages[activeChannel]}
                onChange={(e) => setMessages({ ...messages, [activeChannel]: e.target.value })}
                className="w-full min-h-[150px] p-4 text-sm text-white/80 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500/50 resize-vertical scrollbar-hide leading-relaxed"
                placeholder={`No ${activeChannel} draft available.`}
              />
              <button
                onClick={() => handleCopy(activeChannel)}
                className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors"
                title="Copy to clipboard"
              >
                {copied === activeChannel ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/60" />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
               <p className="text-[10px] text-white/30 italic">
                 AI-generated based on the call transcript. Review before sending.
               </p>
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="h-8 px-4 border-cyan-500/30 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 gap-2"
                 onClick={() => handleCopy(activeChannel)}
               >
                 Copy content
               </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
