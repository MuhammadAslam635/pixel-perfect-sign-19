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

export interface GenerateEmailCopyInput {
  companyId: string;
  personId: string;
  emailType?: EmailType;
  tone?: EmailTone;
  length?: EmailLength;
  customInstructions?: string;
}

export interface EmailCopy {
  subject: string;
  preheader?: string;
  body: string;
  bodyHtml: string;
  cta?: string;
  ps?: string;
}

export interface EmailCopyMetadata {
  recipientName?: string;
  recipientPosition?: string;
  companyName?: string;
  emailType?: string;
  tone?: string;
  length?: string;
  customInstructions?: string | null;
  wordCount?: number;
}

export interface GenerateEmailCopyResponse {
  success: boolean;
  message?: string;
  data: {
    email: EmailCopy;
    metadata?: EmailCopyMetadata;
  };
}

export interface GeneratePhoneScriptInput {
  companyId: string;
  personId: string;
  callObjective?: string;
  scriptLength?: "short" | "medium" | "long" | string;
  customInstructions?: string;
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
    metadata?: PhoneScriptMetadata;
  };
}

export interface GenerateConnectionMessageInput {
  companyId: string;
  personId: string;
  tone?: string;
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
  characterCount?: number;
  person?: ConnectionMessagePerson;
  company?: ConnectionMessageCompany;
}

export interface GenerateConnectionMessageResponse {
  success: boolean;
  message?: string;
  data: ConnectionMessageData;
}

export const connectionMessagesService = {
  generateEmailCopy: async (
    payload: GenerateEmailCopyInput
  ): Promise<GenerateEmailCopyResponse> => {
    const response = await API.post("/connection-messages/email-copy", payload);
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
};
