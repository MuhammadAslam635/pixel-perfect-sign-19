export type FeedbackType = "improvement" | "failure" | "bug" | "error";
export type FeedbackStatus = "open" | "closed";

export interface FeedbackAttachment {
    fileId?: string;
    fileName?: string;
    fileUrl?: string;
}

export interface Feedback {
    _id: string;
    title: string;
    description?: string | null;
    type: FeedbackType;
    status: FeedbackStatus;
    attachments: FeedbackAttachment[];
    createdBy: string;     // User ID
    createdAt: string;     // ISO date string
    updatedAt: string;     // ISO date string
}

export interface FeedbackResponse {
    success: boolean;
    data: Feedback[];
}


export interface CreateFeedbackPayload {
    title: string;
    description?: string;
    type: FeedbackType;
    attachments?: FeedbackAttachment[];
}


export interface UpdateFeedbackPayload {
    title?: string;
    description?: string;
    type?: FeedbackType;
    status?: FeedbackStatus;
    attachments?: FeedbackAttachment[];
}