import API from "@/utils/api";

/**
 * Company Configuration Response
 */
export interface CompanyConfigResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    companyId: string;
    autoLeadEnrichment: boolean;
    perplexityPrompt: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Update Company Config Request
 */
export interface UpdateCompanyConfigRequest {
  autoLeadEnrichment?: boolean;
  perplexityPrompt?: string | null;
}

/**
 * Company Config Service
 * 
 * Handles API calls related to company configuration
 */
export const companyConfigService = {
  /**
   * Get company configuration
   * @returns Promise with company config data
   */
  getConfig: async (): Promise<CompanyConfigResponse> => {
    try {
      const response = await API.get("/company-config");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update company configuration
   * @param config - Configuration data to update
   * @returns Promise with updated config data
   */
  updateConfig: async (
    config: UpdateCompanyConfigRequest
  ): Promise<CompanyConfigResponse> => {
    try {
      const response = await API.put("/company-config", config);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get company configuration by company ID (Admin only)
   * @param companyId - The company ID to fetch config for
   * @returns Promise with company config data
   */
  getConfigByCompanyId: async (companyId: string): Promise<CompanyConfigResponse & { company?: { _id: string; name: string; email: string } }> => {
    try {
      const response = await API.get(`/admin/company-config/${companyId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update company configuration by company ID (Admin only)
   * @param companyId - The company ID to update config for
   * @param config - Configuration data to update
   * @returns Promise with updated config data
   */
  updateConfigByCompanyId: async (
    companyId: string,
    config: UpdateCompanyConfigRequest
  ): Promise<CompanyConfigResponse & { company?: { _id: string; name: string; email: string } }> => {
    try {
      const response = await API.put(`/admin/company-config/${companyId}`, config);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

