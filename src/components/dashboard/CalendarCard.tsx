import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, ArrowRight } from 'lucide-react';

export default function CalendarCard() {
  return (
    <Card className="solid-card p-3 lg:p-5">
      <div className="flex items-center justify-between mb-2 lg:mb-4">
        <div className="flex items-center gap-1.5 lg:gap-2">
          <Calendar className="w-3 h-3 lg:w-4 lg:h-4 text-foreground/50" />
          <h3 className="font-medium text-[10px] lg:text-sm text-foreground leading-tight">Calendar</h3>
        </div>
        <Button variant="link" className="h-auto p-0 text-[9px] lg:text-xs text-foreground/60 hover:text-foreground/80">
          View All <ArrowRight className="w-2.5 h-2.5 lg:w-3 lg:h-3 ml-0.5 lg:ml-1" />
        </Button>
      </div>

      <div className="space-y-2 lg:space-y-3 card-scroll scrollbar-hide">
        <div>
          <span className="calendar-label mb-1.5 lg:mb-2 inline-block text-[9px] lg:text-xs">Today</span>
          <div className="relative">
            <div className="row-rail" />
            <div className="flex items-start gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg calendar-row transition-smooth">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] lg:text-sm font-normal text-foreground leading-tight">Meeting with Sarah Malik</p>
                <div className="flex items-center gap-1.5 lg:gap-2 mt-0.5 lg:mt-1">
                  <Avatar className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary text-[8px] lg:text-[10px]">SM</AvatarFallback>
                  </Avatar>
                  <span className="text-[9px] lg:text-xs text-muted-foreground/60">10:00 AM</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 lg:mt-3">
            <div className="timeline-bar">
              <div className="knob" />
            </div>
          </div>
        </div>

        <div>
          <span className="calendar-label mb-1.5 lg:mb-2 inline-block text-[9px] lg:text-xs">Tomorrow</span>
          <div className="relative">
            <div className="row-rail" />
            <div className="flex items-start gap-2 lg:gap-3 p-2 lg:p-3 rounded-lg calendar-row transition-smooth">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] lg:text-sm font-normal text-foreground leading-tight">Meeting with Sarah Malik</p>
                <span className="text-[9px] lg:text-xs text-muted-foreground/60 mt-0.5 lg:mt-1 block">2:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

