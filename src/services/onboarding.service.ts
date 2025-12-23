import API from "@/utils/api";
import {
  OnboardingResponse,
  OnboardingStatusResponse,
  OnboardingUpdateData,
  DocumentUploadResponse,
} from "@/types/onboarding.types";

/**
 * Onboarding API Service
 * Handles all onboarding-related API calls
 */
export const onboardingService = {
  /**
   * Get onboarding data for the authenticated user's company
   */
  getOnboarding: async (): Promise<OnboardingResponse> => {
    try {
      const response = await API.get("/onboarding");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update onboarding data (creates if doesn't exist)
   */
  updateOnboarding: async (data: OnboardingUpdateData): Promise<OnboardingResponse> => {
    try {
      const response = await API.patch("/onboarding", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get onboarding status
   */
  getOnboardingStatus: async (): Promise<OnboardingStatusResponse> => {
    try {
      const response = await API.get("/onboarding/status");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Upload supporting documents
   */
  uploadDocuments: async (files: File[]): Promise<DocumentUploadResponse> => {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("documents", file);
      });

      const response = await API.post("/onboarding/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete a supporting document
   */
  deleteDocument: async (documentId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.delete(`/onboarding/documents/${documentId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Mark onboarding as completed
   */
  completeOnboarding: async (): Promise<OnboardingResponse> => {
    try {
      const response = await API.patch("/onboarding/complete");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update connection status (Meta/Google integrations)
   */
  updateConnections: async (data: {
    isMetaConnected?: boolean;
    isGoogleConnected?: boolean;
  }): Promise<{ success: boolean; message: string; data: any }> => {
    try {
      const response = await API.patch("/onboarding/connections", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Suggest core offerings based on company name and description
   */
  suggestCoreOfferings: async (companyName: string, description: string): Promise<{
    success: boolean;
    data?: {
      coreOfferings: string[];
    };
    error?: string;
  }> => {
    try {
      const response = await API.post("/onboarding/suggest-core-offerings", {
        companyName,
        description,
      });
      return response.data;
    } catch (error: any) {
      // Return error in a consistent format
      return {
        success: false,
        error: error?.response?.data?.error || error?.message || "Failed to generate core offerings suggestions",
      };
    }
  },

  /**
   * Generate ICP suggestions based on company information
   */
  generateICPSuggestions: async (data: {
    website: string;
    companyName?: string;
    businessDescription?: string;
  }): Promise<{
    success: boolean;
    data?: {
      suggestions: Array<{
        title: string;
        description: string;
      }>;
    };
    error?: string;
  }> => {
    try {
      const response = await API.post("/onboarding/generate-icp", data);
      return response.data;
    } catch (error: any) {
      // Return error in a consistent format
      return {
        success: false,
        error: error?.response?.data?.message || error?.message || "Failed to generate ICP suggestions",
      };
    }
  },
};
