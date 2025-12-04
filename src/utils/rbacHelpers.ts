import { Role, Module, PermissionAction } from "@/types/rbac.types";

/**
 * Check if user has permission to access a module with specific actions
 * @param userRole - User's role object
 * @param moduleName - Name of the module to check
 * @param requiredActions - Array of required actions
 * @param requireAll - If true, user must have all actions. If false, user needs at least one
 */
export const hasPermission = (
  userRole: Role | null | undefined,
  moduleName: string,
  requiredActions: PermissionAction[] = ["view"],
  requireAll: boolean = false
): boolean => {
  // If no role, no permission
  if (!userRole) return false;

  // Find module permission entry
  const modulePermission = userRole.permissions.find((p) => {
    if (typeof p.module === "string") {
      return false; // Module not populated
    }
    return p.module.name === moduleName;
  });

  if (!modulePermission) return false;

  // Check if user has required actions
  if (requireAll) {
    return requiredActions.every((action) => modulePermission.actions.includes(action));
  } else {
    return requiredActions.some((action) => modulePermission.actions.includes(action));
  }
};

/**
 * Check if user has specific action permission on a module
 * @param userRole - User's role object
 * @param moduleName - Name of the module
 * @param action - Specific action to check
 */
export const hasAction = (
  userRole: Role | null | undefined,
  moduleName: string,
  action: PermissionAction
): boolean => {
  return hasPermission(userRole, moduleName, [action]);
};

/**
 * Get all accessible modules for user
 * @param userRole - User's role object
 */
export const getAccessibleModules = (userRole: Role | null | undefined): Module[] => {
  if (!userRole) return [];

  return userRole.permissions
    .filter((p) => typeof p.module !== "string" && p.module.isActive)
    .map((p) => p.module as Module);
};

/**
 * Get all actions user has on a specific module
 * @param userRole - User's role object
 * @param moduleName - Name of the module
 */
export const getModuleActions = (
  userRole: Role | null | undefined,
  moduleName: string
): PermissionAction[] => {
  if (!userRole) return [];

  const modulePermission = userRole.permissions.find((p) => {
    if (typeof p.module === "string") return false;
    return p.module.name === moduleName;
  });

  return modulePermission?.actions || [];
};

/**
 * Check if user is System Admin
 * @param userRole - User's role (legacy string or Role object)
 */
export const isSystemAdmin = (userRole: string | Role | null | undefined): boolean => {
  if (!userRole) return false;

  if (typeof userRole === "string") {
    return userRole === "Admin";
  }

  return userRole.type === "system" || userRole.isSystemRole;
};

/**
 * Check if user is Company Admin
 * @param userRole - User's role (legacy string or Role object)
 */
export const isCompanyAdmin = (userRole: string | Role | null | undefined): boolean => {
  if (!userRole) return false;

  if (typeof userRole === "string") {
    return userRole === "Admin" || userRole === "CompanyAdmin" || userRole === "Company";
  }

  return (
    userRole.type === "system" ||
    userRole.name === "CompanyAdmin" ||
    (userRole.type === "default" && userRole.name === "CompanyAdmin")
  );
};

/**
 * Legacy role check - for backward compatibility
 * @param userRole - Legacy role string
 * @param moduleName - Module name
 */
export const hasLegacyPermission = (userRole: string, moduleName: string): boolean => {
  const legacyMap: Record<string, string[]> = {
    Admin: ["*"],
    Company: [
      "dashboard",
      "companies",
      "chat",
      "agents",
      "campaigns",
      "users",
      "settings",
      "company-knowledge",
      "followup-templates",
      "emails",
    ],
    CompanyAdmin: [
      "dashboard",
      "companies",
      "chat",
      "agents",
      "campaigns",
      "users",
      "settings",
      "company-knowledge",
      "followup-templates",
      "emails",
    ],
    CompanyUser: ["dashboard", "chat", "contact-now", "campaigns", "emails"],
    CompanyViewer: ["dashboard", "campaigns"],
  };

  const allowedModules = legacyMap[userRole] || [];
  return allowedModules.includes("*") || allowedModules.includes(moduleName);
};

/**
 * Check module access (supports both new RBAC and legacy roles)
 * @param user - User object with role information
 * @param moduleName - Module name
 * @param requiredActions - Required actions (optional, defaults to ['view'])
 */
export const canAccessModule = (
  user: any,
  moduleName: string,
  requiredActions: PermissionAction[] = ["view"]
): boolean => {
  if (!user) return false;

  // Note: Admin role is intentionally kept as legacy system role (not roleId-based)
  if (user.role === "Admin") return true;

  // PRIORITY 1: Check roleId for new RBAC system
  if (user.roleId && typeof user.roleId === "object") {
    return hasPermission(user.roleId, moduleName, requiredActions);
  }

  // PRIORITY 2: Fallback to legacy role system for backward compatibility
  if (user.role && typeof user.role === "string") {
    return hasLegacyPermission(user.role, moduleName);
  }

  return false;
};

/**
 * Filter navigation items based on user permissions
 * @param navItems - Array of navigation items with module names
 * @param user - User object
 */
export const filterNavigationByPermissions = (navItems: any[], user: any): any[] => {
  if (!user) return [];

  return navItems.filter((item) => {
    if (!item.moduleName) return true; // Items without module names are always visible
    return canAccessModule(user, item.moduleName);
  });
};
