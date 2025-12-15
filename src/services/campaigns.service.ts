import API from "@/utils/api";

export interface ResearchDoc {
  content: string;
  createdAt: string | null;
  status: "pending" | "in-progress" | "completed" | "failed";
}

export interface ProcessingStatus {
  research: {
    status: "pending" | "in-progress" | "completed" | "failed";
    completedDocs: number;
    totalDocs: number;
  };
  content: {
    status: "pending" | "in-progress" | "completed" | "failed";
    jobId: string | null;
  };
  media: {
    status: "pending" | "in-progress" | "completed" | "failed";
    jobId: string | null;
  };
}

export interface Campaign {
  _id: string;
  userId: string;
  name: string;
  userRequirements: string;
  media: string[];
  status: string;
  campaignType: string;
  platform: string[];
  targetAudience: string;
  location: string;
  estimatedBudget: number;
  numberOfDays: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  content?: string;
  researchDocs?: {
    marketResearch?: ResearchDoc;
    offerServiceBrief?: ResearchDoc;
    necessaryBriefs?: ResearchDoc;
    brandDesign?: ResearchDoc;
  };
  processingStatus?: ProcessingStatus;
}

export interface CampaignsResponse {
  success: boolean;
  message: string;
  data: {
    docs: Campaign[];
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

export interface CampaignsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | 1 | -1;
  dateFrom?: string;
  dateTo?: string;
  platform?: string;
}

export interface UpdateCampaignData {
  name?: string;
  userRequirements?: string;
  content?: string;
  media?: string[];
  status?: "draft" | "in-progress" | "completed" | "paused" | "cancelled";
  campaignType?: "awareness" | "advertisement" | "product" | "promotion" | "brand" | "other";
  platform?: ("facebook" | "google")[];
  targetAudience?: "children" | "youth" | "elders" | "adults" | "teenagers" | "seniors" | "all";
  location?: string;
  estimatedBudget?: number;
  numberOfDays?: number;
}

export interface CreateCampaignData {
  name: string;
  userRequirements: string;
  campaignType: "awareness" | "advertisement" | "product" | "promotion" | "brand" | "other";
  platform: ("facebook" | "google")[];
  targetAudience: "children" | "youth" | "elders" | "adults" | "teenagers" | "seniors" | "all";
  location: string;
  estimatedBudget: number;
  numberOfDays: number;
  status?: "draft" | "in-progress" | "completed" | "paused" | "cancelled";
}

export interface RegenerateCampaignData {
  type: "content" | "media" | "both";
  userGuidelines?: string;
  fileURL?: string;
  fileMimeType?: string;
}

export interface CampaignResponse {
  success: boolean;
  message: string;
  data: Campaign;
}

export const campaignsService = {
  /**
   * Get campaigns list with pagination and filters
   */
  getCampaigns: async (params: CampaignsQueryParams = {}): Promise<CampaignsResponse> => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        sortBy,
        sortOrder,
        dateFrom,
        dateTo,
        platform,
      } = params;

      const queryParams: any = {
        page,
        limit,
      };

      if (search) {
        queryParams.search = search;
      }

      if (sortBy) {
        queryParams.sortBy = sortBy;
        queryParams.sortOrder = sortOrder === "desc" || sortOrder === -1 ? -1 : 1;
      }

      if (dateFrom) {
        queryParams.dateFrom = dateFrom;
      }

      if (dateTo) {
        queryParams.dateTo = dateTo;
      }

      if (platform && platform !== 'all') {
        queryParams.platform = platform;
      }

      const response = await API.get("/campaigns/list", {
        params: queryParams,
      });

      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get a single campaign by ID
   */
  getCampaignById: async (id: string): Promise<CampaignResponse> => {
    try {
      const response = await API.get(`/campaigns/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update a campaign
   */
  updateCampaign: async (id: string, data: UpdateCampaignData): Promise<CampaignResponse> => {
    try {
      const response = await API.put(`/campaigns/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete a campaign
   */
  deleteCampaign: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.delete(`/campaigns/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Regenerate campaign content and/or media
   */
  regenerateCampaign: async (id: string, data: RegenerateCampaignData): Promise<{ success: boolean; message: string; data: any }> => {
    try {
      const response = await API.post(`/campaigns/${id}/regenerate`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Reset campaign content
   */
  resetCampaignContent: async (id: string): Promise<CampaignResponse> => {
    try {
      const response = await API.post(`/campaigns/${id}/reset-content`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Reset campaign media
   */
  resetCampaignMedia: async (id: string): Promise<CampaignResponse> => {
    try {
      const response = await API.post(`/campaigns/${id}/reset-media`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Create a new campaign
   */
  createCampaign: async (data: CreateCampaignData): Promise<CampaignResponse> => {
    try {
      const response = await API.post("/campaigns/create", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

