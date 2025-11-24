import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AssistantPanel from "@/components/dashboard/AssistantPanel";
import StatsCard from "@/components/dashboard/StatsCard";
import CommunicationHubCard from "@/components/dashboard/CommunicationHubCard";
import ProposalsToSendCard from "@/components/dashboard/ProposalsToSendCard";
import TopLeadsCard from "@/components/dashboard/TopLeadsCard";
import CalendarCard from "@/components/dashboard/CalendarCard";
import MobileAssistantCTA from "@/components/dashboard/MobileAssistantCTA";

const getIsDesktop = () => {
  if (typeof window === "undefined") {
    return true;
  }
  return window.innerWidth >= 1024;
};

const Dashboard = () => {
  const [isDesktop, setIsDesktop] = useState(getIsDesktop);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsDesktop(getIsDesktop());
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const desktopLayout = (
    <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col lg:flex-row items-start gap-5 md:gap-6 lg:gap-8 text-white flex-1 min-h-0 overflow-hidden max-w-full">
      <div className="w-full lg:basis-1/2 lg:min-w-0 h-full flex-1 min-h-0">
        <AssistantPanel isDesktop={isDesktop} />
      </div>

      <div className="scrollbar-hide lg:flex w-full flex-col gap-4 overflow-y-scroll pr-1 md:gap-5 lg:basis-1/2 lg:min-w-0 lg:pr-3 h-full min-h-0 bg-transparent">
        <StatsCard />

        <div className="p-2 mt-6">
          <div className="grid grid-cols-2 gap-4 lg:gap-4 mb-6">
            <CommunicationHubCard />
            <ProposalsToSendCard />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:gap-4 mb-6">
            <TopLeadsCard />
            <CalendarCard />
          </div>
        </div>
      </div>
    </main>
  );

  const mobileLayout = (
    <main className="relative z-10 flex flex-col gap-6 px-5 pt-28 pb-12 text-white lg:hidden">
      <StatsCard />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CommunicationHubCard />
          <ProposalsToSendCard />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TopLeadsCard />
          <CalendarCard />
        </div>
      </div>

      <MobileAssistantCTA />
    </main>
  );

  return (
    <DashboardLayout>
      {isDesktop ? desktopLayout : mobileLayout}
    </DashboardLayout>
  );
};

export default Dashboard;
