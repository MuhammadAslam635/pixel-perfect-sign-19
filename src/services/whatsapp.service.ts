import API from "@/utils/api";

export interface WhatsAppThread {
  contactPhone: string;
  contactName?: string | null;
  phoneNumberId: string;
  lastMessageAt: string;
  lastMessage?: string | null;
  lastDirection: "outbound" | "inbound" | "system";
  lastType: string;
  lastStatus: string;
}

export interface WhatsAppMessage {
  _id: string;
  companyId: string;
  userId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  } | string | null;
  phoneNumberId: string;
  contactPhone: string;
  contactName?: string | null;
  direction: "outbound" | "inbound" | "system";
  type: string;
  messageId?: string | null;
  messageStatus: string;
  textBody?: string | null;
  templateName?: string | null;
  templateLanguage?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  interactive?: Record<string, unknown> | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

type PaginatedResponse<T> = {
  success: boolean;
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

class WhatsAppService {
  async sendTextMessage(payload: {
    to: string;
    text: string;
    leadId?: string;
  }): Promise<{ success: boolean; data: WhatsAppMessage }> {
    const response = await API.post("/whatsapp/messages/send", payload);
    return response.data;
  }

  async getThreads(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<WhatsAppThread[]>> {
    const response = await API.get("/whatsapp/messages", { params });
    return response.data;
  }

  async getConversation(params: {
    contact: string;
    leadId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<WhatsAppMessage[]>> {
    const response = await API.get("/whatsapp/messages/conversation", {
      params,
    });
    return response.data;
  }

  async deleteConversation(params: {
    contact: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await API.delete("/whatsapp/messages/conversation", {
      params,
    });
    return response.data;
  }

  async deleteMessage(messageId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await API.delete(`/whatsapp/messages/${messageId}`);
    return response.data;
  }
}

export const whatsappService = new WhatsAppService();
