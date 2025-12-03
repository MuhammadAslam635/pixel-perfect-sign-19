import API from "@/utils/api";

export type EmailTone =
  | "professional"
  | "friendly"
  | "casual"
  | "authoritative"
  | string;

export type EmailType =
  | "introduction"
  | "follow_up"
  | "value_proposition"
  | "partnership"
  | "event_invitation"
  | string;

export type EmailLength = "short" | "medium" | "long" | string;

export interface GenerateEmailMessageInput {
  companyId: string;
  personId: string;
  emailType?: EmailType;
  tone?: EmailTone;
  length?: EmailLength;
  customInstructions?: string;
  regenerate?: boolean;
}

export interface EmailMessage {
  subject: string;
  preheader?: string;
  body: string;
  bodyHtml: string;
  cta?: string;
  ps?: string;
}

export interface EmailMessageMetadata {
  recipientName?: string;
  recipientPosition?: string;
  companyName?: string;
  emailType?: string;
  tone?: string;
  length?: string;
  customInstructions?: string | null;
  wordCount?: number;
}

export interface GenerateEmailMessageResponse {
  success: boolean;
  message?: string;
  data: {
    email: EmailMessage;
    messageId?: string;
    messageMetadata?: EmailMessageMetadata;
    isExisting?: boolean;
  };
}

export interface GeneratePhoneScriptInput {
  companyId: string;
  personId: string;
  callObjective?: string;
  scriptLength?: "short" | "medium" | "long" | string;
  customInstructions?: string;
  regenerate?: boolean;
}

export interface PhoneScriptMetadata {
  prospectName?: string;
  prospectPosition?: string;
  companyName?: string;
  callObjective?: string;
  scriptLength?: string;
  estimatedDuration?: string;
}

export interface GeneratePhoneScriptResponse {
  success: boolean;
  message?: string;
  data: {
    script: string;
    messageId?: string;
    metadata?: PhoneScriptMetadata;
    isExisting?: boolean;
  };
}

export interface GenerateConnectionMessageInput {
  companyId: string;
  personId: string;
  tone?: string;
  regenerate?: boolean;
}

export interface ConnectionMessagePerson {
  id: string;
  name: string;
  position?: string;
  company?: string;
  linkedinUrl?: string;
}

export interface ConnectionMessageCompany {
  id: string;
  name: string;
  industry?: string;
}

export interface ConnectionMessageData {
  connectionMessage: string;
  messageId?: string;
  characterCount?: number;
  person?: ConnectionMessagePerson;
  company?: ConnectionMessageCompany;
  metadata?: any;
  isExisting?: boolean;
}

export interface GenerateConnectionMessageResponse {
  success: boolean;
  message?: string;
  data: ConnectionMessageData;
}

export interface EnhanceEmailContentInput {
  content: string;
  tone?: EmailTone;
  context?: string;
}

export interface EnhanceEmailContentData {
  originalContent: string;
  enhancedContent: string;
  tone: string;
  characterCount: number;
  wordCount: number;
}

export interface EnhanceEmailContentResponse {
  success: boolean;
  message?: string;
  data: EnhanceEmailContentData;
}

export interface UpdateConnectionMessageInput {
  messageId: string;
  instructions: string;
  messageType: "linkedin" | "email" | "phone";
}

export interface UpdateConnectionMessageData {
  messageId: string;
  messageType: "linkedin" | "email" | "phone";
  content: string;
  subject?: string;
  bodyHtml?: string;
  cta?: string;
  ps?: string;
  metadata?: any;
  generationCount: number;
}

export interface UpdateConnectionMessageResponse {
  success: boolean;
  message?: string;
  data: UpdateConnectionMessageData;
}

export const connectionMessagesService = {
  generateEmailMessage: async (
    payload: GenerateEmailMessageInput
  ): Promise<GenerateEmailMessageResponse> => {
    const response = await API.post("/connection-messages/email", payload);
    return response.data;
  },

  generatePhoneScript: async (
    payload: GeneratePhoneScriptInput
  ): Promise<GeneratePhoneScriptResponse> => {
    const response = await API.post(
      "/connection-messages/phone-script",
      payload
    );
    return response.data;
  },

  generateConnectionMessage: async (
    payload: GenerateConnectionMessageInput
  ): Promise<GenerateConnectionMessageResponse> => {
    const response = await API.post("/connection-messages/generate", payload);
    return response.data;
  },

  enhanceEmailContent: async (
    payload: EnhanceEmailContentInput
  ): Promise<EnhanceEmailContentResponse> => {
    const response = await API.post(
      "/connection-messages/enhance-content",
      payload
    );
    return response.data;
  },

  updateConnectionMessage: async (
    payload: UpdateConnectionMessageInput
  ): Promise<UpdateConnectionMessageResponse> => {
    const response = await API.put("/connection-messages/update", payload);
    return response.data;
  },
};
