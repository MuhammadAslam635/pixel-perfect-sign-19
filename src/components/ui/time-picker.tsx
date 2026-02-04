import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TimePicker = ({ value, onChange, disabled }: TimePickerProps) => {
  const [open, setOpen] = useState(false);
  
  // Helper to parse time string to 12h format
  const parseTimeValue = (val: string) => {
    const [h, m] = val ? val.split(':') : ['09', '00'];
    let hours = parseInt(h);
    const period = hours >= 12 ? 'PM' : 'AM';
    
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    
    return {
      hour: hours.toString().padStart(2, '0'),
      minute: m || '00',
      period
    };
  };

  const initial = parseTimeValue(value);
  
  // Keep local state for the UI
  const [selectedHour, setSelectedHour] = useState(initial.hour);
  const [selectedMinute, setSelectedMinute] = useState(initial.minute);
  const [selectedPeriod, setSelectedPeriod] = useState(initial.period);
  
  // Ref to track if we need to sync local state from props (only when closed)
  const lastPropValue = useRef(value);

  // Sync internal state when value prop changes externally, but ONLY if not open (to avoid fighting user input)
  useEffect(() => {
    if (value && value !== lastPropValue.current && !open) {
      const { hour, minute, period } = parseTimeValue(value);
      setSelectedHour(hour);
      setSelectedMinute(minute);
      setSelectedPeriod(period);
      lastPropValue.current = value;
    }
  }, [value, open]);

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
  const periods = ['AM', 'PM'];

  // Update LOCAL state only
  const handleTimeChange = (type: 'hour' | 'minute' | 'period', val: string) => {
    if (type === 'hour') setSelectedHour(val);
    else if (type === 'minute') setSelectedMinute(val);
    else if (type === 'period') setSelectedPeriod(val);
  };

  // Commit changes when popover closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    
    if (!newOpen) {
      // Calculate final 24h time string
      let h = parseInt(selectedHour);
      const m = selectedMinute;
      
      if (selectedPeriod === 'PM' && h !== 12) h += 12;
      if (selectedPeriod === 'AM' && h === 12) h = 0;

      const timeString = `${h.toString().padStart(2, '0')}:${m}`;
      // Only fire onChange if value actually changed to prevent unnecessary updates
      if (timeString !== value) {
        onChange(timeString);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="outline"
          className="w-full h-12 rounded-xl bg-white/[0.04] border-white/10 text-white hover:bg-white/[0.08] px-4 justify-start font-normal"
        >
          <Clock className="mr-3 h-4 w-4 text-white/50" />
          {selectedHour}:{selectedMinute} {selectedPeriod}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-white/10 overflow-hidden relative shadow-[0_25px_60px_rgba(0,0,0,0.55)] bg-popover" 
        align="start"
      >
        <div className="relative z-10 flex divide-x divide-white/10 h-[300px]">
          {/* Hours Column */}
          <ScrollArea className="h-full w-20" hideScrollbars>
            <div className="flex flex-col p-2 space-y-1">
              {hours.map((hour) => (
                <button
                  key={hour}
                  onClick={() => handleTimeChange('hour', hour)}
                  className={cn(
                    "rounded-md px-2 py-2 text-sm text-center transition-colors hover:bg-white/10",
                    selectedHour === hour ? "bg-white/20 text-white font-medium" : "text-white/60"
                  )}
                >
                  {hour}
                </button>
              ))}
            </div>
          </ScrollArea>
          
          {/* Minutes Column */}
           <ScrollArea className="h-full w-20" hideScrollbars>
            <div className="flex flex-col p-2 space-y-1">
              {minutes.map((minute) => (
                <button
                  key={minute}
                  onClick={() => handleTimeChange('minute', minute)}
                  className={cn(
                    "rounded-md px-2 py-2 text-sm text-center transition-colors hover:bg-white/10",
                     selectedMinute === minute ? "bg-white/20 text-white font-medium" : "text-white/60"
                  )}
                >
                  {minute}
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* AM/PM Column */}
           <ScrollArea className="h-full w-20" hideScrollbars>
            <div className="flex flex-col p-2 space-y-1">
              {periods.map((period) => (
                <button
                  key={period}
                  onClick={() => handleTimeChange('period', period)}
                  className={cn(
                    "rounded-md px-2 py-2 text-sm text-center transition-colors hover:bg-white/10",
                     selectedPeriod === period ? "bg-white/20 text-white font-medium" : "text-white/60"
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
