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
    meetingJoinLink?: string;
    leadMeetingId?: string | null;
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
  source: "lead_meeting" | "microsoft_graph";
  provider: string;
  id: string;
  eventId: string;
  title: string;
  body?: string;
  start: string;
  end: string;
  allDay: boolean;
  timezone: string;
  location?: string;
  attendees?: Array<{
    email: string;
    name: string;
    status: string;
  }>;
  status: "scheduled" | "completed" | "cancelled";
  joinLink?: string | null;
  webLink?: string | null;
  linkedPerson?: {
    id: string;
    name: string;
    email: string;
    companyName?: string;
  } | null;
  leadMeetingId?: string;
  autoSelectedSlot?: boolean;
  metadata?: Record<string, unknown>;
  rawEvent?: Record<string, unknown>;
  rawDoc?: Record<string, unknown>;
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
};

export default calendarService;

