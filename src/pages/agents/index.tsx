import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AgentCard from "./components/AgentCard";
import kaiSales from "@/assets/kaisales.jpg";
import auraContentCreator from "@/assets/auracontentcr.jpg";
import lexOutreach from "@/assets/lexoutreach.jpg";
import sageFinancial from "@/assets/sagefinancial.jpg";
import zuriManager from "@/assets/zurimanager.jpg";

const agents = [
  {
    image: kaiSales,
    name: "Kai – The Sales Navigator Agent",
    description:
      "Scouting high-potential leads and opportunities to keep your sales pipeline full and optimized.",
  },
  {
    image: auraContentCreator,
    name: "Aura – The Content Creator Agent",
    description:
      "Crafting compelling, on-brand content across channels so your voice stays consistent everywhere.",
  },
  {
    image: lexOutreach,
    name: "Lex – The Outreach Agent",
    description:
      "Connecting with the right prospects at the right time to build pipelines that convert.",
  },
  {
    image: sageFinancial,
    name: "Sage – The Financial Advisor Agent",
    description:
      "Delivering clear financial insights and guidance to keep your business healthy and growing.",
  },
  {
    image: zuriManager,
    name: "Zuri – The Manager Agent",
    description:
      "Coordinating teams and workflows so operations stay smooth while your business scales.",
  },
];

const AgentsPage = () => {
  return (
    <DashboardLayout>
      <main className="relative flex-1 px-6 pb-12 pt-28 sm:px-10 md:px-14 lg:px-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-transparent to-[#05060A] opacity-70"></div>
        <header className="flex flex-col gap-4 mb-12">
          <span className="font-poppins font-medium text-4xl text-white">
            AI Agents
          </span>
          <h1 className="font-poppins font-light text-xl text-white">
            Meet the specialists powering your autonomous growth{" "}
          </h1>
        </header>
        <div
          className="rounded-2xl p-6"
          style={{
            background:
              "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            border: "1px solid #FFFFFF4D",
          }}
        >
          <section className="grid gap-6 sm:grid-cols-3 xl:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.name} {...agent} />
            ))}
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default AgentsPage;
