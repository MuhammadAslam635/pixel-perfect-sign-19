import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Target } from "lucide-react";
import { dashboardService, CommunicationEvent } from "@/services/dashboard.service";

export default function CommunicationHubCard() {
  const [communications, setCommunications] = useState<CommunicationEvent[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardService.getRecentCommunications();
        setCommunications(response.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to load communications"
        );
        console.error("Error fetching communications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunications();
  }, []);
  return (
    <Card id="comm-hub-card" className="solid-card p-3 lg:p-5">
      <div className="flex items-center justify-between mb-2 lg:mb-4">
        <div className="flex items-center gap-1.5 lg:gap-2">
          <Target className="w-3 h-3 lg:w-4 lg:h-4 text-foreground/50" />
          <h3 className="font-medium text-[10px] lg:text-sm glass-card-header leading-tight">
            Communication Hub
          </h3>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-[#4A4A4A]/30 hover:bg-[#5A5A5A]/40"
        >
          <Bell className="w-3 h-3 lg:w-4 lg:h-4 text-foreground/60" />
        </Button>
      </div>

      <div className="space-y-1 mb-2 lg:mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] lg:text-xs text-muted-foreground/70">
            Recents
          </span>
          <Button
            variant="link"
            className="h-auto p-0 text-[9px] lg:text-xs text-foreground/60 hover:text-foreground/80"
          >
            View All
          </Button>
        </div>
      </div>

      <div className="space-y-1.5 lg:space-y-2">
        <div className="flex items-center gap-2 lg:gap-3 p-2 lg:p-3 teal-row transition-smooth">
          <Avatar className="w-6 h-6 lg:w-8 lg:h-8 flex-shrink-0">
            <AvatarFallback
              className="text-[10px] lg:text-xs"
              style={{
                background:
                  "linear-gradient(180deg, rgba(103,178,183,0.20) 0%, rgba(103,178,183,0.14) 100%)",
                color: "#67B2B7",
              }}
            >
              SJ
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] lg:text-sm font-normal text-foreground truncate leading-tight">
              Call with Sarah Johnson
            </p>
            <p className="text-[9px] lg:text-xs text-muted-foreground/60">
              3m 45s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-3 p-2 lg:p-3 teal-row transition-smooth">
          <Avatar className="w-6 h-6 lg:w-8 lg:h-8 flex-shrink-0">
            <AvatarFallback
              className="text-[10px] lg:text-xs"
              style={{
                background:
                  "linear-gradient(180deg, rgba(103,178,183,0.20) 0%, rgba(103,178,183,0.14) 100%)",
                color: "#67B2B7",
              }}
            >
              ME
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] lg:text-sm font-normal text-foreground truncate leading-tight">
              Email from Mark Evans
            </p>
            <p className="text-[9px] lg:text-xs text-muted-foreground/60">
              9:12 AM
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
