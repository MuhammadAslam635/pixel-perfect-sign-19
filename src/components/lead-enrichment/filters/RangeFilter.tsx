import { DollarSign, Users2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  REVENUE_RANGES,
  EMPLOYEE_RANGES,
  type RevenueRange,
  type EmployeeRange,
} from "@/types/leadEnrichment";

interface RangeFilterProps {
  type: "revenue" | "employee";
  value: RevenueRange | EmployeeRange | undefined;
  onChange: (range: RevenueRange | EmployeeRange | undefined) => void;
}

const RangeFilter = ({ type, value, onChange }: RangeFilterProps) => {
  const isRevenue = type === "revenue";
  const ranges = isRevenue ? REVENUE_RANGES : EMPLOYEE_RANGES;
  const icon = isRevenue ? DollarSign : Users2;
  const label = isRevenue ? "Revenue Range" : "Company Size";
  const color = isRevenue ? "yellow" : "cyan";

  const getCurrentLabel = () => {
    if (!value || (!value.min && !value.max)) {
      return ranges[0].label;
    }

    const matchingRange = ranges.find(
      (r) => r.min === value.min && r.max === value.max
    );
    return matchingRange?.label || "Custom Range";
  };

  const handleChange = (rangeLabel: string) => {
    const selectedRange = ranges.find((r) => r.label === rangeLabel);
    if (selectedRange) {
      if (
        selectedRange.min === undefined &&
        selectedRange.max === undefined
      ) {
        onChange(undefined);
      } else {
        onChange({
          min: selectedRange.min,
          max: selectedRange.max,
        });
      }
    }
  };

  const Icon = icon;

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
        <Icon className={`w-4 h-4 text-${color}-400`} />
        {label}
      </label>

      {/* Current Selection Display */}
      {value && (value.min !== undefined || value.max !== undefined) && (
        <div className="flex items-center gap-2 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
          <Badge
            variant="secondary"
            className={`bg-${color}-900/40 text-${color}-300 border-${color}-500/30`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {getCurrentLabel()}
          </Badge>
          <span className="text-xs text-gray-400">
            {isRevenue ? (
              <>
                {value.min !== undefined && `$${value.min}M`}
                {value.min !== undefined && value.max !== undefined && " - "}
                {value.max !== undefined && `$${value.max}M`}
                {value.min !== undefined && value.max === undefined && "+"}
              </>
            ) : (
              <>
                {value.min !== undefined && `${value.min}`}
                {value.min !== undefined && value.max !== undefined && " - "}
                {value.max !== undefined && `${value.max}`}
                {value.min !== undefined && value.max === undefined && "+"}
                {" employees"}
              </>
            )}
          </span>
        </div>
      )}

      {/* Range Selector */}
      <Select value={getCurrentLabel()} onValueChange={handleChange}>
        <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {ranges.map((range) => (
            <SelectItem
              key={range.label}
              value={range.label}
              className="text-gray-200 focus:bg-gray-700 focus:text-white"
            >
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Info Text */}
      <p className="text-xs text-gray-400 italic">
        {isRevenue
          ? "Filter companies by annual revenue (in USD)"
          : "Filter companies by number of employees"}
      </p>
    </div>
  );
};

export default RangeFilter;
