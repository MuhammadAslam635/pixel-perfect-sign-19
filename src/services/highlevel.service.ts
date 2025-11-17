import API from "@/utils/api";

export interface CreateGHLContactFromCompanyPersonRequest {
  companyPersonId: string;
  companyId?: string;
  type?: "lead" | "customer";
  source?: string;
  tags?: string[];
  customField?: Array<{
    id: string;
    value: string;
  }>;
}

// Company contact functionality removed - companies are not synced as separate contacts

export interface CreateGHLContactCustomRequest {
  contactName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  address1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  type?: "lead" | "customer";
  source?: string;
  tags?: string[];
  customField?: Array<{
    id: string;
    value: string;
  }>;
}

export interface GHLContactResponse {
  success: boolean;
  message: string;
  data: any;
}

export interface BulkSyncContactsRequest {
  companyPersonIds: string[]; // Required - companies are not synced as separate contacts
  type?: "lead" | "customer";
  source?: string;
  tags?: string[];
}

export interface BulkSyncContactsResponse {
  success: boolean;
  message: string;
  data: {
    success: number;
    failed: number;
    total: number;
    results: Array<{
      success: boolean;
      data?: any;
      error?: string;
    }>;
  };
}

export const highlevelService = {
  /**
   * Create GHL contact from CompanyPerson
   */
  createContactFromCompanyPerson: async (
    data: CreateGHLContactFromCompanyPersonRequest
  ): Promise<GHLContactResponse> => {
    try {
      const response = await API.post(
        "/highlevel/contact/company-person",
        data
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Company contact functionality removed - companies are not synced as separate contacts

  /**
   * Create GHL contact with custom data
   */
  createContactCustom: async (
    data: CreateGHLContactCustomRequest
  ): Promise<GHLContactResponse> => {
    try {
      const response = await API.post("/highlevel/contact", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Bulk sync contacts to GHL
   */
  bulkSyncContacts: async (
    data: BulkSyncContactsRequest
  ): Promise<BulkSyncContactsResponse> => {
    try {
      const response = await API.post("/highlevel/contact/bulk", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
