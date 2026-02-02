export type FeedbackType = "improvement" | "failure" | "bug" | "error";
export type FeedbackStatus = "open" | "in-progress" | "closed";

export interface FeedbackAttachment {
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
}

export interface FeedbackAdminNote {
  content: string;
  addedBy: { _id: string; name?: string; email?: string } | string;
  addedAt: string;
}

export interface Feedback {
  _id: string;
  title: string;
  description?: string | null;
  type: FeedbackType;
  status: FeedbackStatus;
  attachments: FeedbackAttachment[];
  adminNotes?: FeedbackAdminNote[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
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
  adminNote?: string;
  attachments?: FeedbackAttachment[];
}

/** Support chat: one-to-one thread per feedback */
export interface FeedbackChatMessage {
  _id: string;
  feedbackChatId: string;
  senderId: { _id: string; name?: string; email?: string } | string;
  content: string;
  createdAt: string;
}

export interface FeedbackChat {
  _id: string;
  feedbackId: string;
  participantUserId: { _id: string; name?: string; email?: string } | string;
  participantSupportId: { _id: string; name?: string; email?: string } | string;
  createdAt: string;
}
