export interface AiAgents {
    id: string,
    image: string,
    name: string,
    title: string,
    description: string,
}

export interface AgentDetails {
    name: string;
    description: string;
    coreDomain: string;
    primaryFunction: string;
    whoItsFor: string;
    keyCapabilities: string[];
    strategicValue: string;
    quote: string;
    customizationFocus: string;
    measurableOutcomes: string[];
    agentEcosystemIntegration: string[];
    workflowExample: string;
    imageUrl?: string;
    isActive: boolean;
    deletedAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}