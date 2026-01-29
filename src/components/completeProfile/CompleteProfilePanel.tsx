import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  X,
  CheckCircle2,
  FileText,
  FileUp,
  Building2,
  Facebook,
  Mail,
  Circle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RootState } from "@/store/store";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { ProfileTask, ProfileTaskId } from "@/types/profileCompletion.types";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  updatePanelCollapsedState,
  getPanelCollapsedState,
} from "@/utils/profileCompletionStorage";

// Task configuration with routes and icons
const PROFILE_TASKS: ProfileTask[] = [
  {
    id: "onboarding",
    title: "Complete Onboarding",
    description: "Set up your business information",
    route: "/onboarding",
    icon: CheckCircle2,
    checkCompletion: async () => false, // Handled by service
  },
  {
    id: "knowledge_base",
    title: "Upload Knowledge Base",
    description: "Add your company documents",
    route: "/company-knowledge",
    icon: FileText,
    checkCompletion: async () => false,
  },
  {
    id: "proposal",
    title: "Proposal Template",
    description: "Add proposal templates",
    route: "/company-knowledge?tab=proposal-examples",
    icon: FileUp,
    checkCompletion: async () => false,
  },
  {
    id: "microsoft",
    title: "Connect Microsoft Account",
    description: "Microsoft integration",
    route: "/settings?tab=integrations",
    icon: Building2,
    checkCompletion: async () => false,
  },
  {
    id: "facebook",
    title: "Connect Facebook",
    description: "Facebook integration",
    route: "/settings?tab=integrations",
    icon: Facebook,
    checkCompletion: async () => false,
  },
  {
    id: "google",
    title: "Connect Google",
    description: "Google integration",
    route: "/settings?tab=integrations",
    icon: Mail,
    checkCompletion: async () => false,
  },
];

