import API from "@/utils/api";

export interface PersonalContactInfo {
  state: string;
  value: string | null; // JSON string containing name, phone, email
  isStale: boolean;
}

export interface Person {
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  photo_url: string | null;
  title: string;
  headline: string | null;
  seniority: string;
  industry: string | null;
  keywords: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  linkedin_url: string;
  twitter_url: string | null;
  facebook_url: string | null;
  organization_name: string;
  organization_website_url: string | null;
  organization_logo_url: string | null;
  organization_linkedin_url: string | null;
  organization_linkedin_uid: string | null;
  organization_twitter_url: string | null;
  organization_facebook_url: string | null;
  organization_primary_domain: string;
  organization_phone: string | null;
  organization_street_address: string | null;
  organization_raw_address: string | null;
  organization_state: string | null;
  organization_city: string | null;
  organization_country: string | null;
  organization_postal_code: string | null;
  organization_founded_year: number | null;
  organization_annual_revenue: number | null;
  organization_annual_revenue_printed: string | null;
  organization_total_funding: number | null;
  organization_total_funding_printed: string | null;
  organization_market_cap: number | null;
  organization_seo_description: string | null;
  organization_short_description: string | null;
  organization_technologies: string | null;
  estimated_num_employees: number | null;
  email_domain_catchall: boolean;
  id: string;
  organization_id: string | null;
  _id: string;
}

export interface Client {
  _id: string;
  airtableId: string;
  sessionId: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  status: "Active" | "Idle Timeout" | "Completed" | "Disconnected";
  messagesTotal: number;
  averageResponse: number;
  transcript: string;
  eventsJSON: string;
  toolCallsSuccess: number;
  toolCallsFailed: number;
  averageToolDuration: number;
  airtableCreatedTime: string | null;
  personalContactInfo?: PersonalContactInfo;
  companyName?: string;
  companyWebsite?: string;
  companyEmails?: string[];
  companyPhones?: string[];
  people?: Person[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ClientsResponse {
  success: boolean;
  message: string;
  data: {
    docs: Client[];
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

export interface ClientsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | 1 | -1;
}

class ClientsService {
  private baseUrl = '/client-customers';

  async getClients(params: ClientsQueryParams = {}): Promise<ClientsResponse> {
    const response = await API.get(`${this.baseUrl}/list`, { params });
    return response.data;
  }

  async getProspects(params: ClientsQueryParams = {}): Promise<ClientsResponse> {
    const response = await API.get(`${this.baseUrl}/prospects`, { params });
    return response.data;
  }

  async getCustomerSupportQueries(params: ClientsQueryParams = {}): Promise<ClientsResponse> {
    const response = await API.get(`${this.baseUrl}/customer-support`, { params });
    return response.data;
  }

  async getClientById(id: string): Promise<{ success: boolean; data: Client }> {
    const response = await API.get(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async syncFromAirtableTable(tableName: string = 'AgentLogs', maxRecords?: number): Promise<{ success: boolean; message: string; data: any }> {
    const params: any = { tableName };
    if (maxRecords) params.maxRecords = maxRecords;
    
    const response = await API.post(`${this.baseUrl}/sync-from-airtable`, {}, { params });
    return response.data;
  }
}

export const clientsService = new ClientsService();

