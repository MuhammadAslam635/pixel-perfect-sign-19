import API from "@/utils/api";

export interface LeadCompanyInfo {
  _id: string;
  name?: string | null;
  address?: string | null;
  industry?: string | null;
  website?: string | null;
  employees?: number | null;
  logo?: string | null;
}

export interface Lead {
  _id: string;
  companyId: string;
  exaItemId?: string;
  peopleWebsetId?: string;
  name: string;
  email?: string;
  phone?: string;
  description?: string;
  location?: string;
  position?: string;
  pictureUrl?: string;
  linkedinUrl?: string;
  companyName?: string | null;
  companyLocation?: string | null;
  createdAt: string;
  updatedAt: string;
  company?: LeadCompanyInfo | null;
}

export interface LeadsResponse {
  success: boolean;
  message: string;
  data: Lead[];
  pagination?: {
    totalDocs: number;
    offset: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}

export interface LeadsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | 1 | -1;
  position?: string;
  location?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasLinkedin?: boolean;
  createdFrom?: string;
  createdTo?: string;
}

export const leadsService = {
  /**
   * Get leads (company people) with pagination and filters
   */
  getLeads: async (params: LeadsQueryParams = {}): Promise<LeadsResponse> => {
    try {
      const response = await API.get("/leads/list", {
        params,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get a single lead by ID
   * Since leads are stored within companies, we fetch companies and find the person
   */
  getLeadById: async (id: string): Promise<Lead> => {
    try {
      const response = await API.get("/leads/list", {
        params: {
          leadId: id,
          limit: 1,
        },
      });

      if (response.data.success && Array.isArray(response.data.data)) {
        const lead = response.data.data[0];
        if (lead) {
          return lead;
        }
      }

      throw new Error(`Lead with ID ${id} not found`);
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Fill missing person data using RocketReach API
   */
  fillPersonData: async (companyId: string, personId: string): Promise<any> => {
    try {
      const response = await API.post("/companies/fill-person-data", {
        companyId,
        personId,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
