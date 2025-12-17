import API from "@/utils/api";

export interface WhatsAppCredential {
  id: string;
  companyId: string;
  businessAccountId: string;
  phoneNumberId: string;
  phoneNumber: string;
  status: string;
  tokens?: {
    accessToken?: string | null;
    verifyToken?: string | null;
    appSecret?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

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
  async getConnections(): Promise<{
    success: boolean;
    credentials: WhatsAppCredential[];
  }> {
    const response = await API.get("/whatsapp/connection");
    return response.data;
  }

  async connect(payload: {
    businessAccountId: string;
    phoneNumberId: string;
    phoneNumber: string;
    accessToken: string;
    verifyToken: string;
    appSecret?: string;
  }): Promise<{
    success: boolean;
    message: string;
    credential: WhatsAppCredential;
  }> {
    const response = await API.post("/whatsapp/connection", payload);
    return response.data;
  }

  async disconnect(
    phoneNumberId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await API.delete(`/whatsapp/connection/${phoneNumberId}`);
    return response.data;
  }

  async sendTextMessage(payload: {
    phoneNumberId: string;
    to: string;
    body: string;
    previewUrl?: boolean;
  }): Promise<{ success: boolean; data: WhatsAppMessage }> {
    const response = await API.post("/whatsapp/messages/send", {
      phoneNumberId: payload.phoneNumberId,
      to: payload.to,
      type: "text",
      text: {
        body: payload.body,
        previewUrl: payload.previewUrl ?? false,
      },
    });
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
    phoneNumberId?: string;
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
    phoneNumberId?: string;
  }): Promise<{ success: boolean; message: string }> {
    const response = await API.delete("/whatsapp/messages/conversation", {
      params,
    });
    return response.data;
  }

  async markMessagesRead(payload: {
    phoneNumberId: string;
    messageIds: string[];
  }): Promise<{
    success: boolean;
    data: Array<{ messageId: string; status: string }>;
  }> {
    const response = await API.post("/whatsapp/messages/mark-read", payload);
    return response.data;
  }

  async deleteMessage(messageId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await API.delete(`/whatsapp/messages/${messageId}`);
    return response.data;
  }

  async validateConfig(payload: {
    businessAccountId: string;
    phoneNumberId: string;
    accessToken: string;
    appSecret?: string;
  }): Promise<{
    success: boolean;
    message: string;
    data?: {
      phoneNumberId: string;
      businessAccountId: string;
      verifiedAt: string;
    };
  }> {
    const response = await API.post("/integration/whatsapp/validate", payload);
    return response.data;
  }
}

export const whatsappService = new WhatsAppService();
