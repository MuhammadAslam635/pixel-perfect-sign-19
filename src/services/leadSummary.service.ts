import API from "@/utils/api";

export interface LeadSummary {
  leadId: string | null;
  companyId: string | null;
  status: "pending" | "completed" | "failed";
  summary: string | null;
  momentumScore: number | null;
  llmModel?: string | null;
  lastGeneratedAt?: string | null;
  lastRequestedAt?: string | null;
  failureReason?: string | null;
  sources?: {
    whatsappCount: number;
    smsCount: number;
    callCount: number;
    emailCount: number;
    timeRange?: {
      from: string | null;
      to: string | null;
    };
  };
  metadata?: Record<string, any>;
  updatedAt?: string;
  createdAt?: string;
}

export interface LeadSummaryResponse {
  success: boolean;
  message: string;
  data: LeadSummary | null;
}

export const leadSummaryService = {
  getSummary: async (leadId: string): Promise<LeadSummaryResponse> => {
    const response = await API.get(`/leads/${leadId}/summary`);
    return response.data;
  },
  refreshSummary: async (leadId: string): Promise<LeadSummaryResponse> => {
    const response = await API.post(`/leads/${leadId}/summary/refresh`);
    return response.data;
  },
};


