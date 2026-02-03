import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getUserData } from "@/utils/authHelpers";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AssistantPanel from "@/components/dashboard/AssistantPanel";
import MobileAssistantCTA from "@/components/dashboard/MobileAssistantCTA";
import StatsCard from "@/components/dashboard/StatsCard";
import LeadsScoreDistributionCard from "@/components/dashboard/LeadsScoreDistributionCard";
// Analytics Cards
import { ActiveQualifiedLeadsCard } from "@/components/dashboard/ActiveQualifiedLeadsCard";
import { WinRateCard } from "@/components/dashboard/WinRateCard";
import { RevenueAtRiskCard } from "@/components/dashboard/RevenueAtRiskCard";
import { SpeedToLeadCard } from "@/components/dashboard/SpeedToLeadCard";
import { FollowupExecutionCard } from "@/components/dashboard/FollowupExecutionCard";
import { ProposalThroughputCard } from "@/components/dashboard/ProposalThroughputCard";
import { DealsAtRiskCard } from "@/components/dashboard/DealsAtRiskCard";
// BDR Dashboard
import BDRDashboard from "@/components/dashboard/bdr/BDRDashboard";
import { useIsDesktop, useLockBodyScroll } from "@/hooks/useViewport";

// --------- Reusable Panels ---------
const LeftPanel = ({ isDesktop }: { isDesktop: boolean }) => (
    <div className="w-full lg:basis-1/2 lg:min-w-0 flex-1 min-h-0 overflow-hidden animate-in fade-in slide-in-from-left-8 duration-700 p-1">
        <AssistantPanel isDesktop={isDesktop} />
    </div>
);

const RightPanelWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="scrollbar-hide lg:flex w-full flex-col gap-4 overflow-y-auto pr-1 md:gap-5 lg:basis-1/2 lg:min-w-0 lg:pr-3 max-h-[calc(100vh-8rem)] bg-transparent animate-in fade-in slide-in-from-right-8 duration-700 p-1">
        {children}
    </div>
);

const GradientSVG = () => (
    <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
            <linearGradient id="dashboard-icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#69B4B7" />
                <stop offset="15.87%" stopColor="#66AFB7" />
                <stop offset="35.04%" stopColor="#5EA0B6" />
                <stop offset="55.91%" stopColor="#5188B6" />
                <stop offset="77.95%" stopColor="#3F66B4" />
                <stop offset="100%" stopColor="#283CB3" />
            </linearGradient>
        </defs>
    </svg>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const sessionUser = user || getUserData();
    const userRole = sessionUser?.role;
    const isDesktop = useIsDesktop();
    useLockBodyScroll();
    useEffect(() => {
        if (userRole === "Admin") navigate("/admin/dashboard", { replace: true });
    }, [userRole, navigate]);
    useEffect(() => {
        if (sessionStorage.getItem("onboarding_just_completed") === "true") {
            sessionStorage.removeItem("onboarding_just_completed");
            console.log("[Dashboard] Cleared onboarding_just_completed flag");
        }
    }, []);
    if (userRole === "Admin") return null;
    if (userRole === "CompanyUser") {
        const desktopLayout = (
            <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col lg:flex-row items-stretch gap-5 md:gap-6 lg:gap-8 text-white flex-1 min-h-0 max-w-full">
                <GradientSVG />
                <LeftPanel isDesktop={isDesktop} />
                <RightPanelWrapper>
                    <BDRDashboard />
                </RightPanelWrapper>
            </main>
        );
        const mobileLayout = (
            <main className="relative z-10 flex flex-col gap-6 px-5 pt-28 pb-12 text-white lg:hidden">
                <BDRDashboard />
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animation-delay-[1050ms]">
                    <MobileAssistantCTA />
                </div>
            </main>
        );
        return <DashboardLayout>{isDesktop ? desktopLayout : mobileLayout}</DashboardLayout>;
    }
    const desktopLayout = (
        <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col lg:flex-row items-stretch gap-5 md:gap-6 lg:gap-8 text-white flex-1 min-h-0 max-w-full">
            <GradientSVG />
            <LeftPanel isDesktop={isDesktop} />
            <RightPanelWrapper>
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ActiveQualifiedLeadsCard />
                    <WinRateCard />
                </div>
                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                    <RevenueAtRiskCard />
                    <SpeedToLeadCard />
                </div>
                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                    <FollowupExecutionCard />
                    <ProposalThroughputCard />
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animation-delay-[450ms]">
                    <StatsCard />
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animation-delay-[600ms] px-2">
                    <DealsAtRiskCard />
                </div>
                <div className="p-2 mt-6">
                    <div className="grid grid-cols-2 gap-4 lg:gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 animation-delay-[600ms]">
                        <LeadsScoreDistributionCard />
                        <div />
                    </div>
                </div>
            </RightPanelWrapper>
        </main>
    );

    const mobileLayout = (
        <main className="relative z-10 flex flex-col gap-6 px-5 pt-28 pb-12 text-white lg:hidden">
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ActiveQualifiedLeadsCard />
                <WinRateCard />
            </div>
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                <RevenueAtRiskCard />
                <SpeedToLeadCard />
            </div>
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <FollowupExecutionCard />
                <ProposalThroughputCard />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animation-delay-[450ms]">
                <StatsCard />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animation-delay-[600ms]">
                <DealsAtRiskCard />
            </div>
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 animation-delay-[750ms]">
                <LeadsScoreDistributionCard />
            </div>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 animation-delay-[1050ms]">
                <MobileAssistantCTA />
            </div>
        </main>
    );

    return <DashboardLayout>{isDesktop ? desktopLayout : mobileLayout}</DashboardLayout>;
};

export default Dashboard;