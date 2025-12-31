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

export type DashboardPeriod = "all" | "7d" | "30d" | "90d" | "1y";

export interface CrmStats {
  totalOutreach: number;
  totalDealsClosed: number;
  activeClients: number;
  messagesSent: number;
}

export interface CompanyCrmStats extends CrmStats {
  totalCompanies: number;
  totalLeads: number;
  totalCompaniesWithPeople?: number;
  totalCompaniesWithWebsite?: number;
}

// New Analytics Cards Interfaces
export interface ActiveQualifiedLeadsData {
  activeLeads: number;
  totalLeads: number;
  percentage: number;
}

export interface WinRateData {
  closedLeads: number;
  totalLeads: number;
  winRate: number;
  period: string;
}

export interface SpeedToLeadData {
  activeLeads: number;
}

export interface LeadAtRiskDetails {
  _id: string;
  name: string;
  companyName: string;
  stage: string;
  lastContact: string | null;
  daysSinceContact: number;
  email?: string;
  phone?: string;
}

export interface RevenueAtRiskData {
  leadsAtRisk: number;
  threshold: string;
  leadsDetails: LeadAtRiskDetails[];
}

export interface ChannelExecutionRate {
  total: number;
  completed: number;
  rate: number;
}

export interface FollowupExecutionData {
  overall: ChannelExecutionRate;
  byChannel: {
    email: ChannelExecutionRate;
    call: ChannelExecutionRate;
    whatsapp: ChannelExecutionRate;
  };
}

export interface ProposalThroughputData {
  rfpsReceived: number;
  proposalsSubmitted: number;
  avgCycleTimeDays: number;
  complianceScore: number | null;
  period: string;
}

export interface DealAtRisk {
  _id: string;
  name: string;
  companyName: string;
  stage: string;
  lastContact: string | null;
  daysSinceContact: number;
  daysSinceProposal: number | null;
  riskReason: "proposal_stalled" | "no_followup" | "no_response";
  recommendedAction: string;
  riskScore: number;
  email?: string;
  phone?: string;
}

export interface DealsAtRiskData {
  dealsAtRisk: DealAtRisk[];
  threshold: string;
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

  /**
   * Get count of leads filtered by activity type
   */
  getLeadsCountByActivity: async (
    activityType: string
  ): Promise<DashboardResponse<{ count: number; activityType: string }>> => {
    try {
      const response = await API.get("/dashboard/leads-count-by-activity", {
        params: { activityType },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get activity breakdown counts
   */
  getActivityBreakdown: async (): Promise<DashboardResponse<any>> => {
    try {
      const response = await API.get("/dashboard/activity-breakdown");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get total count of all leads from all companies
   */
  getTotalLeadsCount: async (
    params?: { period?: DashboardPeriod }
  ): Promise<DashboardResponse<{ count: number }>> => {
    try {
      const response = await API.get("/dashboard/total-leads-count", { params });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // New Analytics Cards API Methods

  /**
   * Get active qualified leads count and percentage
   */
  getActiveQualifiedLeads: async (): Promise<
    DashboardResponse<ActiveQualifiedLeadsData>
  > => {
    try {
      const response = await API.get("/dashboard/active-qualified-leads");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get win rate metrics with optional period filter
   */
  getWinRate: async (params?: {
    period?: "30d" | "90d" | "all";
  }): Promise<DashboardResponse<WinRateData>> => {
    try {
      const response = await API.get("/dashboard/win-rate", { params });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get speed to lead metric (active leads count)
   */
  getSpeedToLead: async (): Promise<DashboardResponse<SpeedToLeadData>> => {
    try {
      const response = await API.get("/dashboard/speed-to-lead");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get revenue at risk (leads not contacted in 7+ days)
   */
  getRevenueAtRisk: async (): Promise<
    DashboardResponse<RevenueAtRiskData>
  > => {
    try {
      const response = await API.get("/dashboard/revenue-at-risk");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get follow-up execution rate by channel
   */
  getFollowupExecutionRate: async (): Promise<
    DashboardResponse<FollowupExecutionData>
  > => {
    try {
      const response = await API.get("/dashboard/followup-execution-rate");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get proposal throughput metrics with optional period filter
   */
  getProposalThroughput: async (params?: {
    period?: "30d" | "90d" | "all";
  }): Promise<DashboardResponse<ProposalThroughputData>> => {
    try {
      const response = await API.get("/dashboard/proposal-throughput", {
        params,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get deals at risk (no activity in 2+ days)
   */
  getDealsAtRisk: async (): Promise<DashboardResponse<DealsAtRiskData>> => {
    try {
      const response = await API.get("/dashboard/deals-at-risk");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
