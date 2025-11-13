import API from "@/utils/api";

export type CompanyKnowledgeFile = {
  _id: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type CompanyKnowledgePagination = {
  currentPage: number;
  totalPages: number;
  totalDocs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type CompanyKnowledgeListResponse = {
  success: boolean;
  message?: string;
  data: {
    files: CompanyKnowledgeFile[];
    pagination: CompanyKnowledgePagination;
  };
};

export type CompanyKnowledgeUploadResponse = {
  success: boolean;
  message: string;
  data: {
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    extractedTextLength: number;
    createdAt: string;
  };
};

export type CompanyKnowledgeDeleteResponse = {
  success: boolean;
  message: string;
};

export type CompanyKnowledgeSearchResponse = {
  success: boolean;
  data: {
    results: Array<{
      content: string;
      metadata: Record<string, unknown>;
      score: number;
    }>;
    query: string;
    totalResults: number;
  };
};

export type CompanyKnowledgeStatsResponse = {
  success: boolean;
  data: Record<string, unknown>;
};

export type CompanyKnowledgeListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export const companyKnowledgeService = {
  listFiles: async (
    params: CompanyKnowledgeListParams = {}
  ): Promise<CompanyKnowledgeListResponse> => {
    const response = await API.get("/company-knowledge/files/list", {
      params,
    });
    return response.data;
  },

  uploadFile: async (
    file: File,
    options?: { companyId?: string }
  ): Promise<CompanyKnowledgeUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.companyId) {
      formData.append("companyId", options.companyId);
    }

    const response = await API.post(
      "/company-knowledge/files/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  deleteFile: async (
    fileId: string
  ): Promise<CompanyKnowledgeDeleteResponse> => {
    const response = await API.delete(`/company-knowledge/files/${fileId}`);
    return response.data;
  },

  searchFiles: async (
    query: string,
    limit = 5
  ): Promise<CompanyKnowledgeSearchResponse> => {
    const response = await API.post("/company-knowledge/files/search", {
      query,
      limit,
    });
    return response.data;
  },

  getStats: async (): Promise<CompanyKnowledgeStatsResponse> => {
    const response = await API.get("/company-knowledge/files/stats");
    return response.data;
  },
};
