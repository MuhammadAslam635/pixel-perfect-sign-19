import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers } from "lucide-react";
import { CompanyPerson } from "@/services/companies.service";
import { Lead } from "@/services/leads.service";
import { EmailDraftModal } from "./components/EmailDraftModal";
import { LinkedinMessageModal } from "./components/LinkedinMessageModal";
import { PhoneCallModal } from "./components/PhoneCallModal";
import { toast } from "sonner";
import LeadsList from "./components/LeadsList";
import { DetailsSidebar } from "../shared/components";
import { useCompaniesData, useLeadsData } from "../shared/hooks";
import { LeadsQueryParams } from "@/services/leads.service";
import {
  connectionMessagesService,
  EmailMessage,
  EmailMessageMetadata,
  PhoneScriptMetadata,
  ConnectionMessageData,
} from "@/services/connectionMessages.service";
import { useQueryClient } from "@tanstack/react-query";
import {
  StatsCards,
  SearchInput,
  FilterButton,
  LeadsFiltersPanel,
} from "../shared/components";
import { buildStats } from "../shared/hooks";

const index = () => {
  const queryClient = useQueryClient();
  // Selected lead state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Leads filters and pagination
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadsLimit, setLeadsLimit] = useState(10);
  const [leadsCompanyFilter, setLeadsCompanyFilter] = useState<string | null>(
    null
  );
  const [leadsLocationFilter, setLeadsLocationFilter] = useState<string>("");
  const [leadsPositionFilter, setLeadsPositionFilter] = useState<string>("");
  const [leadsHasEmailFilter, setLeadsHasEmailFilter] = useState(false);
  const [leadsHasPhoneFilter, setLeadsHasPhoneFilter] = useState(false);
  const [leadsHasLinkedinFilter, setLeadsHasLinkedinFilter] = useState(false);
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
  const [leadFiltersOpen, setLeadFiltersOpen] = useState(false);

  const resetLeadAdvancedFilters = useCallback(() => {
    setLeadsLocationFilter("");
    setLeadsPositionFilter("");
    setLeadsHasEmailFilter(false);
    setLeadsHasPhoneFilter(false);
    setLeadsHasLinkedinFilter(false);
    setLeadFiltersOpen(false);
  }, []);
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
  const pageContentRef = useRef<HTMLElement | null>(null);
  const pageSizeOptions = [10, 25, 50, 100];
  const handleDesktopExecutivesFocus = () => {
    if (pageContentRef.current) {
      pageContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch all companies for the leads filter dropdown (limit to 500 for dropdown)
  const { companies: allCompaniesForFilter } = useCompaniesData({
    page: 1,
    limit: 500,
  });

  // Fetch all leads (without pagination) to count leads per company
  const { leads: allLeadsForCount } = useLeadsData(
    { page: 1, limit: 10000 },
    { enabled: true }
  );

  const hasLeadAdvancedFilters = useMemo(
    () =>
      leadsLocationFilter.trim() !== "" ||
      leadsPositionFilter.trim() !== "" ||
      leadsHasEmailFilter ||
      leadsHasPhoneFilter ||
      leadsHasLinkedinFilter,
    [
      leadsLocationFilter,
      leadsPositionFilter,
      leadsHasEmailFilter,
      leadsHasPhoneFilter,
      leadsHasLinkedinFilter,
    ]
  );

  const leadsParams = useMemo(() => {
    const params: LeadsQueryParams = {
      page: leadsPage,
      limit: leadsLimit,
      search: leadsSearch || undefined,
      companyId: leadsCompanyFilter || undefined,
      sortBy: "createdAt",
      sortOrder: -1,
    };

    if (leadsLocationFilter.trim()) {
      params.location = leadsLocationFilter.trim();
    }

    if (leadsPositionFilter.trim()) {
      params.position = leadsPositionFilter.trim();
    }

    if (leadsHasEmailFilter) {
      params.hasEmail = true;
    }

    if (leadsHasPhoneFilter) {
      params.hasPhone = true;
    }

    if (leadsHasLinkedinFilter) {
      params.hasLinkedin = true;
    }

    return params;
  }, [
    leadsPage,
    leadsLimit,
    leadsSearch,
    leadsCompanyFilter,
    leadsLocationFilter,
    leadsPositionFilter,
    leadsHasEmailFilter,
    leadsHasPhoneFilter,
    leadsHasLinkedinFilter,
  ]);

  const {
    query: leadsQuery,
    leads,
    totalLeads: filteredTotalLeads,
    pagination: leadsPagination,
  } = useLeadsData(leadsParams, {
    enabled: true,
  });

  // Fetch total leads count without search/filter for stats
  const { totalLeads: totalLeadsForStats } = useLeadsData(
    { page: 1, limit: 1 },
    { enabled: true }
  );

  const leadsLoading = leadsQuery.isLoading || leadsQuery.isFetching;

  const stats = useMemo(
    () => buildStats(undefined, totalLeadsForStats),
    [totalLeadsForStats]
  );

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

  // Reset pagination when filters change
  useEffect(() => {
    setLeadsPage(1);
  }, [
    leadsSearch,
    leadsCompanyFilter,
    leadsLimit,
    leadsLocationFilter,
    leadsPositionFilter,
    leadsHasEmailFilter,
    leadsHasPhoneFilter,
    leadsHasLinkedinFilter,
  ]);

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
    selectedLeadId !== null || selectedExecutiveFallback !== null;
  const selectedLeadDetails: Lead | undefined = leads.find(
    (lead) => lead._id === selectedLeadId
  );

  return (
    <DashboardLayout>
      <main
        ref={pageContentRef}
        className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white flex-1 overflow-y-auto"
      >
        <div className="max-w-[1600px] mx-auto w-full">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-5">
            {/* Controls Container */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 order-1 lg:order-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 flex-1">
                <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                  {/* Search Input */}
                  <SearchInput
                    placeholder="Search leads..."
                    value={leadsSearch}
                    onChange={setLeadsSearch}
                  />

                  {/* Company Filter Dropdown */}
                  <div className="relative w-full sm:w-auto sm:min-w-[140px]">
                    <Select
                      value={leadsCompanyFilter || "all"}
                      onValueChange={(value) =>
                        setLeadsCompanyFilter(value === "all" ? null : value)
                      }
                    >
                      <SelectTrigger
                        className="h-9 pl-10 pr-4 rounded-lg sm:rounded-full border border-gray-600 sm:border-0 text-gray-300 text-xs w-full sm:w-auto bg-gray-800/50 sm:bg-[#FFFFFF1A] mobile-select-trigger"
                        style={{
                          boxShadow: "none",
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
                                  {companyLeadsCount === 1 ? "lead" : "leads"})
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Popover
                      open={leadFiltersOpen}
                      onOpenChange={setLeadFiltersOpen}
                    >
                      <PopoverTrigger asChild>
                        <FilterButton
                          hasFilters={hasLeadAdvancedFilters}
                          onClick={() => setLeadFiltersOpen(true)}
                        />
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        className="w-80 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-4"
                      >
                        <LeadsFiltersPanel
                          locationFilter={leadsLocationFilter}
                          onLocationFilterChange={setLeadsLocationFilter}
                          positionFilter={leadsPositionFilter}
                          onPositionFilterChange={setLeadsPositionFilter}
                          hasEmailFilter={leadsHasEmailFilter}
                          onHasEmailFilterChange={setLeadsHasEmailFilter}
                          hasPhoneFilter={leadsHasPhoneFilter}
                          onHasPhoneFilterChange={setLeadsHasPhoneFilter}
                          hasLinkedinFilter={leadsHasLinkedinFilter}
                          onHasLinkedinFilterChange={setLeadsHasLinkedinFilter}
                          hasFilters={hasLeadAdvancedFilters}
                          onResetFilters={resetLeadAdvancedFilters}
                          onClose={() => setLeadFiltersOpen(false)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <StatsCards stats={stats} />

          {/* Split View */}
          <div
            className={`flex flex-col lg:flex-row items-start ${
              isSidebarOpen ? "gap-2 sm:gap-3 md:gap-4 lg:gap-6" : ""
            }`}
          >
            {/* Left: Companies/Leads List */}
            <div className="relative pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)]">
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
                pageSize={leadsLimit}
                onPageSizeChange={setLeadsLimit}
                pageSizeOptions={pageSizeOptions}
              />
            </div>

            {/* Right: Executives/Details Panel (Desktop only) */}
            <div className="hidden lg:block">
              <DetailsSidebar
                activeTab="leads"
                isOpen={isSidebarOpen}
                selectedLead={selectedLeadDetails}
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
        leadId={phoneLead?._id}
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
