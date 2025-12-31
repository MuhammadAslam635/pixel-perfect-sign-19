interface MetricValueProps {
  value: string | number;
  suffix?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Large value display component for metric cards
 * Shows formatted numbers with optional suffix and subtitle
 */
export const MetricValue = ({
  value,
  suffix,
  subtitle,
  size = "lg",
}: MetricValueProps) => {
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "text-2xl sm:text-3xl";
      case "md":
        return "text-3xl sm:text-4xl";
      case "lg":
        return "text-4xl sm:text-5xl";
      case "xl":
        return "text-5xl sm:text-6xl";
      default:
        return "text-4xl sm:text-5xl";
    }
  };

  const formattedValue =
    typeof value === "number" ? value.toLocaleString() : value;

  return (
    <div className="flex flex-col gap-1 mt-2 sm:mt-4">
      <div className="flex items-baseline gap-2">
        <p className={`${getSizeClass()} font-normal tracking-tight text-white`}>
          {formattedValue}
        </p>
        {suffix && (
          <span className="text-lg sm:text-xl text-white/60">{suffix}</span>
        )}
      </div>
      {subtitle && (
        <span className="text-xs sm:text-sm text-[#7A7A7A]">{subtitle}</span>
      )}
    </div>
  );
};
