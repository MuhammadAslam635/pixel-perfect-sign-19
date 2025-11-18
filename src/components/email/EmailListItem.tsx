import { Email } from "@/types/email.types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Star, Mail, MailOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailListItemProps {
  email: Email;
  onClick: () => void;
}

export const EmailListItem = ({ email, onClick }: EmailListItemProps) => {
  const fromName = email.from.name || email.from.email.split("@")[0];
  const preview = email.body.text?.substring(0, 100) || email.body.html?.replace(/<[^>]*>/g, "").substring(0, 100) || "No preview available";
  
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:bg-primary/5 border-l-4",
        !email.isRead && "border-l-primary bg-primary/5",
        email.isRead && "border-l-transparent"
      )}
      onClick={onClick}
    >
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-1">
              {email.isRead ? (
                <MailOpen className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Mail className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "font-semibold truncate",
                  !email.isRead && "font-bold"
                )}>
                  {fromName}
                </span>
                {email.isStarred && (
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                )}
                {email.direction === "outbound" && (
                  <Badge variant="outline" className="text-xs">
                    Sent
                  </Badge>
                )}
              </div>
              <p className={cn(
                "text-sm font-medium mb-1 truncate",
                !email.isRead && "font-semibold"
              )}>
                {email.subject || "(No Subject)"}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {preview}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(email.createdAt), { addSuffix: true })}
            </span>
            {email.deliveryStatus?.delivered && (
              <Badge variant="secondary" className="text-xs">
                Delivered
              </Badge>
            )}
          </div>
        </div>
        {email.to.length > 0 && (
          <div className="text-xs text-muted-foreground">
            To: {email.to.map(r => r.name || r.email).join(", ")}
          </div>
        )}
      </div>
    </Card>
  );
};

