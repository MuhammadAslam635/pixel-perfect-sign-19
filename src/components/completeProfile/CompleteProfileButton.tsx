import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Sparkles } from "lucide-react";
import { RootState } from "@/store/store";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { cn } from "@/lib/utils";

export const CompleteProfileButton = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { progress, isComplete } = useProfileCompletion();

  // Debug log
  useEffect(() => {
    if (currentUser?._id) {
      console.log("[CompleteProfileButton] Progress:", progress, "Complete:", isComplete);
    }
  }, [progress, isComplete, currentUser?._id]);

  // Get user's role name
  const getUserRoleName = (): string | null => {
    if (!currentUser) return null;

    // Check populated roleId (new RBAC system)
    if (currentUser.roleId && typeof currentUser.roleId === "object") {
      return (currentUser.roleId as any).name;
    }

    // Fallback to legacy role string
    if (currentUser.role && typeof currentUser.role === "string") {
      return currentUser.role;
    }

    return null;
  };

  const userRoleName = getUserRoleName();

  // Only show for Company and CompanyAdmin roles
  const shouldShowButton =
    userRoleName === "Company" || userRoleName === "CompanyAdmin";

  // Hide button if profile is complete or user shouldn't see it
  if (!shouldShowButton || isComplete) {
    return null;
  }

  const handleClick = () => {
    // Dispatch event to toggle the panel
    window.dispatchEvent(new CustomEvent("toggle_complete_profile_panel"));
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-gradient-to-r from-cyan-500/20 to-blue-600/20",
        "border border-cyan-400/30",
        "text-white text-sm font-medium",
        "hover:from-cyan-500/30 hover:to-blue-600/30 hover:border-cyan-400/50",
        "transition-all duration-200",
        "shadow-[0_0_15px_rgba(6,182,212,0.3)]"
      )}
      aria-label="Complete your profile setup"
    >
      {/* Icon */}
      <Sparkles className="h-4 w-4 text-cyan-400" />

      {/* Text */}
      <span className="hidden sm:inline">Complete Profile</span>
      <span className="inline sm:hidden">Profile</span>

      {/* Progress Badge */}
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-400/30">
        <span className="text-xs font-semibold text-cyan-400">{progress}%</span>
      </div>
    </button>
  );
};
