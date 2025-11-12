import API from "@/utils/api";

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
  companyName?: string;
  companyLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadsResponse {
  success: boolean;
  message: string;
  data: Lead[];
}

export const leadsService = {
  /**
   * Get all leads (company people) from all companies
   */
  getLeads: async (): Promise<LeadsResponse> => {
    try {
      // Fetch companies which includes people data
      const response = await API.get("/companies/list", {
        params: {
          page: 1,
          limit: 1000, // Get all companies
        },
      });

      if (response.data.success && response.data.data.docs) {
        // Extract all people from all companies
        const allPeople: Lead[] = [];

        response.data.data.docs.forEach((company: any) => {
          if (company.people && Array.isArray(company.people)) {
            company.people.forEach((person: any) => {
              allPeople.push({
                ...person,
                companyName: company.name,
                companyLocation: company.address,
              });
            });
          }
        });

        return {
          success: true,
          message: 'Leads fetched successfully',
          data: allPeople,
        };
      }

      return {
        success: false,
        message: 'Failed to fetch leads',
        data: [],
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get a single lead by ID
   */
  getLeadById: async (id: string): Promise<Lead> => {
    try {
      const response = await API.get(`/company-person/${id}`);
      return response.data;
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
