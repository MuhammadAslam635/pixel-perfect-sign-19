import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Sparkles } from "lucide-react";
import { RootState } from "@/store/store";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { cn } from "@/lib/utils";

export const CompleteProfileButton = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { progress, isComplete, checkAllTasksStatus } = useProfileCompletion();

  // Debug log - track completion status changes
  useEffect(() => {
    if (currentUser?._id) {
      console.log("[CompleteProfileButton] Progress:", progress, "% | Complete:", isComplete);
      if (isComplete) {
        console.log("[CompleteProfileButton] 🎉 Profile 100% complete! Button will hide.");
      } else if (progress > 0) {
        console.log(`[CompleteProfileButton] ⚡ Button visible with ${progress}% progress`);
      }
    }
  }, [progress, isComplete, currentUser?._id]);

  // Listen for real-time updates from task completions/uncompletion
  useEffect(() => {
    if (!currentUser?._id) return;

    const handleTaskUpdate = () => {
      console.log("[CompleteProfileButton] Task updated, refreshing status...");
      checkAllTasksStatus();
    };

    // Listen for all task update events
    const events = [
      // Task completion events
      "microsoft_connected",
      "facebook_connected",
      "google_connected",
      "knowledge_base_updated",
      "proposal_updated",
      "onboarding_updated",
      // Task uncompletion events (disconnect/delete)
      "microsoft_disconnected",
      "facebook_disconnected",
      "google_disconnected",
    ];

    events.forEach((event) => {
      window.addEventListener(event, handleTaskUpdate);
    });

    // Also check on visibility change (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("[CompleteProfileButton] Tab visible, checking status");
        checkAllTasksStatus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleTaskUpdate);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentUser?._id, checkAllTasksStatus]);

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

  // Hide button if user shouldn't see it
  if (!shouldShowButton) {
    return null;
  }

  const handleClick = () => {
    // Dispatch event to toggle the panel
    window.dispatchEvent(new CustomEvent("toggle_complete_profile_panel"));
  };

  // If complete, hide with animation
  if (isComplete) {
    console.log("[CompleteProfileButton] Profile complete, hiding button");
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group relative overflow-hidden flex-none flex h-10 items-center justify-start rounded-full",
        "border border-white/40 px-3.5 gap-2",
        "text-xs font-medium tracking-wide sm:text-sm",
        "text-white transition-all duration-300 ease-out",
        "hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)]",
        "before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5",
        "before:rounded-t-full before:bg-gradient-to-b before:from-white/15 before:to-transparent",
        "before:transition-all before:duration-300 before:ease-in-out",
        "hover:before:from-white/25 hover:before:duration-200",
        "animate-in fade-in slide-in-from-right-5 duration-500"
      )}
      style={{
        background: "#FFFFFF1A",
        boxShadow:
          "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
      }}
      aria-label="Complete your profile setup"
    >
      {/* Icon */}
      <Sparkles className="h-[16px] w-[16px] flex-shrink-0 text-white/85 transition-colors duration-300 group-hover:text-white" />

      {/* Text */}
      <span className="whitespace-nowrap hidden sm:inline">Complete Profile</span>
      <span className="whitespace-nowrap inline sm:hidden">Profile</span>

      {/* Progress Badge */}
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-400/30">
        <span className="text-xs font-semibold text-cyan-400">{progress}%</span>
      </div>
    </button>
  );
};
