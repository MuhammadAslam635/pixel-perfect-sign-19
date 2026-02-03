import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AgentCard from "./components/AgentCard";
import { useQuery } from "@tanstack/react-query";
import { AiAgents } from "@/types/aiagents.types";
import { aiAgentsService } from "@/services/aiagents.service";

const AgentsPage = () => {
  const { data } = useQuery<AiAgents[], Error>({
    queryKey: ["agents"],
    queryFn: aiAgentsService.getAllAgents,
  });

  return (
    <DashboardLayout>
      <main className="relative flex-1 px-6 pb-6 pt-28 sm:px-10 md:px-14 lg:px-20">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0F172A] via-transparent to-[#05060A] opacity-70"></div>
        <header className="flex flex-col gap-4 mb-4">
          <span className="font-poppins font-medium text-3xl text-white">
            AI Agents
          </span>
          <h2 className="font-poppins font-light text-xl text-white">
            Meet the specialists powering your autonomous growth{" "}
          </h2>
        </header>
        <div className="grid gap-6 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 rounded-2xl">
          {data?.map((agent) => (
            <AgentCard key={agent.id} {...agent} />
          ))}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default AgentsPage;
