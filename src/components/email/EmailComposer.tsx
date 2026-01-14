import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, X, Plus, Sparkles, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { connectionMessagesService } from "@/services/connectionMessages.service";
import { leadsService } from "@/services/leads.service";
import { useToast } from "@/hooks/use-toast";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { EmailTemplates } from "@/utils/emailTemplates";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface EmailComposerProps {
  initialTo?: string[];
  initialSubject?: string;
  initialBody?: string;
  threadId?: string;
  onSend: (data: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    text?: string;
    html?: string;
    threadId?: string;
    attachments?: File[];
  }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const EmailComposer = ({
  initialTo = [],
  initialSubject = "",
  initialBody = "",
  threadId,
  onSend,
  onCancel,
  isLoading = false,
}: EmailComposerProps) => {
  const [to, setTo] = useState<string[]>(initialTo);
  const [toInput, setToInput] = useState("");
  const [cc, setCc] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [bcc, setBcc] = useState<string[]>([]);
  const [bccInput, setBccInput] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const addRecipient = (
    email: string,
    list: string[],
    setList: (list: string[]) => void
  ) => {
    const trimmed = email.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
  };

  const removeRecipient = (
    email: string,
    list: string[],
    setList: (list: string[]) => void
  ) => {
    setList(list.filter((e) => e !== email));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (to.length === 0 || !subject.trim()) {
      return;
    }

    // Create plain text version from HTML for email clients that prefer text
    const plainText = body.replace(/<[^>]*>/g, "").trim();

    // Format email content using professional HTML template
    const formattedContent = EmailTemplates.formatRichTextEmailContent(
      body.trim(),
      {
        subject: subject.trim(),
      }
    );

    onSend({
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject: subject.trim(),
      text: plainText || undefined,
      html: formattedContent.html || undefined,
      threadId,
      attachments,
    });
  };

  const handleEnhanceWithAI = async () => {
    // Check if we have a recipient email
    if (to.length === 0) {
      toast({
        title: "No recipient",
        description: "Please add a recipient email address first.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    try {
      // Get the first recipient email
      const recipientEmail = to[0];

      // First, try to find the lead by email to get companyId and personId
      const leadResponse = await leadsService.findLeadByEmail(recipientEmail);

      if (!leadResponse.success || !leadResponse.data.lead) {
        toast({
          title: "Lead not found",
          description:
            "The recipient must be a lead in your CRM to generate personalized emails using knowledge base context.",
          variant: "destructive",
        });
        setIsEnhancing(false);
        return;
      }

      const lead = leadResponse.data.lead;

      if (!lead.companyId || !lead._id) {
        toast({
          title: "Incomplete lead information",
          description:
            "Lead information is incomplete for generating suggestions.",
          variant: "destructive",
        });
        setIsEnhancing(false);
        return;
      }

      // Use generateEmailMessage with knowledge base context (like LeadChat)
      const response = await connectionMessagesService.generateEmailMessage({
        companyId: lead.companyId,
        personId: lead._id,
        tone: "professional",
      });

      if (response.success) {
        const emailData = response.data.email;

        // Set subject if provided and current subject is empty
        const generatedSubject = emailData.subject?.trim() || "Email";
        if (!subject.trim()) {
          setSubject(generatedSubject);
        }

        // Prefer HTML body, fallback to plain text converted to HTML
        let generatedBody = emailData.bodyHtml?.trim();

        if (!generatedBody && emailData.body?.trim()) {
          // Convert plain text to HTML paragraphs
          const plainText = emailData.body.trim();
          generatedBody = plainText
            .split("\n\n")
            .map((paragraph) => paragraph.trim())
            .filter((paragraph) => paragraph.length > 0)
            .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
            .join("");
        }

        if (generatedBody) {
          setBody(generatedBody);
          toast({
            title: "Email generated!",
            description: `Created personalized email for ${lead.name} based on their profile and knowledge base context.`,
          });
        } else {
          throw new Error("No message suggestion was generated. Try again.");
        }
      } else {
        throw new Error(response.message || "Failed to generate email");
      }
    } catch (error: any) {
      console.error("AI generation error:", error);
      const friendlyMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to generate a connection message.";
      toast({
        title: "Generation failed",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <section
      className="flex flex-col rounded-[30px] border border-[#FFFFFF4D] shadow-2xl overflow-hidden relative"
      style={{
        borderRadius: "30px",
        borderWidth: "1px",
        background:
          "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
      }}
    >
      <div className="flex flex-col h-full relative z-10">
        <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {threadId ? "Reply" : "Compose Email"}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="border-white/30 text-white hover:bg-white/10 rounded-lg"
            >
              Cancel
            </Button>
            <ActiveNavButton
              icon={Send}
              text={isLoading ? "Sending..." : "Send"}
              onClick={handleSend}
              disabled={isLoading || to.length === 0 || !subject.trim()}
              className="flex items-center gap-2"
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 p-6 overflow-y-auto scrollbar-hide max-h-[calc(100vh-300px)]">
          <div className="space-y-3">
            <Label htmlFor="to" className="text-sm font-medium text-white/90">
              To
            </Label>
            <div className="flex flex-wrap gap-2 items-center">
              {to.map((email) => (
                <Badge
                  key={email}
                  className="bg-[#66AFB74D] text-[#66AFB7] border border-emerald-500/30 rounded-full px-3 py-1 text-xs flex items-center gap-1"
                >
                  {email}
                  <button
                    onClick={() => removeRecipient(email, to, setTo)}
                    className="ml-1 hover:text-red-400 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Input
                id="to"
                type="email"
                placeholder="Recipient email"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addRecipient(toInput, to, setTo);
                    setToInput("");
                  }
                }}
                onBlur={() => {
                  if (toInput.trim()) {
                    addRecipient(toInput, to, setTo);
                    setToInput("");
                  }
                }}
                className="flex-1 min-w-[200px]  border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-1 focus:ring-white/20 rounded-lg"
              />
            </div>
          </div>

          {showCc && (
            <div className="space-y-3">
              <Label htmlFor="cc" className="text-sm font-medium text-white/90">
                CC
              </Label>
              <div className="flex flex-wrap gap-2 items-center">
                {cc.map((email) => (
                  <Badge
                    key={email}
                    className="bg-[#66AFB74D] text-[#66AFB7] border border-emerald-500/30 rounded-full px-3 py-1 text-xs flex items-center gap-1"
                  >
                    {email}
                    <button
                      onClick={() => removeRecipient(email, cc, setCc)}
                      className="ml-1 hover:text-red-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  id="cc"
                  type="email"
                  placeholder="CC email"
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addRecipient(ccInput, cc, setCc);
                      setCcInput("");
                    }
                  }}
                  onBlur={() => {
                    if (ccInput.trim()) {
                      addRecipient(ccInput, cc, setCc);
                      setCcInput("");
                    }
                  }}
                  className="flex-1 min-w-[200px] bg-[#0b0f1c] border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-1 focus:ring-white/20 rounded-lg"
                />
              </div>
            </div>
          )}

          {showBcc && (
            <div className="space-y-3">
              <Label
                htmlFor="bcc"
                className="text-sm font-medium text-white/90"
              >
                BCC
              </Label>
              <div className="flex flex-wrap gap-2 items-center">
                {bcc.map((email) => (
                  <Badge
                    key={email}
                    className="bg-[#66AFB74D] text-[#66AFB7] border border-emerald-500/30 rounded-full px-3 py-1 text-xs flex items-center gap-1"
                  >
                    {email}
                    <button
                      onClick={() => removeRecipient(email, bcc, setBcc)}
                      className="ml-1 hover:text-red-400 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  id="bcc"
                  type="email"
                  placeholder="BCC email"
                  value={bccInput}
                  onChange={(e) => setBccInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addRecipient(bccInput, bcc, setBcc);
                      setBccInput("");
                    }
                  }}
                  onBlur={() => {
                    if (bccInput.trim()) {
                      addRecipient(bccInput, bcc, setBcc);
                      setBccInput("");
                    }
                  }}
                  className="flex-1 min-w-[200px] bg-[#0b0f1c] border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-1 focus:ring-white/20 rounded-lg"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {!showCc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(true)}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <Plus className="h-4 w-4 mr-1" />
                CC
              </Button>
            )}
            {!showBcc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBcc(true)}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <Plus className="h-4 w-4 mr-1" />
                BCC
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="subject"
              className="text-sm font-medium text-white/90"
            >
              Subject
            </Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border-white/10 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-1 focus:ring-white/20 rounded-lg"
            />
          </div>

          <div className="space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="body"
                className="text-sm font-medium text-white/90"
              >
                Message
              </Label>
              <ActiveNavButton
                type="button"
                icon={Sparkles}
                text={isEnhancing ? "Generating..." : "Generate with AI"}
                onClick={handleEnhanceWithAI}
                disabled={isEnhancing || to.length === 0}
                className="flex items-center gap-1"
                title={
                  to.length === 0
                    ? "Add a recipient email first"
                    : "Generate AI-powered email content"
                }
              />
            </div>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Write your message here..."
              height="300px"
              className="min-h-[200px] placeholder:text-white/40"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1">
                {attachments.map((file, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 flex items-center gap-1.5 py-1.5"
                  >
                    <Paperclip className="h-3 w-3 text-white/60" />
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="ml-1 hover:text-red-400 transition-colors"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex justify-end px-1">
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm" // Changed to sm to match screenshot vibe if needed, but icon is fine
                className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Attach file</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
