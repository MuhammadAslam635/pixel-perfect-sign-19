import API from "@/utils/api";

export interface Proposal {
  _id: string;
  companyId: string;
  leadId: string;
  content: string;
  htmlContent?: string;
  sentBy: {
    _id: string;
    name: string;
    email: string;
  };
  sentAt: string;
  emailSent: boolean;
  emailAddress?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SaveProposalInput {
  leadId: string;
  content: string;
  htmlContent?: string;
  emailSent?: boolean;
  emailAddress?: string;
  metadata?: any;
}

export interface SaveProposalResponse {
  success: boolean;
  message: string;
  data: {
    proposal: Proposal;
  };
}

export interface GetProposalsResponse {
  success: boolean;
  data: {
    proposals: Proposal[];
    total: number;
  };
}

export interface GetProposalResponse {
  success: boolean;
  data: {
    proposal: Proposal;
  };
}

export interface DeleteProposalResponse {
  success: boolean;
  message: string;
}

export const proposalService = {
  /**
   * Save a sent proposal
   */
  saveProposal: async (
    payload: SaveProposalInput
  ): Promise<SaveProposalResponse> => {
    const response = await API.post("/proposals", payload);
    return response.data;
  },

  /**
   * Get all proposals for a lead
   */
  getProposalsByLead: async (leadId: string): Promise<GetProposalsResponse> => {
    const response = await API.get(`/proposals/lead/${leadId}`);
    return response.data;
  },

  /**
   * Get a single proposal by ID
   */
  getProposalById: async (proposalId: string): Promise<GetProposalResponse> => {
    const response = await API.get(`/proposals/${proposalId}`);
    return response.data;
  },

  /**
   * Delete a proposal
   */
  deleteProposal: async (
    proposalId: string
  ): Promise<DeleteProposalResponse> => {
    const response = await API.delete(`/proposals/${proposalId}`);
    return response.data;
  },
};
