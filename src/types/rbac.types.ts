export type PermissionAction = "view" | "create" | "edit" | "delete";

export interface ModulePermission {
  action: PermissionAction;
  displayName: string;
  description?: string;
}

export interface Module {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  route: string;
  icon?: string;
  parentModule?: string | Module;
  isActive: boolean;
  order: number;
  permissions: ModulePermission[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermission {
  module: string | Module;
  actions: PermissionAction[];
}

export type RoleType = "system" | "default" | "custom";

export interface Role {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  type: RoleType;
  company?: string;
  permissions: RolePermission[];
  isActive: boolean;
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface UserPermissions {
  role?: Role;
  modulePermissions?: PermissionAction[];
  isSystemAdmin?: boolean;
  allPermissions?: boolean;
  legacy?: boolean;
  allowedModules?: string[];
}

export interface CreateRolePayload {
  name: string;
  displayName: string;
  description?: string;
  permissions: {
    module: string;
    actions: PermissionAction[];
  }[];
}

export interface UpdateRolePayload {
  displayName?: string;
  description?: string;
  permissions?: {
    module: string;
    actions: PermissionAction[];
  }[];
  isActive?: boolean;
}

export interface AssignRolePayload {
  userId: string;
  roleId: string;
}
