import { ReactNode } from "react";

interface MetricCardProps {
  children: ReactNode;
  className?: string;
  minHeight?: string;
}

/**
 * Reusable metric card wrapper with consistent styling
 * Matches StatsCard.tsx styling with rounded borders and hover effects
 */
export const MetricCard = ({
  children,
  className = "",
  minHeight = "min-h-[120px]"
}: MetricCardProps) => {
  return (
    <div className="p-2">
      <section
        className={`
          relative w-full overflow-hidden
          rounded-[36px] border border-white/10
          px-4 py-4 sm:px-5 sm:py-5
          ${minHeight}
          transition-all duration-300
          hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]
          ${className}
        `}
      >
        <div className="relative z-10 flex h-full flex-col">
          {children}
        </div>
      </section>
    </div>
  );
};
