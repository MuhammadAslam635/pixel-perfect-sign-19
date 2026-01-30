import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getUserData } from "@/utils/authHelpers";
import { loginSuccess } from "@/store/slices/authSlice";
import { fetchUserPermissions } from "@/store/slices/permissionsSlice";
import { AppDispatch } from "@/store/store";
import {
  shouldShowOnFirstLogin,
  markFirstLoginShown,
} from "@/utils/profileCompletionStorage";

/**
 * AuthProvider component to restore authentication state on app load
 * This component checks localStorage for stored auth data and
 * restores it to Redux state if valid
 */
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Restore auth state from localStorage on app mount
    const restoreAuthState = async () => {
      try {
        const userData = getUserData();

        // If we have stored user data and token, restore the auth state
        if (userData && userData.token) {
          dispatch(
            loginSuccess({
              email: userData.email,
              name: userData.company || userData.email,
              _id: userData._id,
              company: userData.company,
              role: userData.role,
              ...userData,
            })
          );
          dispatch(fetchUserPermissions());

          // Check if profile completion panel should be shown
          // Only for Company and CompanyAdmin roles
          const userRole = userData.role;
          const isCompanyRole =
            userRole === "Company" || userRole === "CompanyAdmin";

          if (isCompanyRole && userData._id) {
            // Small delay to ensure UI is ready
            setTimeout(() => {
              // Check if user skipped onboarding
              const onboardingSkipped = sessionStorage.getItem("onboarding_skipped");
              
              // Show panel if:
              // 1. First time login (and not coming from skip - Dashboard handles skip)
              if (shouldShowOnFirstLogin(userData._id) && onboardingSkipped !== "true") {
                // Dispatch event to show the panel
                window.dispatchEvent(
                  new CustomEvent("show_complete_profile_panel")
                );
                // Mark that we've shown it on first login
                markFirstLoginShown(userData._id);
              }
              // Note: onboarding_skipped flag is kept active until user closes panel
              // This allows user to navigate freely while completing tasks
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Failed to restore auth state:", error);
      }
    };

    restoreAuthState();
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthProvider;
