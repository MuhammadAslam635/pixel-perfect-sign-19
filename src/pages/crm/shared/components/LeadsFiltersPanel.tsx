import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface LeadsFiltersPanelProps {
  // Location filter
  locationFilter: string;
  onLocationFilterChange: (value: string) => void;

  // Position filter
  positionFilter: string;
  onPositionFilterChange: (value: string) => void;

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
        <Input
          type="text"
          placeholder="VP of Sales, CEO, ..."
          value={positionFilter}
          onChange={(e) => onPositionFilterChange(e.target.value)}
          className="h-9 rounded-lg border border-white/15 bg-transparent text-white placeholder:text-gray-500 text-xs"
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
