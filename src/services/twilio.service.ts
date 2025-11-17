import API from "@/utils/api";

export interface TwilioTokenResponse {
  token: string;
}

export interface TwilioMessageRequest {
  to: string;
  body: string;
}

export interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  date_created?: string;
}

export const twilioService = {
  /**
   * Get Twilio access token for voice calls
   */
  getToken: async (): Promise<TwilioTokenResponse> => {
    try {
      const response = await API.get<TwilioTokenResponse>("/twilio/token");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Send SMS message via Twilio
   */
  sendMessage: async (
    data: TwilioMessageRequest
  ): Promise<TwilioMessageResponse> => {
    try {
      const response = await API.post<TwilioMessageResponse>(
        "/twilio/message",
        data
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

