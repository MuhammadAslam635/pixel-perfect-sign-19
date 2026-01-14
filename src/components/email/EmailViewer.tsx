import { Email } from "@/types/email.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import {
  Star,
  Reply,
  Trash2,
  Archive,
  Mail,
  MailOpen,
  Clock,
  Users,
  User,
} from "lucide-react";
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarStyle = () => {
    return "bg-primary";
  };

  const getBaseApiUrl = () => {
    const backendUrl = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:5111/api";
    // Remove /api from the end if it exists to get the server root for static files
    return backendUrl.replace(/\/api$/, "");
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Action Bar - Sleek and Modern */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStar(!email.isStarred)}
            disabled={isLoading}
            className={cn(
              "hover:bg-transparent transition-all duration-300",
              email.isStarred && "scale-110"
            )}
          >
            <Star
              className={cn(
                "h-5 w-5 transition-all duration-300",
                email.isStarred
                  ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                  : "text-muted-foreground hover:text-yellow-400 hover:scale-110"
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkRead(!email.isRead)}
            disabled={isLoading}
            className="hover:bg-transparent"
          >
            {email.isRead ? (
              <MailOpen className="h-5 w-5 text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110" />
            ) : (
              <Mail className="h-5 w-5 text-primary transition-all duration-200 hover:scale-110" />
            )}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onReply}
            size="sm"
            className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="text-muted-foreground"
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isLoading}
            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Email Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 py-8 h-full flex flex-col">
          {/* Subject Line - Bold and Prominent */}
          <div className="flex-shrink-0 mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {email.subject || "(No Subject)"}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={
                  email.direction === "inbound" ? "secondary" : "default"
                }
                className="font-medium"
              >
                {email.direction === "inbound" ? "Inbox" : "Sent"}
              </Badge>
              {email.deliveryStatus?.delivered && (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-medium"
                >
                  <span className="mr-1">✓</span>
                  Delivered
                </Badge>
              )}
              {email.deliveryStatus?.opened && (
                <Badge
                  variant="outline"
                  className="bg-sky-500/10 text-sky-600 border-sky-500/30 font-medium"
                >
                  <span className="mr-1">👁</span>
                  Opened
                </Badge>
              )}
              {email.status === "bounced" && (
                <Badge variant="destructive" className="font-medium">
                  <span className="mr-1">⚠</span>
                  Bounced
                </Badge>
              )}
            </div>
          </div>

          {/* Sender Info Card - Premium Design */}
          <div className="flex-shrink-0 mb-8 p-6 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 shadow-xl">
            <div className="flex items-start gap-4">
              {/* Avatar with Gradient */}
              <div className="relative">
                <Avatar
                  className={cn(
                    "h-16 w-16 ring-4 ring-background shadow-lg",
                    getAvatarStyle()
                  )}
                >
                  <AvatarFallback className="text-white font-bold text-lg bg-transparent">
                    {getInitials(fromName)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background",
                    email.direction === "inbound"
                      ? "bg-green-500"
                      : "bg-blue-500"
                  )}
                />
              </div>

              {/* Sender Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-foreground">
                    {fromName}
                  </h3>
                  {email.direction === "outbound" && (
                    <Badge variant="outline" className="text-xs bg-primary/10">
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  {email.from.email}
                </p>

                <Separator className="my-4" />

                {/* Recipients - Clean Layout */}
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground font-medium min-w-[50px] flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      To:
                    </span>
                    <span className="text-foreground font-medium">
                      {toRecipients}
                    </span>
                  </div>

                  {ccRecipients && (
                    <div className="flex items-start gap-3">
                      <span className="text-muted-foreground font-medium min-w-[50px] flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        CC:
                      </span>
                      <span className="text-foreground">{ccRecipients}</span>
                    </div>
                  )}

                  {bccRecipients && (
                    <div className="flex items-start gap-3">
                      <span className="text-muted-foreground font-medium min-w-[50px] flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        BCC:
                      </span>
                      <span className="text-foreground">{bccRecipients}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-muted-foreground font-medium min-w-[50px] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Date:
                    </span>
                    <span className="text-foreground">
                      {formatDistanceToNow(new Date(email.createdAt), {
                        addSuffix: true,
                      })}{" "}
                      <span className="text-muted-foreground">
                        ({new Date(email.createdAt).toLocaleString()})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Body - Clean and Readable - Scrollable Container */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-8 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 shadow-inner scrollbar-hide">
            {email.body.html ? (
              <div
                className="prose prose-invert prose-lg max-w-none
                           prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                           prose-p:leading-relaxed prose-p:text-foreground/90 prose-p:my-4
                           prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                           prose-strong:text-foreground prose-strong:font-bold
                           prose-ul:my-4 prose-ol:my-4 prose-li:my-1
                           prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2
                           prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                           animate-in fade-in-50 slide-in-from-bottom-4 duration-500"
                dangerouslySetInnerHTML={{
                  __html: stripQuotedEmailContent(email.body.html),
                }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-base leading-loose text-foreground/90 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                {stripQuotedEmailContent(email.body.text || "No content")}
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
                <span className="h-4 w-4">📎</span>
                Attachments ({email.attachments.length})
              </h4>
              <div className="flex flex-wrap gap-4">
                {email.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={`${getBaseApiUrl()}${attachment.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 transition-all group min-w-[200px]"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <span className="text-lg">📄</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {attachment.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
