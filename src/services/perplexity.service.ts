import axios from "axios";
import { ICPSuggestion } from "@/types/onboarding.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export interface GenerateICPRequest {
  website: string;
  companyName?: string;
  businessDescription?: string;
}

export interface GenerateICPResponse {
  success: boolean;
  data: {
    suggestions: ICPSuggestion[];
  };
  message?: string;
}

class PerplexityService {
  /**
   * Generate ICP suggestions using Perplexity AI
   */
  async generateICPSuggestions(
    data: GenerateICPRequest
  ): Promise<GenerateICPResponse> {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.post<GenerateICPResponse>(
        `${API_BASE_URL}/onboarding/generate-icp`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("Error generating ICP suggestions:", error);
      throw new Error(
        error?.response?.data?.message ||
          "Failed to generate ICP suggestions"
      );
    }
  }
}

export const perplexityService = new PerplexityService();

