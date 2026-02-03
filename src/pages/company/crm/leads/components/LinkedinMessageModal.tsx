import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, List, Edit, Sparkles, Send } from "lucide-react";
import { ConnectionMessageData } from "@/services/connectionMessages.service";

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
  metadata?: ConnectionMessageData | null;
  onRegenerate?: () => void;
  messageId?: string;
  onEdit?: (instructions: string) => void;
}

export const LinkedinMessageModal = ({
  open,
  onClose,
  leadName,
  leadLinkedin,
  message,
  loading = false,
  error,
  metadata,
  onRegenerate,
  messageId,
  onEdit,
}: LinkedinMessageModalProps) => {
  const [draft, setDraft] = useState(() => defaultMessage(leadName));
  const [editMode, setEditMode] = useState(false);
  const [editInstructions, setEditInstructions] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const charactersUsed = useMemo(() => draft.length, [draft]);
  const characterLimit = 300;
  const isOverLimit = charactersUsed > characterLimit;

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
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-x-hidden overflow-y-auto scrollbar-hide bg-[#1e2829] border-[#3A3A3A] text-white">
        <DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1">
                <DialogTitle className="text-lg sm:text-xl font-semibold text-white">
                  LinkedIn Connection
                </DialogTitle>
                <p className="text-xs sm:text-sm text-white/60 mt-1">
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
                    <span className="hidden sm:inline">View Profile</span>
                    <span className="sm:hidden">Profile</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-white/10 flex-shrink-0"
                >
                  <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-3">
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

              <div className="flex items-center gap-2">
                {messageId && onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleEditMode}
                    disabled={loading || editLoading}
                    className="text-xs text-white/80 hover:bg-white/10 rounded-full px-3 h-7 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    {editMode ? "Cancel Edit" : "Edit with AI"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={loading || editLoading}
                  className="text-xs text-white/80 hover:bg-white/10 bg-primary/20 rounded-full px-4 h-7 flex items-center justify-center gap-1.5 disabled:opacity-50 w-full sm:w-auto"
                >
                  <Sparkles className="w-3 h-3" />
                  {loading ? "Generating…" : "Regenerate"}
                </Button>
              </div>
            </div>

            {editMode && (
              <div className="p-3 bg-[#1e2829]/50 rounded-lg border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/80 font-medium">
                    Edit Instructions
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    disabled={editLoading || !editInstructions.trim()}
                    className="text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded-full px-3 h-6 flex items-center gap-1.5"
                  >
                    <Sparkles className="h-3 w-3" />
                    {editLoading ? "Updating…" : "Apply"}
                  </Button>
                </div>
                <Textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  placeholder="Describe how you want to modify the message (e.g., 'Make it more personal', 'Add a specific question', 'Change the tone to be more formal')"
                  className="scrollbar-hide min-h-[60px] w-full bg-[#2A3435]/50 border-white/5 text-white/90 resize-none focus-visible:ring-1 focus-visible:ring-primary/50 text-xs"
                  disabled={editLoading}
                />
              </div>
            )}
          </div>

          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={loading}
            className="scrollbar-hide min-h-[220px] bg-[#2A3435]/50 border-white/5 text-white/90 resize-none focus-visible:ring-1 focus-visible:ring-primary/50 text-sm leading-relaxed"
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

          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 text-xs text-white/60">
            <span>
              Characters:&nbsp;
              <span
                className={
                  isOverLimit ? "text-red-300 font-semibold" : "text-white/90"
                }
              >
                {charactersUsed}
              </span>
              /{characterLimit}
            </span>
            {metadata?.company?.name && metadata?.person?.position && (
              <span className="text-white/50 break-words">
                Target: {metadata.person.position} @ {metadata.company.name}
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="bg-[#2A3435] hover:bg-[#364142] text-white border-0 rounded-full px-8 py-2 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 disabled:bg-primary/40 disabled:text-white/60 text-white rounded-full px-8 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Send Connection</span>
              <span className="sm:hidden">Send</span>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
