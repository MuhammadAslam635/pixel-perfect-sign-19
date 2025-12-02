import React from "react";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { Filter } from "lucide-react";

interface FilterButtonProps {
  hasFilters: boolean;
  onClick: () => void;
}

export const FilterButton = React.forwardRef<
  HTMLButtonElement,
  FilterButtonProps
>(({ hasFilters, onClick }, ref) => {
  return (
    <ActiveNavButton
      ref={ref}
      icon={Filter}
      text="Filters"
      showIndicator={hasFilters}
      onClick={onClick}
    />
  );
});

FilterButton.displayName = "FilterButton";
