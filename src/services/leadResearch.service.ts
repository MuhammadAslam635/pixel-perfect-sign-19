import API from "@/utils/api";

/**
 * Lead Research Data Structure
 */
export interface ResearchData {
  professionalBackground: string;
  recentActivities: string[];
  news: Array<{
    title: string;
    summary: string;
    date: string;
  }>;
  painPoints: string[];
  opportunities: string[];
  researchedAt: string;
  status: "pending" | "completed" | "failed";
  error?: string;
}

/**
 * Lead Research Response
 */
export interface LeadResearchResponse {
  success: boolean;
  message: string;
  data?: {
    isResearched: boolean;
    researchData?: ResearchData;
    leadInfo?: {
      name: string;
      position: string;
      companyName: string;
    };
    status?: string;
  };
}

/**
 * Trigger Research Response
 */
export interface TriggerResearchResponse {
  success: boolean;
  message: string;
  data?: {
    jobId: string;
    queuePosition: number;
  };
}

/**
 * Queue Status Response
 */
export interface QueueStatusResponse {
  success: boolean;
  data: {
    queueLength: number;
    isProcessing: boolean;
    pendingJobs: number;
    processingJobs: number;
  };
}

/**
 * Lead Research Service
 * 
 * Handles API calls related to lead research powered by Perplexity AI
 */
export const leadResearchService = {
  /**
   * Get research data for a specific lead
   * @param leadId - The ID of the lead
   * @returns Promise with research data
   */
  getResearch: async (leadId: string): Promise<LeadResearchResponse> => {
    try {
      const response = await API.get(`/leads/${leadId}/research`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Manually trigger research for a specific lead
   * @param leadId - The ID of the lead
   * @returns Promise with job information
   */
  triggerResearch: async (leadId: string): Promise<TriggerResearchResponse> => {
    try {
      const response = await API.post(`/leads/${leadId}/research`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Trigger research for multiple leads
   * @param leadIds - Array of lead IDs
   * @returns Promise with bulk operation results
   */
  triggerBulkResearch: async (
    leadIds: string[]
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      total: number;
      queued: number;
      failed: number;
      notFound: number;
    };
  }> => {
    try {
      const response = await API.post("/leads/research/bulk", { leadIds });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get the current queue status
   * @returns Promise with queue statistics
   */
  getQueueStatus: async (): Promise<QueueStatusResponse> => {
    try {
      const response = await API.get("/leads/research/queue-status");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

