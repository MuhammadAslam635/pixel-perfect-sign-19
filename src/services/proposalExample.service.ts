import API from "@/utils/api";

export type ProposalExample = {
  _id: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  extractedText?: string;
  metadata?: {
    industry?: string;
    clientType?: string;
    projectType?: string;
    tags?: string[];
    dealValue?: number;
    successRate?: "won" | "lost" | "pending";
  };
  createdAt?: string;
  updatedAt?: string;
};

export type ProposalExampleListParams = {
  page?: number;
  limit?: number;
  search?: string;
  industry?: string;
  tags?: string;
};

export type ProposalExampleListResponse = {
  success: boolean;
  message: string;
  data: {
    examples: ProposalExample[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalDocs: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
};

export type ProposalExampleUploadMetadata = {
  industry?: string;
  clientType?: string;
  projectType?: string;
  tags?: string[];
  dealValue?: number;
  successRate?: "won" | "lost" | "pending";
};

export const proposalExampleService = {
  listExamples: async (
    params: ProposalExampleListParams = {}
  ): Promise<ProposalExampleListResponse> => {
    const response = await API.get("/proposal-examples/list", { params });
    return response.data;
  },

  uploadExample: async (
    file: File,
    metadata?: ProposalExampleUploadMetadata
  ) => {
    const formData = new FormData();
    formData.append("file", file);

    if (metadata) {
      if (metadata.industry) formData.append("industry", metadata.industry);
      if (metadata.clientType)
        formData.append("clientType", metadata.clientType);
      if (metadata.projectType)
        formData.append("projectType", metadata.projectType);
      if (metadata.tags)
        formData.append("tags", JSON.stringify(metadata.tags));
      if (metadata.dealValue)
        formData.append("dealValue", metadata.dealValue.toString());
      if (metadata.successRate)
        formData.append("successRate", metadata.successRate);
    }

    const response = await API.post("/proposal-examples/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteExample: async (exampleId: string) => {
    const response = await API.delete(`/proposal-examples/${exampleId}`);
    return response.data;
  },

  updateMetadata: async (
    exampleId: string,
    metadata: Partial<ProposalExampleUploadMetadata>
  ) => {
    const response = await API.patch(
      `/proposal-examples/${exampleId}/metadata`,
      metadata
    );
    return response.data;
  },

  searchExamples: async (query: string, limit = 5) => {
    const response = await API.post("/proposal-examples/search", {
      query,
      limit,
    });
    return response.data;
  },

  getStats: async () => {
    const response = await API.get("/proposal-examples/stats");
    return response.data;
  },
};
