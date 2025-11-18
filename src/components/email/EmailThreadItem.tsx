import { EmailThread } from "@/types/email.types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Star, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailThreadItemProps {
  thread: EmailThread;
  onClick: () => void;
}

export const EmailThreadItem = ({ thread, onClick }: EmailThreadItemProps) => {
  const lastFromName = thread.lastMessageFrom.name || thread.lastMessageFrom.email.split("@")[0];
  
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:bg-primary/5 border-l-4",
        thread.unreadCount > 0 && "border-l-primary bg-primary/5",
        thread.unreadCount === 0 && "border-l-transparent"
      )}
      onClick={onClick}
    >
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="mt-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "font-semibold truncate",
                  thread.unreadCount > 0 && "font-bold"
                )}>
                  {thread.subject || "(No Subject)"}
                </span>
                {thread.isStarred && (
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {lastFromName}
              </p>
              <p className={cn(
                "text-xs line-clamp-2",
                thread.unreadCount > 0 && "font-medium"
              )}>
                {thread.lastMessagePreview}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
            </span>
            {thread.unreadCount > 0 && (
              <Badge variant="default" className="text-xs">
                {thread.unreadCount} {thread.unreadCount === 1 ? "unread" : "unread"}
              </Badge>
            )}
            {thread.messageCount > 1 && (
              <Badge variant="outline" className="text-xs">
                {thread.messageCount} messages
              </Badge>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {thread.participants.map(p => p.name || p.email).join(", ")}
        </div>
      </div>
    </Card>
  );
};

