import API from "@/utils/api";
import {
  MailgunConfigRequest,
  MailgunConfigResponse,
} from "@/types/email.types";

export const integrationService = {
  /**
   * Validate Mailgun configuration
   */
  validateMailgunConfig: async (
    data: MailgunConfigRequest
  ): Promise<MailgunConfigResponse> => {
    try {
      const response = await API.post("/integration/mailgun/validate", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Save Mailgun configuration
   */
  saveMailgunConfig: async (
    data: MailgunConfigRequest & { mailgunEmail?: string }
  ): Promise<MailgunConfigResponse> => {
    try {
      const response = await API.post("/integration/mailgun/save", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Suggest a unique Mailgun email address
   */
  suggestMailgunEmail: async (
    domain: string,
    prefix?: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      suggestedEmail: string;
      domain: string;
    };
  }> => {
    try {
      const response = await API.post("/integration/mailgun/suggest-email", {
        domain,
        prefix,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Mailgun integration status
   */
  getMailgunIntegration: async (): Promise<{
    success: boolean;
    integration?: {
      _id: string | null;
      userId: string;
      providerName: string;
      isConnected: boolean;
      connectionData?: {
        metadata?: {
          apiKey?: string;
          domain?: string;
          apiUrl?: string;
          webhookSigningKey?: string;
        };
      };
    };
    existingEmail?: string;
  }> => {
    try {
      const response = await API.get("/integration/mailgun");
      return response.data;
    } catch (error: any) {
      // Return empty response if integration doesn't exist (404)
      if (error?.response?.status === 404) {
        return {
          success: false,
        };
      }
      throw error;
    }
  },
};
