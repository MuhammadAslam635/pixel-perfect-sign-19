import API from "@/utils/api";

export interface FacebookPage {
  id: string;
  name: string;
  category?: string;
  access_token?: string;
}

export interface FacebookBusinessAccount {
  id: string;
  name: string;
  primary_page?: {
    id: string;
    name: string;
  };
  timezone_id?: string;
}

export interface FacebookIntegration {
  _id: string;
  provider: string;
  pageId?: string;
  businessAccountId?: string;
  pages: FacebookPage[];
  businessAccounts: FacebookBusinessAccount[];
  selectedBusinessAccount?: FacebookBusinessAccount;
  tokenType?: string;
  receivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FacebookStatusResponse {
  success: boolean;
  connected: boolean;
  integration: FacebookIntegration | null;
}

export interface FacebookRedirectResponse {
  success: boolean;
  authUrl: string;
  state: string;
}

export interface SelectPagePayload {
  pageId: string;
}

export interface SelectBusinessAccountPayload {
  businessAccountId: string;
}

export interface RefreshPagesResponse {
  success: boolean;
  message: string;
  pages: FacebookPage[];
}

export interface BusinessAccountsResponse {
  success: boolean;
  data: FacebookBusinessAccount[];
  message: string;
}

export interface FacebookAdAccount {
  id: string;
  account_id?: string;
  name: string;
  account_status?: number;
  currency?: string;
  timezone_name?: string;
}

export interface AdAccountsResponse {
  success: boolean;
  data: FacebookAdAccount[];
  message: string;
}

export const facebookService = {
  /**
   * Get Facebook integration status
   */
  getStatus: async (): Promise<FacebookStatusResponse> => {
    try {
      const response = await API.get("/facebook/status");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Facebook OAuth redirect URL
   */
  getRedirectUrl: async (): Promise<FacebookRedirectResponse> => {
    try {
      const response = await API.get("/facebook/redirect");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Disconnect Facebook integration
   */
  disconnect: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.delete("/facebook/disconnect");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Select a Facebook page
   */
  selectPage: async (
    payload: SelectPagePayload
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.post("/facebook/select-page", payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Refresh Facebook pages list
   */
  refreshPages: async (): Promise<RefreshPagesResponse> => {
    try {
      const response = await API.post("/facebook/refresh-pages", {});
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Facebook business accounts
   */
  getBusinessAccounts: async (): Promise<BusinessAccountsResponse> => {
    try {
      const response = await API.get("/facebook/business-accounts");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Select a Facebook business account
   */
  selectBusinessAccount: async (
    payload: SelectBusinessAccountPayload
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.post(
        "/facebook/select-business-account",
        payload
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get Facebook ad accounts
   */
  getAdAccounts: async (
    businessAccountId?: string
  ): Promise<AdAccountsResponse> => {
    try {
      const params = businessAccountId ? { businessAccountId } : undefined;
      const response = await API.get("/facebook/ad-accounts", { params });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
