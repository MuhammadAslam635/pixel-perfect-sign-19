import axios from "axios";
import { getUserData } from "@/utils/authHelpers";

const APP_BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

export interface GlobalIntegration {
  _id: string;
  providerName: string;
  isConnected: boolean;
  status: string;
  connectionData: {
    metadata?: Record<string, any>;
  };
  isGlobal: boolean;
  managedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalIntegrationsResponse {
  success: boolean;
  integrations: GlobalIntegration[];
  message?: string;
}

export interface SaveIntegrationResponse {
  success: boolean;
  integration?: GlobalIntegration;
  message?: string;
}

export class AdminGlobalIntegrationsService {
  private static instance: AdminGlobalIntegrationsService;
  private user = getUserData();

  public static getInstance(): AdminGlobalIntegrationsService {
    if (!AdminGlobalIntegrationsService.instance) {
      AdminGlobalIntegrationsService.instance =
        new AdminGlobalIntegrationsService();
    }
    return AdminGlobalIntegrationsService.instance;
  }

  private getAuthHeaders() {
    const user = getUserData();
    return {
      Authorization: `Bearer ${user?.token}`,
      "ngrok-skip-browser-warning": "true",
    };
  }

  /**
   * Fetch all global integrations for admin
   */
  async fetchGlobalIntegrations(): Promise<GlobalIntegrationsResponse> {
    try {
      const response = await axios.get(
        `${APP_BACKEND_URL}/admin/integrations/global`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error fetching global integrations:", error);
      throw new Error(
        error?.response?.data?.message || "Unable to load integrations. Please try again."
      );
    }
  }

  /**
   * Save or update a global integration configuration
   */
  async saveIntegration(
    provider: string,
    metadata: Record<string, any>
  ): Promise<SaveIntegrationResponse> {
    try {
      const response = await axios.post(
        `${APP_BACKEND_URL}/admin/integrations/global/${provider}`,
        {
          connectionData: {},
          metadata,
        },
        {
          headers: this.getAuthHeaders(),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(`Error saving ${provider} integration:`, error);
      throw new Error(
        error?.response?.data?.message ||
          `Failed to save ${provider} configuration`
      );
    }
  }

  /**
   * Delete a global integration
   */
  async deleteIntegration(
    provider: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await axios.delete(
        `${APP_BACKEND_URL}/admin/integrations/global/${provider}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(`Error deleting ${provider} integration:`, error);
      throw new Error(
        error?.response?.data?.message ||
          `Failed to delete ${provider} integration`
      );
    }
  }

  /**
   * Test a global integration connection
   */
  async testIntegration(
    provider: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await axios.post(
        `${APP_BACKEND_URL}/admin/integrations/global/${provider}/test`,
        {},
        {
          headers: this.getAuthHeaders(),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(`Error testing ${provider} integration:`, error);
      throw new Error(
        error?.response?.data?.message ||
          `Failed to test ${provider} integration`
      );
    }
  }

  /**
   * Check environment credentials status for admin integrations
   */
  async checkEnvCredentials(): Promise<{
    success: boolean;
    envCredentials: Record<string, any>;
  }> {
    try {
      const response = await axios.get(
        `${APP_BACKEND_URL}/admin/integrations/env/check`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error checking env credentials:", error);
      throw new Error(
        error?.response?.data?.message || "Failed to check env credentials"
      );
    }
  }

  /**
   * Validate environment credentials for a specific provider
   */
  async validateEnvCredentials(provider: string): Promise<{
    success: boolean;
    validation: { valid: boolean; message: string };
  }> {
    try {
      const response = await axios.get(
        `${APP_BACKEND_URL}/admin/integrations/env/validate/${provider}`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(`Error validating ${provider} env credentials:`, error);
      throw new Error(
        error?.response?.data?.message ||
          `Failed to validate ${provider} env credentials`
      );
    }
  }
}

export const adminGlobalIntegrationsService =
  AdminGlobalIntegrationsService.getInstance();
