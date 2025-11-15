import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bold, Italic, List, Edit, Sparkles } from "lucide-react";
import {
  EmailCopy,
  EmailCopyMetadata,
} from "@/services/connectionMessages.service";

const DEFAULT_EMAIL_BODY =
  "Hi there,\n\nI hope you're doing well. I wanted to reach out personally to introduce myself and learn more about what you're working on.\n\nWould you be open to a brief conversation sometime next week?\n\nBest regards,\n[Your Name]";

interface EmailDraftModalProps {
  open: boolean;
  onClose: () => void;
  leadName?: string;
  leadEmail?: string;
  content?: EmailCopy | null;
  metadata?: EmailCopyMetadata | null;
  loading?: boolean;
  error?: string | null;
  onRegenerate?: () => void;
}

export const EmailDraftModal = ({
  open,
  onClose,
  leadName,
  leadEmail,
  content,
  metadata,
  loading = false,
  error,
  onRegenerate,
}: EmailDraftModalProps) => {
  const [subject, setSubject] = useState(content?.subject ?? "");
  const [emailContent, setEmailContent] = useState(
    content?.body ?? DEFAULT_EMAIL_BODY
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setSubject(content?.subject ?? "");
    if (content?.body) {
      setEmailContent(content.body);
    } else {
      setEmailContent(
        DEFAULT_EMAIL_BODY.replace("Hi there", `Hi ${leadName ?? "there"}`)
      );
    }
  }, [open, content, leadName]);

  const handleSend = () => {
    console.log("Sending email to:", leadEmail);
    onClose();
  };

  const handleDraftRegenerate = () => {
    onRegenerate?.();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#1e2829] border-[#3A3A3A] text-white">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-white">
                Email Draft
              </DialogTitle>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                Generated outreach copy tailored for {leadName ?? "this lead"}.
                Review and tweak before sending.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white/10 flex-shrink-0"
            >
              <Edit className="h-4 w-4 text-white" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-white/40">
              Subject
            </p>
            <Input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Add a compelling subject line"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2 bg-[#2A3435]/50 rounded-lg border border-white/5">
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
              onClick={handleDraftRegenerate}
              disabled={loading}
              className="text-xs text-white/80 hover:bg-white/10 bg-primary/20 rounded-full px-4 h-7 flex items-center justify-center gap-1.5 disabled:opacity-50 w-full sm:w-auto"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">{loading ? "Generating…" : "Regenerate with AI"}</span>
              <span className="sm:hidden">{loading ? "Generating…" : "Regenerate"}</span>
            </Button>
          </div>

          <div className="relative">
            <Textarea
              value={emailContent}
              onChange={(event) => setEmailContent(event.target.value)}
              className="min-h-[220px] bg-[#2A3435]/50 border-white/5 text-white/90 resize-none focus-visible:ring-1 focus-visible:ring-primary/50 text-sm leading-relaxed"
              placeholder="Type your email content here..."
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#1e2829]/70 backdrop-blur-sm">
                <span className="text-sm text-white/70">
                  Generating personalized copy…
                </span>
              </div>
            )}
          </div>

          {content?.cta && (
            <div className="rounded-lg border border-white/10 bg-[#2A3435]/40 px-4 py-3 text-xs text-white/60">
              Suggested CTA:{" "}
              <span className="text-white/90 font-medium">{content.cta}</span>
            </div>
          )}

          {content?.ps && (
            <div className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-xs text-primary/90">
              P.S. {content.ps}
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="bg-[#2A3435] hover:bg-[#364142] text-white border-0 rounded-full px-8 py-2 w-full sm:w-auto"
            >
              Back
            </Button>
            <Button
              onClick={handleSend}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 disabled:bg-primary/40 disabled:text-white/60 text-white rounded-full px-8 py-2 w-full sm:w-auto"
            >
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
