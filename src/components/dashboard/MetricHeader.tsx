import { ReactNode } from "react";

interface MetricHeaderProps {
  title: string;
  badge?: ReactNode;
  subtitle?: string;
}

/**
 * Header component for metric cards
 * Shows title with optional badge and subtitle
 */
export const MetricHeader = ({ title, badge, subtitle }: MetricHeaderProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-[#7A7A7A] text-sm sm:text-base font-medium">
          {title}
        </span>
        {badge}
      </div>
      {subtitle && (
        <span className="text-[#7A7A7A] text-xs sm:text-sm">
          {subtitle}
        </span>
      )}
    </div>
  );
};

interface MetricBadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

/**
 * Badge component for metric headers
 * Styled to match StatsCard badge design
 */
export const MetricBadge = ({ children, variant = "default" }: MetricBadgeProps) => {
  const getVariantColor = () => {
    switch (variant) {
      case "success":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "danger":
        return "text-red-400";
      default:
        return "text-white";
    }
  };

  return (
    <span
      className={`rounded-full bg-[#FFFFFF1A] px-3 py-1 text-xs font-medium ${getVariantColor()}`}
      style={{
        boxShadow:
          "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
      }}
    >
      {children}
    </span>
  );
};
