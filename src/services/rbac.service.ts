import API from "@/utils/api";
import {
  Role,
  Module,
  ModuleAccess,
  CreateRolePayload,
  UpdateRolePayload,
  AssignRolePayload,
} from "@/types/rbac.types";

export interface RoleResponse {
  success: boolean;
  data: Role;
  message?: string;
}

export interface RoleListResponse {
  success: boolean;
  data: Role[];
  message?: string;
}

export interface ModuleResponse {
  success: boolean;
  data: Module;
  message?: string;
}

export interface ModuleListResponse {
  success: boolean;
  data: Module[];
  message?: string;
  legacy?: boolean;
}

export interface UserModuleListResponse {
  success: boolean;
  data: ModuleAccess[];
  message?: string;
  legacy?: boolean;
}

export interface AssignRoleResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    roleId: string;
    roleName: string;
  };
}

/**
 * RBAC Service for Role and Module Management
 */
export const rbacService = {
  // ============================================
  // ROLE MANAGEMENT
  // ============================================

  /**
   * Get all roles
   */
  getAllRoles: async (): Promise<RoleListResponse> => {
    try {
      const response = await API.get("/roles");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get role by ID
   */
  getRoleById: async (id: string): Promise<RoleResponse> => {
    try {
      const response = await API.get(`/roles/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Create new role
   */
  createRole: async (payload: CreateRolePayload): Promise<RoleResponse> => {
    try {
      const response = await API.post("/roles", payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update role
   */
  updateRole: async (
    id: string,
    payload: UpdateRolePayload
  ): Promise<RoleResponse> => {
    try {
      const response = await API.put(`/roles/${id}`, payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete role
   */
  deleteRole: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.delete(`/roles/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Assign role to user
   */
  assignRole: async (
    payload: AssignRolePayload
  ): Promise<AssignRoleResponse> => {
    try {
      const response = await API.post("/roles/assign", payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // ============================================
  // MODULE MANAGEMENT
  // ============================================

  /**
   * Get all modules
   */
  getAllModules: async (
    includeInactive: boolean = false
  ): Promise<ModuleListResponse> => {
    try {
      const response = await API.get("/modules", {
        params: { includeInactive },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get user's accessible modules
   */
  getUserModules: async (): Promise<UserModuleListResponse> => {
    try {
      const response = await API.get("/modules/user");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get module by ID
   */
  getModuleById: async (id: string): Promise<ModuleResponse> => {
    try {
      const response = await API.get(`/modules/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Create new module (Admin only)
   */
  createModule: async (payload: Partial<Module>): Promise<ModuleResponse> => {
    try {
      const response = await API.post("/modules", payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update module (Admin only)
   */
  updateModule: async (
    id: string,
    payload: Partial<Module>
  ): Promise<ModuleResponse> => {
    try {
      const response = await API.put(`/modules/${id}`, payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete module (Admin only)
   */
  deleteModule: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.delete(`/modules/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
