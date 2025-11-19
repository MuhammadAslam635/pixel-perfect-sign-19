import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import {
  hasPermission,
  hasAction,
  getAccessibleModules,
  getModuleActions,
  isSystemAdmin,
  isCompanyAdmin,
  canAccessModule,
} from "@/utils/rbacHelpers";
import { PermissionAction, Role } from "@/types/rbac.types";

/**
 * Custom hook for checking user permissions
 */
export const usePermissions = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Get user's role (new RBAC or legacy)
  const userRole: Role | null = user?.roleId && typeof user.roleId === "object" ? user.roleId : null;
  const legacyRole: string | null = user?.role && typeof user.role === "string" ? user.role : null;

  /**
   * Check if user has permission to access a module with specific actions
   */
  const checkPermission = (
    moduleName: string,
    requiredActions: PermissionAction[] = ["view"],
    requireAll: boolean = false
  ): boolean => {
    if (!user) return false;

    // System Admin has all permissions
    if (legacyRole === "Admin" || isSystemAdmin(userRole)) {
      return true;
    }

    // New RBAC
    if (userRole) {
      return hasPermission(userRole, moduleName, requiredActions, requireAll);
    }

    // Legacy fallback
    return canAccessModule(user, moduleName, requiredActions);
  };

  /**
   * Check if user has a specific action on a module
   */
  const checkAction = (moduleName: string, action: PermissionAction): boolean => {
    if (!user) return false;

    // System Admin has all permissions
    if (legacyRole === "Admin" || isSystemAdmin(userRole)) {
      return true;
    }

    if (userRole) {
      return hasAction(userRole, moduleName, action);
    }

    return canAccessModule(user, moduleName, [action]);
  };

  /**
   * Check if user can view a module
   */
  const canView = (moduleName: string): boolean => {
    return checkAction(moduleName, "view");
  };

  /**
   * Check if user can create in a module
   */
  const canCreate = (moduleName: string): boolean => {
    return checkAction(moduleName, "create");
  };

  /**
   * Check if user can edit in a module
   */
  const canEdit = (moduleName: string): boolean => {
    return checkAction(moduleName, "edit");
  };

  /**
   * Check if user can delete in a module
   */
  const canDelete = (moduleName: string): boolean => {
    return checkAction(moduleName, "delete");
  };

  /**
   * Check if user is System Admin
   */
  const isSysAdmin = (): boolean => {
    return legacyRole === "Admin" || isSystemAdmin(userRole);
  };

  /**
   * Check if user is Company Admin or higher
   */
  const isCompAdmin = (): boolean => {
    return legacyRole === "Admin" || isCompanyAdmin(userRole || legacyRole);
  };

  /**
   * Get all accessible modules
   */
  const accessibleModules = userRole ? getAccessibleModules(userRole) : [];

  /**
   * Get all actions for a specific module
   */
  const getActions = (moduleName: string): PermissionAction[] => {
    if (!user) return [];

    if (legacyRole === "Admin" || isSystemAdmin(userRole)) {
      return ["view", "create", "edit", "delete"];
    }

    if (userRole) {
      return getModuleActions(userRole, moduleName);
    }

    return [];
  };

  return {
    // Check functions
    checkPermission,
    checkAction,
    canView,
    canCreate,
    canEdit,
    canDelete,
    // Role checks
    isSysAdmin,
    isCompAdmin,

    // Module info
    accessibleModules,
    getActions,

    // User info
    userRole,
    legacyRole,
    user,
  };
};

export default usePermissions;
