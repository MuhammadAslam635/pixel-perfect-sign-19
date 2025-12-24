import { useState } from "react";
import { Users, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { SeniorityLevel, SeniorityOption } from "@/types/leadEnrichment";

interface SeniorityQuickSelectorProps {
  selectedSeniorities: SeniorityLevel[];
  onChange: (seniorities: SeniorityLevel[]) => void;
  seniorityOptions: SeniorityOption[];
}

const SeniorityQuickSelector = ({
  selectedSeniorities,
  onChange,
  seniorityOptions,
}: SeniorityQuickSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSeniority = (seniority: SeniorityLevel) => {
    const newSelection = selectedSeniorities.includes(seniority)
      ? selectedSeniorities.filter((s) => s !== seniority)
      : [...selectedSeniorities, seniority];
    onChange(newSelection);
  };

  const selectAll = () => {
    onChange(seniorityOptions.map((opt) => opt.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-10 px-4 bg-gradient-to-br from-gray-800/50 to-gray-900/30 border border-white/10 text-white hover:bg-white/5 hover:border-white/20"
        >
          <Users className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Seniority Levels</span>
          <span className="sm:hidden">Seniority</span>
          {selectedSeniorities.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-[#69B4B7] text-white border-0 px-1.5 py-0 h-5 text-xs"
            >
              {selectedSeniorities.length}
            </Badge>
          )}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[280px] bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10"
      >
        <DropdownMenuLabel className="text-white/70 flex items-center justify-between">
          <span>Filter by Seniority</span>
          <div className="flex gap-1">
            {selectedSeniorities.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                selectAll();
              }}
              className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
            >
              All
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />

        <div className="max-h-[300px] overflow-y-auto scrollbar-hide">
          {seniorityOptions.map((option) => {
            const isSelected = selectedSeniorities.includes(option.value);
            return (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={isSelected}
                onCheckedChange={() => toggleSeniority(option.value)}
                className="text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-white/50">
                      {option.description}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#69B4B7] ml-2" />
                  )}
                </div>
              </DropdownMenuCheckboxItem>
            );
          })}
        </div>

        {selectedSeniorities.length === 0 && (
          <>
            <DropdownMenuSeparator className="bg-white/10" />
            <div className="px-2 py-2 text-xs text-white/50 italic text-center">
              No filters applied - all seniorities
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SeniorityQuickSelector;
