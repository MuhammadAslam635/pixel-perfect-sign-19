import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, ArrowRight } from 'lucide-react';

export default function CalendarCard() {
  return (
    <Card className="solid-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-foreground/50" />
          <h3 className="font-medium text-sm text-foreground">Calendar</h3>
        </div>
        <Button variant="link" className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80">
          View All <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      <div className="space-y-3 card-scroll scrollbar-hide">
        <div>
          <span className="calendar-label mb-2 inline-block">Today</span>
          <div className="relative">
            <div className="row-rail" />
            <div className="flex items-start gap-3 p-3 rounded-lg calendar-row transition-smooth">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-normal text-foreground">Meeting with Sarah Malik</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="bg-primary/20 text-primary text-[10px]">SM</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground/60">10:00 AM</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <div className="timeline-bar">
              <div className="knob" />
            </div>
          </div>
        </div>

        <div>
          <span className="calendar-label mb-2 inline-block">Tomorrow</span>
          <div className="relative">
            <div className="row-rail" />
            <div className="flex items-start gap-3 p-3 rounded-lg calendar-row transition-smooth">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-normal text-foreground">Meeting with Sarah Malik</p>
                <span className="text-xs text-muted-foreground/60 mt-1 block">2:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

