import API from "@/utils/api";

export interface FollowupPlanPersonRef {
  _id: string;
  name?: string;
  email?: string;
  position?: string;
  companyName?: string;
}

export interface FollowupPlanTemplateRef {
  _id: string;
  title?: string;
  numberOfDaysToRun?: string;
  numberOfEmails?: string;
  numberOfCalls?: string;
  numberOfWhatsappMessages?: string;
}

export interface FollowupPlanTodo {
  _id: string;
  type: "email" | "call" | "whatsapp_message";
  personId: FollowupPlanPersonRef | string;
  day?: number;
  scheduledFor?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  isComplete: boolean;
}

export interface FollowupPlan {
  _id: string;
  templateId: string | FollowupPlanTemplateRef;
  jobId?: string | null;
  userId: string;
  companyId?: string | null;
  status: "scheduled" | "in_progress" | "completed" | "failed";
  startDate: string;
  summary?: string;
  llmModel?: string;
  metadata?: Record<string, unknown>;
  todo: FollowupPlanTodo[];
  createdAt: string;
  updatedAt: string;
}

export interface FollowupPlanScheduleDay {
  day: number;
  date: string; // YYYY-MM-DD format
  tasks: FollowupPlanTodo[];
}

export interface FollowupPlanSchedule {
  totalDays: number;
  startDate: string;
  days: FollowupPlanScheduleDay[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
  };
}

export interface FollowupPlanWithSchedule extends FollowupPlan {
  schedule: FollowupPlanSchedule;
}

export interface FollowupPlansPaginated {
  docs: FollowupPlan[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface FollowupPlansQueryParams {
  page?: number;
  limit?: number;
  templateId?: string;
  jobId?: string;
}

export interface FollowupPlansResponse {
  success: boolean;
  message: string;
  data: FollowupPlansPaginated;
}

export interface FollowupPlanResponse {
  success: boolean;
  message: string;
  data: FollowupPlan;
}

export interface FollowupPlanScheduleResponse {
  success: boolean;
  message: string;
  data: FollowupPlanWithSchedule;
}

export interface DeleteFollowupPlanResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    status: FollowupPlan["status"];
  };
}

export interface FollowupPlanStats {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  failedPlans: number;
  totalTouchpoints: number;
  avgDaysPerPlan: number | null;
  avgTouchpointsPerPlan: number | null;
}

export interface FollowupPlanStatsResponse {
  success: boolean;
  message: string;
  data: FollowupPlanStats;
}

export interface FollowupPlanSchedulePayload {
  enabled?: boolean;
  timezone?: string;
  cronExpression?: string;
  startDate?: string;
  llmModel?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateFollowupPlanPayload {
  templateId: string;
  personIds: string[];
  startDate?: string;
  timezone?: string;
  llmModel?: string;
  metadata?: Record<string, unknown>;
  schedule?: FollowupPlanSchedulePayload;
}

export interface UpdateFollowupPlanPayload {
  todo?: Array<{
    _id?: string;
    type: "email" | "call" | "whatsapp_message";
    personId: string;
    day?: number;
    scheduledFor?: string | null;
    notes?: string;
    metadata?: Record<string, unknown>;
    isComplete?: boolean;
  }>;
}

export const followupPlansService = {
  getPlans: async (
    params: FollowupPlansQueryParams = {}
  ): Promise<FollowupPlansResponse> => {
    const response = await API.get("/followup/plans", { params });
    return response.data;
  },

  getPlanById: async (id: string): Promise<FollowupPlanResponse> => {
    const response = await API.get(`/followup/plans/${id}`);
    return response.data;
  },

  createPlan: async (
    payload: CreateFollowupPlanPayload
  ): Promise<FollowupPlanResponse> => {
    const response = await API.post("/followup/plans", payload);
    return response.data;
  },

  updatePlan: async (
    id: string,
    payload: UpdateFollowupPlanPayload
  ): Promise<FollowupPlanResponse> => {
    const response = await API.put(`/followup/plans/${id}`, payload);
    return response.data;
  },

  deletePlan: async (id: string): Promise<DeleteFollowupPlanResponse> => {
    const response = await API.delete(`/followup/plans/${id}`);
    return response.data;
  },

  getPlanSchedule: async (
    id: string
  ): Promise<FollowupPlanScheduleResponse> => {
    const response = await API.get(`/followup/plans/${id}/schedule`);
    return response.data;
  },

  getPlanStats: async (): Promise<FollowupPlanStatsResponse> => {
    const response = await API.get("/followup/plans/stats");
    return response.data;
  },
};

export default followupPlansService;
