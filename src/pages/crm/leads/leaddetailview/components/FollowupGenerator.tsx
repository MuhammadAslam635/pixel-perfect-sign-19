
import React, { useState, useEffect } from "react";
import { Loader2, Copy, Check, Mail, MessageSquare, Send } from "lucide-react";
import API from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface FollowupGeneratorProps {
  callLogId: string;
  transcript: string;
  leadId: string;
  leadEmail: string;
  leadPhone: string;
}

type Channel = "email" | "sms" | "whatsapp";

export const FollowupGenerator: React.FC<FollowupGeneratorProps> = ({
  callLogId,
  transcript,
  leadId,
  leadEmail,
  leadPhone,
}) => {
  const [activeChannel, setActiveChannel] = useState<Channel>("email");
  const [messages, setMessages] = useState<Record<Channel, string>>({
    email: "",
    sms: "",
    whatsapp: "",
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
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

  const handleCopy = () => {
    const message = messages[activeChannel];
    if (!message) return;
    navigator.clipboard.writeText(message);
    setCopied(activeChannel);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard.",
    });
  };

  const handleSend = async () => {
    const body = messages[activeChannel];
    if (!body) {
      toast({
        title: "Blank message",
        description: "Cannot send an empty message.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      if (activeChannel === "email") {
        let subject = "Follow-up After Our Call";
        let emailBody = body;
        
        if (emailBody.startsWith("Subject:")) {
          const lines = emailBody.split("\n");
          subject = lines[0].replace("Subject:", "").trim();
          emailBody = lines.slice(1).join("\n").trim();
        }

        await API.post("/emails/send", {
          to: [leadEmail],
          subject: subject,
          html: emailBody.replace(/\n/g, '<br/>'),
        });
      } else if (activeChannel === "whatsapp") {
        // Fetch WhatsApp connection to get the phoneNumberId
        const connectionRes = await API.get("/whatsapp/connection");
        const credentials = connectionRes.data?.credentials || [];
        
        if (credentials.length === 0) {
          throw new Error("No connected WhatsApp phone number found. Please connect your WhatsApp Business account first.");
        }

        // Use the first active connection
        const phoneNumberId = credentials[0].phoneNumberId;

        await API.post("/whatsapp/messages/send", {
          phoneNumberId,
          to: leadPhone,
          type: "text",
          text: {
            body: body
          }
        });
      } else {
        await API.post("/twilio/message", {
          to: leadPhone,
          body: body,
          leadId: leadId
        });
      }

      toast({
        title: "Message Sent",
        description: `Follow-up ${activeChannel} has been sent successfully.`,
      });
    } catch (error: any) {
      console.error(`Failed to send ${activeChannel}`, error);
      toast({
        title: "Send Failed",
        description: error.response?.data?.message || `Failed to send ${activeChannel}. Please ensure contact details are valid.`,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const channels: { id: Channel; label: string; icon: any }[] = [
    { id: "email", label: "Email", icon: Mail },
    { id: "sms", label: "SMS", icon: Send },
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  ];

  return (
    <div className="flex flex-col gap-1.5 mt-0.5 flex-1 min-h-0">
      <div className="flex gap-2 p-1 bg-white/5 rounded-lg border border-white/10 overflow-x-auto scrollbar-hide">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => setActiveChannel(channel.id)}
            className={`flex-1 flex-shrink-0 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
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

      <div className="relative flex flex-col flex-1 min-h-0">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
            <p className="text-xs text-white/40 animate-pulse">Drafting messages...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 group flex-1 min-h-0">
            <div className="relative flex-1 flex flex-col min-h-0">
              <textarea
                value={messages[activeChannel]}
                onChange={(e) => setMessages({ ...messages, [activeChannel]: e.target.value })}
                className="w-full flex-1 p-4 text-xs text-white/80 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500/50 resize-none scrollbar-hide leading-relaxed"
                placeholder={`No ${activeChannel} draft available.`}
              />
              {/* <button
                onClick={handleCopy}
                className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                title="Copy to clipboard"
              >
                {copied === activeChannel ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button> */}
            </div>

            <div className="flex items-center justify-end gap-4 mt-1">
              {/* <div className="flex-1">
                <p className="text-[10px] text-white/30 italic">
                  Review the AI-generated draft before sending.
                </p>
              </div> */}
              <Button 
                onClick={handleSend}
                disabled={sending || !messages[activeChannel]}
                className="h-7 px-3 text-[10px] bg-cyan-500 hover:bg-cyan-600 text-white gap-1.5 min-w-[80px] rounded-md"
              >
                {sending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                {sending ? "Sending..." : "Send Now"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
