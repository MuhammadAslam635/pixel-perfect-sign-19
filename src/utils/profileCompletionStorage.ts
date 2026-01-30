import {
  ProfileCompletionData,
  ProfileTaskId,
} from "@/types/profileCompletion.types";

const STORAGE_KEY_PREFIX = "profile_completion_";
const STORAGE_VERSION = 1;

/**
 * Get the storage key for a specific user
 */
const getStorageKey = (userId: string): string => {
  return `${STORAGE_KEY_PREFIX}${userId}`;
};

/**
 * Get profile completion data from localStorage
 * Returns null if not found or invalid
 */
export const getProfileCompletionData = (
  userId: string
): ProfileCompletionData | null => {
  try {
    const storageKey = getStorageKey(userId);
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      console.log(`[ProfileCompletion] No data found for user ${userId}`);
      return null;
    }

    const data: ProfileCompletionData = JSON.parse(stored);

    // Validate version
    if (data.version !== STORAGE_VERSION) {
      console.warn("[ProfileCompletion] Outdated data version, clearing...");
      clearProfileCompletionData(userId);
      return null;
    }

    // Validate userId matches
    if (data.userId !== userId) {
      console.warn("[ProfileCompletion] UserId mismatch, clearing...");
      clearProfileCompletionData(userId);
      return null;
    }

    // Add isPanelCollapsed if it doesn't exist (backward compatibility)
    if (data.isPanelCollapsed === undefined) {
      data.isPanelCollapsed = false;
      saveProfileCompletionData(data);
    }

    console.log(`[ProfileCompletion] Data loaded for user ${userId}`, data);
    return data;
  } catch (error) {
    console.error("[ProfileCompletion] Error reading from localStorage:", error);
    return null;
  }
};

/**
 * Initialize profile completion data for a new user
 */
export const initializeProfileCompletionData = (
  userId: string
): ProfileCompletionData => {
  const initialData: ProfileCompletionData = {
    version: STORAGE_VERSION,
    userId,
    tasks: {
      onboarding: false,
      knowledge_base: false,
      proposal: false,
      microsoft: false,
      facebook: false,
      google: false,
    },
    lastUpdated: Date.now(),
    firstLoginShown: false,
    isPanelCollapsed: false,
  };

  saveProfileCompletionData(initialData);
  return initialData;
};

/**
 * Save profile completion data to localStorage
 */
export const saveProfileCompletionData = (
  data: ProfileCompletionData
): void => {
  try {
    const storageKey = getStorageKey(data.userId);
    const updatedData = {
      ...data,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(storageKey, JSON.stringify(updatedData));

    console.log(`[ProfileCompletion] Data saved for user ${data.userId}`);

    // Dispatch storage event for cross-tab sync
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: storageKey,
        newValue: JSON.stringify(updatedData),
        storageArea: localStorage,
      })
    );
  } catch (error) {
    console.error(
      "[ProfileCompletion] Error saving to localStorage:",
      error
    );
  }
};

/**
 * Update a single task status
 */
export const updateTaskStatus = (
  userId: string,
  taskId: ProfileTaskId,
  completed: boolean
): ProfileCompletionData | null => {
  try {
    let data = getProfileCompletionData(userId);

    // Initialize if not exists
    if (!data) {
      data = initializeProfileCompletionData(userId);
    }

    // Update task status
    data.tasks[taskId] = completed;
    saveProfileCompletionData(data);

    // Dispatch custom event for components to listen
    window.dispatchEvent(
      new CustomEvent("profile_task_updated", {
        detail: { taskId, completed },
      })
    );

    return data;
  } catch (error) {
    console.error("[ProfileCompletion] Error updating task status:", error);
    return null;
  }
};

/**
 * Update multiple task statuses at once
 */
export const updateMultipleTaskStatuses = (
  userId: string,
  taskUpdates: Partial<Record<ProfileTaskId, boolean>>
): ProfileCompletionData | null => {
  try {
    let data = getProfileCompletionData(userId);

    // Initialize if not exists
    if (!data) {
      data = initializeProfileCompletionData(userId);
    }

    // Update all task statuses
    Object.entries(taskUpdates).forEach(([taskId, completed]) => {
      data!.tasks[taskId as ProfileTaskId] = completed;
    });

    saveProfileCompletionData(data);

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent("profile_task_updated", {
        detail: { taskUpdates },
      })
    );

    return data;
  } catch (error) {
    console.error(
      "[ProfileCompletion] Error updating multiple tasks:",
      error
    );
    return null;
  }
};

/**
 * Mark first login as shown
 */
export const markFirstLoginShown = (userId: string): void => {
  try {
    let data = getProfileCompletionData(userId);

    if (!data) {
      data = initializeProfileCompletionData(userId);
    }

    data.firstLoginShown = true;
    saveProfileCompletionData(data);
  } catch (error) {
    console.error("[ProfileCompletion] Error marking first login:", error);
  }
};

/**
 * Calculate completion progress (0-100)
 */
export const calculateProgress = (
  data: ProfileCompletionData | null
): number => {
  if (!data) return 0;

  const taskIds: ProfileTaskId[] = [
    "onboarding",
    "knowledge_base",
    "proposal",
    "microsoft",
    "facebook",
    "google",
  ];

  const completedCount = taskIds.filter((taskId) => data.tasks[taskId]).length;
  const totalCount = taskIds.length;

  return Math.round((completedCount / totalCount) * 100);
};

/**
 * Check if profile is complete
 */
export const isProfileComplete = (
  data: ProfileCompletionData | null
): boolean => {
  return calculateProgress(data) === 100;
};

/**
 * Clear profile completion data from localStorage
 */
export const clearProfileCompletionData = (userId?: string): void => {
  try {
    if (userId) {
      const storageKey = getStorageKey(userId);
      localStorage.removeItem(storageKey);
    } else {
      // Clear all profile completion data (if no userId provided)
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent("profile_completion_reset"));

    console.log("[ProfileCompletion] Data cleared");
  } catch (error) {
    console.error("[ProfileCompletion] Error clearing data:", error);
  }
};

/**
 * Check if user should see the profile panel on first login
 */
export const shouldShowOnFirstLogin = (
  userId: string
): boolean => {
  const data = getProfileCompletionData(userId);

  // Show if:
  // 1. No data exists (first time), OR
  // 2. firstLoginShown is false and profile is not complete
  if (!data) return true;

  return !data.firstLoginShown && !isProfileComplete(data);
};

/**
 * Check if user should see the header button
 */
export const shouldShowHeaderButton = (
  userId: string
): boolean => {
  const data = getProfileCompletionData(userId);

  // Show button if profile is not complete
  return !isProfileComplete(data);
};

/**
 * Update panel collapsed state
 */
export const updatePanelCollapsedState = (
  userId: string,
  isCollapsed: boolean
): void => {
  try {
    let data = getProfileCompletionData(userId);
    if (!data) {
      data = initializeProfileCompletionData(userId);
    }
    data.isPanelCollapsed = isCollapsed;
    saveProfileCompletionData(data);
  } catch (error) {
    console.error("[ProfileCompletion] Error updating collapse state:", error);
  }
};

/**
 * Get panel collapsed state
 */
export const getPanelCollapsedState = (userId: string): boolean => {
  const data = getProfileCompletionData(userId);
  return data?.isPanelCollapsed || false;
};
