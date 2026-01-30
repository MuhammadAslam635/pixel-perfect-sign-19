import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { isSystemAdmin, isCompanyAdmin } from "@/utils/rbacHelpers";
import { PermissionAction, Role } from "@/types/rbac.types";
import { fetchUserPermissions } from "@/store/slices/permissionsSlice";

/**
 * Custom hook for checking user permissions
 */
export const usePermissions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const permissionsState = useSelector((state: RootState) => state.permissions);

  // Get user's role (prioritize new RBAC roleId over legacy role)
  // PRIORITY 1: Extract roleId (new RBAC system) if it's a populated Role object
  const userRole: Role | null =
    user?.roleId && typeof user.roleId === "object" ? user.roleId : null;
  // PRIORITY 2: Extract legacy role string for backward compatibility
  const legacyRole: string | null =
    user?.role && typeof user.role === "string" ? user.role : null;

  useEffect(() => {
    if (user && !permissionsState.initialized && !permissionsState.loading) {
      dispatch(fetchUserPermissions());
    }
  }, [dispatch, user, permissionsState.initialized, permissionsState.loading]);

  const checkPermission = useCallback(
    (
      moduleName: string,
      requiredActions: PermissionAction[] = ["view"],
      requireAll: boolean = false
    ): boolean => {
      if (!user) return false;

      // Note: Admin role is intentionally kept as legacy system role (not roleId-based)
      // System Admin has all permissions
      if (legacyRole === "Admin" || isSystemAdmin(userRole)) {
        return true;
      }

      // Global modules accessible to all authenticated users
      if (["settings", "feedback"].includes(moduleName)) {
         return true;
      }

      const moduleAccess = permissionsState.modulesByName[moduleName];
      if (!moduleAccess) {
        return false;
      }

      const actions = moduleAccess.actions || [];

      return requireAll
        ? requiredActions.every((action) => actions.includes(action))
        : requiredActions.some((action) => actions.includes(action));
    },
    [user, legacyRole, userRole, permissionsState.modulesByName]
  );

  /**
   * Check if user has a specific action on a module
   */
  const checkAction = useCallback(
    (moduleName: string, action: PermissionAction): boolean => {
      return checkPermission(moduleName, [action]);
    },
    [checkPermission]
  );

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
   * Prioritizes roleId over legacy role
   */
  const isCompAdmin = (): boolean => {
    // userRole || legacyRole prioritizes populated roleId, falls back to legacy role
    return legacyRole === "Admin" || isCompanyAdmin(userRole || legacyRole);
  };

  /**
   * Get all accessible modules
   */
  const accessibleModules = useMemo(
    () => Object.values(permissionsState.modulesByName),
    [permissionsState.modulesByName]
  );

  /**
   * Get all actions for a specific module
   */
  const getActions = (moduleName: string): PermissionAction[] => {
    if (!user) return [];

    if (legacyRole === "Admin" || isSystemAdmin(userRole)) {
      return ["view", "create", "edit", "delete"];
    }

    // Global modules accessible to all authenticated users
    if (["settings", "feedback"].includes(moduleName)) {
      return ["view", "create", "edit", "delete"];
    }

    return permissionsState.modulesByName[moduleName]?.actions || [];
  };

  const refreshPermissions = useCallback(() => {
    dispatch(fetchUserPermissions());
  }, [dispatch]);

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

    // Permission meta
    permissionsLoading: permissionsState.loading,
    permissionsReady: permissionsState.initialized,
    permissionsError: permissionsState.error,
    refreshPermissions,
  };
};

export default usePermissions;
