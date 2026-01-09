// Mock service for BDR Dashboard - Remove this when backend APIs are ready
import { BDRDashboardData, DashboardResponse } from "@/types/bdr-dashboard.types";

const mockBDRData: BDRDashboardData = {
  dailyGoals: {
    conversationsStarted: {
      current: 8,
      dailyTarget: 15,
      weeklyTarget: 75,
    },
    meetingsBooked: {
      current: 2,
      dailyTarget: 3,
      weeklyTarget: 15,
    },
    qualifiedOpportunities: {
      current: 1,
      dailyTarget: 2,
      weeklyTarget: 10,
    },
  },
  priorityQueue: [
    {
      id: "lead-1",
      name: "Sarah Johnson",
      companyName: "TechCorp Inc",
      email: "sarah.johnson@techcorp.com",
      phone: "+1-555-0123",
      lastInteraction: "2024-01-06T10:30:00Z",
      recommendedAction: "call",
      priorityReason: "High-value prospect, responded positively to initial outreach",
      urgencyScore: 9,
      conversionLikelihood: 85,
      slaRisk: false,
    },
    {
      id: "lead-2",
      name: "Michael Chen",
      companyName: "StartupXYZ",
      email: "m.chen@startupxyz.com",
      lastInteraction: "2024-01-04T14:15:00Z",
      recommendedAction: "email",
      priorityReason: "SLA breach - no contact in 4 days, previously engaged",
      urgencyScore: 8,
      conversionLikelihood: 70,
      slaRisk: true,
    },
    {
      id: "lead-3",
      name: "Emily Rodriguez",
      companyName: "Global Solutions",
      email: "emily.r@globalsolutions.com",
      phone: "+1-555-0456",
      lastInteraction: "2024-01-07T09:00:00Z",
      recommendedAction: "follow-up",
      priorityReason: "Requested pricing information, follow-up scheduled",
      urgencyScore: 7,
      conversionLikelihood: 75,
      slaRisk: false,
    },
  ],
  pipelineSnapshot: {
    activeOpportunities: {
      count: 24,
      totalValue: 485000,
      byStage: {
        new: 8,
        contacted: 10,
        qualified: 4,
        meetingSet: 2,
      },
      riskIndicator: "medium",
    },
    meetingsBooked: {
      today: 2,
      thisWeek: 7,
      showUps: 5,
      noShows: 1,
      upcomingNext48h: [
        {
          id: "meeting-1",
          leadName: "David Kim",
          scheduledTime: "2024-01-09T14:00:00Z",
          type: "Discovery Call",
        },
        {
          id: "meeting-2",
          leadName: "Lisa Wang",
          scheduledTime: "2024-01-09T16:30:00Z",
          type: "Demo",
        },
      ],
    },
  },
  executionQuality: {
    speedToLead: {
      medianResponseTime: 45, // minutes
      slaCompliance: "on_track",
      compliancePercentage: 87,
    },
    followupConsistency: {
      executionRate: 92,
      missedFollowups: [
        {
          id: "followup-1",
          leadName: "John Smith",
          dueDate: "2024-01-08T10:00:00Z",
          type: "email",
        },
      ],
    },
    conversationEffectiveness: {
      positiveResponses: 12,
      objectionsEncountered: 3,
      qualityScore: 78,
    },
  },
  talkTrack: {
    leadId: "lead-1",
    leadName: "Sarah Johnson",
    companyName: "TechCorp Inc",
    openingLine: "Hi Sarah, I noticed TechCorp recently expanded into the European market. I'd love to discuss how companies like yours are handling the compliance challenges that come with international growth.",
    discoveryQuestions: [
      "What's been your biggest challenge with managing compliance across different regions?",
      "How are you currently handling data privacy requirements in Europe?",
      "What would an ideal solution look like for your compliance team?",
    ],
    likelyObjections: [
      {
        objection: "We already have a compliance system in place",
        suggestedResponse: "That's great to hear you're being proactive about compliance. Many of our clients had existing systems too, but found they needed additional capabilities for international requirements. What specific challenges are you facing with your current setup?",
      },
      {
        objection: "We're not ready to make any changes right now",
        suggestedResponse: "I completely understand - timing is everything. Would it be helpful if I shared some insights about what other companies in your industry are doing to prepare for upcoming regulatory changes? No commitment needed, just valuable information.",
      },
    ],
    recommendedNextStep: "Schedule a 15-minute discovery call to understand their current compliance challenges and identify potential gaps in their international operations.",
    context: {
      dealStage: "Initial Contact",
      priorInteractions: ["Email opened", "LinkedIn profile viewed"],
      leadProfile: "VP of Compliance at mid-size tech company, recently expanded internationally",
    },
  },
  messageSuggestions: [
    {
      type: "email",
      subject: "Quick question about TechCorp's European expansion",
      draftContent: "Hi Sarah,\n\nI saw the announcement about TechCorp's expansion into Europe - congratulations! I work with similar companies navigating international compliance requirements.\n\nWould you be open to a brief 15-minute call to discuss some strategies that have worked well for other tech companies in your situation?\n\nBest regards,",
      tone: "consultative",
      alternativeVersions: [
        "More direct version focusing on specific compliance pain points",
        "Casual version mentioning mutual connections in the industry",
      ],
    },
  ],
  activitySummary: {
    today: {
      callsMade: 12,
      emailsSent: 25,
      conversationsHeld: 8,
      aiCallsHandled: 3,
    },
    week: {
      callsMade: 58,
      emailsSent: 142,
      conversationsHeld: 34,
      aiCallsHandled: 15,
    },
    timeAllocation: {
      sellingTime: 65,
      adminTime: 20,
      proposalSupport: 10,
      followupTime: 5,
    },
  },
  conversionRates: {
    contactToConversation: {
      rate: 24,
      personalAverage: 22,
      trend: "up",
    },
    conversationToMeeting: {
      rate: 18,
      personalAverage: 16,
      trend: "up",
    },
    meetingToQualified: {
      rate: 45,
      personalAverage: 42,
      trend: "stable",
    },
  },
  coachingInsights: [
    {
      type: "suggestion",
      title: "Try asking about budget earlier in discovery calls",
      description: "Your conversion rate improves by 23% when budget is discussed in the first call vs. waiting until the second meeting.",
      actionable: true,
      priority: "high",
    },
    {
      type: "strength",
      title: "Excellent follow-up consistency",
      description: "Your follow-up execution rate of 92% is well above the team average of 78%. Keep up the great work!",
      actionable: false,
      priority: "low",
    },
  ],
  atRiskItems: [
    {
      id: "risk-1",
      type: "sla_breach",
      leadName: "Robert Taylor",
      companyName: "Enterprise Corp",
      reason: "No contact in 8 days - SLA requires contact within 5 days",
      daysSince: 8,
      quickAction: {
        label: "Send Follow-up Email",
        action: "send_email",
        params: { templateId: "sla_recovery" },
      },
      priority: "urgent",
    },
    {
      id: "risk-2",
      type: "overdue_followup",
      leadName: "Amanda Foster",
      companyName: "Innovation Labs",
      reason: "Follow-up email was due 2 days ago",
      daysSince: 2,
      quickAction: {
        label: "Send Overdue Follow-up",
        action: "send_followup",
        params: { followupId: "followup-123" },
      },
      priority: "high",
    },
  ],
};

export const bdrDashboardMockService = {
  getBDRDashboardData: async (): Promise<DashboardResponse<BDRDashboardData>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      data: mockBDRData,
    };
  },

  getTalkTrack: async (leadId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: mockBDRData.talkTrack,
    };
  },

  executeQuickAction: async (itemId: string, action: string, params?: Record<string, any>) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      data: { success: true },
    };
  },

  updateDailyGoals: async (goals: any) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: mockBDRData.dailyGoals,
    };
  },
};