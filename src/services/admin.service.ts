import API from "@/utils/api";

export interface Company {
  _id: string;
  company: string;
  name?: string;
  email: string;
  role: string;
  status?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  getCompanies: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    trashed?: boolean;
    isVerified?: boolean;
  } = {}): Promise<CompaniesResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.search) queryParams.append("search", params.search);
      if (params.trashed) queryParams.append("trashed", "true");
      if (params.isVerified !== undefined)
        queryParams.append("isVerified", params.isVerified.toString());

      const response = await API.get(`/admin/companies?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get company by ID (Admin only)
   */
  getCompanyById: async (id: string): Promise<{ success: boolean; data: Company }> => {
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
      const response = await API.post(`/admin/companies/${companyId}/user/${userId}`, data);
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
  ): Promise<{ success: boolean; message: string; data?: Company }> => {
    try {
      const response = await API.post(`/admin/companies/${companyId}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

