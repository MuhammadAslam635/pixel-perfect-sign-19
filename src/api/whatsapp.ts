import API from "@/utils/api";

export interface WhatsAppCredential {
  id: string;
  companyId: string;
  businessAccountId: string;
  phoneNumberId: string;
  phoneNumber: string;
  webhookUrl?: string | null;
  status: string;
  lastSyncedAt?: string | null;
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

export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getWhatsAppConnections = async () => {
  const response = await API.get<{
    success: boolean;
    credentials: WhatsAppCredential[];
  }>("/whatsapp/connection");
  return response.data;
};

export const connectWhatsApp = async (payload: {
  businessAccountId: string;
  phoneNumberId: string;
  phoneNumber: string;
  accessToken: string;
  verifyToken: string;
  appSecret?: string;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
}) => {
  const response = await API.post<{
    success: boolean;
    message: string;
    credential: WhatsAppCredential;
  }>("/whatsapp/connection", payload);
  return response.data;
};

export const disconnectWhatsApp = async (phoneNumberId: string) => {
  const response = await API.delete<{ success: boolean; message: string }>(
    `/whatsapp/connection/${phoneNumberId}`
  );
  return response.data;
};

export const sendWhatsAppTextMessage = async (payload: {
  phoneNumberId: string;
  to: string;
  body: string;
  previewUrl?: boolean;
}) => {
  const response = await API.post<{ success: boolean; data: WhatsAppMessage }>(
    "/whatsapp/messages/send",
    {
      phoneNumberId: payload.phoneNumberId,
      to: payload.to,
      type: "text",
      text: {
        body: payload.body,
        previewUrl: payload.previewUrl ?? false,
      },
    }
  );
  return response.data;
};

export const getWhatsAppThreads = async (params?: {
  page?: number;
  limit?: number;
}) => {
  const response = await API.get<PaginatedResponse<WhatsAppThread[]>>(
    "/whatsapp/messages",
    {
      params,
    }
  );
  return response.data;
};

export const getWhatsAppConversation = async (params: {
  contact: string;
  phoneNumberId?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await API.get<PaginatedResponse<WhatsAppMessage[]>>(
    "/whatsapp/messages/conversation",
    {
      params,
    }
  );
  return response.data;
};

export const deleteWhatsAppConversation = async (params: {
  contact: string;
  phoneNumberId?: string;
}) => {
  const response = await API.delete<{ success: boolean; message: string }>(
    "/whatsapp/messages/conversation",
    {
      params,
    }
  );
  return response.data;
};

