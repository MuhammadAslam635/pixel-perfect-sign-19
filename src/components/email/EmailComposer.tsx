import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const addRecipient = (email: string, list: string[], setList: (list: string[]) => void) => {
    const trimmed = email.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
  };

  const removeRecipient = (email: string, list: string[], setList: (list: string[]) => void) => {
    setList(list.filter(e => e !== email));
  };

  const handleSend = () => {
    if (to.length === 0 || !subject.trim()) {
      return;
    }

    onSend({
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject: subject.trim(),
      text: body.trim() || undefined,
      html: body.trim() ? `<p>${body.trim().replace(/\n/g, '<br>')}</p>` : undefined,
      threadId,
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <CardTitle>{threadId ? "Reply" : "Compose Email"}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-6">
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <div className="flex flex-wrap gap-2 items-center">
            {to.map((email) => (
              <Badge key={email} variant="secondary" className="flex items-center gap-1">
                {email}
                <button
                  onClick={() => removeRecipient(email, to, setTo)}
                  className="ml-1 hover:text-destructive"
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
              className="flex-1 min-w-[200px]"
            />
          </div>
        </div>

        {showCc && (
          <div className="space-y-2">
            <Label htmlFor="cc">CC</Label>
            <div className="flex flex-wrap gap-2 items-center">
              {cc.map((email) => (
                <Badge key={email} variant="secondary" className="flex items-center gap-1">
                  {email}
                  <button
                    onClick={() => removeRecipient(email, cc, setCc)}
                    className="ml-1 hover:text-destructive"
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
                className="flex-1 min-w-[200px]"
              />
            </div>
          </div>
        )}

        {showBcc && (
          <div className="space-y-2">
            <Label htmlFor="bcc">BCC</Label>
            <div className="flex flex-wrap gap-2 items-center">
              {bcc.map((email) => (
                <Badge key={email} variant="secondary" className="flex items-center gap-1">
                  {email}
                  <button
                    onClick={() => removeRecipient(email, bcc, setBcc)}
                    className="ml-1 hover:text-destructive"
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
                className="flex-1 min-w-[200px]"
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
            >
              <Plus className="h-4 w-4 mr-1" />
              BCC
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="space-y-2 flex-1 flex flex-col">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            placeholder="Write your message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="flex-1 min-h-[200px] resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isLoading || to.length === 0 || !subject.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

