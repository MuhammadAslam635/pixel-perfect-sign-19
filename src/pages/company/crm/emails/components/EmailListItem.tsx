import { Email } from "@/types/email.types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Star, Mail, MailOpen } from "lucide-react";
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

interface EmailListItemProps {
  email: Email;
  onClick: () => void;
}

export const EmailListItem = ({ email, onClick }: EmailListItemProps) => {
  const fromName = email.from.name || email.from.email.split("@")[0];

  // Clean the email content before creating preview
  let cleanedText = "";
  if (email.body.text) {
    const textContent = email.body.text;
    // Check if text contains HTML tags
    if (/<[^>]+>/.test(textContent)) {
      // Strip HTML tags from text field
      let stripped = textContent.replace(/<\/p>/gi, " ");
      stripped = stripped.replace(/<br\s*\/?>/gi, " ");
      stripped = stripped.replace(/<[^>]+>/g, "");
      stripped = stripped.replace(/\s+/g, " ").trim();
      cleanedText = stripQuotedEmailContent(stripped);
    } else {
      cleanedText = stripQuotedEmailContent(textContent);
    }
  }

  const cleanedHtml = email.body.html
    ? stripQuotedEmailContent(email.body.html.replace(/<[^>]*>/g, ""))
    : "";
  const preview =
    (cleanedText || cleanedHtml)?.substring(0, 100) || "No preview available";

  const isUnread = !email.isRead;

  return (
    <Card
      className={cn(
        "relative flex items-start gap-2 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.32)]",
        isUnread
          ? "bg-gradient-to-r from-[#1a4d55] via-[#1f5c66] to-[#1a4d55] border-primary/80 shadow-lg shadow-primary/20"
          : "border-0 backdrop-blur-[22.6px]",
        "rounded-[12px] px-2.5 py-1.5",
        "before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[70%] before:w-[3px] before:rounded-full",
        isUnread
          ? "before:bg-primary before:shadow-[0_0_8px_rgba(102,175,183,0.6)]"
          : "before:bg-white/75"
      )}
      onClick={onClick}
      style={
        isUnread
          ? {
              borderWidth: "1.5px",
            }
          : {
              borderWidth: "0px",
              background: `linear-gradient(180deg, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0.08) 100%), radial-gradient(50% 100% at 50% 0%, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0) 100%)`,
            }
      }
    >
      {/* Left side - Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {isUnread ? (
            <Mail className="h-2.5 w-2.5 text-primary flex-shrink-0" />
          ) : (
            <MailOpen className="h-2.5 w-2.5 text-white/60 flex-shrink-0" />
          )}
          <h3 className="text-[11px] font-semibold text-white truncate">
            {fromName}
          </h3>
          {email.isStarred && (
            <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500 flex-shrink-0" />
          )}
        </div>
        <p
          className={cn(
            "text-[10px] text-white/90 mb-0.5 line-clamp-1",
            isUnread && "font-semibold"
          )}
        >
          {email.subject || "(No Subject)"}
        </p>
        <p className="text-[9px] text-white/60 line-clamp-1">{preview}</p>
      </div>

      {/* Right side - Meta info */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[9px] text-white/50 whitespace-nowrap">
          {formatDistanceToNow(new Date(email.createdAt), {
            addSuffix: true,
          })}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {email.direction === "outbound" && (
            <Badge className="rounded-full bg-white/15 text-white border-white/20 px-1.5 py-0 text-[8px]">
              Sent
            </Badge>
          )}
          {email.deliveryStatus?.delivered && (
            <Badge className="rounded-full bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-1.5 py-0 text-[8px]">
              ✓
            </Badge>
          )}
          {email.to.length > 0 && (
            <Badge className="rounded-full bg-white/10 text-white/70 border-white/15 px-1.5 py-0 text-[8px]">
              To: {email.to.length}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
