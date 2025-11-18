import API from "@/utils/api";

export interface FollowupTemplateUser {
  _id: string;
  name?: string;
  email?: string;
}

export interface FollowupTemplate {
  _id: string;
  userId?: FollowupTemplateUser | null;
  companyId?: FollowupTemplateUser | null;
  title: string;
  numberOfDaysToRun: string;
  numberOfEmails: string;
  numberOfCalls: string;
  numberOfWhatsappMessages: string;
  timeOfDayToRun: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowupTemplatesPaginated {
  docs: FollowupTemplate[];
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

export interface FollowupTemplatesResponse {
  success: boolean;
  message: string;
  data: FollowupTemplatesPaginated;
}

export interface FollowupTemplateResponse {
  success: boolean;
  message: string;
  data: FollowupTemplate;
}

export interface FollowupTemplatesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export type FollowupTemplatePayload = Omit<
  FollowupTemplate,
  "_id" | "userId" | "companyId" | "createdAt" | "updatedAt"
>;

const buildQueryParams = (params: FollowupTemplatesQueryParams = {}) => {
  const { page = 1, limit = 10, search } = params;

  const query: Record<string, string | number> = { page, limit };

  if (search) {
    query.search = search;
  }

  return query;
};

export const followupTemplatesService = {
  getTemplates: async (
    params: FollowupTemplatesQueryParams = {}
  ): Promise<FollowupTemplatesResponse> => {
    const response = await API.get("/followup/templates", {
      params: buildQueryParams(params),
    });

    return response.data;
  },

  getTemplateById: async (id: string): Promise<FollowupTemplateResponse> => {
    const response = await API.get(`/followup/templates/${id}`);
    return response.data;
  },

  createTemplate: async (
    payload: FollowupTemplatePayload
  ): Promise<FollowupTemplateResponse> => {
    const response = await API.post("/followup/templates", payload);
    return response.data;
  },

  updateTemplate: async (
    id: string,
    payload: Partial<FollowupTemplatePayload>
  ): Promise<FollowupTemplateResponse> => {
    const response = await API.put(`/followup/templates/${id}`, payload);
    return response.data;
  },

  deleteTemplate: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await API.delete(`/followup/templates/${id}`);
    return response.data;
  },

  duplicateTemplate: async (
    id: string
  ): Promise<FollowupTemplateResponse> => {
    const response = await API.post(`/followup/templates/${id}/duplicate`);
    return response.data;
  },
};

export type {
  FollowupTemplate as FollowupTemplateDto,
  FollowupTemplatesQueryParams as FollowupTemplateFilters,
};

