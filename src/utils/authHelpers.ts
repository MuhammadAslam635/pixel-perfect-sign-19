// Helper functions for authentication token management
import { clearOnboardingCache } from "./onboardingCache";

/**
 * Get the authentication token from localStorage
 * @returns The JWT token string or null if not found
 */
export const getAuthToken = (): string | null => {
  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      return parsedUser.token || null;
    }
  } catch (error) {
    console.error("Error getting auth token:", error);
  }
  return null;
};

/**
 * Set the authentication token in localStorage
 * @param token - The JWT token string
 * @param userData - Optional additional user data to store
 */
export const setAuthToken = (token: string, userData?: any): void => {
  try {
    const user = userData || { token };
    localStorage.setItem("user", JSON.stringify(user));
  } catch (error) {
    console.error("Error setting auth token:", error);
  }
};

/**
 * Clear all authentication data from localStorage
 * Also clears chat-related localStorage to prevent showing chats from previous users
 */
/**
 * Clear all authentication data from localStorage
 * Also clears chat-related localStorage to prevent showing chats from previous users
 * NOW: Performing a deep clean of all storage to ensure no data leakage.
 */
export const clearAuthData = (): void => {
  try {
    // 1. Clear Local Storage
    // We want to be aggressive here. If there are keys that MUST persist across users (like theme preference debugging?),
    // we should whitelist them. For now, wiping clean is safer for data privacy.
    localStorage.clear();

    // 2. Clear Session Storage
    sessionStorage.clear();

    // 3. Clear any specific caches if needed (though localStorage.clear() covers most)
    clearOnboardingCache();
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

/**
 * Get the complete user data from localStorage
 * @returns The parsed user object or null if not found
 */
export const getUserData = (): any | null => {
  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (error) {
    console.error("Error getting user data:", error);
  }
  return null;
};

/**
 * Check if user is authenticated (has valid token)
 * @returns True if user has a token, false otherwise
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return token !== null && token !== "";
};
