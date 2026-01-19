import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AgentDetails } from "@/types/aiagents.types";
import { aiAgentsService } from "@/services/aiagents.service";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ChevronRight } from "lucide-react";

const AgentDetail = () => {
    const { name } = useParams<{ name: string }>();

    const { data: agent } = useQuery<AgentDetails, Error>({
        queryKey: ["agentDetails", name],
        queryFn: () => aiAgentsService.getAgentDetailsByName(name!),
        enabled: !!name,
    });

    if (!agent) return <p>No agent found</p>;

    return (
        <DashboardLayout>
            <main className="relative flex-1 px-6 pb-6 pt-28 sm:px-10 md:px-14 lg:px-20">
                <div className="flex flex-col lg:flex-row gap-10 p-10">
                    {/* Left Image Panel */}
                    <div className="lg:w-1/3 flex-shrink-0">
                        <img
                            src={agent.imageUrl}
                            alt={agent.name}
                            className="w-full h-auto rounded-lg shadow-lg"
                        />
                    </div>

                    {/* Right Text Panel */}
                    <div className="lg:w-2/3 space-y-6">
                        <h1 className="text-3xl font-semibold">{agent.name}</h1>
                        <p className="leading-8">{agent.description}</p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
                                <h2 className="text-xl font-semibold">Core Domain: </h2>
                                <p>{agent.coreDomain}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
                                <h2 className="text-xl font-semibold">Primary Function: </h2>
                                <p>{agent.primaryFunction}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
                                <h2 className="text-xl font-semibold">Who It’s For: </h2>
                                <p>{agent.whoItsFor}</p>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold py-3">Key Capabilities</h2>
                                <ul className="space-y-4">
                                    {agent.keyCapabilities.map((cap, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
                                            <span>{cap}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-3xl font-semibold py-2">Strategic Value (Why It Matters)</h2>
                                <p className="leading-8">{agent.strategicValue}</p>
                                {agent.quote && <p className="italic pt-2">"{agent.quote}"</p>}
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold py-6">Customization Focus</h2>
                                <ul className="space-y-4">
                                    {agent.customizationFocus?.map((cap, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
                                            <span>{cap}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold py-6">Measurable Outcomes</h2>
                                <ul className="space-y-4">
                                    {agent.measurableOutcomes.map((cap, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
                                            <span>{cap}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-3xl font-semibold py-6">Agent Ecosystem Integration</h2>
                                <ul className="space-y-4">
                                    {agent.agentEcosystemIntegration.map((cap, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
                                            <span>{cap}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold pb-8">Workflow Example:</h2>

                                <ol className="list-decimal list-inside space-y-4">
                                    {agent.workflowExample?.map((cap, i) => (
                                        <li
                                            key={i}
                                            className="marker:font-semibold marker:text-white"
                                        >
                                            {cap}
                                        </li>
                                    ))}
                                </ol>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </DashboardLayout>

    );
};

export default AgentDetail;
