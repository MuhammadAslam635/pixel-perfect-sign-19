import API from "@/utils/api";

export interface Company {
  _id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  employees?: number;
  industry?: string;
  logo?: string;
  website?: string;
  description?: string;
}

export interface CompanyAdmin {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  status?: string;
  parentCompany?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompaniesResponse {
  success: boolean;
  message: string;
  data: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
    companies: Company[];
  };
}

export interface CompanyUsersResponse {
  success: boolean;
  message: string;
  data: {
    page: number;
    limit: number;
    totalPages: number;
    totalRecords: number;
    users: CompanyAdmin[];
  };
}

export interface UpdateUserStatusData {
  name?: string;
  email?: string;
  role?: string;
  status: string;
}

export const adminService = {
  /**
   * Get all companies (Admin only)
   */
  getCompanies: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      trashed?: boolean;
      isVerified?: boolean;
    } = {}
  ): Promise<CompaniesResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);
      if (params.trashed) queryParams.append("trashed", "true");
      if (params.isVerified !== undefined)
        queryParams.append("isVerified", params.isVerified.toString());

      const response = await API.get(
        `/admin/companies?${queryParams.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get company by ID (Admin only)
   */
  getCompanyById: async (
    id: string
  ): Promise<{ success: boolean; data: Company }> => {
    try {
      const response = await API.get(`/admin/companies/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get company users (Admin only)
   */
  getCompanyUsers: async (
    companyId: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      trashed?: boolean;
      isVerified?: boolean;
    } = {}
  ): Promise<CompanyUsersResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);
      if (params.trashed) queryParams.append("trashed", "true");
      if (params.isVerified !== undefined)
        queryParams.append("isVerified", params.isVerified.toString());

      const response = await API.get(
        `/admin/companies/${companyId}/users?${queryParams.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update company user status (Admin only)
   */
  updateCompanyUserStatus: async (
    companyId: string,
    userId: string,
    data: UpdateUserStatusData
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.post(
        `/admin/companies/${companyId}/user/${userId}`,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update company status (approve/activate)
   */
  updateCompanyStatus: async (
    companyId: string,
    data: Partial<Company>
  ): Promise<{
    success: boolean;
    message: string;
    data?: Company;
    provisioning?: {
      twilio: { success: boolean; error: string | null };
      elevenlabs: { success: boolean; error: string | null };
    };
  }> => {
    try {
      const response = await API.post(`/admin/companies/${companyId}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Save Mailgun configuration for a company (Admin only)
   */
  saveCompanyMailgunConfig: async (
    companyId: string,
    config: {
      apiKey: string;
      domain: string;
      apiUrl: string;
      webhookSigningKey: string;
      mailgunEmail?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      integration: {
        providerName: string;
        isConnected: boolean;
        status: string;
      };
      mailgunEmail: string | null;
      companyId: string;
      companyName: string;
    };
  }> => {
    try {
      const response = await API.post(
        `/admin/companies/${companyId}/mailgun/save`,
        config
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Mailgun status for a company (Admin only)
   */
  getCompanyMailgunStatus: async (
    companyId: string
  ): Promise<{
    success: boolean;
    data?: {
      hasMailgun: boolean;
      isConnected: boolean;
      status: string;
      mailgunEmail: string | null;
      mailgunConfig: any;
    };
  }> => {
    try {
      const response = await API.get(
        `/admin/companies/${companyId}/mailgun/status`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get company statistics based on user role
   */
  getCompanyStatistics: async (): Promise<{
    success: boolean;
    data: {
      totalCompanies: number;
      activeCompanies: number;
      prompts?: {
        totalPrompts: number;
        linkedinPrompts: number;
        emailPrompts: number;
        phonePrompts: number;
        whatsappPrompts: number;
        globalPrompts: number;
        companySpecificPrompts: number;
      };
    };
  }> => {
    try {
      const response = await API.get("/admin/companies/statistics");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Prompt management methods
  getPromptsPaginated: async (params?: {
    page?: number;
    limit?: number;
    promptType?: string;
    promptCategory?: string;
    companyId?: string;
  }) => {
    const response = await API.get("/admin/prompts", { params });
    return response.data;
  },

  getPromptStatistics: async () => {
    const response = await API.get("/admin/prompts/statistics");
    return response.data;
  },

  /**
   * Get all users globally (Admin only)
   * Aggregates users from all companies
   */
  getAllUsers: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
      companyId?: string;
      trashed?: boolean;
    } = {}
  ): Promise<CompanyUsersResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);
      if (params.role) queryParams.append("role", params.role);
      if (params.status) queryParams.append("status", params.status);
      if (params.companyId) queryParams.append("companyId", params.companyId);
      if (params.trashed) queryParams.append("trashed", "true");

      const response = await API.get(`/admin/users?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get user statistics globally (Admin only)
   */
  getUserStatistics: async (): Promise<{
    success: boolean;
    data: {
      totalUsers: number;
      activeUsers: number;
      inactiveUsers: number;
      admins: number;
      companyAdmins: number;
      companyUsers: number;
      byRole: Record<string, number>;
      byCompany: Record<string, number>;
    };
  }> => {
    try {
      const response = await API.get("/admin/users/statistics");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get admin dashboard statistics
   */
  getDashboardStats: async (): Promise<{
    success: boolean;
    data: {
      totalCompanies: number;
      totalAiAgents: number;
      totalAiAgentRequests: number;
      totalRequestPortal: number;
      totalFreeCompanies: number;
      totalPremiumCompanies: number;
    };
    message: string;
  }> => {
    try {
      const response = await API.get("/admin/dashboard/stats");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
