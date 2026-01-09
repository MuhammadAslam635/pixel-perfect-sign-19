import { Role } from "@/types/rbac.types";

/**
 * Restricted Modules Configuration
 * 
 * Defines the list of system administration modules that are absolutely restricted
 * to Company Owner and Company Admin roles only.
 */

export const RESTRICTED_MODULES = [
  "users",
  "company-knowledge",
  "modules",
  "roles"
];

/**
 * Check if a module is restricted
 * @param moduleName - Name of the module to check
 * @returns boolean - True if the module is restricted
 */
export const isRestrictedModule = (moduleName: string): boolean => {
  if (!moduleName) return false;
  return RESTRICTED_MODULES.includes(moduleName.toLowerCase().trim());
};

/**
 * Check if a user role is an Admin role allowed to access restricted modules
 * @param userRole - User's role object or legacy string
 * @returns boolean - True if the user is Company Owner or Company Admin
 */
export const isAdminRole = (userRole: Role | string | null | undefined): boolean => {
  if (!userRole) return false;

  // 1. Legacy string check
  if (typeof userRole === "string") {
    return (
      userRole === "Admin" || 
      userRole === "Company" || 
      userRole === "CompanyAdmin"
    );
  }

  // 2. Role object check
  if (
    userRole.type === "system" || 
    userRole.isSystemRole || 
    userRole.name === "Company" || 
    userRole.name === "CompanyAdmin"
  ) {
    return true;
  }

  return false;
};
