import API from "@/utils/api";
import {
  SendEmailRequest,
  SendEmailResponse,
  GetInboxEmailsParams,
  GetInboxEmailsResponse,
  GetEmailThreadsParams,
  GetEmailThreadsResponse,
  GetThreadResponse,
  GetEmailResponse,
  UpdateEmailReadRequest,
  UpdateEmailStarRequest,
  GetEmailStatsResponse,
} from "@/types/email.types";

export const emailService = {
  /**
   * Send an email via Mailgun
   */
  sendEmail: async (data: SendEmailRequest): Promise<SendEmailResponse> => {
    try {
      const response = await API.post("/emails/send", data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get inbox emails with pagination and filters
   */
  getInboxEmails: async (
    params?: GetInboxEmailsParams
  ): Promise<GetInboxEmailsResponse> => {
    try {
      const response = await API.get("/emails/inbox", { params });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get email threads with pagination and filters
   */
  getEmailThreads: async (
    params?: GetEmailThreadsParams
  ): Promise<GetEmailThreadsResponse> => {
    try {
      const response = await API.get("/emails/threads", { params });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get a specific thread with all emails
   */
  getThread: async (threadId: string): Promise<GetThreadResponse> => {
    try {
      const response = await API.get(`/emails/threads/${threadId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get a specific email by ID
   */
  getEmail: async (emailId: string): Promise<GetEmailResponse> => {
    try {
      const response = await API.get(`/emails/${emailId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Mark email as read/unread
   */
  markEmailRead: async (
    emailId: string,
    data: UpdateEmailReadRequest
  ): Promise<GetEmailResponse> => {
    try {
      const response = await API.patch(`/emails/${emailId}/read`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Star/unstar an email
   */
  starEmail: async (
    emailId: string,
    data: UpdateEmailStarRequest
  ): Promise<GetEmailResponse> => {
    try {
      const response = await API.patch(`/emails/${emailId}/star`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Delete an email
   */
  deleteEmail: async (
    emailId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await API.delete(`/emails/${emailId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get email statistics
   */
  getEmailStats: async (): Promise<GetEmailStatsResponse> => {
    try {
      const response = await API.get("/emails/stats");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
