import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { isAuthenticated, getUserData } from "@/utils/authHelpers";
import { PermissionAction } from "@/types/rbac.types";
import { usePermissions } from "@/hooks/usePermissions";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Legacy role-based access
  moduleName?: string; // New RBAC: module name
  requiredActions?: PermissionAction[]; // New RBAC: required actions
  requireAllActions?: boolean; // New RBAC: require all actions or just one
  skipOnboardingCheck?: boolean; // Skip onboarding redirect for onboarding page itself
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  moduleName,
  requiredActions = ["view"],
  requireAllActions = false,
  skipOnboardingCheck = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated: isAuthenticatedRedux, user } = useSelector(
    (state: RootState) => state.auth
  );
  const { checkPermission, permissionsReady, isSysAdmin } = usePermissions();

  // Check both Redux state and localStorage
  const isAuth = isAuthenticatedRedux || isAuthenticated();

  const sessionUser = user || getUserData();

  // Check onboarding status for Company/CompanyAdmin users
  const { requiresOnboarding, loading: onboardingLoading } = useOnboardingStatus(
    sessionUser?.role,
    isAuth && !skipOnboardingCheck
  );

  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  // Check if user needs to change password (unless they're already on the change-password page)
  if (
    sessionUser?.requiresPasswordChange &&
    window.location.pathname !== "/change-password"
  ) {
    return <Navigate to="/change-password" replace />;
  }

  // Check if user needs to complete onboarding (Company/CompanyAdmin roles only)
  // Skip if already on onboarding page or if skipOnboardingCheck is true
  if (!skipOnboardingCheck && window.location.pathname !== '/onboarding') {
    if (onboardingLoading && (sessionUser?.role === 'Company' || sessionUser?.role === 'CompanyAdmin')) {
      return (
        <div className="flex min-h-screen items-center justify-center text-white/60">
          Checking onboarding status...
        </div>
      );
    }

    if (requiresOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
  }
  // Admin users can only access admin routes
  if (
    sessionUser?.role === "Admin" &&
    !window.location.pathname.startsWith("/admin/")
  ) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // New RBAC check - takes precedence
  if (moduleName) {
    if (!permissionsReady && !isSysAdmin()) {
      return (
        <div className="flex min-h-screen items-center justify-center text-white/60">
          Checking permissions...
        </div>
      );
    }

    const hasAccess = checkPermission(
      moduleName,
      requiredActions,
      requireAllActions
    );

    if (!hasAccess) {
      // User doesn't have permission to access this module
      const userRole = sessionUser?.role;
      const dashboardPath =
        userRole === "Admin" ? "/admin/dashboard" : "/dashboard";
      return <Navigate to={dashboardPath} replace />;
    }
  }
  // Legacy role-based check (for backward compatibility)
  else if (allowedRoles && allowedRoles.length > 0) {
    const userRole = sessionUser?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on user role
      const dashboardPath =
        userRole === "Admin" ? "/admin/dashboard" : "/dashboard";
      return <Navigate to={dashboardPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

