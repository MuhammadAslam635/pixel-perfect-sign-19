import API from "@/utils/api";

export interface Notification {
  _id: string;
  sender_id?: string;
  receiver_id?: string;
  type: string;
  type_id?: string;
  message: string;
  is_read: string; // "Yes" or "No"
  createdAt: string;
  updatedAt?: string;
  title?: string;
  meta?: string;
}

export interface NotificationResponse {
  success: boolean;
  notification?: Notification[]; // API returns "notification" not "notifications"
  notifications?: Notification[]; // Keep for backwards compatibility
  unreadNotificationCount?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    unreadCount?: number;
  };
}

export const notificationService = {
  /**
   * Get all notifications for the current user
   */
  getNotifications: async (
    page: number = 1,
    limit: number = 10,
    unreadOnly: boolean = false
  ): Promise<NotificationResponse> => {
    try {
      const response = await API.get("/notifications", {
        params: { page, limit, unreadOnly },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: string): Promise<any> => {
    try {
      const response = await API.post(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<any> => {
    try {
      const response = await API.post("/notifications/read-all");
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};
