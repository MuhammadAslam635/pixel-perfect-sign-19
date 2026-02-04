import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { isAuthenticated, getUserData } from "@/utils/authHelpers";
import { PermissionAction } from "@/types/rbac.types";
import { usePermissions } from "@/hooks/usePermissions";
import { isRestrictedModule } from "@/utils/restrictedModules";
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
  const { requiresOnboarding, loading: onboardingLoading } =
    useOnboardingStatus(sessionUser?.role, isAuth && !skipOnboardingCheck);

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
  // Only redirect to onboarding once per session - after that, let users navigate freely
  // They'll be reminded via the CompleteProfilePanel instead
  if (!skipOnboardingCheck && window.location.pathname !== "/onboarding") {
    // Check if we've already shown the onboarding redirect in this session
    const hasRedirectedToOnboarding =
      sessionStorage.getItem("has_redirected_to_onboarding") === "true";

    if (
      onboardingLoading &&
      (sessionUser?.role === "Company" || sessionUser?.role === "CompanyAdmin")
    ) {
      return (
        <div className="flex min-h-screen items-center justify-center text-white/60">
          Checking onboarding status...
        </div>
      );
    }

    // Only redirect if we haven't already redirected in this session
    if (requiresOnboarding && !hasRedirectedToOnboarding) {
      // Mark that we've redirected in this session
      sessionStorage.setItem("has_redirected_to_onboarding", "true");
      return <Navigate to="/onboarding" replace />;
    }
  }
  // Admin users can only access admin routes (except feedback support chat so they can respond)
  if (
    sessionUser?.role === "Admin" &&
    !window.location.pathname.startsWith("/admin/")
  ) {
    const isFeedbackSupportChat = /^\/feedback\/[^/]+\/chat$/.test(
      window.location.pathname
    );
    if (!isFeedbackSupportChat) {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  // New RBAC check - takes precedence
  if (moduleName) {
    // CRITICAL: Fail fast for restricted modules if permissions aren't ready but we know it's restricted
    // Note: checkPermission inside usePermissions hook should use the updated logic from rbacHelpers
    // But we add a double-check here for safety
    if (isRestrictedModule(moduleName) && permissionsReady) {
      const hasAccess = checkPermission(
        moduleName,
        requiredActions,
        requireAllActions
      );
      if (!hasAccess) {
        const userRole = sessionUser?.role;
        const dashboardPath =
          userRole === "Admin" ? "/admin/dashboard" : "/dashboard";
        // Optional: Show toast here? "Access Denied: Restricted Module"
        return <Navigate to={dashboardPath} replace />;
      }
    }

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
