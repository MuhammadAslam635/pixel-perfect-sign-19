import { DollarSign, Users2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { RangeOption } from "@/types/leadEnrichment";

interface RangeFilterProps {
  type: "revenue" | "employee";
  selectedRanges: RangeOption[];
  onChange: (ranges: RangeOption[]) => void;
  ranges: RangeOption[];
}

const RangeFilter = ({ type, selectedRanges, onChange, ranges }: RangeFilterProps) => {
  const isRevenue = type === "revenue";
  const icon = isRevenue ? DollarSign : Users2;
  const label = isRevenue ? "Revenue Ranges" : "Company Sizes";
  const Icon = icon;

  const toggleRange = (range: RangeOption) => {
    // Check if this range is already selected
    const isSelected = selectedRanges.some(
      (r) => r.min === range.min && r.max === range.max
    );

    let newRanges: RangeOption[];
    if (isSelected) {
      // Remove this range
      newRanges = selectedRanges.filter(
        (r) => !(r.min === range.min && r.max === range.max)
      );
    } else {
      // Add this range
      newRanges = [...selectedRanges, range];
    }

    onChange(newRanges);
  };

  const isRangeSelected = (range: RangeOption) => {
    return selectedRanges.some(
      (r) => r.min === range.min && r.max === range.max
    );
  };

  const clearAll = () => {
    onChange([]);
  };

  const formatRangeLabel = (range: RangeOption) => {
    if (isRevenue) {
      if (range.min !== undefined && range.max !== undefined) {
        return `$${range.min}M - $${range.max}M`;
      } else if (range.min !== undefined) {
        return `$${range.min}M+`;
      } else if (range.max !== undefined) {
        return `Up to $${range.max}M`;
      }
    } else {
      if (range.min !== undefined && range.max !== undefined) {
        return `${range.min} - ${range.max} employees`;
      } else if (range.min !== undefined) {
        return `${range.min}+ employees`;
      } else if (range.max !== undefined) {
        return `Up to ${range.max} employees`;
      }
    }
    return range.label;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
          <Icon className="w-4 h-4 text-blue-400" />
          {label}
        </label>
        {selectedRanges.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-red-400 h-6"
          >
            Clear ({selectedRanges.length})
          </Button>
        )}
      </div>

      {/* Selected Ranges Summary */}
      {selectedRanges.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
          {selectedRanges.map((range, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-blue-900/40 text-blue-300 border-blue-500/30"
            >
              <Icon className="w-3 h-3 mr-1" />
              {formatRangeLabel(range)}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleRange(range)}
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Range Options */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide bg-gray-800/20 rounded-lg border border-gray-700 p-2">
        {ranges.map((range, index) => {
          // Skip "Any" option
          if (range.min === undefined && range.max === undefined) {
            return null;
          }

          const isSelected = isRangeSelected(range);

          return (
            <div
              key={index}
              onClick={() => toggleRange(range)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? "bg-blue-900/30 border border-blue-500/50"
                  : "bg-gray-800/30 hover:bg-gray-800/50 border border-transparent"
              }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleRange(range)}
                className="border-gray-600 data-[state=checked]:bg-blue-600"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-200">
                  {range.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {formatRangeLabel(range)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-400 italic">
        {isRevenue
          ? "Select multiple ranges - companies matching ANY range will be included (OR condition)"
          : "Select multiple sizes - companies matching ANY size will be included (OR condition)"}
      </p>
    </div>
  );
};

export default RangeFilter;
