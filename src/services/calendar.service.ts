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
  };
}

export const calendarService = {
  scheduleMeeting: async (
    payload: ScheduleMeetingPayload
  ): Promise<ScheduleMeetingResponse> => {
    const response = await API.post("/calendar/schedule-meeting", payload);
    return response.data;
  },
};

