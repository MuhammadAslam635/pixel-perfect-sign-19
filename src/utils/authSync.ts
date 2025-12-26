import { authService } from "@/services/auth.service";
import { getUserData, setAuthToken } from "@/utils/authHelpers";

/**
 * Fetch the canonical user from the server (/me) and sync localStorage.
 * Returns the merged user object (including existing token) or null on failure.
 */
export const fetchAndSyncUser = async (): Promise<any | null> => {
  try {
    const existing = getUserData();
    if (!existing?.token) return null;
    const response = await authService.getMe();
    if (response?.success && response.data) {
      const existing = getUserData();
      const token = existing?.token;
      const updatedUser = token ? { ...response.data, token } : response.data;
      try {
        setAuthToken(token ?? "", updatedUser);
      } catch (e) {
        console.error("Error setting auth token during sync:", e);
      }
      return updatedUser;
    }
  } catch (error) {
    console.error("Failed to fetch /me for sync:", error);
  }
  return null;
};
