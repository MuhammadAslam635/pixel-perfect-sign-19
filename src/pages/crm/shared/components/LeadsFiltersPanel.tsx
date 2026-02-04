import { useMemo, useState, useEffect } from "react";
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
import { Save, Check } from "lucide-react";
import { toast } from "sonner";

// Predefined seniority levels (common across most organizations)
const PREDEFINED_SENIORITY_OPTIONS: MultiSelectOption[] = [
  { value: "c_suite", label: "C-Suite" },
  { value: "vp", label: "VP" },
  { value: "director", label: "Director" },
  { value: "manager", label: "Manager" },
  { value: "senior", label: "Senior" },
  { value: "entry", label: "Entry Level" },
  { value: "intern", label: "Intern" },
];

// LocalStorage key for saved seniority filter
const SAVED_SENIORITY_FILTER_KEY = "savedSeniorityFilter";

// Utility functions for localStorage persistence
const saveSeniorityFilter = (filter: string[]) => {
  try {
    localStorage.setItem(SAVED_SENIORITY_FILTER_KEY, JSON.stringify(filter));
    return true;
  } catch (error) {
    console.error("Failed to save seniority filter:", error);
    return false;
  }
};

const loadSeniorityFilter = (): string[] => {
  try {
    const saved = localStorage.getItem(SAVED_SENIORITY_FILTER_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load seniority filter:", error);
  }
  return [];
};

interface LeadsFiltersInlineProps {
  // Country filter
  countryFilter: string[];
  onCountryFilterChange: (value: string[]) => void;

  // Seniority filter
  seniorityFilter: string[];
  onSeniorityFilterChange: (value: string[]) => void;
  onLoadSavedSeniority?: () => void;

  // Stage filter
  stageFilter: string[];
  onStageFilterChange: (value: string[]) => void;

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

  // Sorting
  sortBy: string;
  onSortByChange: (value: string) => void;

  // Additional Checkbox Filter
  hasFavouriteFilter: boolean;
  onHasFavouriteFilterChange: (checked: boolean) => void;
}

const EMPTY_ARRAY: MultiSelectOption[] = [];

export const LeadsFiltersInline = ({
  countryFilter,
  onCountryFilterChange,
  seniorityFilter,
  onSeniorityFilterChange,
  stageFilter,
  onStageFilterChange,
  hasEmailFilter,
  onHasEmailFilterChange,
  hasPhoneFilter,
  onHasPhoneFilterChange,
  hasLinkedinFilter,
  onHasLinkedinFilterChange,
  hasFilters,
  onResetFilters,
  sortBy,
  onSortByChange,
  hasFavouriteFilter,
  onHasFavouriteFilterChange,
  onLoadSavedSeniority,
}: LeadsFiltersInlineProps) => {
  // Use predefined seniority options
  const seniorityOptions = PREDEFINED_SENIORITY_OPTIONS;
  const [savedFilter, setSavedFilter] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Load saved filter on mount
  useEffect(() => {
    const saved = loadSeniorityFilter();
    setSavedFilter(saved);
    // Check if current filter matches saved filter
    setIsSaved(
      JSON.stringify([...seniorityFilter].sort()) ===
        JSON.stringify([...saved].sort())
    );
  }, [seniorityFilter]);

  const handleSaveSeniorityFilter = () => {
    if (saveSeniorityFilter(seniorityFilter)) {
      setSavedFilter([...seniorityFilter]);
      setIsSaved(true);
      toast.success("Seniority filter saved");
    } else {
      toast.error("Failed to save seniority filter");
    }
  };

  const handleLoadSavedSeniority = () => {
    const saved = loadSeniorityFilter();
    if (saved.length > 0) {
      onSeniorityFilterChange(saved);
      if (onLoadSavedSeniority) {
        onLoadSavedSeniority();
      }
      toast.success("Saved seniority filter loaded");
    } else {
      toast.info("No saved seniority filter found");
    }
  };

  const countryOptions = useMemo(
    () => countryList().getData().map((c) => ({ value: c.label, label: c.label })).sort((a, b) => {
      const aSelected = countryFilter.includes(a.value);
      const bSelected = countryFilter.includes(b.value);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return a.label.localeCompare(b.label);
    }),
    [countryFilter]
  );

  // Stage options based on lead stage definitions
  const stageOptions = useMemo(
    () => [
      { value: "New", label: "New" },
      { value: "Interested", label: "Interested" },
      { value: "Follow-up", label: "Follow-up" },
      { value: "Appointment Booked", label: "Appointment Booked" },
      { value: "Proposal Sent", label: "Proposal Sent" },
      { value: "Follow-up to Close", label: "Follow-up to Close" },
      { value: "Deal Closed", label: "Deal Closed" },
    ],
    []
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
      <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Country:
        </label>
        <div className="w-28">
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
            showCount={true}
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Stage:
        </label>
        <div className="w-32">
          <MultiSelect
            options={stageOptions}
            value={stageFilter}
            onChange={onStageFilterChange}
            placeholder="All stages"
            searchPlaceholder="Search stages..."
            emptyMessage="No stages found."
            className="h-8 text-xs"
            maxDisplayItems={1}
            popoverWidth="w-[280px]"
            showCount={true}
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Seniority:
        </label>
        <div className="flex items-center gap-1">
          <div className="w-32">
            <MultiSelect
              options={seniorityOptions}
              value={seniorityFilter}
              onChange={onSeniorityFilterChange}
              placeholder="All seniorities"
              searchPlaceholder="Search seniority..."
              emptyMessage="No seniority levels found."
              className="h-8 text-xs"
              maxDisplayItems={1}
              popoverWidth="w-[280px]"
              showCount={true}
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={`h-8 w-8 p-0 ${
              isSaved
                ? "text-green-400 hover:text-green-300"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={handleSaveSeniorityFilter}
            title="Save seniority filter"
          >
            {isSaved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
          {savedFilter.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-gray-400 hover:text-white"
              onClick={handleLoadSavedSeniority}
              title="Load saved seniority filter"
            >
              Load
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <label className="text-[11px] uppercase tracking-[0.08em] text-gray-400 whitespace-nowrap">
          Sort:
        </label>
        <div className="w-32">
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="h-8 text-xs bg-transparent border-input">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap items-center gap-1.5 ml-auto">
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

        <label className="flex items-center gap-1 cursor-pointer">
          <Checkbox
            checked={hasFavouriteFilter}
            onCheckedChange={(checked) =>
              onHasFavouriteFilterChange(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span className="text-xs text-gray-300">Favourite</span>
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

  // Seniority filter
  seniorityFilter: string[];
  onSeniorityFilterChange: (value: string[]) => void;
  onLoadSavedSeniority?: () => void;

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
  seniorityFilter,
  onSeniorityFilterChange,
  hasEmailFilter,
  onHasEmailFilterChange,
  hasPhoneFilter,
  onHasPhoneFilterChange,
  hasLinkedinFilter,
  onHasLinkedinFilterChange,
  hasFilters,
  onResetFilters,
  onClose,
  onLoadSavedSeniority,
}: LeadsFiltersPanelProps) => {
  // Use predefined seniority options
  const seniorityOptions = PREDEFINED_SENIORITY_OPTIONS;
  const [savedFilter, setSavedFilter] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Load saved filter on mount
  useEffect(() => {
    const saved = loadSeniorityFilter();
    setSavedFilter(saved);
    // Check if current filter matches saved filter
    setIsSaved(
      JSON.stringify([...seniorityFilter].sort()) ===
        JSON.stringify([...saved].sort())
    );
  }, [seniorityFilter]);

  const handleSaveSeniorityFilter = () => {
    if (saveSeniorityFilter(seniorityFilter)) {
      setSavedFilter([...seniorityFilter]);
      setIsSaved(true);
      toast.success("Seniority filter saved");
    } else {
      toast.error("Failed to save seniority filter");
    }
  };

  const handleLoadSavedSeniority = () => {
    const saved = loadSeniorityFilter();
    if (saved.length > 0) {
      onSeniorityFilterChange(saved);
      if (onLoadSavedSeniority) {
        onLoadSavedSeniority();
      }
      toast.success("Saved seniority filter loaded");
    } else {
      toast.info("No saved seniority filter found");
    }
  };
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
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400">
            Seniority Level
          </p>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className={`h-7 w-7 p-0 ${
                isSaved
                  ? "text-green-400 hover:text-green-300"
                  : "text-gray-400 hover:text-white"
              }`}
              onClick={handleSaveSeniorityFilter}
              title="Save seniority filter"
            >
              {isSaved ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
            </Button>
            {savedFilter.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-gray-400 hover:text-white"
                onClick={handleLoadSavedSeniority}
                title="Load saved seniority filter"
              >
                Load
              </Button>
            )}
          </div>
        </div>
        <MultiSelect
          options={seniorityOptions}
          value={seniorityFilter}
          onChange={onSeniorityFilterChange}
          placeholder="All seniority levels"
          searchPlaceholder="Search seniority..."
          emptyMessage="No seniority levels found."
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
