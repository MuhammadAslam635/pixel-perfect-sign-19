import { Email } from "@/types/email.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Star, Reply, Trash2, Archive, Mail, MailOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// Utility function to strip quoted email content
const stripQuotedEmailContent = (content: string) => {
  if (!content) {
    return "";
  }

  const normalized = content.replace(/\r\n/g, "\n");
  const quoteRegexes = [
    /\nOn\s[\w\s,.:@]+\sat\s[\d:]+\s?[APM]+\s.+?\s?wrote:\s*/i,
    /\nOn\s.+?\swrote:\s*/i,
    /\nFrom:\s.+/i,
    /\nSent:\s.+/i,
    /\nSubject:\s.+/i,
    /\nTo:\s.+/i,
    /\nDate:\s.+/i,
    /\n-{2,}\s*Original Message\s*-{2,}/i,
    /\n-{2,}\s*Forwarded message\s*-{2,}/i,
  ];

  let cutoffIndex = normalized.length;
  for (const regex of quoteRegexes) {
    const matchIndex = normalized.search(regex);
    if (matchIndex !== -1 && matchIndex < cutoffIndex) {
      cutoffIndex = matchIndex;
    }
  }

  const withoutMarkers = normalized.slice(0, cutoffIndex);
  const withoutQuotedLines = withoutMarkers
    .split("\n")
    .filter(
      (line) => !line.trim().startsWith(">") && !line.trim().startsWith("--")
    )
    .join("\n")
    .trim();

  if (withoutQuotedLines) {
    return withoutQuotedLines;
  }

  const fallback = normalized
    .split("\n")
    .filter(
      (line) => !line.trim().startsWith(">") && !line.trim().startsWith("--")
    )
    .join("\n")
    .trim();

  return fallback || content.trim();
};

interface EmailViewerProps {
  email: Email;
  onStar: (isStarred: boolean) => void;
  onMarkRead: (isRead: boolean) => void;
  onDelete: () => void;
  onReply: () => void;
  isLoading?: boolean;
}

export const EmailViewer = ({
  email,
  onStar,
  onMarkRead,
  onDelete,
  onReply,
  isLoading = false,
}: EmailViewerProps) => {
  const fromName = email.from.name || email.from.email.split("@")[0];
  const toRecipients = email.to.map((r) => r.name || r.email).join(", ");
  const ccRecipients = email.cc?.map((r) => r.name || r.email).join(", ");
  const bccRecipients = email.bcc?.map((r) => r.name || r.email).join(", ");

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between mb-4">
          <CardTitle className="text-xl">
            {email.subject || "(No Subject)"}
          </CardTitle>
          <div className="flex items-center gap-2">
            {email.isStarred ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStar(false)}
                disabled={isLoading}
              >
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStar(true)}
                disabled={isLoading}
              >
                <Star className="h-5 w-5" />
              </Button>
            )}
            {email.isRead ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMarkRead(false)}
                disabled={isLoading}
              >
                <MailOpen className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMarkRead(true)}
                disabled={isLoading}
              >
                <Mail className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isLoading}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground w-20">
              From:
            </span>
            <span>
              {fromName} &lt;{email.from.email}&gt;
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground w-20">
              To:
            </span>
            <span>{toRecipients}</span>
          </div>
          {ccRecipients && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground w-20">
                CC:
              </span>
              <span>{ccRecipients}</span>
            </div>
          )}
          {bccRecipients && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground w-20">
                BCC:
              </span>
              <span>{bccRecipients}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground w-20">
              Date:
            </span>
            <span>
              {new Date(email.createdAt).toLocaleString()} (
              {formatDistanceToNow(new Date(email.createdAt), {
                addSuffix: true,
              })}
              )
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-muted-foreground w-20">
              Status:
            </span>
            <Badge
              variant={email.direction === "inbound" ? "secondary" : "default"}
            >
              {email.direction === "inbound" ? "Received" : "Sent"}
            </Badge>
            {email.deliveryStatus?.delivered && (
              <Badge variant="secondary">Delivered</Badge>
            )}
            {email.deliveryStatus?.opened && (
              <Badge variant="secondary">Opened</Badge>
            )}
            {email.status === "bounced" && (
              <Badge variant="destructive">Bounced</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-6">
        {email.body.html ? (
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: stripQuotedEmailContent(email.body.html),
            }}
          />
        ) : (
          <div className="whitespace-pre-wrap text-sm">
            {stripQuotedEmailContent(email.body.text || "No content")}
          </div>
        )}
      </CardContent>
      <div className="border-t p-4 flex items-center gap-2">
        <Button onClick={onReply} variant="default">
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </Button>
        <Button variant="outline" disabled>
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
      </div>
    </Card>
  );
};
