import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, List, Edit, Sparkles, Send } from "lucide-react";

const defaultMessage = (name?: string) =>
  `Hi ${
    name ?? "there"
  },\n\nI hope you’re doing well. I came across your profile and was impressed by your work. I’d love to connect here on LinkedIn and learn more about what you’re building.\n\nLooking forward to connecting!\n`;

interface LinkedinMessageModalProps {
  open: boolean;
  onClose: () => void;
  leadName?: string;
  leadLinkedin?: string;
  message?: string | null;
  loading?: boolean;
  error?: string | null;
  onRegenerate?: () => void;
}

export const LinkedinMessageModal = ({
  open,
  onClose,
  leadName,
  leadLinkedin,
  message,
  loading = false,
  error,
  onRegenerate,
}: LinkedinMessageModalProps) => {
  const [draft, setDraft] = useState(() => defaultMessage(leadName));

  useEffect(() => {
    if (open) {
      if (message && message.trim().length > 0) {
        setDraft(message);
      } else {
        setDraft(defaultMessage(leadName));
      }
    }
  }, [leadName, message, open]);

  const handleSend = () => {
    console.log("Sending LinkedIn message to:", leadLinkedin);
    onClose();
  };

  const handleOpenProfile = () => {
    if (!leadLinkedin) return;
    const url = leadLinkedin.startsWith("http")
      ? leadLinkedin
      : `https://${leadLinkedin}`;
    window.open(url, "_blank");
  };

  const handleRegenerate = () => {
    onRegenerate?.();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#1e2829] border-[#3A3A3A] text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-white">
                LinkedIn Connection
              </DialogTitle>
              <p className="text-sm text-white/60 mt-1">
                Craft a quick message to connect with{" "}
                <span className="text-white">{leadName ?? "this lead"}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {leadLinkedin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenProfile}
                  className="text-xs text-white/80 hover:bg-white/10 rounded-full px-3 h-7"
                >
                  View Profile
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-white/10"
              >
                <Edit className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between gap-2 p-2 bg-[#2A3435]/50 rounded-lg border border-white/5">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-white/10"
              >
                <Bold className="h-3.5 w-3.5 text-white/80" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-white/10"
              >
                <Italic className="h-3.5 w-3.5 text-white/80" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-white/10"
              >
                <List className="h-3.5 w-3.5 text-white/80" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={loading}
              className="text-xs text-white/80 hover:bg-white/10 bg-primary/20 rounded-full px-4 h-7 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              {loading ? "Generating…" : "Regenerate"}
            </Button>
          </div>

          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[220px] bg-[#2A3435]/50 border-white/5 text-white/90 resize-none focus-visible:ring-1 focus-visible:ring-primary/50 text-sm leading-relaxed"
            placeholder="Type your LinkedIn connection message here..."
          />

          {loading && (
            <div className="rounded-lg border border-white/10 bg-[#0f1718]/70 px-4 py-2 text-sm text-white/70">
              Generating LinkedIn copy…
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="bg-[#2A3435] hover:bg-[#364142] text-white border-0 rounded-full px-8 py-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-2 flex items-center gap-2"
            >
              Send Connection
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
