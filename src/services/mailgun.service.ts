import API from "@/utils/api";
import {
  MailgunConfigRequest,
  MailgunConfigResponse,
} from "@/types/email.types";

type MailgunIntegrationResponse = {
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
};

class MailgunService {
  /**
   * Validate Mailgun configuration
   */
  async validateConfig(
    data: MailgunConfigRequest
  ): Promise<MailgunConfigResponse> {
    const response = await API.post("/integration/mailgun/validate", data);
    return response.data;
  }

  /**
   * Persist Mailgun configuration
   */
  async saveConfig(
    data: MailgunConfigRequest & { mailgunEmail?: string }
  ): Promise<MailgunConfigResponse> {
    const response = await API.post("/integration/mailgun/save", data);
    return response.data;
  }

  /**
   * Suggest a unique Mailgun email address
   */
  async suggestEmail(
    domain: string,
    prefix?: string
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      suggestedEmail: string;
      domain: string;
    };
  }> {
    const response = await API.post("/integration/mailgun/suggest-email", {
      domain,
      prefix,
    });
    return response.data;
  }

  /**
   * Fetch Mailgun integration status
   */
  async getIntegrationStatus(): Promise<MailgunIntegrationResponse> {
    try {
      const response = await API.get("/integration/mailgun");
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return { success: false };
      }
      throw error;
    }
  }

  /**
   * Check environment credentials status for company integrations
   */
  async checkEnvCredentials(): Promise<{
    success: boolean;
    envCredentials: Record<string, any>;
  }> {
    const response = await API.get("/integration/env/check");
    return response.data;
  }

  /**
   * Validate Mailgun environment credentials
   */
  async validateEnvCredentials(): Promise<{
    success: boolean;
    validation: { valid: boolean; message: string };
  }> {
    const response = await API.get("/integration/mailgun/env/validate");
    return response.data;
  }
}

export const mailgunService = new MailgunService();
