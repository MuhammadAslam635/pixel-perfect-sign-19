import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getUserData } from "@/utils/authHelpers";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AssistantPanel from "@/components/dashboard/AssistantPanel";
import StatsCard from "@/components/dashboard/StatsCard";
import CommunicationHubCard from "@/components/dashboard/CommunicationHubCard";
import ProposalsToSendCard from "@/components/dashboard/ProposalsToSendCard";
import TopLeadsCard from "@/components/dashboard/TopLeadsCard";
import CalendarCard from "@/components/dashboard/CalendarCard";
import FollowupTasksCard from "@/components/dashboard/FollowupTasksCard";
import MobileAssistantCTA from "@/components/dashboard/MobileAssistantCTA";
import LeadsScoreDistributionCard from "@/components/dashboard/LeadsScoreDistributionCard";
// New Analytics Cards
import { ActiveQualifiedLeadsCard } from "@/components/dashboard/ActiveQualifiedLeadsCard";
import { WinRateCard } from "@/components/dashboard/WinRateCard";
import { RevenueAtRiskCard } from "@/components/dashboard/RevenueAtRiskCard";
import { SpeedToLeadCard } from "@/components/dashboard/SpeedToLeadCard";
import { FollowupExecutionCard } from "@/components/dashboard/FollowupExecutionCard";
import { ProposalThroughputCard } from "@/components/dashboard/ProposalThroughputCard";
import { DealsAtRiskCard } from "@/components/dashboard/DealsAtRiskCard";

const getIsDesktop = () => {
  if (typeof window === "undefined") {
    return true;
  }
  return window.innerWidth >= 1024;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const sessionUser = user || getUserData();
  const userRole = sessionUser?.role;
  const [isDesktop, setIsDesktop] = useState(getIsDesktop);

  // Redirect Admin users to Members & Permissions page
  useEffect(() => {
    if (userRole === "Admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [userRole, navigate]);

  // Clear the onboarding_just_completed flag when dashboard loads
  // This flag is only needed for the initial navigation after completing onboarding
  useEffect(() => {
    const flag = sessionStorage.getItem("onboarding_just_completed");
    if (flag === "true") {
      sessionStorage.removeItem("onboarding_just_completed");
      console.log("[Dashboard] Cleared onboarding_just_completed flag");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setIsDesktop(getIsDesktop());
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Disable body scrolling when Dashboard is mounted
  useEffect(() => {
    if (typeof document === "undefined") return;

    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

  // Don't render dashboard for Admin users (they'll be redirected)
  if (userRole === "Admin") {
    return null;
  }

  const desktopLayout = (
    <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col lg:flex-row items-stretch gap-5 md:gap-6 lg:gap-8 text-white flex-1 min-h-0 max-w-full">
      <div className="w-full lg:basis-1/2 lg:min-w-0 flex-1 min-h-0 overflow-hidden animate-in fade-in slide-in-from-left-8 duration-700">
        <AssistantPanel isDesktop={isDesktop} />
      </div>

      <div className="scrollbar-hide lg:flex w-full flex-col gap-4 overflow-y-auto pr-1 md:gap-5 lg:basis-1/2 lg:min-w-0 lg:pr-3 max-h-[calc(100vh-8rem)] bg-transparent animate-in fade-in slide-in-from-right-8 duration-700">
        {/* Row 1 - Analytics Cards (Above StatsCard) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ActiveQualifiedLeadsCard />
          <WinRateCard />
        </div>

        {/* Row 2 - Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <RevenueAtRiskCard />
          <SpeedToLeadCard />
        </div>

        {/* Row 3 - Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <FollowupExecutionCard />
          <ProposalThroughputCard />
        </div>

        {/* Existing StatsCard */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[450ms]">
          <StatsCard />
        </div>

        {/* Row 4 - Deals at Risk (Full Width) */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[600ms]">
          <DealsAtRiskCard />
        </div>

        <div className="p-2 mt-6">
          <div className="grid grid-cols-2 gap-4 lg:gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[600ms]">
            <LeadsScoreDistributionCard />
            {/* <CommunicationHubCard />
            <ProposalsToSendCard /> */}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[750ms]">
            {/* <TopLeadsCard />
            <CalendarCard /> */}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[900ms]">
            {/* <FollowupTasksCard /> */}
            <div></div> {/* Empty space for balance */}
          </div>
        </div>
      </div>
    </main>
  );

  const mobileLayout = (
    <main className="relative z-10 flex flex-col gap-6 px-5 pt-28 pb-12 text-white lg:hidden">
      {/* Row 1 - Analytics Cards */}
      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <ActiveQualifiedLeadsCard />
        <WinRateCard />
      </div>

      {/* Row 2 - Analytics Cards */}
      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <RevenueAtRiskCard />
        <SpeedToLeadCard />
      </div>

      {/* Row 3 - Analytics Cards */}
      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <FollowupExecutionCard />
        <ProposalThroughputCard />
      </div>

      {/* Existing StatsCard */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[450ms]">
        <StatsCard />
      </div>

      {/* Row 4 - Deals at Risk */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[600ms]">
        <DealsAtRiskCard />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[600ms]">
          <CommunicationHubCard />
          <ProposalsToSendCard />
        </div>

        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[750ms]">
          <TopLeadsCard />
          <CalendarCard />
        </div>

        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[900ms]">
          <FollowupTasksCard />
          <div></div> {/* Empty space for balance */}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[1050ms]">
        <MobileAssistantCTA />
      </div>
    </main>
  );

  return (
    <DashboardLayout>
      {isDesktop ? desktopLayout : mobileLayout}
    </DashboardLayout>
  );
};

export default Dashboard;
