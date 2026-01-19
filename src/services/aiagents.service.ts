import { AgentDetails, AiAgents } from "@/types/aiagents.types";
import API from "@/utils/api";

export interface AiAgentsResponse {
    data: AiAgents[],
    message?: string,
}


export const aiAgentsService = {
    /**
     * Get all AI Agents from API
     */
    getAllAgents: async (): Promise<AiAgents[]> => {
        try {
            const response = await API.get<AiAgentsResponse>("/ai-agents-list");
            return response.data.data;
        } catch (error: any) {
            console.error("Failed to fetch AI agents:", error);
            throw error;
        }
    },

    /**
 * Get AI Agents from Name
 */
    getAgentDetailsByName: async (name: string): Promise<AgentDetails> => {
        try {
            const response = await API.get<{ success: boolean; data: AgentDetails }>(
                `/ai-agent-detail/${name}`
            );
            return response.data.data;
        } catch (error: any) {
            console.error(`Failed to fetch details for agent ${name}:`, error);
            throw error;
        }
    }
};