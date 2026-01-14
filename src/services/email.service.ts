import API from "@/utils/api";
import {
  SendEmailRequest,
  SendEmailResponse,
  GetInboxEmailsParams,
  GetInboxEmailsResponse,
  GetSentEmailsParams,
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
      if (data.attachments && data.attachments.length > 0) {
        const formData = new FormData();
        
        // Append all text fields
        Object.keys(data).forEach((key) => {
          if (key !== "attachments") {
            const value = data[key as keyof SendEmailRequest];
            if (Array.isArray(value)) {
              // For arrays like 'to', 'cc', we likely need to append them individually or as JSON
              // Mailgun often accepts comma-separated strings or repeated fields.
              // Let's assume the backend controller expects them parsed.
              // Since we are changing backend, we can decide how to handle.
              // Safest is to append as is, axios serializes array slightly differently.
              // But usually for FormData, we append each item with same key.
              value.forEach((item) => formData.append(key, item));
            } else if (value !== undefined) {
              formData.append(key, String(value));
            }
          }
        });

        // Append files
        data.attachments.forEach((file) => {
          formData.append("attachments", file);
        });

        const response = await API.post("/emails/send", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } else {
        const response = await API.post("/emails/send", data);
        return response.data;
      }
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
   * Get emails for a specific lead
   */
  getLeadEmails: async (
    leadId: string,
    params?: GetInboxEmailsParams
  ): Promise<GetInboxEmailsResponse> => {
    try {
      const response = await API.get(`/emails/lead/${leadId}`, { params });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get sent emails with pagination and filters
   */
  getSentEmails: async (
    params?: GetSentEmailsParams
  ): Promise<GetInboxEmailsResponse> => {
    try {
      const response = await API.get("/emails/sent", { params });
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

  /**
   * Batch categorize emails using AI
   */
  batchCategorizeEmails: async (
    limit?: number
  ): Promise<{ success: boolean; message: string; data: any[] }> => {
    try {
      const response = await API.post("/emails/categorize/batch", { limit });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
