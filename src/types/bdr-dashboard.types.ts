// BDR/SDR Dashboard Types
export interface DailyGoalTracker {
  conversationsStarted: {
    current: number;
    dailyTarget: number;
    weeklyTarget: number;
  };
  meetingsBooked: {
    current: number;
    dailyTarget: number;
    weeklyTarget: number;
  };
  qualifiedOpportunities: {
    current: number;
    dailyTarget: number;
    weeklyTarget: number;
  };
}

export interface PriorityLead {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  lastInteraction: string | null;
  recommendedAction: "call" | "email" | "follow-up" | "meeting";
  priorityReason: string;
  urgencyScore: number;
  conversionLikelihood: number;
  slaRisk: boolean;
}

export interface PersonalPipelineSnapshot {
  activeOpportunities: {
    count: number;
    totalValue: number;
    byStage: {
      new: number;
      contacted: number;
      qualified: number;
      meetingSet: number;
    };
    riskIndicator: "low" | "medium" | "high";
  };
  meetingsBooked: {
    today: number;
    thisWeek: number;
    showUps: number;
    noShows: number;
    upcomingNext48h: Array<{
      id: string;
      leadName: string;
      scheduledTime: string;
      type: string;
    }>;
  };
}

export interface ExecutionQuality {
  speedToLead: {
    medianResponseTime: number; // in minutes
    slaCompliance: "on_track" | "at_risk";
    compliancePercentage: number;
  };
  followupConsistency: {
    executionRate: number; // percentage
    missedFollowups: Array<{
      id: string;
      leadName: string;
      dueDate: string;
      type: string;
    }>;
  };
  conversationEffectiveness: {
    positiveResponses: number;
    objectionsEncountered: number;
    qualityScore: number; // AI-derived score 0-100
  };
}

export interface TalkTrackSuggestion {
  leadId: string;
  leadName: string;
  companyName: string;
  openingLine: string;
  discoveryQuestions: string[];
  likelyObjections: Array<{
    objection: string;
    suggestedResponse: string;
  }>;
  recommendedNextStep: string;
  context: {
    dealStage: string;
    priorInteractions: string[];
    leadProfile: string;
  };
}

export interface MessageSuggestion {
  type: "email" | "linkedin" | "sms";
  subject?: string;
  draftContent: string;
  tone: "formal" | "consultative" | "direct";
  alternativeVersions: string[];
}

export interface PersonalActivitySummary {
  today: {
    callsMade: number;
    emailsSent: number;
    conversationsHeld: number;
    aiCallsHandled: number;
  };
  week: {
    callsMade: number;
    emailsSent: number;
    conversationsHeld: number;
    aiCallsHandled: number;
  };
  timeAllocation: {
    sellingTime: number; // percentage
    adminTime: number;
    proposalSupport: number;
    followupTime: number;
  };
}

export interface PersonalConversionRates {
  contactToConversation: {
    rate: number;
    personalAverage: number;
    trend: "up" | "down" | "stable";
  };
  conversationToMeeting: {
    rate: number;
    personalAverage: number;
    trend: "up" | "down" | "stable";
  };
  meetingToQualified: {
    rate: number;
    personalAverage: number;
    trend: "up" | "down" | "stable";
  };
}

export interface CoachingInsight {
  type: "suggestion" | "observation" | "strength";
  title: string;
  description: string;
  actionable: boolean;
  priority: "high" | "medium" | "low";
}

export interface AtRiskItem {
  id: string;
  type: "sla_breach" | "overdue_followup" | "missing_prep" | "stalled_deal";
  leadName: string;
  companyName: string;
  reason: string;
  daysSince: number;
  quickAction: {
    label: string;
    action: string;
    params?: Record<string, any>;
  };
  priority: "urgent" | "high" | "medium";
}

export interface BDRDashboardData {
  dailyGoals: DailyGoalTracker;
  priorityQueue: PriorityLead[];
  pipelineSnapshot: PersonalPipelineSnapshot;
  executionQuality: ExecutionQuality;
  talkTrack?: TalkTrackSuggestion;
  messageSuggestions: MessageSuggestion[];
  activitySummary: PersonalActivitySummary;
  conversionRates: PersonalConversionRates;
  coachingInsights: CoachingInsight[];
  atRiskItems: AtRiskItem[];
}

export interface DashboardResponse<T> {
  success: boolean;
  data: T;
}