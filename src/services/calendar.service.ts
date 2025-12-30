import API from "@/utils/api";

export interface ScheduleMeetingPayload {
  personId: string;
  subject?: string;
  body?: string;
  startDateTime?: string;
  endDateTime?: string;
  location?: string;
  durationMinutes?: number;
  findAvailableSlot?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface ScheduleMeetingResponse {
  success: boolean;
  message: string;
  data?: {
    eventId?: string;
    webLink?: string;
    subject?: string;
    startTime?: Record<string, unknown>;
    endTime?: Record<string, unknown>;
    timezone?: string;
    meetingJoinLink?: string;
    person?: {
      id: string;
      name: string;
      email: string;
      companyName?: string;
      timezone?: string;
    };
    followupPlansStopped?: string[];
    followupPlansStoppedCount?: number;
    leadMeetingId?: string | null;
    recall?: {
      status?: string;
      sessionId?: string | null;
      webhookUrl?: string | null;
    };
  };
}

export interface MicrosoftConnectionStatusResponse {
  success: boolean;
  connected: boolean;
  data?: {
    providerUserEmail?: string | null;
    lastSyncAt?: string | null;
  };
}

export interface LeadMeetingRecord {
  _id: string;
  personId: string;
  companyId: string;
  scheduledByUserId?: string | null;
  provider: string;
  eventId: string;
  subject: string;
  body?: string;
  location?: string;
  startDateTime: string;
  endDateTime: string;
  durationMinutes?: number | null;
  timezone?: string;
  joinLink?: string | null;
  webLink?: string | null;
  attendees?: Array<{
    email: string;
    name?: string | null;
    status?: string | null;
    responseTime?: string | null;
    _id?: string;
  }>;
  status: "scheduled" | "completed" | "cancelled";
  autoSelectedSlot?: boolean;
  metadata?: Record<string, unknown>;
  recall?: {
    status?: "scheduled" | "starting" | "active" | "ended" | "failed" | null;
    sessionId?: string | null;
    webhookUrl?: string | null;
    lastError?: string | null;
    transcriptUrl?: string | null;
    transcriptText?: string | null;
    transcriptStatus?: string | null;
    transcriptId?: string | null;
    transcriptProvider?: string | null;
    recordingUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface LeadMeetingsQuery {
  personId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  status?: string;
  sort?: "asc" | "desc";
}

export interface LeadMeetingsResponse {
  success: boolean;
  data: LeadMeetingRecord[];
  count: number;
}

export interface AvailableSlot {
  start: string;
  end: string;
  durationMinutes: number;
}

export interface AvailableSlotsQuery {
  startDate: string;
  endDate: string;
  durationMinutes?: number;
  intervalMinutes?: number;
  workingHours?: string;
  workingHoursTimeZone?: string;
  weekdaysOnly?: boolean | string;
}

export interface AvailableSlotsResponse {
  success: boolean;
  data: AvailableSlot[];
  count: number;
  searchRange?: {
    start: string;
    end: string;
  };
}

export interface DeleteMeetingResponse {
  success: boolean;
  message: string;
}

export interface SyncMeetingsPayload {
  startDate?: string;
  endDate?: string;
}

export interface SyncMeetingsResponse {
  success: boolean;
  message: string;
  data: {
    totalEvents: number;
    syncedMeetings: number;
    skippedEvents: number;
    meetings: LeadMeetingRecord[];
    skipped: Array<{
      eventId: string;
      subject: string;
      reason: string;
    }>;
  };
}

export interface EnhancedMeetingNotes {
  summary: string;
  keyPoints: string[];
  actionItems: Array<{
    description: string;
    assignee: string | null;
    dueDate: string | null;
    priority: "high" | "medium" | "low";
  }>;
  decisions: Array<{
    description: string;
    impact: string;
    participants: string[];
  }>;
  nextSteps: string[];
  insights: string;
  participants: Array<{
    name: string;
    role: string | null;
    keyContributions: string[];
  }>;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  topics: string[];
}

export interface MeetingNotesResponse {
  success: boolean;
  data: {
    enhancedNotes: EnhancedMeetingNotes | null;
    processed: boolean;
    processedAt: string | null;
    error: string | null;
    hasTranscript: boolean;
  };
}

export interface GenerateMeetingNotesPayload {
  force?: boolean;
}

export interface GenerateMeetingNotesResponse {
  success: boolean;
  message: string;
  data?: {
    enhancedNotes?: EnhancedMeetingNotes;
    processedAt?: string;
  };
}

export const calendarService = {
  scheduleMeeting: async (
    payload: ScheduleMeetingPayload
  ): Promise<ScheduleMeetingResponse> => {
    const response = await API.post("/calendar/schedule-meeting", payload);
    return response.data;
  },
  getMicrosoftConnectionStatus: async (): Promise<MicrosoftConnectionStatusResponse> => {
    const response = await API.get("/calendar/connection-status");
    return response.data;
  },
  getLeadMeetings: async (
    params: LeadMeetingsQuery
  ): Promise<LeadMeetingsResponse> => {
    const response = await API.get("/calendar/meetings", { params });
    return response.data;
  },
  getAvailableSlots: async (
    params: AvailableSlotsQuery
  ): Promise<AvailableSlotsResponse> => {
    const response = await API.get("/calendar/available-slots", { params });
    return response.data;
  },
  deleteMeeting: async (meetingId: string): Promise<DeleteMeetingResponse> => {
    const response = await API.delete(`/calendar/meeting/${meetingId}`);
    return response.data;
  },
  syncMeetings: async (payload: SyncMeetingsPayload = {}): Promise<SyncMeetingsResponse> => {
    const response = await API.post('/calendar/sync-meetings', payload);
    return response.data;
  },
  getMeetingRecording: async (meetingId: string): Promise<{
    success: boolean;
    data: {
      transcriptUrl?: string | null;
      transcriptText?: string | null;
      transcriptStatus?: string | null;
      transcriptId?: string | null;
      transcriptProvider?: string | null;
      recordingUrl?: string | null;
      status?: string;
      sessionId?: string | null;
    };
  }> => {
    const response = await API.get(`/recall/meeting/${meetingId}/recording`);
    return response.data;
  },
  getMeetingNotes: async (meetingId: string): Promise<MeetingNotesResponse> => {
    const response = await API.get(`/recall/meeting/${meetingId}/notes`);
    return response.data;
  },
  generateMeetingNotes: async (
    meetingId: string,
    payload: GenerateMeetingNotesPayload = {}
  ): Promise<GenerateMeetingNotesResponse> => {
    const response = await API.post(
      `/recall/meeting/${meetingId}/generate-notes`,
      payload
    );
    return response.data;
  },
};

export default calendarService;

