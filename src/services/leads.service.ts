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
}

export const leadsService = {
  /**
   * Get leads (company people) with pagination and filters
   */
  getLeads: async (params: LeadsQueryParams = {}): Promise<LeadsResponse> => {
    try {
      const {
        page = 1,
        limit = 100,
        search = "",
        companyId,
        sortBy,
        sortOrder,
      } = params;

      // Build query params for companies API
      // Fetch all companies (or a large number) to ensure we get the filtered company
      const companiesParams: any = {
        page: 1,
        limit: 1000, // Fetch enough companies to find the one we need
      };

      if (search && !companyId) {
        // Only apply search if not filtering by specific company
        companiesParams.search = search;
      }

      // Fetch companies which includes people data
      const response = await API.get("/companies/list", {
        params: companiesParams,
      });

      if (response.data.success && response.data.data.docs) {
        // Extract people from companies
        let allPeople: Lead[] = [];

        response.data.data.docs.forEach((company: any) => {
          // Filter by companyId if provided
          if (companyId && company._id !== companyId) {
            return;
          }

          if (company.people && Array.isArray(company.people)) {
            company.people.forEach((person: any) => {
              allPeople.push({
                ...person,
                companyId: company._id,
                companyName: company.name,
                companyLocation: company.address,
              });
            });
          }
        });

        // Apply search filter on leads if not already applied
        if (search && !companiesParams.search) {
          const searchLower = search.toLowerCase();
          allPeople = allPeople.filter(
            (person) =>
              person.name?.toLowerCase().includes(searchLower) ||
              person.email?.toLowerCase().includes(searchLower) ||
              person.position?.toLowerCase().includes(searchLower) ||
              person.companyName?.toLowerCase().includes(searchLower)
          );
        }

        // Apply sorting
        if (sortBy) {
          allPeople.sort((a, b) => {
            const aVal = (a as any)[sortBy] || "";
            const bVal = (b as any)[sortBy] || "";
            const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            return sortOrder === "desc" || sortOrder === -1
              ? -comparison
              : comparison;
          });
        }

        // Apply pagination
        const totalDocs = allPeople.length;
        const totalPages = Math.ceil(totalDocs / limit);
        const offset = (page - 1) * limit;
        const paginatedPeople = allPeople.slice(offset, offset + limit);

        return {
          success: true,
          message: "Leads fetched successfully",
          data: paginatedPeople,
          pagination: {
            totalDocs,
            offset,
            limit,
            totalPages,
            page,
            pagingCounter: offset + 1,
            hasPrevPage: page > 1,
            hasNextPage: page < totalPages,
            prevPage: page > 1 ? page - 1 : null,
            nextPage: page < totalPages ? page + 1 : null,
          },
        };
      }

      return {
        success: false,
        message: "Failed to fetch leads",
        data: [],
        pagination: {
          totalDocs: 0,
          offset: 0,
          limit,
          totalPages: 0,
          page: 1,
          pagingCounter: 0,
          hasPrevPage: false,
          hasNextPage: false,
          prevPage: null,
          nextPage: null,
        },
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