export const CompleteProfilePanel = () => {
  const navigate = useNavigate();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userId = currentUser?._id || "";
  
  // Load collapsed state from localStorage
  // If panel was collapsed, restore it as visible
  // But if coming from skip onboarding, open expanded
  const checkIfSkipped = () => {
    return sessionStorage.getItem("onboarding_skipped") === "true";
  };
  
  const initialCollapsedState = checkIfSkipped() ? false : (userId ? getPanelCollapsedState(userId) : false);
  const [isVisible, setIsVisible] = useState(initialCollapsedState);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsedState);
  const [isCheckingStatuses, setIsCheckingStatuses] = useState(false);

  const {
    progress,
    isComplete,
    getTaskStatus,
    checkAllTasksStatus,
    isLoading,
  } = useProfileCompletion();

  // Get user's role name
  const getUserRoleName = (): string | null => {
    if (!currentUser) return null;

    // Check populated roleId (new RBAC system)
    if (currentUser.roleId && typeof currentUser.roleId === "object") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (currentUser.roleId as any).name;
    }

    // Fallback to legacy role string
    if (currentUser.role && typeof currentUser.role === "string") {
      return currentUser.role;
    }

    return null;
  };

  const userRoleName = getUserRoleName();

  // Check if user should see this panel (Company or CompanyAdmin only)
  const shouldShowPanel =
    userRoleName === "Company" || userRoleName === "CompanyAdmin";

  // Listen for show/toggle panel events
  useEffect(() => {
    const handleShowPanel = () => {
      if (shouldShowPanel && !isComplete) {
        setIsVisible(true);
        // If coming from skip, open expanded
        const isFromSkip = sessionStorage.getItem("onboarding_skipped") === "true";
        if (isFromSkip) {
          setIsCollapsed(false);
          // DON'T clear the skip flag yet - keep it so user can navigate freely
          // It will be cleared when user closes panel or on next login
          // Save expanded state
          if (userId) {
            updatePanelCollapsedState(userId, false);
          }
        }
        // Don't check statuses immediately to prevent blink during animation
        // Status is already loaded from hook
      }
    };

    const handleTogglePanel = () => {
      if (shouldShowPanel && !isComplete) {
        setIsVisible((prev) => !prev);
        // Don't check statuses immediately to prevent blink during animation
      }
    };

    const handleHidePanel = () => {
      setIsVisible(false);
    };

    window.addEventListener("show_complete_profile_panel", handleShowPanel);
    window.addEventListener("toggle_complete_profile_panel", handleTogglePanel);
    window.addEventListener("hide_complete_profile_panel", handleHidePanel);

    return () => {
      window.removeEventListener(
        "show_complete_profile_panel",
        handleShowPanel
      );
      window.removeEventListener(
        "toggle_complete_profile_panel",
        handleTogglePanel
      );
      window.removeEventListener(
        "hide_complete_profile_panel",
        handleHidePanel
      );
    };
  }, [shouldShowPanel, isComplete, checkAllTasksStatus, userId]);

  // Don't check statuses immediately when panel opens to prevent blink
  // Status is already loaded from hook and will be checked on events only
  // This ensures smooth animation without content shift

  // Re-check statuses when page becomes visible (user returns from another tab/page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isVisible && !isCheckingStatuses) {
        setIsCheckingStatuses(true);
        checkAllTasksStatus().finally(() => {
          setIsCheckingStatuses(false);
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isVisible, isCheckingStatuses, checkAllTasksStatus]);

  // Listen for integration connection/disconnection and file upload/delete events
  useEffect(() => {
    const handleTaskUpdate = (eventName: string) => () => {
      console.log(`[CompleteProfilePanel] ⚡ ${eventName} event → Refreshing status...`);
      checkAllTasksStatus();
    };

    // All events that should trigger a status refresh
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

    // Add listeners for all events
    const handlers = events.map((event) => {
      const handler = handleTaskUpdate(event);
      window.addEventListener(event, handler);
      return { event, handler };
    });

    return () => {
      handlers.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler);
      });
    };
  }, [checkAllTasksStatus]);

  // Auto-hide when complete, but allow reopening if incomplete again
  useEffect(() => {
    if (isComplete && isVisible) {
      console.log("[CompleteProfilePanel] 🎉 Profile complete! Auto-hiding panel...");
      toast.success("Profile setup complete! 🎉");
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    }
  }, [isComplete, isVisible]);

  // Only show if user should see panel AND not complete
  // This allows panel to reappear if user uncompletes tasks later
  if (!shouldShowPanel) {
    return null;
  }

  // If complete and not visible, don't render
  if (isComplete && !isVisible) {
    return null;
  }

  const handleTaskClick = (task: ProfileTask) => {
    // Don't navigate if task is already completed
    if (getTaskStatus(task.id)) {
      console.log(`[CompleteProfile] Task ${task.id} already completed, skipping navigation`);
      return;
    }
    
    console.log(`[CompleteProfile] Navigating to task: ${task.id}, route: ${task.route}`);
    navigate(task.route);
    // Collapse panel when task is clicked (don't close completely)
    setIsCollapsed(true);
    if (userId) {
      updatePanelCollapsedState(userId, true);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setIsCollapsed(false); // Reset collapse state when closing
    // Clear skip flag when user explicitly closes panel
    sessionStorage.removeItem("onboarding_skipped");
    // Save collapse state
    if (userId) {
      updatePanelCollapsedState(userId, false);
    }
  };

  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    // When collapsing, ensure panel stays visible
    if (newCollapsedState) {
      setIsVisible(true);
    }
    // Save collapse state to localStorage
    if (userId) {
      updatePanelCollapsedState(userId, newCollapsedState);
    }
  };

  // Get incomplete tasks
  const incompleteTasks = PROFILE_TASKS.filter(
    (task) => !getTaskStatus(task.id)
  );

  return (
    <>
      {/* Backdrop - Only show when expanded */}
      {!isCollapsed && (
        <div
          className={cn(
            "fixed inset-0 bg-black/20 backdrop-blur-sm z-[998] transition-opacity duration-500 ease-in-out",
            isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={handleClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-5 right-5 z-[999] transition-all duration-500 ease-in-out",
          "md:bottom-8 md:right-8",
          "will-change-transform",
          isVisible
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-[calc(100%+40px)] opacity-0 scale-95",
          isCollapsed
            ? "w-[280px]"
            : "w-[400px] max-w-[calc(100vw-40px)]"
        )}
      >
        <div
          className={cn(
            "bg-[rgba(15,15,20,0.95)] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl",
            "overflow-hidden flex flex-col transition-all duration-500 ease-in-out",
            "will-change-[max-height]",
            isCollapsed ? "max-h-[140px]" : "max-h-[calc(100vh-100px)]"
          )}
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-1">
                  Complete Profile
                </h3>
                {!isCollapsed && (
                  <p className="text-sm text-white/60">
                    {incompleteTasks.length === 0
                      ? "All tasks completed!"
                      : `${incompleteTasks.length} ${
                          incompleteTasks.length === 1 ? "task" : "tasks"
                        } remaining`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleCollapse}
                  className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-white/70">
                  Progress
                </span>
                <span className="text-xs font-semibold text-cyan-400">
                  {progress}%
                </span>
              </div>
              <Progress
                value={progress}
                className="h-2 bg-white/10"
                style={
                  {
                    "--progress-background":
                      "linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)",
                  } as React.CSSProperties
                }
              />
            </div>
          </div>

          {/* Collapsed State - Show quick summary */}
          {isCollapsed && (
            <div className="px-6 py-3 text-center">
              <p className="text-sm text-white/60">
                {incompleteTasks.length === 0 ? (
                  <span className="text-green-400">All tasks completed! 🎉</span>
                ) : (
                  <>
                    {incompleteTasks.length}{" "}
                    {incompleteTasks.length === 1 ? "task" : "tasks"} remaining
                  </>
                )}
              </p>
            </div>
          )}

          {/* Task List - Hidden when collapsed */}
          {!isCollapsed && (
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                <span className="ml-2 text-sm text-white/60">
                  Checking status...
                </span>
              </div>
            )}

            {!isLoading && (
              <div className="space-y-2">
                {PROFILE_TASKS.map((task) => {
                  const isCompleted = getTaskStatus(task.id);
                  const Icon = task.icon;

                  return (
                    <button
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      disabled={isCompleted}
                      className={cn(
                        "w-full p-4 rounded-xl border transition-all duration-200",
                        "flex items-start gap-3 text-left group",
                        isCompleted
                          ? "bg-green-500/10 border-green-500/30 opacity-50 cursor-not-allowed"
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-400/50 hover:scale-[1.02] cursor-pointer"
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                          isCompleted
                            ? "bg-green-500/20 text-green-400"
                            : "bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white mb-0.5">
                          {task.title}
                        </h4>
                        <p className="text-xs text-white/60">
                          {task.description}
                        </p>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <div className="w-5 h-5 rounded-full bg-green-500/30 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                          </div>
                        ) : (
                          <Circle className="h-5 w-5 text-white/30" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          )}

          {/* Footer - Hidden when collapsed */}
          {!isCollapsed && (
            <div className="p-4 border-t border-white/10 bg-white/5">
              <p className="text-xs text-center text-white/50">
                Complete these tasks to get the most out of EmpaTech OS
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
