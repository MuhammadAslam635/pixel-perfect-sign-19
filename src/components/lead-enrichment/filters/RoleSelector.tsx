import { Users, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { SeniorityLevel, SeniorityOption } from "@/types/leadEnrichment";

interface RoleSelectorProps {
  selectedRoles: SeniorityLevel[];
  onChange: (roles: SeniorityLevel[]) => void;
  seniorityOptions: SeniorityOption[];
}

const RoleSelector = ({ selectedRoles, onChange, seniorityOptions }: RoleSelectorProps) => {
  const toggleRole = (role: SeniorityLevel) => {
    const newRoles = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role];
    onChange(newRoles);
  };

  const selectAll = () => {
    onChange(seniorityOptions.map((opt) => opt.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          Seniority Levels
        </label>
        <div className="flex gap-2">
          {selectedRoles.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs text-gray-400 hover:text-red-400 h-6"
            >
              Clear ({selectedRoles.length})
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAll}
            className="text-xs text-gray-400 hover:text-blue-400 h-6"
          >
            Select All
          </Button>
        </div>
      </div>

      {/* Selected Roles Summary */}
      {selectedRoles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
          {selectedRoles.map((role) => {
            const option = seniorityOptions.find((opt) => opt.value === role);
            return (
              <Badge
                key={role}
                variant="secondary"
                className="bg-blue-900/40 text-blue-300 border-blue-500/30"
              >
                {option?.label}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleRole(role)}
                  className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                >
                  <Check className="w-3 h-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Role Options */}
      <div className="grid grid-cols-2 gap-3">
        {seniorityOptions.map((option) => {
          const isSelected = selectedRoles.includes(option.value);
          return (
            <div
              key={option.value}
              onClick={() => toggleRole(option.value)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? "bg-blue-900/30 border-blue-500/50"
                  : "bg-gray-800/30 border-gray-700 hover:border-blue-500/30 hover:bg-gray-800/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleRole(option.value)}
                  className="mt-0.5 border-gray-600 data-[state=checked]:bg-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-200">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {option.description}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <p className="text-xs text-gray-400 italic">
        These seniority levels will be used to filter decision-makers from discovered companies.
      </p>
    </div>
  );
};

export default RoleSelector;
