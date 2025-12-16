// Onboarding Types

export type OnboardingStatus = 'not_started' | 'draft' | 'in_progress' | 'completed' | 'approved' | 'rejected';

export interface OnboardingQuestions {
  // Section 1: Company Overview
  companyName?: string;
  website?: string;
  businessDescription?: string;
  mainProductService?: string;
  coreOfferings?: string[];
  idealCustomerProfile?: string;
  primaryBusinessGoals?: string;

  // Section 2: Current Operations & Challenges
  currentChallenges?: string;
  challengeDuration?: string;
  previousAttempts?: string;
  existingTeams?: string;
  currentTechStack?: string;

  // Section 3: Data, Systems & Partners
  existingPartners?: string;
  dataChannels?: string;
  preferredCountries?: string;

  // Section 4: Strategy, Differentiation & Assets
  differentiators?: string;
}

export interface SupportingDocument {
  _id?: string;
  fileName: string;
  filePath: string;
  uploadedAt: string;
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
    title: 'Company Overview',
    description: 'Tell us about your company and goals',
    fields: ['companyName', 'website', 'businessDescription', 'mainProductService', 'coreOfferings', 'idealCustomerProfile', 'primaryBusinessGoals'],
  },
  {
    id: 2,
    title: 'Operations & Challenges',
    description: 'Share your current challenges and tech stack',
    fields: ['currentChallenges', 'challengeDuration', 'previousAttempts', 'existingTeams', 'currentTechStack'],
  },
  {
    id: 3,
    title: 'Data & Partners',
    description: 'Tell us about your systems and partnerships',
    fields: ['existingPartners', 'dataChannels', 'preferredCountries'],
  },
  {
    id: 4,
    title: 'Strategy & Assets',
    description: 'What makes you different and upload documents',
    fields: ['differentiators'],
  },
];
