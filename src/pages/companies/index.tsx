import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Search,
  Filter,
  Layers,
  Upload,
  Loader2,
} from "lucide-react";
import { Company, CompanyPerson } from "@/services/companies.service";
import { Lead } from "@/services/leads.service";
import { EmailDraftModal } from "@/pages/companies/components/EmailDraftModal";
import { LinkedinMessageModal } from "@/pages/companies/components/LinkedinMessageModal";
import { PhoneCallModal } from "@/pages/companies/components/PhoneCallModal";
import { toast } from "sonner";
import CompaniesList from "./components/CompaniesList";
import LeadsList from "./components/LeadsList";
import { highlevelService } from "@/services/highlevel.service";
import DetailsSidebar from "./components/DetailsSidebar";
import CompanyExecutivesPanel from "./components/CompanyExecutivesPanel";
import LeadDetailsPanel from "./components/LeadDetailsPanel";
import {
  defaultStatsCards,
  useCompaniesData,
  useLeadsData,
  buildStats,
} from "./hooks";
import {
  connectionMessagesService,
  EmailMessage,
  EmailMessageMetadata,
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
  const [emailDraft, setEmailDraft] = useState<EmailMessage | null>(null);
  const [emailMetadata, setEmailMetadata] =
    useState<EmailMessageMetadata | null>(null);
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
  const [bulkSyncingLeads, setBulkSyncingLeads] = useState(false);
  const [syncedLeadIds, setSyncedLeadIds] = useState<Set<string>>(new Set());
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
        const response = await connectionMessagesService.generateEmailMessage({
          companyId: lead.companyId,
          personId: lead._id,
        });

        setEmailDraft(response.data.email);
        setEmailMetadata(response.data.messageMetadata ?? null);
      } catch (error) {
        const message = resolveErrorMessage(
          error,
          "Failed to generate email message."
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
    totalCompanies: filteredTotalCompanies,
  } = useCompaniesData(companiesParams);

  // Fetch total companies count without search/filter for stats
  const { totalCompanies: totalCompaniesForStats } = useCompaniesData({
    page: 1,
    limit: 1,
  });

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
    totalLeads: filteredTotalLeads,
    pagination: leadsPagination,
  } = useLeadsData(leadsParams, {
    enabled: activeTab === "leads" || pendingLeadIdentifier !== null,
  });

  // Fetch total leads count without search/filter for stats
  const { totalLeads: totalLeadsForStats } = useLeadsData(
    { page: 1, limit: 1 },
    { enabled: true }
  );

  const loading = companiesQuery.isLoading;
  const leadsLoading = leadsQuery.isLoading || leadsQuery.isFetching;

  const stats = useMemo(
    () =>
      buildStats(totalCompaniesForStats, totalLeadsForStats, defaultStatsCards),
    [totalCompaniesForStats, totalLeadsForStats]
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
    <DashboardLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-24 sm:pt-28 lg:pt-32 pb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto w-full">
          {/* Tabs */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div
              ref={containerRef}
              className="relative inline-flex w-fit gap-[10px] items-center rounded-full bg-[#2A2A2A] p-1"
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
                      ? "text-white"
                      : "text-gray-400 hover:text-white/80"
                  }`}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Sync All Button - Show when leads tab is active */}
            {activeTab === "leads" && leads.length > 0 && (
              <Button
                onClick={async () => {
                  if (leads.length === 0) {
                    toast.error("No leads to sync");
                    return;
                  }

                  setBulkSyncingLeads(true);
                  try {
                    const companyPersonIds = leads
                      .filter((lead) => lead._id && lead.companyId)
                      .map((lead) => lead._id) as string[];

                    if (companyPersonIds.length === 0) {
                      toast.error("No valid leads to sync");
                      return;
                    }

                    const result = await highlevelService.bulkSyncContacts({
                      companyPersonIds,
                      type: "lead",
                      source: "api v1",
                      tags: [],
                    });

                    if (result.success) {
                      // Mark all synced leads
                      setSyncedLeadIds(new Set(companyPersonIds));
                      toast.success(
                        `Bulk sync completed! ${result.data.success} succeeded, ${result.data.failed} failed.`
                      );
                    } else {
                      toast.error(result.message || "Bulk sync failed");
                    }
                  } catch (error: any) {
                    const errorMessage =
                      error?.response?.data?.message ||
                      error?.message ||
                      "Failed to bulk sync leads to GoHighLevel";
                    toast.error(errorMessage);
                  } finally {
                    setBulkSyncingLeads(false);
                  }
                }}
                disabled={bulkSyncingLeads}
                className="rounded-full bg-primary hover:bg-primary/80 disabled:bg-primary/50 disabled:cursor-wait px-4 sm:px-6 py-2 text-xs sm:text-sm font-semibold text-white flex items-center gap-2"
              >
                {bulkSyncingLeads ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="hidden sm:inline">Syncing All...</span>
                    <span className="sm:hidden">Syncing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">
                      Sync All ({leads.length})
                    </span>
                    <span className="sm:hidden">Sync All</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {stats.map((stat) => (
              <div key={stat.title} className="relative flex-1 w-full">
                {/* Gradient glow behind card */}
                <div className="absolute -inset-4 lg:-inset-8 bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-transparent blur-3xl opacity-60" />
                <Card
                  className="relative border-[#FFFFFF4D] shadow-2xl w-full"
                  style={{
                    borderRadius: "30px",
                    opacity: 1,
                    borderWidth: "1px",
                    background:
                      "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                  }}
                >
                  <CardContent className="p-4 sm:p-5 lg:p-6 h-full flex flex-col justify-between min-h-[150px]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs sm:text-sm text-gray-300 font-medium">
                        {stat.title}
                      </p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        <span className="hidden sm:inline">{stat.link}</span>
                        <ArrowRight className="w-3 h-3 sm:ml-1" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
                        <stat.icon className="w-full h-full text-white" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-white">
                        {stat.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Title and Filters Bar - Same Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-5">
            {/* Heading */}
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {activeTab === "companies" ? "Companies" : "Leads"}
            </h2>

            {/* Controls Container - responsive layout */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Filter Buttons Row - wraps on mobile, stays in row on larger screens */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1">
                {activeTab === "companies" ? (
                  <>
                    {/* Search Input */}
                    <div className="relative w-full sm:w-auto sm:min-w-[160px] sm:flex-1 lg:flex-none lg:min-w-[160px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                      <Input
                        type="text"
                        placeholder="Search companies..."
                        value={companiesSearch}
                        onChange={(e) => setCompaniesSearch(e.target.value)}
                        className="h-9 pl-10 pr-4 !rounded-full border-0 text-gray-300 placeholder:text-gray-500 text-xs w-full"
                        style={{
                          background: "#FFFFFF1A",
                          boxShadow:
                            "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                        }}
                      />
                    </div>
                    {filteredTotalCompanies !== undefined && (
                      <div
                        className="px-3 py-1.5 sm:py-2 rounded-full text-gray-300 text-xs sm:text-sm font-medium whitespace-nowrap flex items-center justify-center"
                        style={{
                          background: "#FFFFFF1A",
                          boxShadow:
                            "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                        }}
                      >
                        {filteredTotalCompanies}{" "}
                        {filteredTotalCompanies === 1 ? "company" : "companies"}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Search Input */}
                    <div className="relative w-full sm:w-auto sm:min-w-[160px] sm:flex-1 lg:flex-none lg:min-w-[160px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                      <Input
                        type="text"
                        placeholder="Search leads..."
                        value={leadsSearch}
                        onChange={(e) => setLeadsSearch(e.target.value)}
                        className="h-9 pl-10 pr-4 !rounded-full border-0 text-gray-300 placeholder:text-gray-500 text-xs w-full"
                        style={{
                          background: "#FFFFFF1A",
                          boxShadow:
                            "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                        }}
                      />
                    </div>
                    {/* Company Filter Dropdown */}
                    <div className="relative w-full sm:w-auto sm:min-w-[140px]">
                      <Select
                        value={leadsCompanyFilter || "all"}
                        onValueChange={(value) =>
                          setLeadsCompanyFilter(value === "all" ? null : value)
                        }
                      >
                        <SelectTrigger
                          className="h-9 pl-10 pr-4 rounded-full border-0 text-gray-300 text-xs w-full sm:w-auto"
                          style={{
                            background: "#FFFFFF1A",
                            boxShadow:
                              "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                          }}
                        >
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <Layers className="w-4 h-4 text-gray-400" />
                          </div>
                          <SelectValue placeholder="All Companies" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] rounded-xl">
                          <SelectItem
                            value="all"
                            className="text-gray-300 focus:text-white focus:bg-white/10"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>All Companies</span>
                              {totalLeadsForStats !== undefined && (
                                <span className="ml-2 text-xs text-gray-500">
                                  ({totalLeadsForStats}{" "}
                                  {totalLeadsForStats === 1 ? "lead" : "leads"})
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
                                className={`text-gray-300 focus:text-white focus:bg-white/10 ${
                                  companyLeadsCount === 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="truncate flex-1">
                                    {company.name}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">
                                    ({companyLeadsCount}{" "}
                                    {companyLeadsCount === 1 ? "lead" : "leads"}
                                    )
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    {filteredTotalLeads !== undefined && (
                      <div
                        className="px-3 py-1.5 sm:py-2 rounded-full text-gray-300 text-xs sm:text-sm font-medium whitespace-nowrap flex items-center justify-center"
                        style={{
                          background: "#FFFFFF1A",
                          boxShadow:
                            "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                        }}
                      >
                        {filteredTotalLeads}{" "}
                        {filteredTotalLeads === 1 ? "lead" : "leads"}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Split View */}
          <div
            className={`flex flex-col lg:flex-row items-start ${
              isSidebarOpen ? "gap-3 sm:gap-4 lg:gap-6" : ""
            }`}
          >
            {/* Left: Companies/Leads List */}
            <div
              className="relative pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-2xl
            h-[calc(100vh-420px)] sm:h-[calc(100vh-380px)] md:h-[calc(100vh-360px)] lg:h-[calc(100vh-340px)]
            min-h-[350px] sm:min-h-[400px] md:min-h-[500px] max-h-[800px]
            flex-1 overflow-y-auto w-full"
              style={{
                borderRadius: "30px",
                borderWidth: "1px",
                borderColor: "rgba(255, 255, 255, 0.08)",
                background:
                  "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
              }}
            >
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
                  totalCompanies={filteredTotalCompanies}
                  showFilters={false}
                  selectedCompany={selectedCompany}
                  onViewAllLeads={() => setActiveTab("leads")}
                  onExecutiveSelect={handleExecutiveSelect}
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
                  totalLeads={filteredTotalLeads}
                  showFilters={false}
                  selectedLead={selectedLeadDetails}
                  executiveFallback={selectedExecutiveFallback}
                  onPhoneClickFromSidebar={handlePhoneClickFromSidebar}
                  syncedLeadIds={syncedLeadIds}
                  onLeadSynced={(leadId) => {
                    setSyncedLeadIds((prev) => new Set(prev).add(leadId));
                  }}
                />
              )}
            </div>

            {/* Right: Executives/Details Panel (Desktop only) */}
            <div className="hidden lg:block">
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
    </DashboardLayout>
  );
};

export default index;
