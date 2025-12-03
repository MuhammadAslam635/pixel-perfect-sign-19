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
import { Bold, Italic, List, Sparkles, Pencil, Edit } from "lucide-react";
import {
  EmailMessage,
  EmailMessageMetadata,
} from "@/services/connectionMessages.service";

const DEFAULT_EMAIL_BODY =
  "Hi there,\n\nI hope you're doing well. I wanted to reach out personally to introduce myself and learn more about what you're working on.\n\nWould you be open to a brief conversation sometime next week?\n\nBest regards,\n[Your Name]";

interface EmailDraftModalProps {
  open: boolean;
  onClose: () => void;
  leadName?: string;
  leadEmail?: string;
  content?: EmailMessage | null;
  metadata?: EmailMessageMetadata | null;
  loading?: boolean;
  error?: string | null;
  onRegenerate?: () => void;
  messageId?: string;
  onEdit?: (instructions: string) => void;
}

export const EmailDraftModal = ({
  open,
  onClose,
  leadName,
  leadEmail,
  content,
  loading = false,
  error,
  onRegenerate,
  messageId,
  onEdit,
}: EmailDraftModalProps) => {
  const [subject, setSubject] = useState(content?.subject ?? "");
  const [emailContent, setEmailContent] = useState(
    content?.body ?? DEFAULT_EMAIL_BODY
  );
  const [editMode, setEditMode] = useState(false);
  const [editInstructions, setEditInstructions] = useState("");
  const [editLoading, setEditLoading] = useState(false);

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

  const handleEdit = async () => {
    if (!editInstructions.trim() || !messageId || !onEdit) return;

    setEditLoading(true);
    try {
      await onEdit(editInstructions);
      setEditMode(false);
      setEditInstructions("");
    } catch (error) {
      console.error("Error editing message:", error);
    } finally {
      setEditLoading(false);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setEditInstructions("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] sm:max-w-[650px] max-h-[100vh] overflow-x-hidden overflow-y-auto scrollbar-hide bg-[#1e2829] border-[#2B2F30] border-2 text-white">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-white">
                Email Draft
              </DialogTitle>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                {/* Generated outreach copy tailored for {leadName ?? "this lead"}.
                Review and tweak before sending. */}
                Here's a drafted email message. Make edits or send as it is.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white/10 flex-shrink-0"
            >
              <Pencil className="h-4 w-4 text-white" />
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

          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-col gap-2 p-2 bg-[#2A3435]/50 rounded-lg border border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Formatting buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-white/10 flex-shrink-0"
                  >
                    <Bold className="h-3.5 w-3.5 text-white/80" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-white/10 flex-shrink-0"
                  >
                    <Italic className="h-3.5 w-3.5 text-white/80" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:bg-white/10 flex-shrink-0"
                  >
                    <List className="h-3.5 w-3.5 text-white/80" />
                  </Button>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {messageId && onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleEditMode}
                      disabled={loading || editLoading}
                      className="text-xs text-white/80 hover:bg-white/10 rounded-full px-3 h-7 flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span className="hidden xs:inline">
                        {editMode ? "Cancel Edit" : "Edit with AI"}
                      </span>
                      <span className="xs:hidden">
                        {editMode ? "Cancel" : "Edit"}
                      </span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDraftRegenerate}
                    disabled={loading}
                    className="relative text-white border-0 rounded-full px-4 h-7 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap hover:bg-[#2F2F2F]/60 transition-all overflow-hidden flex-shrink-0"
                    style={{
                      background: "#FFFFFF1A",
                      boxShadow:
                        "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                    }}
                  >
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[150px] h-[150px] rounded-full pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle, #66AFB7 0%, transparent 70%)",
                        backdropFilter: "blur(50px)",
                        WebkitBackdropFilter: "blur(50px)",
                        zIndex: -1,
                      }}
                    ></div>
                    <Sparkles className="w-3 h-3 relative z-10" />
                    <span className="hidden sm:inline relative z-10 text-xs">
                      {loading ? "Generating…" : "Regenerate with AI"}
                    </span>
                    <span className="sm:hidden relative z-10 text-xs">
                      {loading ? "Generating…" : "Regenerate"}
                    </span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Edit Mode Section */}
            {editMode && (
              <div className="p-3 bg-[#1e2829]/50 rounded-lg border border-white/10">
                <div className="flex flex-col gap-2 mb-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/80 font-medium">
                      Edit Instructions
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEdit}
                      disabled={editLoading || !editInstructions.trim()}
                      className="text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded-full px-3 h-6 flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Sparkles className="h-3 w-3" />
                      {editLoading ? "Updating…" : "Apply"}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  placeholder="Describe how you want to modify the email (e.g., 'Make the subject more compelling', 'Add a specific question', 'Change the closing')"
                  className="scrollbar-hide min-h-[60px] w-full bg-[#2A3435]/50 border-white/5 text-white/90 resize-none focus-visible:ring-1 focus-visible:ring-primary/50 text-xs"
                  disabled={editLoading}
                />
              </div>
            )}

            <div className="relative">
              <Textarea
                value={emailContent}
                onChange={(event) => setEmailContent(event.target.value)}
                className="scrollbar-hide min-h-[220px] w-full bg-[#2A3435]/50 border-white/5 text-white/90 resize-none focus-visible:ring-1 focus-visible:ring-primary/50 text-sm leading-relaxed"
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
                className="relative text-white border-0 rounded-full px-8 py-2 w-full sm:w-auto hover:bg-[#2F2F2F]/60 transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[150px] h-[150px] rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, #66AFB7 0%, transparent 70%)",
                    backdropFilter: "blur(50px)",
                    WebkitBackdropFilter: "blur(50px)",
                    zIndex: -1,
                  }}
                ></div>
                <span className="relative z-10">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
