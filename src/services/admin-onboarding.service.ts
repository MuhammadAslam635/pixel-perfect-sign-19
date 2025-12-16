import API from "@/utils/api";

export interface OnboardingApplication {
  _id: string;
  companyId: string;
  status: "draft" | "in_progress" | "completed" | "approved" | "rejected";
  questions: Record<string, any>;
  supportingDocuments?: Array<{
    _id: string;
    filename: string;
    url: string;
    uploadedAt: string;
  }>;
  adminNotes?: string;
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  createdAt: string;
  updatedAt: string;
  lastUpdated: string;
}

export interface ProvisioningStatus {
  twilio: {
    success: boolean;
    error: string | null;
  };
  elevenlabs: {
    success: boolean;
    error: string | null;
  };
}

export interface OnboardingApplicationsResponse {
  success: boolean;
  data: {
    applications: OnboardingApplication[];
    page: number;
    totalPages: number;
    totalApplications: number;
  };
}

export interface OnboardingApplicationResponse {
  success: boolean;
  data: OnboardingApplication;
}

export interface ApproveOnboardingResponse {
  success: boolean;
  message: string;
  data: OnboardingApplication;
  provisioning?: ProvisioningStatus;
}

export const adminOnboardingService = {
  /**
   * Get all onboarding applications (Admin only)
   */
  getApplications: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<OnboardingApplicationsResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.status) queryParams.append("status", params.status);

      const response = await API.get(
        `/admin/onboarding?${queryParams.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get onboarding application details (Admin only)
   */
  getApplicationDetails: async (
    id: string
  ): Promise<OnboardingApplicationResponse> => {
    try {
      const response = await API.get(`/admin/onboarding/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Approve onboarding application (Admin only)
   * Returns provisioning status in response
   */
  approveApplication: async (
    id: string,
    adminNotes?: string
  ): Promise<ApproveOnboardingResponse> => {
    try {
      const response = await API.patch(`/admin/onboarding/${id}/approve`, {
        adminNotes,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Reject onboarding application (Admin only)
   */
  rejectApplication: async (
    id: string,
    data?: {
      adminNotes?: string;
      rejectionReason?: string;
    }
  ): Promise<OnboardingApplicationResponse> => {
    try {
      const response = await API.patch(`/admin/onboarding/${id}/reject`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update onboarding application status (Admin only)
   * Returns provisioning status if status is 'approved'
   */
  updateStatus: async (
    id: string,
    data: {
      status: string;
      adminNotes?: string;
    }
  ): Promise<ApproveOnboardingResponse> => {
    try {
      const response = await API.patch(`/admin/onboarding/${id}/status`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

