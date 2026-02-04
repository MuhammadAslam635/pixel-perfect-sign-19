import { LucideIcon } from "lucide-react";

/**
 * Task IDs for profile completion
 */
export type ProfileTaskId =
  | "onboarding"
  | "knowledge_base"
  | "proposal"
  | "microsoft"
  | "facebook"
  | "google";

/**
 * Profile completion data stored in localStorage
 */
export interface ProfileCompletionData {
  version: 1;
  userId: string;
  tasks: Record<ProfileTaskId, boolean>;
  lastUpdated: number;
  firstLoginShown: boolean; // Track if auto-shown on first login
  isPanelCollapsed: boolean; // Track if panel is collapsed
}

/**
 * Individual task configuration
 */
export interface ProfileTask {
  id: ProfileTaskId;
  title: string;
  description: string;
  route: string;
  icon: LucideIcon;
  checkCompletion: () => Promise<boolean>;
}

/**
 * Hook return type for useProfileCompletion
 */
export interface UseProfileCompletionReturn {
  completionData: ProfileCompletionData | null;
  progress: number;
  isComplete: boolean;
  updateTaskStatus: (taskId: ProfileTaskId, completed: boolean) => void;
  checkAllTasksStatus: () => Promise<void>;
  resetCompletion: () => void;
  getTaskStatus: (taskId: ProfileTaskId) => boolean;
  isLoading: boolean;
}

/**
 * Events dispatched for profile completion updates
 */
export type ProfileCompletionEvent =
  | "show_complete_profile_panel"
  | "toggle_complete_profile_panel"
  | "hide_complete_profile_panel"
  | "profile_task_updated"
  | "profile_completion_reset";
