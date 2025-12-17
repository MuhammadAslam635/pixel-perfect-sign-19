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

export interface GenerateProposalInput {
  companyId: string;
  personId: string;
  regenerate?: boolean;
}

export interface ProposalData {
  proposal: string;
  proposalId?: string;
  metadata?: any;
  isExisting?: boolean;
}

export interface GenerateProposalResponse {
  success: boolean;
  message?: string;
  data: ProposalData;
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
  recipientEmail?: string; // Optional: if provided, will check for lead and generate personalized content
}

export interface EnhanceEmailContentData {
  originalContent: string;
  enhancedContent: string;
  enhancedContentHtml?: string;
  subject?: string;
  tone: string;
  characterCount: number;
  wordCount: number;
  recipientInfo?: {
    name: string;
    email: string;
    position?: string;
    company?: string;
    isLead: boolean;
  };
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

// Prompt Management Types
export type PromptType = "linkedin" | "email" | "phone" | "whatsapp";
export type PromptCategory =
  | "system"
  | "human"
  | "bulk_system"
  | "bulk_human"
  | "enhance_system"
  | "enhance_human";

export type PromptStage =
  | "new"
  | "interested"
  | "followup"
  | "appointment_booked"
  | "proposal_sent"
  | "followup_close"
  | "closed"
  | "general";

export interface Prompt {
  _id: string;
  companyId?: string | null;
  promptType: PromptType;
  promptCategory: PromptCategory;
  stage: PromptStage;
  content: string;
  name?: string;
  description?: string;
  metadata?: {
    tone?: string;
    emailType?: string;
    callObjective?: string;
    scriptLength?: string;
    version?: number;
    isDefault?: boolean;
    model?: string;
    temperature?: number;
  };
  isActive: boolean;
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    _id: string;
    name: string;
  };
  createdByUser?: {
    _id: string;
    name: string;
    email: string;
  };
  lastModifiedByUser?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface CreatePromptInput {
  companyId?: string | null;
  promptType: PromptType;
  promptCategory: PromptCategory;
  stage?: PromptStage;
  content: string;
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface GetPromptsResponse {
  success: boolean;
  data: {
    prompts: Prompt[];
    total: number;
  };
}

export interface CreatePromptResponse {
  success: boolean;
  message: string;
  data: {
    prompt: Prompt;
    isUpdate: boolean;
  };
}

export interface DeletePromptResponse {
  success: boolean;
  message: string;
}

// Available Models Types
export interface AIModel {
  id: string;
  name: string;
  created?: number;
  owned_by?: string;
}

export interface GetAvailableModelsData {
  models: AIModel[];
  total: number;
  isFallback?: boolean;
}

export interface GetAvailableModelsResponse {
  success: boolean;
  message?: string;
  data: GetAvailableModelsData;
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

  // Prompt Management
  getPrompts: async (params?: {
    companyId?: string;
    promptType?: PromptType;
    promptCategory?: PromptCategory;
  }): Promise<GetPromptsResponse> => {
    const response = await API.get("/connection-messages/prompts", { params });
    return response.data;
  },

  createOrUpdatePrompt: async (
    payload: CreatePromptInput
  ): Promise<CreatePromptResponse> => {
    const response = await API.post("/connection-messages/prompts", payload);
    return response.data;
  },

  deletePrompt: async (promptId: string): Promise<DeletePromptResponse> => {
    const response = await API.delete(
      `/connection-messages/prompts/${promptId}`
    );
    return response.data;
  },

  getAvailableModels: async (): Promise<GetAvailableModelsResponse> => {
    const response = await API.get("/connection-messages/models");
    return response.data;
  },

  generateProposal: async (
    payload: GenerateProposalInput
  ): Promise<GenerateProposalResponse> => {
    const response = await API.post("/connection-messages/proposal", payload);
    return response.data;
  },
};
