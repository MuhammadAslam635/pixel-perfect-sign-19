import * as React from "react";
import countryList from "react-select-country-list";
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
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CountrySelect({
  value = "",
  onChange,
  placeholder = "Select country",
  className,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);
  const countries = React.useMemo(() => countryList().getData(), []);

  const selectedCountry = React.useMemo(
    () => countries.find((country) => country.label === value),
    [countries, value]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white",
            className
          )}
        >
          <span className="truncate">
            {selectedCountry ? selectedCountry.label : placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {value && (
              <div
                className="flex items-center justify-center cursor-pointer"
                onMouseDown={handleClear}
              >
                <X className="h-3 w-3 shrink-0 opacity-50 hover:opacity-100" />
              </div>
            )}
            <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 bg-[#1a1a1a] border-[#2a2a2a]">
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Search countries..."
            className="h-9 text-white placeholder:text-gray-500"
          />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm text-white/60">
              No country found.
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto scrollbar-hide">
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.label}
                  onSelect={() => {
                    onChange(country.label);
                    setOpen(false);
                  }}
                  className="text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.label ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {country.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
