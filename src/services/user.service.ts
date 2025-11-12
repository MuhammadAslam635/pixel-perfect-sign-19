import API from "@/utils/api";

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  profileImage?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserResponse {
  success: boolean;
  user: User;
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
};
