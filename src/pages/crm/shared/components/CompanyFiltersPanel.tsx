import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompanyFiltersPanelProps {
  // Industry filter
  industries: string[];
  industryFilter: string;
  onIndustryFilterChange: (value: string) => void;

  // Employee range filter
  employeeRanges: Array<{ value: string; label: string }>;
  employeeRange: string;
  onEmployeeRangeChange: (value: string) => void;

  // Location filter
  locationFilter: string;
  onLocationFilterChange: (value: string) => void;

  // Checkbox filters
  hasPeopleFilter: boolean;
  onHasPeopleFilterChange: (checked: boolean) => void;
  hasWebsiteFilter: boolean;
  onHasWebsiteFilterChange: (checked: boolean) => void;

  // Actions
  hasFilters: boolean;
  onResetFilters: () => void;
  onClose: () => void;
}

export const CompanyFiltersPanel = ({
  industries,
  industryFilter,
  onIndustryFilterChange,
  employeeRanges,
  employeeRange,
  onEmployeeRangeChange,
  locationFilter,
  onLocationFilterChange,
  hasPeopleFilter,
  onHasPeopleFilterChange,
  hasWebsiteFilter,
  onHasWebsiteFilterChange,
  hasFilters,
  onResetFilters,
  onClose,
}: CompanyFiltersPanelProps) => {
  return (
    <div className="flex flex-col gap-3 text-gray-100 text-xs">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mb-2">
          Industry
        </p>
        <Select value={industryFilter} onValueChange={onIndustryFilterChange}>
          <SelectTrigger className="h-9 w-full rounded-lg border border-white/15 bg-transparent text-white text-xs">
            <SelectValue placeholder="All industries" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] rounded-xl max-h-60">
            <SelectItem
              value="all"
              className="text-gray-300 focus:text-white focus:bg-white/10"
            >
              All industries
            </SelectItem>
            {industries.map((industry) => (
              <SelectItem
                key={industry}
                value={industry}
                className="text-gray-300 focus:text-white focus:bg-white/10"
              >
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mb-2">
          Company size
        </p>
        <Select value={employeeRange} onValueChange={onEmployeeRangeChange}>
          <SelectTrigger className="h-9 w-full rounded-lg border border-white/15 bg-transparent text-white text-xs">
            <SelectValue placeholder="Company size" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] rounded-xl">
            {employeeRanges.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-gray-300 focus:text-white focus:bg-white/10"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mb-2">
          Location
        </p>
        <Input
          type="text"
          placeholder="City, state, or region"
          value={locationFilter}
          onChange={(e) => onLocationFilterChange(e.target.value)}
          className="h-9 rounded-lg border border-white/15 bg-transparent text-white placeholder:text-gray-500 text-xs"
        />
      </div>
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={hasPeopleFilter}
            onCheckedChange={(checked) =>
              onHasPeopleFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span>Only companies with saved contacts</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={hasWebsiteFilter}
            onCheckedChange={(checked) =>
              onHasWebsiteFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span>Only companies with websites</span>
        </label>
      </div>
      <div className="flex items-center justify-between">
        {hasFilters ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-300 hover:text-white px-2 py-1"
            onClick={onResetFilters}
          >
            Clear filters
          </Button>
        ) : (
          <p className="text-[11px] text-gray-500">No filters applied</p>
        )}
        <Button
          size="sm"
          variant="secondary"
          className="px-3 py-1 text-xs"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
};
