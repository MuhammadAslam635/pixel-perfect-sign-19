import { FC, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Phone,
  RefreshCcw,
  Edit,
  Sparkles,
} from "lucide-react";
import { PhoneScriptMetadata } from "@/services/connectionMessages.service";
import ReactMarkdown from "react-markdown";

type PhoneCallModalProps = {
  open: boolean;
  onClose: () => void;
  leadName?: string;
  phoneNumber?: string;
  leadId?: string;
  script?: string | null;
  metadata?: PhoneScriptMetadata | null;
  loading?: boolean;
  error?: string | null;
  onRegenerate?: () => void;
  messageId?: string;
  onEdit?: (instructions: string) => void;
};

export const PhoneCallModal: FC<PhoneCallModalProps> = ({
  open,
  onClose,
  leadName,
  phoneNumber,
  leadId,
  script,
  metadata,
  loading = false,
  error,
  onRegenerate,
  messageId,
  onEdit,
}) => {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [editInstructions, setEditInstructions] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const sanitizedPhoneNumber = useMemo(
    () => phoneNumber?.replace(/\D/g, "") || "",
    [phoneNumber]
  );

  const handleCall = () => {
    if (!phoneNumber) {
      return;
    }

    // If we have a leadId, navigate to the Lead Detail view,
    // open the Call tab, and auto-start the Twilio call there.
    if (leadId) {
      navigate(`/leads/${leadId}?tab=Call&autoCall=1`);
      onClose();
      return;
    }

    // Fallback for cases where only a phone number is available
    window.open(`tel:${phoneNumber}`);
    onClose();
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
      <DialogContent className="w-[95vw] max-w-[560px] max-h-[90vh] overflow-x-hidden overflow-y-auto scrollbar-hide bg-[#1e2829] border-[#3A3A3A] text-white">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold text-white">
            Call {leadName || "Lead"}
          </DialogTitle>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Review the recommended talking points before placing your call.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="rounded-lg border border-white/10 bg-[#2A3435]/60 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-white/40">
                  Phone Number
                </p>
                <p className="text-sm font-medium text-white break-all">
                  {phoneNumber || "Not available"}
                </p>
              </div>
              {sanitizedPhoneNumber && (
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary flex-shrink-0">
                  Ready
                </span>
              )}
            </div>
            {metadata?.callObjective && (
              <p className="mt-3 text-xs text-white/50">
                Objective:{" "}
                <span className="text-white">
                  {metadata.callObjective.replace(/_/g, " ")}
                </span>
              </p>
            )}
            {metadata?.estimatedDuration && (
              <p className="text-xs text-white/40 mt-1">
                Estimated duration: {metadata.estimatedDuration}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-white/10 bg-[#2A3435]/40 p-3 sm:p-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-white/40">
                  Call Script
                </p>
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
                    className="text-xs text-white/80 hover:bg-white/10 rounded-full px-3 h-7 flex items-center gap-1.5 disabled:opacity-50 w-full sm:w-auto"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    {loading ? "Refreshing…" : "Regenerate"}
                  </Button>
                </div>
              </div>

              {editMode && (
                <div className="mb-4 p-3 bg-[#1e2829]/50 rounded-lg border border-white/10">
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
                    placeholder="Describe how you want to modify the script (e.g., 'Make it more concise', 'Add a question about their recent project', 'Focus more on value proposition')"
                    className="scrollbar-hide min-h-[60px] w-full bg-[#2A3435]/50 border-white/5 text-white/90 resize-none focus-visible:ring-1 focus-visible:ring-primary/50 text-xs"
                    disabled={editLoading}
                  />
                </div>
              )}
            </div>
            <div className="relative max-h-48 sm:max-h-64 overflow-y-auto scrollbar-hide rounded-md border border-white/5 bg-[#253032]/40 p-3 text-xs sm:text-sm text-white/80 leading-relaxed">
              {script?.trim() ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-base font-semibold text-primary mt-4 mb-2 first:mt-0"
                          {...props}
                        />
                      ),
                      h4: ({ node, ...props }) => (
                        <h4
                          className="text-sm font-semibold text-white/90 mt-3 mb-1.5"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="text-white/80 mb-2 leading-relaxed"
                          {...props}
                        />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong
                          className="text-white font-semibold"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul
                          className="list-disc list-inside ml-2 mb-2 space-y-1"
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="text-white/80" {...props} />
                      ),
                      hr: ({ node, ...props }) => (
                        <hr className="border-white/20 my-3" {...props} />
                      ),
                    }}
                  >
                    {script}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-white/60">
                  No phone script is available yet. Generate one to prepare for
                  your call.
                </p>
              )}
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1b2627]/80 backdrop-blur-sm text-xs sm:text-sm text-white/70">
                  Generating call script…
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="bg-[#2A3435] hover:bg-[#364142] text-white border-0 rounded-full px-6 py-2 w-full sm:w-auto"
            >
              Close
            </Button>
            <Button
              onClick={handleCall}
              disabled={!phoneNumber || loading}
              className="bg-primary hover:bg-primary/90 disabled:bg-primary/40 disabled:text-white/60 text-white rounded-full px-6 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Phone className="h-4 w-4" />
              Call Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
