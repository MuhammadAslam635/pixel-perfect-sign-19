// Helper functions for authentication token management

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
 */
export const clearAuthData = (): void => {
  localStorage.removeItem("user");
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
