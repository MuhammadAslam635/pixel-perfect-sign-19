// Onboarding Types

export type OnboardingStatus =
  | "not_started"
  | "draft"
  | "in_progress"
  | "completed"
  | "approved"
  | "rejected";

export interface OnboardingQuestions {
  // Step 1: Company website
  website?: string;
  address?: string;
  postalCode?: string;
  country?: string;

  // Step 2: Company Info
  companyName?: string;
  businessDescription?: string;
  coreOfferings?: string[];
  preferredCountries?: string[];

  // Step 3: ICP
  idealCustomerProfile?: string;

  // Step 4: Data & Partners + Strategy
  existingPartners?: string;
  dataChannels?: string;
  differentiators?: string;
}

export interface ICPSuggestion {
  title: string;
  description: string;
}

export interface SupportingDocument {
  _id?: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  fileType?: string;
  uploadedAt: string;
  updatedAt?: string;
}

export interface OnboardingData {
  _id: string;
  companyId: string;
  questions: OnboardingQuestions;
  isMetaConnected: boolean;
  isGoogleConnected: boolean;
  isMicrosoftConnected: boolean;
  supportingDocuments: SupportingDocument[];
  status: OnboardingStatus;
  lastUpdated: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Admin fields
  adminNotes?: string;
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  // Google integration
  googleDeveloperToken?: string | null;
  googleCustomerId?: string | null;
}

export interface OnboardingResponse {
  success: boolean;
  data: OnboardingData;
  message?: string;
}

export interface OnboardingStatusResponse {
  success: boolean;
  data: {
    status: OnboardingStatus;
    completedAt: string | null;
    lastUpdated: string;
    isMetaConnected: boolean;
    isGoogleConnected: boolean;
  };
}

export interface OnboardingUpdateData {
  questions?: Partial<OnboardingQuestions>;
  isMetaConnected?: boolean;
  isGoogleConnected?: boolean;
  status?: OnboardingStatus;
}

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  data: {
    uploadedCount: number;
    documents: SupportingDocument[];
  };
}

// Step configuration for the wizard
export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  fields: (keyof OnboardingQuestions)[];
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Company website",
    description: "Enter your website link",
    fields: ["website"],
  },
  {
    id: 2,
    title: "Company Info",
    description: "Tell us about your company",
    fields: [
      "companyName",
      "businessDescription",
      "coreOfferings",
      "preferredCountries",
      "address",
      "postalCode",
      "country",
    ],
  },
  {
    id: 3,
    title: "ICP",
    description: "Define your Ideal Customer Profile",
    fields: ["idealCustomerProfile"],
  },
  {
    id: 4,
    title: "Data & Partners",
    description:
      "Tell us what makes you different and upload supporting documents",
    fields: ["differentiators"],
  },
];
