import API from "@/utils/api";
import { setAuthToken, clearAuthData } from "@/utils/authHelpers";

// Authentication API Service
export interface RegisterData {
  company: string;
  industry?: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirm_password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
}

export interface InvitationDetails {
  email: string;
  companyName: string;
  role: string;
  roleId?: string | null;
  invitedBy: string;
  expiresAt: string;
}

export interface InvitationDetailsResponse {
  success: boolean;
  data: InvitationDetails;
}

export interface AcceptInvitationData {
  token: string;
  name: string;
  password: string;
  confirm_password: string;
}

export const authService = {
  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await API.post("/register", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Login user
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await API.post("/login", data);

      if (response.data.success && response.data.token) {
        // Store user data with token in localStorage
        const userWithToken = {
          ...response.data.user,
          token: response.data.token,
        };
        setAuthToken(response.data.token, userWithToken);
      }

      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Request password reset
   */
  forgotPassword: async (data: ForgotPasswordData): Promise<AuthResponse> => {
    try {
      const response = await API.post("/forgot-password", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordData): Promise<AuthResponse> => {
    try {
      const response = await API.post("/reset-password", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    clearAuthData();
  },

  /**
   * Get current user profile
   */
  getMe: async (): Promise<any> => {
    try {
      const response = await API.get("/me");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<AuthResponse> => {
    try {
      const response = await API.get(`/verify-email?token=${token}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Fetch invitation details for a token
   */
  getInvitationDetails: async (token: string): Promise<InvitationDetailsResponse> => {
    try {
      const response = await API.get(`/invite/${token}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Accept an invitation
   */
  acceptInvitation: async (data: AcceptInvitationData): Promise<AuthResponse> => {
    try {
      const response = await API.post("/invite/accept", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
