import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionAction } from "@/types/rbac.types";

interface PermissionGuardProps {
  children: React.ReactNode;
  moduleName: string;
  requiredActions?: PermissionAction[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 *
 * Usage:
 * <PermissionGuard moduleName="users" requiredActions={["create"]}>
 *   <Button>Create User</Button>
 * </PermissionGuard>
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  moduleName,
  requiredActions = ["view"],
  requireAll = false,
  fallback = null,
}) => {
  const { checkPermission } = usePermissions();

  const hasPermission = checkPermission(moduleName, requiredActions, requireAll);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
