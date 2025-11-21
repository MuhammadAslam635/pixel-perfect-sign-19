import API from "@/utils/api";

export interface TwilioTokenResponse {
  token: string;
}

export interface TwilioMessageRequest {
  to: string;
  body: string;
}

export interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  date_created?: string;
}

export type LeadSmsDirection = "inbound" | "outbound";

export interface LeadSmsMessage {
  _id: string;
  leadId?: string | null;
  companyId: string;
  userId?: string | null;
  direction: LeadSmsDirection;
  from: string;
  to: string;
  body: string;
  status: string;
  twilioSid?: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface LeadSmsMessagesResponse {
  success: boolean;
  data: LeadSmsMessage[];
  pagination: {
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}

export type LeadCallStatus =
  | "completed"
  | "failed"
  | "cancelled"
  | "missed"
  | "in-progress";

export interface LeadCallLog {
  _id: string;
  companyId: string;
  leadId?: string | null;
  userId?: string | null;
  direction: "inbound" | "outbound";
  status: LeadCallStatus;
  channel: string;
  from?: string | null;
  to?: string | null;
  leadName?: string | null;
  leadPhone?: string | null;
  durationSeconds: number;
  startedAt: string;
  endedAt?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LeadCallLogsResponse {
  success: boolean;
  data: LeadCallLog[];
  pagination: {
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  };
}

export interface CreateLeadCallLogPayload {
  leadId: string;
  startedAt: string;
  durationSeconds: number;
  endedAt?: string;
  status?: LeadCallStatus;
  direction?: "inbound" | "outbound";
  channel?: string;
  to?: string | null;
  from?: string | null;
  leadName?: string | null;
  leadPhone?: string | null;
  metadata?: Record<string, any>;
}

export const twilioService = {
  /**
   * Get Twilio access token for voice calls
   */
  getToken: async (): Promise<TwilioTokenResponse> => {
    try {
      const response = await API.get<TwilioTokenResponse>("/twilio/token");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Send SMS message via Twilio
   */
  sendMessage: async (
    data: TwilioMessageRequest
  ): Promise<TwilioMessageResponse> => {
    try {
      const response = await API.post<TwilioMessageResponse>(
        "/twilio/message",
        data
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Fetch SMS messages associated with a lead
   */
  getLeadMessages: async (
    leadId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<LeadSmsMessagesResponse> => {
    try {
      const response = await API.get(`/twilio/messages/${leadId}`, {
        params,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Send an SMS message to a lead
   */
  sendLeadMessage: async (
    leadId: string,
    payload: { body: string }
  ): Promise<TwilioMessageResponse> => {
    try {
      const response = await API.post(`/twilio/messages/${leadId}`, payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Fetch call logs associated with a lead
   */
  getLeadCallLogs: async (
    leadId: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<LeadCallLogsResponse> => {
    try {
      const response = await API.get(`/twilio/calls/${leadId}`, {
        params,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Record a completed lead call
   */
  logLeadCall: async (
    payload: CreateLeadCallLogPayload
  ): Promise<{ success: boolean; data: LeadCallLog }> => {
    try {
      const response = await API.post("/twilio/calls", payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

