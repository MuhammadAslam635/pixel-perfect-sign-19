import React, { useState } from "react";

interface AvatarFallbackProps {
  name: string;
  pictureUrl?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

// Generate consistent color from name
const getColorFromName = (name: string): string => {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
    "from-indigo-500 to-indigo-600",
    "from-cyan-500 to-cyan-600",
    "from-teal-500 to-teal-600",
    "from-green-500 to-green-600",
    "from-orange-500 to-orange-600",
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Get initials from name
const getInitials = (name: string): string => {
  if (!name) return "?";
  
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ name, pictureUrl, size = "md", className = "" }, ref) => {
    const [hasError, setHasError] = useState(false);

    const sizeClasses = {
      xs: "w-8 h-8 text-[10px]",
      sm: "w-8 h-8 sm:w-10 sm:h-10 text-xs",
      md: "w-12 h-12 sm:w-14 sm:h-14 text-sm sm:text-base",
      lg: "w-16 h-16 sm:w-20 sm:h-20 text-base sm:text-lg",
    };

    const initials = getInitials(name);
    const gradientColor = getColorFromName(name);

    const renderFallback = () => (
      <div className={`w-full h-full bg-gradient-to-br ${gradientColor} flex items-center justify-center font-semibold text-white`}>
        {initials}
      </div>
    );

    return (
      <div 
        ref={ref}
        className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-primary/40 bg-white/5 flex-shrink-0 ${className}`}
      >
        {pictureUrl && !hasError ? (
          <img
            src={pictureUrl}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          renderFallback()
        )}
      </div>
    );
  }
);
AvatarFallback.displayName = "AvatarFallback";
