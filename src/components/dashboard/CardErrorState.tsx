import { AlertCircle, RefreshCw } from "lucide-react";

interface CardErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/**
 * Error state component for metric cards
 * Shows error message with optional retry button
 */
export const CardErrorState = ({ message, onRetry }: CardErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[150px] gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-sm text-red-400 text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
};
