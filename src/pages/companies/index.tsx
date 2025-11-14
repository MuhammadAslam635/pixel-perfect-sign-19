import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Search, Filter, Layers } from "lucide-react";
import { Company, CompanyPerson } from "@/services/companies.service";
import { Lead } from "@/services/leads.service";
import { EmailDraftModal } from "@/pages/companies/components/EmailDraftModal";
import { LinkedinMessageModal } from "@/pages/companies/components/LinkedinMessageModal";
import { PhoneCallModal } from "@/pages/companies/components/PhoneCallModal";
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
import {
  connectionMessagesService,
  EmailCopy,
  EmailCopyMetadata,
  PhoneScriptMetadata,
  ConnectionMessageData,
} from "@/services/connectionMessages.service";
import { useQueryClient } from "@tanstack/react-query";

const index = () => {
  type TabKey = "companies" | "leads";
  const tabs: { id: TabKey; label: string }[] = [
    { id: "companies", label: "Companies" },
    { id: "leads", label: "Leads" },
  ];

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("companies");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Companies filters and pagination
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesSearch, setCompaniesSearch] = useState("");
  const [companiesLimit] = useState(10); // Increased limit to show more items per page

  // Leads filters and pagination
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadsLimit] = useState(10); // Increased limit to show more items per page
  const [leadsCompanyFilter, setLeadsCompanyFilter] = useState<string | null>(
    null
  );
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedExecutiveFallback, setSelectedExecutiveFallback] =
    useState<CompanyPerson | null>(null);
  const [pendingLeadIdentifier, setPendingLeadIdentifier] = useState<{
    email?: string;
    name?: string;
  } | null>(null);
  const [emailDraft, setEmailDraft] = useState<EmailCopy | null>(null);
  const [emailMetadata, setEmailMetadata] = useState<EmailCopyMetadata | null>(
    null
  );
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [linkedinModalOpen, setLinkedinModalOpen] = useState(false);
  const [linkedinLead, setLinkedinLead] = useState<Lead | null>(null);
  const [linkedinMessage, setLinkedinMessage] = useState<string | null>(null);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);
  const [linkedinMetadata, setLinkedinMetadata] =
    useState<ConnectionMessageData | null>(null);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneLead, setPhoneLead] = useState<Lead | null>(null);
  const [phoneFallbackExecutive, setPhoneFallbackExecutive] =
    useState<CompanyPerson | null>(null);
  const [phoneScript, setPhoneScript] = useState<string | null>(null);
  const [phoneMetadata, setPhoneMetadata] =
    useState<PhoneScriptMetadata | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const resolveErrorMessage = useCallback(
    (error: unknown, fallback: string) => {
      const err = error as any;
      return (
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        fallback
      );
    },
    []
  );

  const fetchEmailDraft = useCallback(
    async (lead: Lead) => {
      if (!lead.companyId || !lead._id) {
        const message = "Missing company or person identifiers for this lead.";
        setEmailDraft(null);
        setEmailMetadata(null);
        setEmailError(message);
        return;
      }

      setEmailLoading(true);
      setEmailError(null);

      try {
        const response = await connectionMessagesService.generateEmailCopy({
          companyId: lead.companyId,
          personId: lead._id,
        });

        setEmailDraft(response.data.email);
        setEmailMetadata(response.data.metadata ?? null);
      } catch (error) {
        const message = resolveErrorMessage(
          error,
          "Failed to generate email copy."
        );
        setEmailError(message);
        toast.error(message);
      } finally {
        setEmailLoading(false);
      }
    },
    [resolveErrorMessage]
  );

  const fetchLinkedinMessage = useCallback(
    async (lead: Lead) => {
      if (!lead.companyId || !lead._id) {
        const message = "Missing company or person identifiers for this lead.";
        setLinkedinMessage(null);
        setLinkedinError(message);
        setLinkedinMetadata(null);
        return;
      }

      setLinkedinLoading(true);
      setLinkedinError(null);
      setLinkedinMetadata(null);

      try {
        const response =
          await connectionMessagesService.generateConnectionMessage({
            companyId: lead.companyId,
            personId: lead._id,
          });

        setLinkedinMessage(response.data.connectionMessage);
        setLinkedinMetadata(response.data);
      } catch (error) {
        const message = resolveErrorMessage(
          error,
          "Failed to generate LinkedIn message."
        );
        setLinkedinError(message);
        setLinkedinMetadata(null);
        toast.error(message);
      } finally {
        setLinkedinLoading(false);
      }
    },
    [resolveErrorMessage]
  );

  const fetchPhoneScript = useCallback(
    async (lead: Lead) => {
      if (!lead.companyId || !lead._id) {
        const message = "Missing company or person identifiers for this lead.";
        setPhoneScript(null);
        setPhoneMetadata(null);
        setPhoneError(message);
        return;
      }

      setPhoneLoading(true);
      setPhoneError(null);

      try {
        const response = await connectionMessagesService.generatePhoneScript({
          companyId: lead.companyId,
          personId: lead._id,
        });

        setPhoneScript(response.data.script);
        setPhoneMetadata(response.data.metadata ?? null);
      } catch (error) {
        const message = resolveErrorMessage(
          error,
          "Failed to generate phone script."
        );
        setPhoneError(message);
        toast.error(message);
      } finally {
        setPhoneLoading(false);
      }
    },
    [resolveErrorMessage]
  );

  const handleEmailClick = useCallback(
    (lead: Lead) => {
      setSelectedLead(lead);
      setEmailModalOpen(true);
      setEmailDraft(null);
      setEmailMetadata(null);
      setEmailError(null);
      fetchEmailDraft(lead);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    [fetchEmailDraft, queryClient]
  );

  const handleEmailRegenerate = useCallback(() => {
    if (selectedLead) {
      fetchEmailDraft(selectedLead);
    }
  }, [fetchEmailDraft, selectedLead]);

  const handleLinkedinClick = useCallback(
    (lead: Lead) => {
      setLinkedinLead(lead);
      setLinkedinModalOpen(true);
      setLinkedinMessage(null);
      setLinkedinError(null);
      setLinkedinMetadata(null);
      fetchLinkedinMessage(lead);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    [fetchLinkedinMessage, queryClient]
  );

  const handleLinkedinRegenerate = useCallback(() => {
    if (linkedinLead) {
      fetchLinkedinMessage(linkedinLead);
    }
  }, [fetchLinkedinMessage, linkedinLead]);

  const openPhoneModal = useCallback(
    (lead: Lead | null, fallback: CompanyPerson | null = null) => {
      setPhoneLead(lead);
      setPhoneFallbackExecutive(fallback);
      setPhoneScript(null);
      setPhoneMetadata(null);
      setPhoneError(null);
      setPhoneModalOpen(true);

      if (!lead) {
        setPhoneError(
          "AI phone scripts are available only for leads synced from the database."
        );
        return;
      }

      fetchPhoneScript(lead);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    [fetchPhoneScript, queryClient]
  );

  const handlePhoneClickFromList = useCallback(
    (lead: Lead) => {
      openPhoneModal(lead, null);
    },
    [openPhoneModal]
  );

  const handlePhoneClickFromSidebar = useCallback(
    (lead?: Lead, fallback?: CompanyPerson | null) => {
      openPhoneModal(lead ?? null, fallback ?? null);
    },
    [openPhoneModal]
  );

  const handlePhoneRegenerate = useCallback(() => {
    if (phoneLead) {
      fetchPhoneScript(phoneLead);
    } else {
      setPhoneError(
        "Cannot generate a phone script without selecting a synced lead."
      );
    }
  }, [fetchPhoneScript, phoneLead]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    companies: null,
    leads: null,
  });
  const [indicatorStyles, setIndicatorStyles] = useState({ width: 0, left: 0 });

  const companiesParams = useMemo(
    () => ({
      page: companiesPage,
      limit: companiesLimit,
      search: companiesSearch || undefined,
    }),
    [companiesPage, companiesLimit, companiesSearch]
  );

  const {
    query: companiesQuery,
    companies,
    totalCompanies,
  } = useCompaniesData(companiesParams);

  // Fetch all companies for the leads filter dropdown (limit to 500 for dropdown)
  const { companies: allCompaniesForFilter } = useCompaniesData({
    page: 1,
    limit: 500,
  });

  // Fetch all leads (without pagination) to count leads per company
  const { leads: allLeadsForCount } = useLeadsData(
    { page: 1, limit: 10000 },
    { enabled: activeTab === "leads" }
  );

  const leadsParams = useMemo(
    () => ({
      page: leadsPage,
      limit: leadsLimit,
      search: leadsSearch || undefined,
      companyId: leadsCompanyFilter || undefined,
    }),
    [leadsPage, leadsLimit, leadsSearch, leadsCompanyFilter]
  );

  const {
    query: leadsQuery,
    leads,
    totalLeads,
    pagination: leadsPagination,
  } = useLeadsData(leadsParams, {
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

  // When switching to leads tab with a selected company, filter by that company
  useEffect(() => {
    if (activeTab === "leads" && selectedCompanyId) {
      setLeadsCompanyFilter(selectedCompanyId);
      setLeadsPage(1); // Reset to first page
    } else if (activeTab === "companies") {
      // Clear company filter when switching back to companies
      setLeadsCompanyFilter(null);
    }
  }, [activeTab, selectedCompanyId]);

  // Reset pagination when filters change
  useEffect(() => {
    setCompaniesPage(1);
  }, [companiesSearch]);

  useEffect(() => {
    setLeadsPage(1);
  }, [leadsSearch, leadsCompanyFilter]);

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

          {/* Title and Filters Bar - Same Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg font-medium text-foreground whitespace-nowrap">
              {activeTab === "companies" ? "Companies" : "Leads"}
            </h2>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {activeTab === "companies" ? (
                <>
                  <div className="relative w-[180px]">
                    <Input
                      type="text"
                      placeholder="Search"
                      value={companiesSearch}
                      onChange={(e) => setCompaniesSearch(e.target.value)}
                      className="h-10 rounded-full bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] border border-white/15 backdrop-blur-md text-white placeholder:text-white/50 focus:border-white/25 focus:ring-2 focus:ring-white/10 pl-10 pr-4 text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  </div>
                  {totalCompanies !== undefined && (
                    <div className="px-3 py-2 rounded-full bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] border border-white/15 backdrop-blur-md text-white/70 text-sm font-medium whitespace-nowrap">
                      {totalCompanies}{" "}
                      {totalCompanies === 1 ? "company" : "companies"}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="relative w-[180px]">
                    <Input
                      type="text"
                      placeholder="Search"
                      value={leadsSearch}
                      onChange={(e) => setLeadsSearch(e.target.value)}
                      className="h-10 rounded-full bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] border border-white/15 backdrop-blur-md text-white placeholder:text-white/50 focus:border-white/25 focus:ring-2 focus:ring-white/10 pl-10 pr-4 text-sm"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                  </div>
                  <Select
                    value={leadsCompanyFilter || "all"}
                    onValueChange={(value) =>
                      setLeadsCompanyFilter(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger className="h-10 rounded-full bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] border border-white/15 backdrop-blur-md text-white/70 hover:bg-white/10 focus:ring-2 focus:ring-white/10 w-[280px] sm:w-[320px] px-3 text-sm">
                      <div className="flex items-center gap-2 w-full">
                        <Layers className="w-4 h-4 text-white/50 flex-shrink-0" />
                        <SelectValue placeholder="All Companies" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10 backdrop-blur-md max-h-[300px]">
                      <SelectItem
                        value="all"
                        className="text-white focus:bg-white/10 cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>All Companies</span>
                          {totalLeads !== undefined && (
                            <span className="ml-2 text-xs text-white/50">
                              ({totalLeads}{" "}
                              {totalLeads === 1 ? "lead" : "leads"})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                      {allCompaniesForFilter.map((company) => {
                        // Count leads for this company from all leads (not just current page)
                        const companyLeadsCount = allLeadsForCount.filter(
                          (lead) => lead.companyId === company._id
                        ).length;

                        return (
                          <SelectItem
                            key={company._id}
                            value={company._id}
                            disabled={companyLeadsCount === 0}
                            className={`text-white focus:bg-white/10 ${
                              companyLeadsCount === 0
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="truncate flex-1">
                                {company.name}
                              </span>
                              <span className="ml-2 text-xs text-white/50 whitespace-nowrap">
                                ({companyLeadsCount}{" "}
                                {companyLeadsCount === 1 ? "lead" : "leads"})
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {totalLeads !== undefined && (
                    <div className="px-3 py-2 rounded-full bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] border border-white/15 backdrop-blur-md text-white/70 text-sm font-medium whitespace-nowrap">
                      {totalLeads} {totalLeads === 1 ? "lead" : "leads"}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {/* Split View */}
          <div
            className={`flex flex-col lg:flex-row items-start ${
              isSidebarOpen ? "gap-4 lg:gap-6" : ""
            }`}
          >
            {/* Left: Companies/Leads List */}
            <div className="bg-[#222B2C] pt-4 sm:px-6 rounded-2xl 
            h-[calc(100vh-380px)] sm:h-[calc(100vh-360px)] lg:h-[calc(100vh-340px)] 
            min-h-[400px] sm:min-h-[500px] max-h-[800px] 
            flex-1 overflow-y-auto">
              {activeTab === "companies" ? (
                <CompaniesList
                  companies={companies}
                  loading={loading}
                  selectedCompanyId={selectedCompanyId}
                  onSelectCompany={handleCompanyClick}
                  search={companiesSearch}
                  onSearchChange={setCompaniesSearch}
                  page={companiesPage}
                  totalPages={companiesQuery.data?.data.totalPages || 1}
                  onPageChange={setCompaniesPage}
                  totalCompanies={totalCompanies}
                  showFilters={false}
                />
              ) : (
                <LeadsList
                  leads={leads}
                  loading={leadsLoading}
                  selectedLeadId={selectedLeadId}
                  onSelectLead={handleLeadClick}
                  onEmailClick={handleEmailClick}
                  onPhoneClick={handlePhoneClickFromList}
                  onLinkedinClick={handleLinkedinClick}
                  search={leadsSearch}
                  onSearchChange={setLeadsSearch}
                  companyFilter={leadsCompanyFilter}
                  onCompanyFilterChange={setLeadsCompanyFilter}
                  companies={allCompaniesForFilter}
                  page={leadsPage}
                  totalPages={leadsPagination?.totalPages || 1}
                  onPageChange={setLeadsPage}
                  totalLeads={totalLeads}
                  showFilters={false}
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
              onPhoneLead={handlePhoneClickFromSidebar}
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
        content={emailDraft}
        metadata={emailMetadata}
        loading={emailLoading}
        error={emailError}
        onRegenerate={handleEmailRegenerate}
      />
      <LinkedinMessageModal
        open={linkedinModalOpen}
        onClose={() => setLinkedinModalOpen(false)}
        leadName={linkedinLead?.name}
        leadLinkedin={linkedinLead?.linkedinUrl}
        message={linkedinMessage}
        loading={linkedinLoading}
        error={linkedinError}
        metadata={linkedinMetadata}
        onRegenerate={handleLinkedinRegenerate}
      />
      <PhoneCallModal
        open={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        leadName={phoneLead?.name ?? phoneFallbackExecutive?.name}
        phoneNumber={phoneLead?.phone ?? phoneFallbackExecutive?.phone}
        script={phoneScript}
        metadata={phoneMetadata}
        loading={phoneLoading}
        error={phoneError}
        onRegenerate={handlePhoneRegenerate}
      />
    </div>
  );
};

export default index;
