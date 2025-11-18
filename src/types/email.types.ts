// Email-related types for Mailgun integration

export interface EmailRecipient {
  email: string;
  name?: string | null;
}

export interface EmailBody {
  text?: string;
  html?: string;
}

export interface EmailDeliveryStatus {
  delivered?: boolean;
  deliveredAt?: string;
  opened?: boolean;
  openedAt?: string;
  clicked?: boolean;
  clickedAt?: string;
  bounced?: boolean;
  bouncedAt?: string;
  bounceReason?: string;
  complained?: boolean;
  complainedAt?: string;
}

export interface EmailSentiment {
  score: number;
  label: "positive" | "negative" | "neutral";
  analyzedAt?: string;
}

export interface Email {
  _id: string;
  userId: string;
  mailgunMessageId?: string;
  from: EmailRecipient;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  body: EmailBody;
  inReplyTo?: string | null;
  references?: string[];
  threadId?: string;
  direction: "inbound" | "outbound";
  status: "sent" | "delivered" | "bounced" | "complained";
  deliveryStatus: EmailDeliveryStatus;
  isRead: boolean;
  isStarred: boolean;
  isDeleted: boolean;
  sentiment?: EmailSentiment;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface EmailThread {
  _id: string;
  userId: string;
  subject: string;
  participants: EmailRecipient[];
  messageCount: number;
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageFrom: EmailRecipient;
  isStarred: boolean;
  isDeleted: boolean;
  overallSentiment?: EmailSentiment;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface SendEmailRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  threadId?: string;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
  data: Email;
}

export interface GetInboxEmailsParams {
  page?: number;
  limit?: number;
  unread?: boolean;
  starred?: boolean;
}

export interface GetEmailThreadsParams {
  page?: number;
  limit?: number;
  unread?: boolean;
  starred?: boolean;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetInboxEmailsResponse {
  success: boolean;
  data: {
    emails: Email[];
    pagination: PaginationInfo;
  };
}

export interface GetEmailThreadsResponse {
  success: boolean;
  data: {
    threads: EmailThread[];
    pagination: PaginationInfo;
  };
}

export interface GetThreadResponse {
  success: boolean;
  data: {
    thread: EmailThread;
    emails: Email[];
  };
}

export interface GetEmailResponse {
  success: boolean;
  data: Email;
}

export interface UpdateEmailReadRequest {
  isRead: boolean;
}

export interface UpdateEmailStarRequest {
  isStarred: boolean;
}

export interface EmailStats {
  totalEmails: number;
  unreadEmails: number;
  sentEmails: number;
  receivedEmails: number;
  starredEmails: number;
  totalThreads: number;
}

export interface GetEmailStatsResponse {
  success: boolean;
  data: EmailStats;
}

// Mailgun Configuration Types
export interface MailgunConfigRequest {
  apiKey: string;
  domain: string;
  apiUrl: string;
  webhookSigningKey: string;
}

export interface MailgunConfigResponse {
  success: boolean;
  message: string;
  data?: {
    domain: string;
    apiUrl: string;
  };
}
