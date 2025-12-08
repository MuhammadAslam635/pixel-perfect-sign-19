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
  [key: string]: unknown;
}

export interface Company {
  _id: string;
  name: string;
  address: string | null;
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
  hasPeople?: boolean;
  hasWebsite?: boolean;
  location?: string;
  country?: string;
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
      return response.data;
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
};
