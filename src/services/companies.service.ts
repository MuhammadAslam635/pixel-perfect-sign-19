import API from "@/utils/api";

export interface CompanyPerson {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  position?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
  phones?: string[];
  emails?: string[];
  pictureUrl?: string;
  photo_url?: string;
  image?: string;
  [key: string]: unknown;
}

export interface Company {
  _id: string;
  name: string;
  address: string | null;
  country: string | null;
  website: string | null;
  description: string | null;
  about: string | null;
  employees: number | null;
  industry: string | null;
  logo: string | null;
  people: CompanyPerson[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  // Additional fields for company details
  revenue?: string | number | null;
  organization_revenue?: string | number | null;
  organization_revenue_printed?: string | number | null;
  marketcap?: string | number | null;
  marketCap?: string | number | null; // Alias for marketcap (camelCase)
  foundedYear?: string | number | null;
  facebook?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;
  tags?: string[];
  ownerId?: string;
  // Lead generation status fields
  leadsGenerationStatus?: 'idle' | 'pending' | 'in_progress' | 'completed' | 'failed';
  leadsGenerationProgress?: {
    current: number;
    total: number;
    lastUpdated: string | null;
  };
  leadsGenerationError?: string | null;
  [key: string]: unknown;
}

export interface CompaniesResponse {
  success: boolean;
  message: string;
  data: {
    docs: Company[];
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

export interface CompaniesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | 1 | -1;
  industry?: string;
  minEmployees?: number;
  maxEmployees?: number;
  employeeRanges?: string; // Comma-separated employee range values
  hasPeople?: boolean;
  hasWebsite?: boolean;
  location?: string;
  country?: string;
  stage?: string[];
  seniority?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasLinkedin?: boolean;
  hasFavourite?: boolean;
}

export const companiesService = {
  /**
   * Get list of companies with pagination and filters
   */
  getCompanies: async (
    params: CompaniesQueryParams = {}
  ): Promise<CompaniesResponse> => {
    try {
      const response = await API.get("/companies/list", {
        params,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get a single company by ID
   */
  getCompanyById: async (id: string): Promise<Company> => {
    try {
      const response = await API.get(`/companies/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get company statistics
   */
  getCompanyStats: async (): Promise<any> => {
    try {
      const response = await API.get("/companies/stats");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  fillPersonData: async (payload: { companyId: string; personId: string }) => {
    try {
      const response = await API.post("/companies/fill-person-data", payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete a company by ID (also deletes associated leads)
   */
  deleteCompany: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.delete(`/companies/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
