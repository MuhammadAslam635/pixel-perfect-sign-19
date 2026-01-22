import { CreateFeedbackPayload, Feedback, FeedbackResponse, UpdateFeedbackPayload } from "@/types/feedback.types";
import API from "@/utils/api";

export const feedbackService = {
    /**
     * Get all feedbacks
     */
    getAllFeedbacks: async (): Promise<Feedback[]> => {
        try {
            const response = await API.get<FeedbackResponse>("/feedback");
            return response?.data?.data?.feedbacks;
        } catch (error: any) {
            console.error("Failed to fetch feedbacks:", error);
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
};