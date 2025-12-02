interface CountBadgeProps {
  count: number | undefined;
  singular: string;
  plural: string;
}

export const CountBadge = ({ count, singular, plural }: CountBadgeProps) => {
  if (count === undefined) return null;

  return (
    <div
      className="hidden sm:flex px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-full border border-gray-600 sm:border-0 text-gray-300 text-xs sm:text-sm font-medium whitespace-nowrap items-center justify-center bg-gray-800/50 sm:bg-[#FFFFFF1A] mobile-count-badge"
      style={{
        boxShadow: "none",
      }}
    >
      {count} {count === 1 ? singular : plural}
    </div>
  );
};
