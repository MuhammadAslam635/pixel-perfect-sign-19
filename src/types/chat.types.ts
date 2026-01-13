export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessage = {
  _id: string;
  chatId: string;
  userId?: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  updatedAt?: string;
  confidence?: number;
};

export type ChatSummary = {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
};

export type ChatDetail = ChatSummary & {
  messages: ChatMessage[];
};

export type SendChatMessageResponse = {
  success: boolean;
  message: string;
  data: {
    chatId: string;
    messages: ChatMessage[];
    title?: string;
    createdAt?: string;
    updatedAt?: string;
    confidence?: number;
    [key: string]: unknown;
  };
  agentType?: string;
  uploadedFile?: {
    originalName: string;
    filename: string;
    size: number;
    path: string;
    publicUrl: string;
    mimeType: string;
    uploadedAt: string;
  };
};
