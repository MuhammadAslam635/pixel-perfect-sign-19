import { Loader2 } from "lucide-react";

/**
 * Loading state component for metric cards
 * Shows a centered spinner while data is being fetched
 */
export const CardLoadingState = () => {
  return (
    <div className="flex items-center justify-center h-full min-h-[150px]">
      <Loader2 className="w-8 h-8 animate-spin text-white/70" />
    </div>
  );
};
