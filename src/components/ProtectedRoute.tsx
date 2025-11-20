import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { isAuthenticated, getUserData } from "@/utils/authHelpers";
import { PermissionAction } from "@/types/rbac.types";
import { usePermissions } from "@/hooks/usePermissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Legacy role-based access
  moduleName?: string; // New RBAC: module name
  requiredActions?: PermissionAction[]; // New RBAC: required actions
  requireAllActions?: boolean; // New RBAC: require all actions or just one
}

const ProtectedRoute = ({
  children,
  allowedRoles,
  moduleName,
  requiredActions = ["view"],
  requireAllActions = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated: isAuthenticatedRedux, user } = useSelector(
    (state: RootState) => state.auth
  );
  const { checkPermission, permissionsReady, isSysAdmin } = usePermissions();

  // Check both Redux state and localStorage
  const isAuth = isAuthenticatedRedux || isAuthenticated();

  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  const sessionUser = user || getUserData();

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
      return <Navigate to="/dashboard" replace />;
    }
  }
  // Legacy role-based check (for backward compatibility)
  else if (allowedRoles && allowedRoles.length > 0) {
    const userRole = sessionUser?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
