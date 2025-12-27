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
import countryList from "react-select-country-list";
import { SearchInput } from "./SearchInput";

interface CompanyFiltersInlineProps {
  // Industry filter
  search: string;
  onSearchChange: (value: string) => void;
  industries: string[];
  industryFilter: string[];
  onIndustryFilterChange: (value: string[]) => void;

  // Employee range filter
  employeeRanges: Array<{ value: string; label: string }>;
  employeeRange: string[];
  onEmployeeRangeChange: (value: string[]) => void;

  // Location filter
  locationFilter: string[];
  onLocationFilterChange: (value: string[]) => void;

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
  search,
  onSearchChange,
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
    <div className="flex flex-col xl:flex-row gap-1.5  xl:gap-3 flex-1">
      <div className="flex items-center gap-1.5">


      {/* Industry Filter */}
      <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Industry:
        </label>
        <div className="w-32">
          <MultiSelect
            options={industryOptions}
            value={industryFilter}
            onChange={onIndustryFilterChange}
            placeholder="All industries"
            searchPlaceholder="Search industries..."
            emptyMessage="No industries found."
            className="h-8 text-xs"
            maxDisplayItems={1}
            popoverWidth="w-[280px]"
            showCount={true}
          />
        </div>
      </div>

      {/* Company Size Filter */}
      <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Size:
        </label>
        <div className="w-32">
          <MultiSelect
            options={employeeRanges.filter(r => r.value !== "all").map(r => ({ value: r.value, label: r.label }))}
            value={employeeRange}
            onChange={onEmployeeRangeChange}
            placeholder="All sizes"
            searchPlaceholder="Search sizes..."
            emptyMessage="No sizes found."
            className="h-8 text-xs"
            maxDisplayItems={1}
            popoverWidth="w-[280px]"
            showCount={true}
          />
        </div>
      </div>

      {/* Country Filter */}
      {/* <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Country:
        </label>
        <div className="w-40">
          <MultiSelect
            options={countryList().getData().map((c) => ({ value: c.label, label: c.label }))}
            value={locationFilter}
            onChange={onLocationFilterChange}
            placeholder="All countries"
            searchPlaceholder="Search countries..."
            emptyMessage="No countries found."
            className="h-8 text-xs"
            maxDisplayItems={1}
            popoverWidth="w-[280px]"
            showCount={true}
          />
        </div>
      </div> */}
      </div>
      <div className="flex items-center gap-1.5 justify-end w-full">
        {/* Country Filter */}
      <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Country:
        </label>
        <div className="w-32">
          <MultiSelect
            options={countryList().getData().map((c) => ({ value: c.label, label: c.label })).sort((a, b) => {
              const aSelected = locationFilter.includes(a.value);
              const bSelected = locationFilter.includes(b.value);
              if (aSelected && !bSelected) return -1;
              if (!aSelected && bSelected) return 1;
              return a.label.localeCompare(b.label);
            })}
            value={locationFilter}
            onChange={onLocationFilterChange}
            placeholder="All countries"
            searchPlaceholder="Search countries..."
            emptyMessage="No countries found."
            className="h-8 text-xs"
            maxDisplayItems={1}
            popoverWidth="w-[280px]"
            showCount={true}
          />
        </div>
      </div>
      {/* Checkboxes */}
      <div className="flex items-center gap-3 ml-2">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={hasPeopleFilter}
            onCheckedChange={(checked) =>
              onHasPeopleFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900 w-3.5 h-3.5"
          />
          <span className="text-xs text-gray-300">Contacts</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={hasWebsiteFilter}
            onCheckedChange={(checked) =>
              onHasWebsiteFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900 w-3.5 h-3.5"
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
  employeeRange: string[];
  onEmployeeRangeChange: (value: string[]) => void;

  // Location filter
  locationFilter: string[];
  onLocationFilterChange: (value: string[]) => void;

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
        <MultiSelect
          options={employeeRanges.filter(r => r.value !== "all").map(r => ({ value: r.value, label: r.label }))}
          value={employeeRange}
          onChange={onEmployeeRangeChange}
          placeholder="All sizes"
          searchPlaceholder="Search sizes..."
          emptyMessage="No sizes found."
          className="h-9 text-xs"
        />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mb-2">
          Country
        </p>
        <MultiSelect
          options={countryList().getData().map((c) => ({ value: c.label, label: c.label })).sort((a, b) => {
            const aSelected = locationFilter.includes(a.value);
            const bSelected = locationFilter.includes(b.value);
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return a.label.localeCompare(b.label);
          })}
          value={locationFilter}
          onChange={onLocationFilterChange}
          placeholder="All countries"
          searchPlaceholder="Search countries..."
          emptyMessage="No countries found."
          className="h-9 text-xs"
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
