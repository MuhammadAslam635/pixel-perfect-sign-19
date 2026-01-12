import API from "@/utils/api";
import {
  BDRDashboardData,
  DailyGoalTracker,
  PriorityLead,
  PersonalPipelineSnapshot,
  ExecutionQuality,
  TalkTrackSuggestion,
  MessageSuggestion,
  PersonalActivitySummary,
  PersonalConversionRates,
  CoachingInsight,
  AtRiskItem,
  DashboardResponse,
} from "@/types/bdr-dashboard.types";

export const bdrDashboardService = {
  /**
   * Get complete BDR dashboard data
   */
  getBDRDashboardData: async (): Promise<
    DashboardResponse<BDRDashboardData>
  > => {
    try {
      const response = await API.get("/dashboard/bdr-overview");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching BDR dashboard data:", error);
      throw error;
    }
  },

  /**
   * Get daily goal tracker data
   */
  getDailyGoals: async (): Promise<DashboardResponse<DailyGoalTracker>> => {
    try {
      const response = await API.get("/dashboard/bdr/daily-goals");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get priority queue of leads to contact today
   */
  getPriorityQueue: async (): Promise<DashboardResponse<PriorityLead[]>> => {
    try {
      const response = await API.get("/dashboard/bdr/priority-queue");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get personal pipeline snapshot
   */
  getPipelineSnapshot: async (): Promise<
    DashboardResponse<PersonalPipelineSnapshot>
  > => {
    try {
      const response = await API.get("/dashboard/bdr/pipeline-snapshot");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get execution quality metrics
   */
  getExecutionQuality: async (): Promise<
    DashboardResponse<ExecutionQuality>
  > => {
    try {
      const response = await API.get("/dashboard/bdr/execution-quality");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get contextual talk track for specific lead
   */
  getTalkTrack: async (
    leadId: string
  ): Promise<DashboardResponse<TalkTrackSuggestion>> => {
    try {
      const response = await API.get(`/dashboard/bdr/talk-track/${leadId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching talk track:", error);
      throw error;
    }
  },

  /**
   * Get message suggestions for current context
   */
  getMessageSuggestions: async (params?: {
    leadId?: string;
    type?: "email" | "linkedin" | "sms";
  }): Promise<DashboardResponse<MessageSuggestion[]>> => {
    try {
      const response = await API.get("/dashboard/bdr/message-suggestions", {
        params,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get personal activity summary
   */
  getActivitySummary: async (): Promise<
    DashboardResponse<PersonalActivitySummary>
  > => {
    try {
      const response = await API.get("/dashboard/bdr/activity-summary");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get personal conversion rates
   */
  getConversionRates: async (): Promise<
    DashboardResponse<PersonalConversionRates>
  > => {
    try {
      const response = await API.get("/dashboard/bdr/conversion-rates");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get AI-generated coaching insights
   */
  getCoachingInsights: async (): Promise<
    DashboardResponse<CoachingInsight[]>
  > => {
    try {
      const response = await API.get("/dashboard/bdr/coaching-insights");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get at-risk items requiring immediate attention
   */
  getAtRiskItems: async (): Promise<DashboardResponse<AtRiskItem[]>> => {
    try {
      const response = await API.get("/dashboard/bdr/at-risk-items");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Execute quick action for at-risk item
   */
  executeQuickAction: async (
    itemId: string,
    action: string,
    params?: Record<string, any>
  ): Promise<DashboardResponse<{ success: boolean }>> => {
    try {
      // Special handling for send_email action
      if (action === "send_email" && params?.leadId) {
        const response = await API.post(`/dashboard/bdr/send-followup-email/${params.leadId}`);
        return response.data;
      }
      
      // Default quick action handler
      const response = await API.post(`/dashboard/bdr/quick-action/${itemId}`, {
        action,
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error("Error executing quick action:", error);
      throw error;
    }
  },

  /**
   * Send AI-generated follow-up email to a lead
   */
  sendFollowUpEmail: async (
    leadId: string
  ): Promise<DashboardResponse<{ emailSent: boolean }>> => {
    try {
      const response = await API.post(`/dashboard/bdr/send-followup-email/${leadId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error sending follow-up email:", error);
      throw error;
    }
  },

  /**
   * Update daily goal targets
   */
  updateDailyGoals: async (
    goals: Partial<DailyGoalTracker>
  ): Promise<DashboardResponse<DailyGoalTracker>> => {
    try {
      const response = await API.put("/dashboard/bdr/daily-goals", goals);
      return response.data;
    } catch (error: any) {
      console.error("Error updating daily goals:", error);
      throw error;
    }
  },
};
