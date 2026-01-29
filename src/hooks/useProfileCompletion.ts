import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  ProfileCompletionData,
  ProfileTaskId,
  UseProfileCompletionReturn,
} from "@/types/profileCompletion.types";
import {
  getProfileCompletionData,
  initializeProfileCompletionData,
  updateTaskStatus as updateTaskStatusStorage,
  updateMultipleTaskStatuses,
  calculateProgress,
  isProfileComplete,
  clearProfileCompletionData,
} from "@/utils/profileCompletionStorage";
import { checkAllTaskStatuses } from "@/services/profileCompletion.service";

/**
 * Custom hook for managing profile completion state
 * Integrates with localStorage and provides real-time updates
 */
export const useProfileCompletion = (): UseProfileCompletionReturn => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userId = currentUser?._id || "";
  
  // Initialize with data from localStorage immediately (synchronous)
  const [completionData, setCompletionData] =
    useState<ProfileCompletionData | null>(() => {
      if (userId) {
        const data = getProfileCompletionData(userId);
        console.log("[useProfileCompletion] Initial data load:", data);
        return data;
      }
      return null;
    });
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load completion data from localStorage
   */
  const loadCompletionData = useCallback(() => {
    if (!userId) return;

    const data = getProfileCompletionData(userId);
    if (data) {
      console.log("[useProfileCompletion] Reloaded data:", data);
      setCompletionData(data);
    }
  }, [userId]);

  /**
   * Update a single task status
   */
  const updateTaskStatus = useCallback(
    (taskId: ProfileTaskId, completed: boolean) => {
      if (!userId) return;

      const updatedData = updateTaskStatusStorage(userId, taskId, completed);
      if (updatedData) {
        setCompletionData(updatedData);
      }
    },
    [userId]
  );

  /**
   * Check all task statuses against APIs and update localStorage
   */
  const checkAllTasksStatus = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const statuses = await checkAllTaskStatuses();

      console.log("[useProfileCompletion] API statuses:", statuses);

      // Get existing data or initialize if needed
      let currentData = getProfileCompletionData(userId);
      if (!currentData) {
        console.log("[useProfileCompletion] Initializing data with API statuses");
        currentData = initializeProfileCompletionData(userId);
      }

      // Update localStorage with all statuses
      const updatedData = updateMultipleTaskStatuses(
        userId,
        statuses as Partial<Record<ProfileTaskId, boolean>>
      );

      if (updatedData) {
        console.log("[useProfileCompletion] Updated data:", updatedData);
        setCompletionData(updatedData);
      }
    } catch (error) {
      console.error("[useProfileCompletion] Error checking statuses:", error);
      // If error and no data exists, initialize with empty
      if (!getProfileCompletionData(userId)) {
        const initialData = initializeProfileCompletionData(userId);
        setCompletionData(initialData);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Reset all completion data
   */
  const resetCompletion = useCallback(() => {
    clearProfileCompletionData();
    if (userId) {
      const newData = initializeProfileCompletionData(userId);
      setCompletionData(newData);
    }
  }, [userId]);

  /**
   * Get status of a specific task
   */
  const getTaskStatus = useCallback(
    (taskId: ProfileTaskId): boolean => {
      return completionData?.tasks[taskId] || false;
    },
    [completionData]
  );

  // Check API statuses after mount (but data is already loaded from localStorage)
  useEffect(() => {
    if (userId && completionData) {
      // Data already loaded synchronously, now check API in background
      const checkTimer = setTimeout(() => {
        console.log("[useProfileCompletion] Checking API statuses in background");
        checkAllTasksStatus();
      }, 2000);
      
      return () => clearTimeout(checkTimer);
    } else if (userId && !completionData) {
      // No data exists, check APIs immediately to initialize
      console.log("[useProfileCompletion] No data found, checking APIs now");
      checkAllTasksStatus();
    }
  }, [userId]);

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Check if the changed key is for the current user
      if (e.key && e.key.startsWith("profile_completion_") && userId) {
        const storageKey = `profile_completion_${userId}`;
        if (e.key === storageKey) {
          loadCompletionData();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadCompletionData, userId]);

  // Listen for custom profile task update events
  useEffect(() => {
    const handleTaskUpdate = () => {
      loadCompletionData();
    };

    window.addEventListener("profile_task_updated", handleTaskUpdate);
    return () =>
      window.removeEventListener("profile_task_updated", handleTaskUpdate);
  }, [loadCompletionData]);

  // Calculate progress
  const progress = calculateProgress(completionData);
  const isComplete = isProfileComplete(completionData);

  return {
    completionData,
    progress,
    isComplete,
    updateTaskStatus,
    checkAllTasksStatus,
    resetCompletion,
    getTaskStatus,
    isLoading,
  };
};
