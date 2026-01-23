import { CreateFeedbackPayload, Feedback, FeedbackResponse, UpdateFeedbackPayload } from "@/types/feedback.types";
import API from "@/utils/api";

export const feedbackService = {
    /**
     * Get all feedbacks
     */
    getAllFeedbacks: async (params?: { userId?: string; status?: string; page?: number; limit?: number }): Promise<any> => {
        try {
            const queryParams = new URLSearchParams();
            if (params?.userId) queryParams.append('userId', params.userId);
            if (params?.status) queryParams.append('status', params.status);
            if (params?.page) queryParams.append('page', params.page.toString());
            if (params?.limit) queryParams.append('limit', params.limit.toString());

            const response = await API.get<FeedbackResponse>(`/feedback?${queryParams.toString()}`);
            return response?.data?.data;
        } catch (error: any) {
            console.error("Failed to fetch feedbacks:", error);
            throw error;
        }
    },

    /**
     * Get feedback statistics (Admin only)
     */
    getFeedbackStats: async (): Promise<any> => {
        try {
            const response = await API.get("/feedback/stats");
            return response?.data?.data;
        } catch (error: any) {
            console.error("Failed to fetch feedback statistics:", error);
            throw error;
        }
    },

    /**
     * Get single feedback by ID
     */
    getFeedbackById: async (id: string): Promise<Feedback> => {
        try {
            const response = await API.get<any>(`/feedback/${id}`);
            return response?.data?.data;
        } catch (error: any) {
            console.error("Failed to fetch feedback:", error);
            throw error;
        }
    },
    /**
 * Create feedbacks
 */
    createFeedback: async (payload: FormData | CreateFeedbackPayload): Promise<Feedback> => {
        try {
            const config = payload instanceof FormData
                ? { headers: { 'Content-Type': 'multipart/form-data' } }
                : {};

            const res = await API.post("/feedback", payload, config);
            return res.data.data;
        } catch (error: any) {
            console.error("Failed to create feedback:", error);
            throw error;
        }
    },

    /**
 * Update feedback
 */
    updateFeedback: async (id: string, payload: FormData | UpdateFeedbackPayload): Promise<Feedback> => {
        try {
            const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};

            const res = await API.put(`/feedback/${id}`, payload, config);
            return res.data.data;
        } catch (error: any) {
            console.error("Failed to update feedback:", error);
            throw error;
        }
    },

    /**
     * Delete feedback
     */
    deleteFeedback: async (id: string): Promise<void> => {
        try {
            await API.delete(`/feedback/${id}`);
        } catch (error: any) {
            console.error("Failed to delete feedback:", error);
            throw error;
        }
    },

    /**
     * Download feedback attachment
     */
    downloadAttachment: async (fileUrl: string): Promise<Blob> => {
        try {
            // Remove /api prefix if present since baseURL already includes it
            // fileUrl from DB is like /api/feedback/files/filename.jpg
            // baseURL is like http://.../api
            const cleanUrl = fileUrl.startsWith('/api/') ? fileUrl.substring(4) : fileUrl;
            
            const response = await API.get(cleanUrl, {
                responseType: 'blob',
            });
            return response.data;
        } catch (error: any) {
            console.error("Failed to download attachment:", error);
            throw error;
        }
    },
};