import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  maxDisplayItems?: number;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search items...",
  emptyMessage = "No items found.",
  className,
  disabled = false,
  maxDisplayItems = 3,
  popoverWidth,
}: MultiSelectProps & { popoverWidth?: string }) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState<string[]>(value);

  // Sync internal value with prop
  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const selectedValues = new Set(internalValue);

  const selectedOptions = options.filter((option) =>
    selectedValues.has(option.value)
  );

  const handleSelect = (optionValue: string) => {
    const newValue = selectedValues.has(optionValue)
      ? internalValue.filter((v) => v !== optionValue)
      : [...internalValue, optionValue];

    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleRemove = (optionValue: string) => {
    const newValue = value.filter((v) => v !== optionValue);
    onChange?.(newValue);
  };

  const displayItems = selectedOptions.slice(0, maxDisplayItems);
  const remainingCount = selectedOptions.length - maxDisplayItems;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-8 rounded-lg border border-white/15 bg-transparent text-white text-xs",
            !selectedOptions.length && "text-gray-500",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-1 flex-nowrap gap-1 overflow-hidden items-center">
            {displayItems.length > 0 ? (
              <>
                {displayItems.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="bg-white/10 text-white border border-white/20 text-xs px-2 py-0 h-5 flex items-center gap-1 flex-shrink-0 pb-0"
                  >
                    <span className="truncate max-w-24 sm:max-w-32 md:max-w-40 lg:max-w-48">
                      {option.label}
                    </span>
                    <button
                      className="ml-1 hover:bg-white/20 rounded-sm flex-shrink-0 p-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(option.value);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {remainingCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white border border-white/20 text-xs px-1.5 py-0 h-5 flex-shrink-0 pb-0"
                  >
                    +{remainingCount}
                  </Badge>
                )}
              </>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0 bg-[#1a1a1a] border-[#2a2a2a] rounded-xl", popoverWidth || "w-[--radix-popover-trigger-width]")}>
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="text-white placeholder:text-gray-400 h-9"
          />
          <CommandList className="scrollbar-hide">
            <CommandEmpty className="p-4 text-sm text-gray-400">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup className="max-h-40 overflow-y-auto scrollbar-hide">
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                    className="flex items-center gap-2 cursor-pointer text-gray-300 focus:text-white focus:bg-white/10"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
