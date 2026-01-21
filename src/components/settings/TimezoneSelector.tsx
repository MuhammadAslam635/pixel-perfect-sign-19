import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TIMEZONES, getTimezoneWithOffset } from "@/utils/timezones";

interface TimezoneSelectorProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  disabled?: boolean;
  id?: string;
}

export const TimezoneSelector = ({
  value,
  onValueChange,
  disabled = false,
  id,
}: TimezoneSelectorProps) => {
  const [open, setOpen] = useState(false);

  const selectedTimezone = TIMEZONES.find((tz) => tz.value === value);

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue === "none" ? null : selectedValue;
    onValueChange(newValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between bg-white/[0.06] border-white/10 text-white hover:bg-white/[0.08]"
        >
          <span className="truncate">
            {value
              ? getTimezoneWithOffset(value)
              : "Not set (UTC)"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 bg-[#1a1a2e] backdrop-blur-xl border-white/20" align="start">
        <Command>
          <CommandInput
            placeholder="Search timezone..."
            className="h-9 text-white bg-white/[0.05] border-white/10 placeholder:text-white/50"
          />
          <CommandList>
            <CommandEmpty className="text-white/70">No timezone found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => handleSelect("none")}
                className="text-white data-[selected='true']:bg-white/10 data-[selected='true']:text-white"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 text-white",
                    value === null ? "opacity-100" : "opacity-0"
                  )}
                />
                Not set (UTC)
              </CommandItem>
              {TIMEZONES.map((timezone) => (
                <CommandItem
                  key={timezone.value}
                  value={`${timezone.value} ${timezone.label} ${timezone.offsetLabel}`}
                  onSelect={() => handleSelect(timezone.value)}
                  className="text-white data-[selected='true']:bg-white/10 data-[selected='true']:text-white"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-white",
                      value === timezone.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center justify-between w-full">
                    <span>{timezone.label}</span>
                    {timezone.offsetLabel && (
                      <span className="ml-2 text-xs text-white/70">
                        {timezone.offsetLabel}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
