import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AgentCard from "./components/AgentCard";
import { motion } from "framer-motion";
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
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
      ease: "easeOut",
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
      ease: "easeOut",
    },
  },
};

const AgentsPage = () => {
  return (
    <DashboardLayout>
      <motion.main
        className="relative flex-1 px-6 pb-12 pt-28 sm:px-10 md:px-14 lg:px-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0F172A] via-transparent to-[#05060A] opacity-70"></div>
        <motion.header
          className="flex flex-col gap-4 mb-12"
          variants={headerVariants}
        >
          <motion.span
            className="font-poppins font-medium text-4xl text-white"
            variants={headerVariants}
          >
            AI Agents
          </motion.span>
          <motion.h1
            className="font-poppins font-light text-xl text-white"
            variants={headerVariants}
          >
            Meet the specialists powering your autonomous growth{" "}
          </motion.h1>
        </motion.header>
        <motion.div
          className="rounded-3xl p-6"
          style={{
            background:
              "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            border: "1px solid #FFFFFF4D",
          }}
          variants={cardsContainerVariants}
        >
          <motion.section
            className="grid gap-6 p-6 sm:grid-cols-3 xl:grid-cols-3"
            variants={cardsContainerVariants}
          >
            {agents.map((agent, index) => (
              <motion.div key={agent.name} variants={cardVariants}>
                <AgentCard {...agent} />
              </motion.div>
            ))}
          </motion.section>
        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default AgentsPage;
