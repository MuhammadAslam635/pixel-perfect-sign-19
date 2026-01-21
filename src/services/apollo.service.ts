import API from "@/utils/api";

/**
 * Apollo API Service
 * Handles company lookup and enrichment via Apollo API
 */
export const apolloService = {
  /**
   * Lookup company information by website domain
   * Returns company name and description
   */
  lookupCompany: async (
    website: string
  ): Promise<{
    success: boolean;
    data?: {
      companyName: string | null;
      description: string | null;
      website: string;
      address: string | null;
      postalCode: string | null;
      country: string | null;
    };
    error?: string;
  }> => {
    try {
      const response = await API.post("/apollo/company/lookup", { website });
      return response.data;
    } catch (error: any) {
      // Return error in a consistent format
      return {
        success: false,
        error:
          error?.response?.data?.error ||
          error?.message ||
          "Unable to load company information. Please try again.",
      };
    }
  },
};
