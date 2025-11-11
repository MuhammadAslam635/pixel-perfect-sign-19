import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getUserData } from "@/utils/authHelpers";
import { loginSuccess } from "@/store/slices/authSlice";

/**
 * AuthProvider component to restore authentication state on app load
 * This component checks localStorage for stored auth data and
 * restores it to Redux state if valid
 */
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Restore auth state from localStorage on app mount
    const restoreAuthState = () => {
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
