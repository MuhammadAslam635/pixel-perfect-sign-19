import { FC } from "react";
import { Building2 } from "lucide-react";

interface CompanyLogoFallbackProps {
  name: string;
  logo?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Generate consistent color from company name
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
    "from-amber-500 to-amber-600",
    "from-red-500 to-red-600",
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Get initials from company name
const getInitials = (name: string): string => {
  if (!name) return "?";
  
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0 && !/^(the|and|or|for|of)$/i.test(word)); // Filter out common words
  
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const CompanyLogoFallback: FC<CompanyLogoFallbackProps> = ({
  name,
  logo,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 sm:w-10 sm:h-10 text-xs",
    md: "w-12 h-12 sm:w-14 sm:h-14 text-sm sm:text-base",
    lg: "w-16 h-16 sm:w-20 sm:h-20 text-base sm:text-lg",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const initials = getInitials(name);
  const gradientColor = getColorFromName(name);

  if (logo) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden border-2 border-primary/40 bg-white flex-shrink-0 ${className}`}>
        <img
          src={logo}
          alt={name}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            // Replace with initials fallback on error
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.className = `${sizeClasses[size]} rounded-lg overflow-hidden border-2 border-primary/40 flex-shrink-0 ${className}`;
              parent.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br ${gradientColor} flex items-center justify-center font-bold text-white">
                  ${initials}
                </div>
              `;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-primary/40 flex-shrink-0 ${className}`}>
      <div className={`w-full h-full bg-gradient-to-br ${gradientColor} flex items-center justify-center font-bold text-white`}>
        {initials}
      </div>
    </div>
  );
};
