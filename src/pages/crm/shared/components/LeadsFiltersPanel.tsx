import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";

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

interface LeadsFiltersInlineProps {
  // Location filter
  locationFilter: string;
  onLocationFilterChange: (value: string) => void;

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
  locationFilter,
  onLocationFilterChange,
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
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Location Filter */}
      <div className="flex items-center gap-2">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Location:
        </label>
        <Input
          type="text"
          placeholder="City, state..."
          value={locationFilter}
          onChange={(e) => onLocationFilterChange(e.target.value)}
          className="h-8 w-32 rounded-lg border border-white/15 bg-transparent text-white placeholder:text-gray-500 text-xs"
        />
      </div>

      {/* Position Filter */}
      <div className="flex items-center gap-2">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Title:
        </label>
        <div className="w-56">
          <MultiSelect
            options={positionOptions}
            value={positionFilter}
            onChange={onPositionFilterChange}
            placeholder="All titles"
            searchPlaceholder="Search titles..."
            emptyMessage="No titles found."
            className="h-8 text-xs"
            maxDisplayItems={3}
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={hasEmailFilter}
            onCheckedChange={(checked) =>
              onHasEmailFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span className="text-xs text-gray-300">Email</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={hasPhoneFilter}
            onCheckedChange={(checked) =>
              onHasPhoneFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span className="text-xs text-gray-300">Phone</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer">
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
          className="bg-accent text-white hover:bg-accent/80 px-2 py-1 h-8 text-xs"
          onClick={onResetFilters}
        >
          Clear
        </Button>
      )}
    </div>
  );
};

interface LeadsFiltersPanelProps {
  // Location filter
  locationFilter: string;
  onLocationFilterChange: (value: string) => void;

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
  locationFilter,
  onLocationFilterChange,
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
