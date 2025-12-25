import API from "@/utils/api";

export interface User {
  _id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  roleId?: string;
  status?: string;
  profileImage?: string;
  companyId?: string;
  mailgunEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserResponse {
  success: boolean;
  user: User;
}

export interface UserListResponse {
  success: boolean;
  data: {
    users: User[];
    page: number;
    totalPages: number;
    totalUsers?: number;
  };
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  trashed?: boolean;
}

export interface InviteUserPayload {
  email: string;
  roleId?: string | null;
  message?: string;
  expiresInDays?: number;
}

export interface InviteUserResponse {
  success: boolean;
  message: string;
  data?: {
    invitationId: string;
    email: string;
    expiresAt: string;
    role: string;
  };
}

export interface CreateUserData {
  name: string;
  firstName: string;
  lastName?: string;
  email: string;
  password?: string; // Optional - will be auto-generated if not provided
  status: string;
  twilio?: {
    shouldProvision?: boolean;
    areaCode?: string;
    capabilities?: Array<"voice" | "sms">;
  };
  mailgunEmail?: string;
  roleId?: string; // RBAC role assignment
}

export interface UpdateUserData {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: string;
  status?: string;
  mailgunEmail?: string;
  roleId?: string; // RBAC role assignment
}

export interface UserDetailResponse {
  success: boolean;
  data: User;
  message?: string;
}

export interface UserPreferences {
  enrichment: {
    selectedSeniorities: string[];
  };
}

export interface UserPreferencesResponse {
  success: boolean;
  message: string;
  data: {
    preferences: UserPreferences;
  };
}

export const userService = {
  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    try {
      const response = await API.get("/me");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<UserResponse> => {
    try {
      const response = await API.put("/profile/update", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update user password
   */
  updatePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<any> => {
    try {
      const response = await API.put("/password/update", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get list of users with pagination and search
   */
  getUsers: async (params: UserListParams = {}): Promise<UserListResponse> => {
    try {
      const { page = 1, limit = 10, search = "", trashed = false } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search,
      });
      if (trashed) {
        queryParams.append("trashed", "true");
      }
      const response = await API.get(`/users?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete a user
   */
  deleteUser: async (userId: string): Promise<any> => {
    try {
      const response = await API.delete(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Restore a deleted user
   */
  restoreUser: async (userId: string): Promise<any> => {
    try {
      const response = await API.patch(`/users/${userId}/restore`, {});
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Create a new user
   */
  createUser: async (data: CreateUserData): Promise<UserResponse> => {
    try {
      const response = await API.post("/users", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string): Promise<UserDetailResponse> => {
    try {
      const response = await API.get(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update a user
   */
  updateUser: async (
    userId: string,
    data: UpdateUserData
  ): Promise<UserResponse> => {
    try {
      const response = await API.post(`/users/${userId}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Invite a user via email
   */
  inviteUser: async (
    payload: InviteUserPayload
  ): Promise<InviteUserResponse> => {
    try {
      const response = await API.post("/users/invite", payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update company profile (for company users)
   */
  updateCompanyProfile: async (data: {
    id: string;
    name?: string;
    email?: string;
    bio?: string;
  }): Promise<{ success: boolean; message: string; user: User }> => {
    try {
      const response = await API.post("/company-profile-update", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update admin profile
   */
  updateAdminProfile: async (data: {
    id: string;
    name?: string;
    email?: string;
  }): Promise<{ success: boolean; message: string; user: User }> => {
    try {
      const response = await API.post("/admin/profile-update", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get user preferences
   */
  getUserPreferences: async (): Promise<UserPreferencesResponse> => {
    try {
      const response = await API.get("/users/preferences");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update user preferences
   */
  updateUserPreferences: async (data: {
    selectedSeniorities: string[];
  }): Promise<UserPreferencesResponse> => {
    try {
      const response = await API.put("/users/preferences", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
