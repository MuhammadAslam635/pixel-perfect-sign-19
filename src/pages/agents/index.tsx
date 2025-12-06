import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AgentCard from "./components/AgentCard";

const agents = [
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Kai.jpg",
    name: "Kai",
    title: "The Sales Navigator Agent",
    description:
      "Scouting high-potential leads and opportunities, Kai ensures your sales pipeline is always full and optimized.",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Aura.jpg",
    name: "Aura",
    title: "The Content Creator Agent",
    description:
      "Crafting compelling content tailored to your brand voice, Aura turns ideas into impactful communication.",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/AxeL.jpg",
    name: "AxeL",
    title: "The Customer Support Agent",
    description:
      "Providing 24/7 responsive customer support, AxeL ensures every interaction leaves customers delighted.",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Sage.jpg",
    name: "Sage",
    title: "The Financial Insights Agent",
    description:
      "Delivering actionable financial intelligence, Sage ensures smart financial decisions backed by data.",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Lex.jpg",
    name: "Lex",
    title: "The Sale Outreach Agent",
    description: "Lex is your AI-powered Outreach Specialist",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Nova.jpg",
    name: "Nova",
    title: "The Sales Conversion Agent",
    description: "Nova is your AI-powered Sales Conversion Strategist",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Remy.jpg",
    name: "Remy",
    title: "The Follow-Up Agent",
    description: "Remy is your AI-powered Relationship Nurturing Specialist",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Echo.jpg",
    name: "Echo",
    title: "The Inbound Voice AI Sales Agent",
    description: "Echo is your AI-powered Inbound Sales Specialist",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Apex.jpg",
    name: "Apex",
    title: "The Ad Optimization Agent",
    description: "Apex is your AI-powered Ad Campaign Strategist",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Syra.jpg",
    name: "Syra",
    title: "The Audience Segmentation Agent",
    description: "Syra is your AI-powered Audience Intelligence Specialist",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Zuri.jpg",
    name: "Zuri",
    title: "The Campaign Manager Agent",
    description: "Zuri is your AI-powered Campaign Orchestration Specialist",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Lume.jpg",
    name: "Lume",
    title: "The Autonomous AI Influencer",
    description: "Lume is your AI-powered Digital Brand Ambassador",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Lyra.jpg",
    name: "Lyra",
    title: "The Customer Sentiment Agent",
    description: "Lyra bridges the emotional gap between customers and brands",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Vox.jpg",
    name: "Vox",
    title: "The Voice AI Customer Support Agent",
    description: "Vox is your AI-powered Voice Support Specialist",
  },
  {
    image: "https://aiassist.bg/wp-content/uploads/2025/01/Flux.jpg",
    name: "Flux",
    title: "The Workflow Automation Agent",
    description: "Flux is your AI-powered Operations Efficiency Specialist",
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
    },
  },
};

const cardsContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
    },
  },
};

const AgentsPage = () => {
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
          {agents.map((agent, index) => (
            <AgentCard {...agent} />
          ))}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default AgentsPage;
