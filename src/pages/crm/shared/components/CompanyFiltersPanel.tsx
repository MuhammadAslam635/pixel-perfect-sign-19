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
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { CountrySelect } from "@/components/ui/country-select";

interface CompanyFiltersInlineProps {
  // Industry filter
  industries: string[];
  industryFilter: string[];
  onIndustryFilterChange: (value: string[]) => void;

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
}

export const CompanyFiltersInline = ({
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
}: CompanyFiltersInlineProps) => {
  const industryOptions: MultiSelectOption[] = industries.map((industry) => ({
    value: industry,
    label: industry,
  }));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Industry Filter */}
      <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Industry:
        </label>
        <div className="w-36">
          <MultiSelect
            options={industryOptions}
            value={industryFilter}
            onChange={onIndustryFilterChange}
            placeholder="All industries"
            searchPlaceholder="Search industries..."
            emptyMessage="No industries found."
            className="h-8 text-xs"
            maxDisplayItems={1}
          />
        </div>
      </div>

      {/* Company Size Filter */}
      <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Size:
        </label>
        <Select value={employeeRange} onValueChange={onEmployeeRangeChange}>
          <SelectTrigger className="h-8 w-24 rounded-lg border border-white/15 bg-transparent text-white text-xs">
            <SelectValue placeholder="Any" />
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

      {/* Country Filter */}
      <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Country:
        </label>
        <CountrySelect
          value={locationFilter}
          onChange={onLocationFilterChange}
          placeholder="All countries"
          className="h-8 w-40 text-xs"
        />
      </div>

      {/* Checkboxes */}
      <div className="flex items-center gap-1.5 ml-1">
        <label className="flex items-center gap-1 cursor-pointer">
          <Checkbox
            checked={hasPeopleFilter}
            onCheckedChange={(checked) =>
              onHasPeopleFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span className="text-xs text-gray-300">Contacts</span>
        </label>

        <label className="flex items-center gap-1 cursor-pointer">
          <Checkbox
            checked={hasWebsiteFilter}
            onCheckedChange={(checked) =>
              onHasWebsiteFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span className="text-xs text-gray-300">Website</span>
        </label>
      </div>

      {/* Clear Filters Button */}
      {hasFilters && (
        <Button
          size="sm"
          variant="ghost"
          className="bg-accent text-white hover:bg-accent/80 px-2 py-1 h-8 text-xs whitespace-nowrap ml-1"
          onClick={onResetFilters}
        >
          Clear
        </Button>
      )}
    </div>
  );
};

interface CompanyFiltersPanelProps {
  // Industry filter
  industries: string[];
  industryFilter: string[];
  onIndustryFilterChange: (value: string[]) => void;

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
  const industryOptions: MultiSelectOption[] = industries.map((industry) => ({
    value: industry,
    label: industry,
  }));

  return (
    <div className="flex flex-col gap-3 text-gray-100 text-xs">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mb-2">
          Industry
        </p>
        <MultiSelect
          options={industryOptions}
          value={industryFilter}
          onChange={onIndustryFilterChange}
          placeholder="All industries"
          searchPlaceholder="Search industries..."
          emptyMessage="No industries found."
        />
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
