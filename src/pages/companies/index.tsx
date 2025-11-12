import { useEffect, useMemo, useRef, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Company, CompanyPerson } from "@/services/companies.service";
import { Lead } from "@/services/leads.service";
import { EmailDraftModal } from "@/pages/companies/components/EmailDraftModal";
import { toast } from "sonner";
import CompaniesList from "./components/CompaniesList";
import LeadsList from "./components/LeadsList";
import DetailsSidebar from "./components/DetailsSidebar";
import {
  defaultStatsCards,
  useCompaniesData,
  useLeadsData,
  buildStats,
} from "./hooks";

const index = () => {
  type TabKey = "companies" | "leads";
  const tabs: { id: TabKey; label: string }[] = [
    { id: "companies", label: "Companies" },
    { id: "leads", label: "Leads" },
  ];

  const [activeTab, setActiveTab] = useState<TabKey>("companies");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedExecutiveFallback, setSelectedExecutiveFallback] =
    useState<CompanyPerson | null>(null);
  const [pendingLeadIdentifier, setPendingLeadIdentifier] = useState<{
    email?: string;
    name?: string;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    companies: null,
    leads: null,
  });
  const [indicatorStyles, setIndicatorStyles] = useState({ width: 0, left: 0 });

  const companiesParams = useMemo(
    () => ({
      page: 1,
      limit: 50,
    }),
    []
  );

  const {
    query: companiesQuery,
    companies,
    totalCompanies,
  } = useCompaniesData(companiesParams);

  const {
    query: leadsQuery,
    leads,
    totalLeads,
  } = useLeadsData({
    enabled: activeTab === "leads" || pendingLeadIdentifier !== null,
  });

  const loading = companiesQuery.isLoading;
  const leadsLoading = leadsQuery.isLoading || leadsQuery.isFetching;

  const stats = useMemo(
    () =>
      buildStats(
        totalCompanies,
        leadsQuery.isSuccess ? totalLeads : undefined,
        defaultStatsCards
      ),
    [totalCompanies, totalLeads, leadsQuery.isSuccess]
  );

  useEffect(() => {
    if (companiesQuery.error) {
      const error = companiesQuery.error as any;
      toast.error(
        error?.response?.data?.message || "Failed to fetch companies"
      );
    }
  }, [companiesQuery.error]);

  useEffect(() => {
    if (leadsQuery.error) {
      const error = leadsQuery.error as any;
      toast.error(error?.response?.data?.message || "Failed to fetch leads");
    }
  }, [leadsQuery.error]);

  useEffect(() => {
    if (!pendingLeadIdentifier) return;

    const { email, name } = pendingLeadIdentifier;

    const matchedLead =
      (email && leads.find((lead) => lead.email?.toLowerCase() === email)) ||
      (name && leads.find((lead) => lead.name?.toLowerCase() === name));

    if (matchedLead) {
      setSelectedLeadId(matchedLead._id);
      setSelectedExecutiveFallback(null);
      setPendingLeadIdentifier(null);
    } else if (!leadsLoading) {
      setPendingLeadIdentifier(null);
    }
  }, [pendingLeadIdentifier, leads, leadsLoading]);

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab];
      const containerEl = containerRef.current;

      if (activeEl && containerEl) {
        const containerRect = containerEl.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();

        setIndicatorStyles({
          width: activeRect.width,
          left: activeRect.left - containerRect.left,
        });
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);

    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab]);

  const handleCompanyClick = (companyId: string) => {
    setSelectedCompanyId((prev) => (prev === companyId ? null : companyId));
  };

  const handleLeadClick = (leadId: string) => {
    setSelectedLeadId((prev) => (prev === leadId ? null : leadId));
    setSelectedExecutiveFallback(null);
  };

  const handleExecutiveSelect = (executive: CompanyPerson) => {
    const email =
      (executive.email || executive.emails?.[0] || "")?.toLowerCase() ||
      undefined;
    const name = executive.name?.toLowerCase();

    setSelectedLeadId(null);
    setSelectedExecutiveFallback(executive);
    setPendingLeadIdentifier({ email, name });
    setActiveTab("leads");

    if (leads.length > 0) {
      const matchedLead =
        (email && leads.find((lead) => lead.email?.toLowerCase() === email)) ||
        (name && leads.find((lead) => lead.name?.toLowerCase() === name));

      if (matchedLead) {
        setSelectedLeadId(matchedLead._id);
        setSelectedExecutiveFallback(null);
        setPendingLeadIdentifier(null);
      }
    }
  };

  const handleEmailClick = (lead: Lead) => {
    setSelectedLead(lead);
    setEmailModalOpen(true);
  };

  const isSidebarOpen =
    activeTab === "companies"
      ? selectedCompanyId !== null
      : selectedLeadId !== null || selectedExecutiveFallback !== null;
  const selectedCompany: Company | undefined = companies.find(
    (company) => company._id === selectedCompanyId
  );
  const selectedLeadDetails: Lead | undefined = leads.find(
    (lead) => lead._id === selectedLeadId
  );

  return (
    <div className="min-h-screen w-full bg-[#1A1A1A] flex flex-col">
      <DashboardHeader />

      <main className="relative flex-1 w-full bg-[#1A1A1A] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-24 lg:mt-28 pb-10 text-white">
        <div className="max-w-[1600px] mx-auto">
          {/* Tabs */}
          <div
            ref={containerRef}
            className="relative mb-6 inline-flex w-fit gap-[10px] items-center rounded-full bg-[#2A2A2A] p-1"
          >
            <div
              className="absolute top-1 bottom-1 left-0 rounded-full bg-[#4A4A4A] transition-all duration-300 ease-out"
              style={{
                width: indicatorStyles.width,
                left: indicatorStyles.left,
                opacity: indicatorStyles.width ? 1 : 0,
              }}
            />
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                onClick={() => setActiveTab(tab.id)}
                variant="ghost"
                className={`relative z-10 rounded-full px-6 py-2 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/80"
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="px-2 py-3 bg-gradient-to-r from-[#1d1d1d50] via-cyan-500/5 to-[#2c2c2c31] border-[#1d1d1d50] rounded-2xl"
              >
                <Card className="border-none bg-transparent overflow-hidden transition-shadow duration-300 hover:shadow-lg">
                  <div className="relative flex flex-col justify-between rounded-[20px] border border-white/10 bg-gradient-to-b from-[#ffffff20] via-[#ffffff00] to-[#ffffff10] p-4 backdrop-blur-xl min-h-[150px] shadow-inner shadow-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-white/70 font-medium">
                        {stat.title}
                      </p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-white/60 hover:text-white/90 transition-colors"
                      >
                        {stat.link} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/15 shadow-sm">
                        <stat.icon />
                      </div>
                      <p className="text-3xl font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-medium text-foreground mb-4">
              {activeTab === "companies" ? "Companies" : "Leads"}
            </h2>
          </div>
          {/* Split View */}
          <div className="flex gap-6 items-start">
            {/* Left: Companies/Leads List */}
            <div className="space-y-3 bg-[#222B2C] p-6 rounded-2xl min-h-[600px] flex-1">
              {activeTab === "companies" ? (
                <CompaniesList
                  companies={companies}
                  loading={loading}
                  selectedCompanyId={selectedCompanyId}
                  onSelectCompany={handleCompanyClick}
                />
              ) : (
                <LeadsList
                  leads={leads}
                  loading={leadsLoading}
                  selectedLeadId={selectedLeadId}
                  onSelectLead={handleLeadClick}
                  onEmailClick={handleEmailClick}
                />
              )}
            </div>

            {/* Right: Executives/Details Panel */}
            <DetailsSidebar
              activeTab={activeTab}
              isOpen={isSidebarOpen}
              selectedCompany={selectedCompany}
              selectedLead={selectedLeadDetails}
              onSwitchToLeads={() => setActiveTab("leads")}
              onEmailLead={handleEmailClick}
              onExecutiveSelect={handleExecutiveSelect}
              executiveFallback={selectedExecutiveFallback}
            />
          </div>
        </div>
      </main>

      {/* Email Draft Modal */}
      <EmailDraftModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        leadName={selectedLead?.name}
        leadEmail={selectedLead?.email}
      />
    </div>
  );
};

export default index;
