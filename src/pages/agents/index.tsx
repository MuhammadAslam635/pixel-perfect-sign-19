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
      <main className="relative flex-1 px-6 pb-12 pt-28 sm:px-10 md:px-14 lg:px-20 2xl:px-[110px]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-transparent to-[#05060A] opacity-70"></div>
        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-12 bg-[#222B2C] p-6 rounded-2xl">
          <header className="flex flex-col gap-4">
            <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
              AI Agents
            </span>
            <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-5xl">
              Meet the specialists powering your autonomous growth
            </h1>
            <p className="max-w-6xl text-base text-white/70 md:text-lg">
              Every agent is tuned for a high-impact part of your go-to-market.
              Blend them together to attract leads, personalize outreach, close
              more deals, and keep customers delighted.
            </p>
          </header>

          <section className="grid gap-6 sm:grid-cols-3 xl:grid-cols-4">
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


