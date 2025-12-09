import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { CountrySelect } from "@/components/ui/country-select";

// Extract unique job titles from leads data
const extractJobTitles = (leads?: any[]): MultiSelectOption[] => {
  if (!leads || leads.length === 0) {
    return [];
  }

  const titleSet = new Set<string>();

  leads.forEach((lead) => {
    const title = lead.position || lead.title;
    if (title && typeof title === "string" && title.trim()) {
      titleSet.add(title.trim());
    }
  });

  return Array.from(titleSet)
    .sort()
    .map((title) => ({ value: title, label: title }));
};

import countryList from "react-select-country-list";

interface LeadsFiltersInlineProps {
  // Country filter
  countryFilter: string[];
  onCountryFilterChange: (value: string[]) => void;

  // Position filter
  positionFilter: string[];
  onPositionFilterChange: (value: string[]) => void;
  leads?: any[]; // For extracting dynamic job titles

  // Checkbox filters
  hasEmailFilter: boolean;
  onHasEmailFilterChange: (checked: boolean) => void;
  hasPhoneFilter: boolean;
  onHasPhoneFilterChange: (checked: boolean) => void;
  hasLinkedinFilter: boolean;
  onHasLinkedinFilterChange: (checked: boolean) => void;

  // Actions
  hasFilters: boolean;
  onResetFilters: () => void;
}

export const LeadsFiltersInline = ({
  countryFilter,
  onCountryFilterChange,
  positionFilter,
  onPositionFilterChange,
  leads,
  hasEmailFilter,
  onHasEmailFilterChange,
  hasPhoneFilter,
  onHasPhoneFilterChange,
  hasLinkedinFilter,
  onHasLinkedinFilterChange,
  hasFilters,
  onResetFilters,
}: LeadsFiltersInlineProps) => {
  const positionOptions = extractJobTitles(leads);
  const countryOptions = countryList()
    .getData()
    .map((c) => ({ value: c.label, label: c.label })); // Using label as value for consistency with existing backend logic if needed, or stick to ISO codes if backend prefers. Assuming names based on previous implementation.

  return (
    <div className="flex flex-wrap flex-1 shrink-0  items-center gap-1.5">
      <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Country:
        </label>
        <div className="w-40">
          <MultiSelect
            options={countryOptions}
            value={countryFilter}
            onChange={onCountryFilterChange}
            placeholder="All countries"
            searchPlaceholder="Search countries..."
            emptyMessage="No countries found."
            className="h-8 text-xs"
            maxDisplayItems={1}
            popoverWidth="w-[280px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Title:
        </label>
        <div className="w-40">
          <MultiSelect
            options={positionOptions}
            value={positionFilter}
            onChange={onPositionFilterChange}
            placeholder="All titles"
            searchPlaceholder="Search titles..."
            emptyMessage="No titles found."
            className="h-8 text-xs"
            maxDisplayItems={1}
            popoverWidth="w-[280px]"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex items-center gap-1.5 ml-1 ml-auto">
        <label className="flex items-center gap-1 cursor-pointer">
          <Checkbox
            checked={hasEmailFilter}
            onCheckedChange={(checked) =>
              onHasEmailFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span className="text-xs text-gray-300">Email</span>
        </label>

        <label className="flex items-center gap-1 cursor-pointer">
          <Checkbox
            checked={hasPhoneFilter}
            onCheckedChange={(checked) =>
              onHasPhoneFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span className="text-xs text-gray-300">Phone</span>
        </label>

        <label className="flex items-center gap-1 cursor-pointer">
          <Checkbox
            checked={hasLinkedinFilter}
            onCheckedChange={(checked) =>
              onHasLinkedinFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span className="text-xs text-gray-300">LinkedIn</span>
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

interface LeadsFiltersPanelProps {
  // Country filter
  countryFilter: string;
  onCountryFilterChange: (value: string) => void;

  // Position filter
  positionFilter: string[];
  onPositionFilterChange: (value: string[]) => void;
  leads?: any[]; // For extracting dynamic job titles

  // Checkbox filters
  hasEmailFilter: boolean;
  onHasEmailFilterChange: (checked: boolean) => void;
  hasPhoneFilter: boolean;
  onHasPhoneFilterChange: (checked: boolean) => void;
  hasLinkedinFilter: boolean;
  onHasLinkedinFilterChange: (checked: boolean) => void;

  // Actions
  hasFilters: boolean;
  onResetFilters: () => void;
  onClose: () => void;
}

export const LeadsFiltersPanel = ({
  countryFilter,
  onCountryFilterChange,
  positionFilter,
  onPositionFilterChange,
  leads,
  hasEmailFilter,
  onHasEmailFilterChange,
  hasPhoneFilter,
  onHasPhoneFilterChange,
  hasLinkedinFilter,
  onHasLinkedinFilterChange,
  hasFilters,
  onResetFilters,
  onClose,
}: LeadsFiltersPanelProps) => {
  const positionOptions = extractJobTitles(leads);
  return (
    <div className="flex flex-col gap-3 text-gray-100 text-xs">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mb-2">
          Country
        </p>
        <CountrySelect
          value={countryFilter}
          onChange={onCountryFilterChange}
          placeholder="Select country"
          className="h-9 w-full text-xs"
        />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mb-2">
          Title / Role
        </p>
        <MultiSelect
          options={positionOptions}
          value={positionFilter}
          onChange={onPositionFilterChange}
          placeholder="All titles"
          searchPlaceholder="Search titles..."
          emptyMessage="No titles found."
        />
      </div>
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={hasEmailFilter}
            onCheckedChange={(checked) =>
              onHasEmailFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span>Has verified email</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={hasPhoneFilter}
            onCheckedChange={(checked) =>
              onHasPhoneFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span>Has phone number</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={hasLinkedinFilter}
            onCheckedChange={(checked) =>
              onHasLinkedinFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span>Has LinkedIn profile</span>
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
