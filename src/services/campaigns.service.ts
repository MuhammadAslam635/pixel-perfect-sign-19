import API from "@/utils/api";
import { getAuthToken, getUserData } from "@/utils/authHelpers";

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

export interface DocumentCreationStep {
  name: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "failed";
}

export interface CampaignStreamEvent {
  type: 'connection' | 'step' | 'campaign_created' | 'workflow_completed' | 'result' | 'error';
  step?: string;
  description?: string;
  message?: string;
  success?: boolean;
  data?: any;
  error?: string;
  timestamp?: string;
}

export interface CampaignResponse {
  success: boolean;
  message: string;
  data: Campaign;
  documentCreationSteps?: DocumentCreationStep[];
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

  /**
   * Create a new campaign with streaming updates
   */
  createCampaignStream: async (
    data: CreateCampaignData,
    onEvent: (event: CampaignStreamEvent) => void
  ): Promise<CampaignResponse> => {
    return new Promise((resolve, reject) => {
      // Reuse the same token source as Axios (stored under "user")
      const token = getAuthToken() || getUserData()?.token;
      if (!token) {
        reject(new Error("No authentication token found"));
        return;
      }

      const controller = new AbortController();
      // Align base URL with the Axios client (includes /api prefix if configured)
      const baseUrl =
        (API.defaults.baseURL as string | undefined) ||
        import.meta.env.VITE_APP_BACKEND_URL ||
        import.meta.env.VITE_API_URL ||
        "";

      fetch(`${baseUrl.replace(/\/$/, "")}/campaigns/create/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `HTTP error! status: ${response.status}, message: ${errorText}`
            );
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body reader available");
          }

          const decoder = new TextDecoder();
          let buffer = "";
          let campaignData: Campaign | null = null;

          const readStream = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();

                if (done) {
                  break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n\n");
                buffer = lines.pop() || ""; // Keep incomplete data in buffer

                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    try {
                      const eventData = JSON.parse(line.slice(6));
                      onEvent(eventData);

                      // Store campaign data when received
                      if (eventData.type === "campaign_created" && eventData.data) {
                        campaignData = eventData.data;
                      }

                      // Resolve promise on result or error
                      if (eventData.type === "result" && eventData.success) {
                        resolve({
                          success: true,
                          message: eventData.message || "Campaign created successfully",
                          data: campaignData || eventData.data,
                        });
                      } else if (eventData.type === "error") {
                        reject(
                          new Error(eventData.message || eventData.error || "Streaming error")
                        );
                      }
                    } catch (parseError) {
                      console.error("Failed to parse SSE data:", parseError);
                    }
                  } else if (line === "event: close") {
                    // Connection closed
                    break;
                  }
                }
              }
            } catch (error) {
              reject(error);
            }
          };

          readStream();
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            reject(error);
          }
        });
    });
  },
};

