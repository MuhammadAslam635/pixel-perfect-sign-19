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
};

