import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, ArrowRight, Loader2 } from "lucide-react";
import { dashboardService, CalendarEvent } from "@/services/dashboard.service";

export default function CalendarCard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardService.getRecentCalendarEvents();
        setEvents(response.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to load calendar events"
        );
        console.error("Error fetching calendar events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarEvents();
  }, []);
  return (
    <Card className="solid-card p-3 lg:p-5 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-2 lg:mb-4">
        <div className="flex items-center gap-1.5 lg:gap-2">
          <Calendar className="w-3 h-3 lg:w-4 lg:h-4 text-foreground/50" />
          <h3 className="font-medium text-[10px] lg:text-sm text-foreground leading-tight">
            Calendar
          </h3>
        </div>
        <Button
          variant="link"
          className="h-auto p-0 text-[9px] lg:text-xs text-foreground/60 hover:text-foreground/80"
        >
          View All{" "}
          <ArrowRight className="w-2.5 h-2.5 lg:w-3 lg:h-3 ml-0.5 lg:ml-1" />
        </Button>
      </div>

      <div className="space-y-2 mt-6 gap-6 lg:space-y-3 card-scroll scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-3 text-center">
            <span className="text-[10px] lg:text-xs text-muted-foreground">
              {error}
            </span>
          </div>
        ) : events.length === 0 ? (
          <div className="p-3 text-center">
            <span className="text-[10px] lg:text-xs text-muted-foreground">
              No upcoming events
            </span>
          </div>
        ) : (
          events.slice(0, 3).map((event, index) => {
            const eventDate = new Date(event.startDateTime);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            let dateLabel = "";
            if (eventDate.toDateString() === today.toDateString()) {
              dateLabel = "Today";
            } else if (eventDate.toDateString() === tomorrow.toDateString()) {
              dateLabel = "Tomorrow";
            } else {
              dateLabel = eventDate.toLocaleDateString("en-US", {
                weekday: "long",
              });
            }

            const timeString = eventDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });

            return (
              <div key={event.id}>
                {index === 0 ||
                (index > 0 &&
                  new Date(events[index - 1].startDateTime).toDateString() !==
                    eventDate.toDateString()) ? (
                  <span className="calendar-label mb-1.5 lg:mb-2 inline-block text-[9px] lg:text-xs">
                    {dateLabel}
                  </span>
                ) : null}
                <div className="relative">
                  <div className="row-rail" />
                  <div className="flex items-start gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg calendar-row transition-smooth">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] lg:text-sm font-normal text-foreground leading-tight">
                        {event.subject}
                      </p>
                      <div className="flex items-center gap-1.5 lg:gap-2 mt-0.5 lg:mt-1">
                        <Avatar className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0">
                          <AvatarFallback className="bg-primary/20 text-primary text-[8px] lg:text-[10px]">
                            {event.leadName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[9px] lg:text-xs text-muted-foreground/60">
                          {timeString}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {index < events.slice(0, 3).length - 1 && (
                  <div className="mt-2 lg:mt-3">
                    <div className="timeline-bar">
                      <div className="knob" />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
