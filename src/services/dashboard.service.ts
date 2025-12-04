import API from "@/utils/api";
import { CompaniesQueryParams } from "./companies.service";

export interface CommunicationEvent {
  id: string;
  type: "email" | "call" | "sms" | "whatsapp";
  direction: "inbound" | "outbound";
  subject?: string;
  body?: string;
  duration?: number;
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  createdAt: string;
  status: string;
}

export interface TopLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  momentumScore: number;
  summaryText: string;
  lastGeneratedAt: string;
  communicationCount: number;
  scoreType?: "communication" | "call" | "sequence";
}

export interface CalendarEvent {
  id: string;
  eventId: string;
  subject: string;
  body: string;
  location: string;
  startDateTime: string;
  endDateTime: string;
  durationMinutes: number;
  timezone: string;
  joinLink: string;
  webLink: string;
  status: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  scheduledBy: string;
  attendeesCount: number;
  createdAt: string;
}

export interface FollowupTask {
  id: string;
  followupPlanId: string;
  type: "email" | "call" | "whatsapp_message";
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  day: number;
  scheduledFor: string;
  notes: string;
  isComplete: boolean;
  planCreatedAt: string;
  planStatus: string;
}

export interface CampaignsStatistics {
  totalCampaigns: number;
  dailyCounts: Array<{
    date: string;
    count: number;
  }>;
}

export interface ScoreDistributionData {
  score: number;
  leadCount: number;
  scoreLabel: string;
}

export interface ScoreDistributionResponse {
  success: boolean;
  chartData: ScoreDistributionData[];
}

export interface DashboardResponse<T> {
  success: boolean;
  data: T;
}

export interface CrmStats {
  totalOutreach: number;
  totalResponse: number;
  activeClients: number;
  messagesSent: number;
}

export interface CompanyCrmStats extends CrmStats {
  totalCompanies: number;
  totalLeads: number;
}

export const dashboardService = {
  /**
   * Get high-level CRM statistics (outreach, responses, active clients, messages)
   */
  getCrmStats: async (): Promise<DashboardResponse<CrmStats>> => {
    try {
      const response = await API.get("/dashboard/crm-stats");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get CRM statistics scoped to filtered companies
   */
  getCompanyCrmStats: async (
    params: CompaniesQueryParams
  ): Promise<DashboardResponse<CompanyCrmStats>> => {
    try {
      const response = await API.get("/dashboard/companies-stats", {
        params,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get leads score distribution
   */
  getLeadsScoreDistribution: async (): Promise<ScoreDistributionResponse> => {
    try {
      const response = await API.get("/dashboard/leads-score-distribution");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get recent communications events
   */
  getRecentCommunications: async (): Promise<
    DashboardResponse<CommunicationEvent[]>
  > => {
    try {
      const response = await API.get("/dashboard/recent-communications");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get top leads by score
   */
  getTopLeads: async (): Promise<DashboardResponse<TopLead[]>> => {
    try {
      const response = await API.get("/dashboard/top-leads");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get recent calendar events
   */
  getRecentCalendarEvents: async (): Promise<
    DashboardResponse<CalendarEvent[]>
  > => {
    try {
      const response = await API.get("/dashboard/recent-calendar-events");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get recent followup tasks
   */
  getRecentFollowupTasks: async (): Promise<
    DashboardResponse<FollowupTask[]>
  > => {
    try {
      const response = await API.get("/dashboard/recent-followup-tasks");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get campaigns statistics
   */
  getCampaignsStatistics: async (): Promise<
    DashboardResponse<CampaignsStatistics>
  > => {
    try {
      const response = await API.get("/dashboard/campaigns-statistics");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
