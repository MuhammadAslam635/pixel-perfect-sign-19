import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { isAuthenticated } from "@/utils/authHelpers";

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * PublicRoute component - Redirects authenticated users to dashboard
 * Use this for login, signup, and other auth pages that should only be accessible to non-logged-in users
 */
const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated: isAuthenticatedRedux } = useSelector(
    (state: RootState) => state.auth
  );

  // Check both Redux state and localStorage
  const isAuth = isAuthenticatedRedux || isAuthenticated();

  // If user is already authenticated, redirect to dashboard
  if (isAuth) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
