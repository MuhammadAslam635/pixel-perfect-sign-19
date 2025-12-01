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
  const cleanedText = email.body.text
    ? stripQuotedEmailContent(email.body.text)
    : "";
  const cleanedHtml = email.body.html
    ? stripQuotedEmailContent(email.body.html.replace(/<[^>]*>/g, ""))
    : "";
  const preview =
    (cleanedText || cleanedHtml)?.substring(0, 100) || "No preview available";

  const isUnread = !email.isRead;

  return (
    <Card
      className={cn(
        "relative flex flex-col gap-2 sm:gap-3 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.32)]",
        "bg-gradient-to-r from-[#13363b] via-[#1f4c55] to-[#16383f]",
        isUnread ? "border-primary/60" : "border-[#274a4f]",
        "rounded-[20px] sm:rounded-[30px] px-4 sm:px-7 py-2 sm:py-3",
        "before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[55%] before:w-[3px] sm:before:w-[5px] before:rounded-full",
        isUnread ? "before:bg-primary" : "before:bg-white/75"
      )}
      onClick={onClick}
      style={{
        borderWidth: "1px",
      }}
    >
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 text-white/90 mb-2">
          <div className="flex items-center gap-2">
            {isUnread ? (
              <Mail className="h-4 w-4 text-primary flex-shrink-0" />
            ) : (
              <MailOpen className="h-4 w-4 text-white/60 flex-shrink-0" />
            )}
            <h3 className="text-sm sm:text-base font-semibold text-white">
              {fromName}
            </h3>
          </div>
          {email.isStarred && (
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
          )}
          {email.direction === "outbound" && (
            <Badge className="rounded-full bg-white/15 text-white border-white/20 px-3 py-1 text-xs">
              Sent
            </Badge>
          )}
        </div>
        <p
          className={cn(
            "text-xs sm:text-sm text-white/90 mb-2 line-clamp-1",
            isUnread && "font-semibold"
          )}
        >
          {email.subject || "(No Subject)"}
        </p>
        <p className="text-xs text-white/65 line-clamp-2 mb-2">{preview}</p>
        {email.to.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/75 mb-1">
            <span className="text-white/60">To:</span>
            {email.to.slice(0, 2).map((r, idx) => (
              <Badge
                key={idx}
                className="rounded-full bg-white/10 text-white/80 border-white/15 px-2 py-0.5 text-xs"
              >
                {r.name || r.email}
              </Badge>
            ))}
            {email.to.length > 2 && (
              <Badge className="rounded-full bg-white/10 text-white/80 border-white/15 px-2 py-0.5 text-xs">
                +{email.to.length - 2} more
              </Badge>
            )}
          </div>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-white/55">
            {formatDistanceToNow(new Date(email.createdAt), {
              addSuffix: true,
            })}
          </span>
          {email.deliveryStatus?.delivered && (
            <Badge className="rounded-full bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-2 py-0.5 text-xs">
              Delivered
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
