import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CompanyPerson } from "@/services/companies.service";
import { Lead, LeadsQueryParams } from "@/services/leads.service";
import { EmailDraftModal } from "./components/EmailDraftModal";
import { LinkedinMessageModal } from "./components/LinkedinMessageModal";
import { PhoneCallModal } from "./components/PhoneCallModal";
import { toast } from "sonner";
import LeadsList from "./components/LeadsList";
import { DetailsSidebar } from "../shared/components";
import { useLeadsPageData } from "../shared/hooks";
import { connectionMessagesService, EmailMessage, EmailMessageMetadata, PhoneScriptMetadata, ConnectionMessageData } from "@/services/connectionMessages.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatsCards } from "../shared/components";
import { buildStats } from "../shared/hooks";
import LeadEnrichmentModal from "@/pages/company/crm/leads/lead-enrichment/LeadEnrichmentModal";
import { useEnrichmentConfigs } from "@/hooks/useEnrichmentConfigs";
import type { SeniorityLevel } from "@/types/leadEnrichment";
import { SENIORITY_OPTIONS } from "@/types/leadEnrichment";
import { userService } from "@/services/user.service";
import { usePermissions } from "@/hooks/usePermissions";
import { LeadsNavigation } from "./components/LeadsNavigation";
type ViewMode = "compact" | "detailed" | "card";
// Modal state type for better organization
interface ModalState {
  open: boolean;
  loading: boolean;
  error: string | null;
  messageId: string | null;
}

const index = () => {
  const { canCreate } = usePermissions();
  const queryClient = useQueryClient();
  const pageContentRef = useRef<HTMLElement | null>(null);
  const prevSenioritiesRef = useRef<SeniorityLevel[] | string[] | null>(null);
  // UI State
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedExecutiveFallback, setSelectedExecutiveFallback] = useState<CompanyPerson | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);
  const [leadFiltersOpen, setLeadFiltersOpen] = useState(false);
  const [pendingLeadIdentifier, setPendingLeadIdentifier] = useState<{ email?: string; name?: string; } | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  // Seniority & Enrichment
  const [selectedSeniorities, setSelectedSeniorities] = useState<SeniorityLevel[]>([]);
  const { seniorityOptions: dynamicSeniorityOptions } = useEnrichmentConfigs();
  const seniorityOptions = useMemo(() => dynamicSeniorityOptions.length > 0 ? dynamicSeniorityOptions : SENIORITY_OPTIONS, [dynamicSeniorityOptions]);
  // Pagination & Search
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadsLimit, setLeadsLimit] = useState(25);
  const pageSizeOptions = [10, 25, 50, 100];
  // Filter States - Consolidated
  const [filters, setFilters] = useState({ country: [] as string[], seniority: [] as string[], company: [] as string[], stage: [] as string[], hasEmail: false, hasPhone: false, hasLinkedin: false, hasFavourite: false, sortBy: "newest" as string, });
  // Email Modal State
  const [emailModal, setEmailModal] = useState<ModalState>({ open: false, loading: false, error: null, messageId: null, });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailDraft, setEmailDraft] = useState<EmailMessage | null>(null);
  const [emailMetadata, setEmailMetadata] = useState<EmailMessageMetadata | null>(null);
  // LinkedIn Modal State
  const [linkedinModal, setLinkedinModal] = useState<ModalState>({ open: false, loading: false, error: null, messageId: null, });
  const [linkedinLead, setLinkedinLead] = useState<Lead | null>(null);
  const [linkedinMessage, setLinkedinMessage] = useState<string | null>(null);
  const [linkedinMetadata, setLinkedinMetadata] = useState<ConnectionMessageData | null>(null);
  // Phone Modal State
  const [phoneModal, setPhoneModal] = useState<ModalState>({ open: false, loading: false, error: null, messageId: null, });
  const [phoneLead, setPhoneLead] = useState<Lead | null>(null);
  const [phoneFallbackExecutive, setPhoneFallbackExecutive] = useState<CompanyPerson | null>(null);
  const [phoneScript, setPhoneScript] = useState<string | null>(null);
  const [phoneMetadata, setPhoneMetadata] = useState<PhoneScriptMetadata | null>(null);
  // User Preferences Query
  const { data: userPreferencesData, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ["userPreferences"],
    queryFn: async () => { const response = await userService.getUserPreferences(); return response; },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: { selectedSeniorities: SeniorityLevel[] }) => { const response = await userService.updateUserPreferences({ selectedSeniorities: data.selectedSeniorities }); return response; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["userPreferences"] }); },
    onError: () => { toast.error("Failed to save preferences"); },
  });

  // Load user preferences on mount
  useEffect(() => {
    if (isLoadingPreferences || isInitialized) return;
    let seniorities = userPreferencesData?.data?.preferences?.enrichment?.selectedSeniorities;
    if (!Array.isArray(seniorities) || seniorities.length === 0) { const localData = localStorage.getItem('selectedSeniorities'); if (localData) { try { seniorities = JSON.parse(localData); } catch (e) { console.error("localStorage parse error:", e); } } }
    if (Array.isArray(seniorities) && seniorities.length > 0) { prevSenioritiesRef.current = seniorities; setSelectedSeniorities(seniorities as SeniorityLevel[]); }
    if (userPreferencesData !== undefined) { setIsInitialized(true); }
  }, [userPreferencesData, isLoadingPreferences, isInitialized]);

  // Auto-save preferences
  useEffect(() => {
    if (!isInitialized || seniorityOptions.length === 0) return;
    if (prevSenioritiesRef.current !== null && JSON.stringify(prevSenioritiesRef.current) === JSON.stringify(selectedSeniorities)) { prevSenioritiesRef.current = null; return; }
    try { localStorage.setItem('selectedSeniorities', JSON.stringify(selectedSeniorities)); } catch (e) { console.error("localStorage save error:", e); }
    const timeoutId = setTimeout(() => { updatePreferencesMutation.mutate({ selectedSeniorities }); }, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeniorities, seniorityOptions.length, isInitialized]);
  // Update limit when view mode changes
  useEffect(() => { setLeadsLimit(viewMode === "card" ? 25 : 10); setLeadsPage(1); }, [viewMode]);

  // Reset filters helper
  const resetLeadAdvancedFilters = useCallback(() => { setFilters({ country: [], seniority: [], company: [], stage: [], hasEmail: false, hasPhone: false, hasLinkedin: false, hasFavourite: false, sortBy: "newest", }); }, []);
  // Error resolver
  const resolveErrorMessage = useCallback((error: unknown, fallback: string) => { const err = error as any; return err?.response?.data?.message || err?.data?.message || err?.message || fallback; }, []);
  // Fetch Email Draft
  const fetchEmailDraft = useCallback(async (lead: Lead, regenerate = false) => {
    if (!lead.companyId || !lead._id) { const message = "Missing company or person identifiers for this lead."; setEmailDraft(null); setEmailMetadata(null); setEmailModal(prev => ({ ...prev, error: message })); return; }
    setEmailModal(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await connectionMessagesService.generateEmailMessage({
        companyId: lead.companyId,
        personId: lead._id,
        regenerate,
      });
      setEmailDraft(response.data.email);
      setEmailMetadata(response.data.messageMetadata ?? null);
      setEmailModal(prev => ({ ...prev, messageId: response.data.messageId || null }));
    } catch (error) {
      const message = resolveErrorMessage(error, "Failed to generate email message.");
      setEmailModal(prev => ({ ...prev, error: message }));
      toast.error(message);
    } finally {
      setEmailModal(prev => ({ ...prev, loading: false }));
    }
  },
    [resolveErrorMessage]
  );

  // Fetch LinkedIn Message
  const fetchLinkedinMessage = useCallback(
    async (lead: Lead, regenerate = false) => {
      if (!lead.companyId || !lead._id) {
        const message = "Missing company or person identifiers for this lead.";
        setLinkedinMessage(null);
        setLinkedinMetadata(null);
        setLinkedinModal(prev => ({ ...prev, error: message }));
        return;
      }
      setLinkedinModal(prev => ({ ...prev, loading: true, error: null }));
      setLinkedinMetadata(null);
      try {
        const response = await connectionMessagesService.generateConnectionMessage({
          companyId: lead.companyId,
          personId: lead._id,
          regenerate,
        });

        setLinkedinMessage(response.data.connectionMessage);
        setLinkedinMetadata(response.data);
        setLinkedinModal(prev => ({ ...prev, messageId: response.data.messageId || null }));
      } catch (error) {
        const message = resolveErrorMessage(error, "Failed to generate LinkedIn message.");
        setLinkedinModal(prev => ({ ...prev, error: message }));
        setLinkedinMetadata(null);
        toast.error(message);
      } finally {
        setLinkedinModal(prev => ({ ...prev, loading: false }));
      }
    },
    [resolveErrorMessage]
  );

  // Fetch Phone Script
  const fetchPhoneScript = useCallback(
    async (lead: Lead, regenerate = false) => {
      if (!lead.companyId || !lead._id) {
        const message = "Missing company or person identifiers for this lead.";
        setPhoneScript(null);
        setPhoneMetadata(null);
        setPhoneModal(prev => ({ ...prev, error: message }));
        return;
      }

      setPhoneModal(prev => ({ ...prev, loading: true, error: null }));

      try {
        const response = await connectionMessagesService.generatePhoneScript({
          companyId: lead.companyId,
          personId: lead._id,
          regenerate,
        });

        setPhoneScript(response.data.script);
        setPhoneMetadata(response.data.metadata ?? null);
        setPhoneModal(prev => ({ ...prev, messageId: response.data.messageId || null }));
      } catch (error) {
        const message = resolveErrorMessage(error, "Failed to generate phone script.");
        setPhoneModal(prev => ({ ...prev, error: message }));
        toast.error(message);
      } finally {
        setPhoneModal(prev => ({ ...prev, loading: false }));
      }
    },
    [resolveErrorMessage]
  );

  // Email Handlers
  const handleEmailClick = useCallback(
    (lead: Lead) => {
      setSelectedLead(lead);
      setEmailModal({ open: true, loading: false, error: null, messageId: null });
      setEmailDraft(null);
      setEmailMetadata(null);
      fetchEmailDraft(lead);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    [fetchEmailDraft, queryClient]
  );

  const handleEmailRegenerate = useCallback(() => {
    if (selectedLead) {
      fetchEmailDraft(selectedLead, true);
    }
  }, [fetchEmailDraft, selectedLead]);

  const handleEmailEdit = useCallback(
    async (instructions: string) => {
      if (!emailModal.messageId) return;

      try {
        const response = await connectionMessagesService.updateConnectionMessage({
          messageId: emailModal.messageId,
          instructions,
          messageType: "email",
        });

        setEmailDraft({
          subject: response.data.subject || emailDraft?.subject || "",
          body: response.data.content,
          bodyHtml: response.data.bodyHtml,
          cta: response.data.cta,
          ps: response.data.ps,
        });
        toast.success("Email updated successfully!");
      } catch (error) {
        const message = resolveErrorMessage(error, "Failed to update email.");
        setEmailModal(prev => ({ ...prev, error: message }));
        toast.error(message);
      }
    },
    [emailModal.messageId, emailDraft, resolveErrorMessage]
  );

  // LinkedIn Handlers
  const handleLinkedinClick = useCallback(
    (lead: Lead) => {
      setLinkedinLead(lead);
      setLinkedinModal({ open: true, loading: false, error: null, messageId: null });
      setLinkedinMessage(null);
      setLinkedinMetadata(null);
      fetchLinkedinMessage(lead);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    [fetchLinkedinMessage, queryClient]
  );

  const handleLinkedinRegenerate = useCallback(() => {
    if (linkedinLead) {
      fetchLinkedinMessage(linkedinLead, true);
    }
  }, [fetchLinkedinMessage, linkedinLead]);

  const handleLinkedinEdit = useCallback(
    async (instructions: string) => {
      if (!linkedinModal.messageId) return;

      try {
        const response = await connectionMessagesService.updateConnectionMessage({
          messageId: linkedinModal.messageId,
          instructions,
          messageType: "linkedin",
        });

        setLinkedinMessage(response.data.content);
        toast.success("LinkedIn message updated successfully!");
      } catch (error) {
        const message = resolveErrorMessage(error, "Failed to update LinkedIn message.");
        setLinkedinModal(prev => ({ ...prev, error: message }));
        toast.error(message);
      }
    },
    [linkedinModal.messageId, resolveErrorMessage]
  );

  // Phone Handlers
  const openPhoneModal = useCallback(
    (lead: Lead | null, fallback: CompanyPerson | null = null) => {
      setPhoneLead(lead);
      setPhoneFallbackExecutive(fallback);
      setPhoneScript(null);
      setPhoneMetadata(null);
      setPhoneModal({ open: true, loading: false, error: null, messageId: null });

      if (!lead) {
        setPhoneModal(prev => ({
          ...prev,
          error: "AI phone scripts are available only for leads synced from the database."
        }));
        return;
      }

      fetchPhoneScript(lead);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    [fetchPhoneScript, queryClient]
  );

  const handlePhoneClickFromList = useCallback(
    (lead: Lead) => openPhoneModal(lead, null),
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
      fetchPhoneScript(phoneLead, true);
    } else {
      setPhoneModal(prev => ({
        ...prev,
        error: "Cannot generate a phone script without selecting a synced lead."
      }));
    }
  }, [fetchPhoneScript, phoneLead]);

  const handlePhoneEdit = useCallback(
    async (instructions: string) => {
      if (!phoneModal.messageId) return;

      try {
        const response = await connectionMessagesService.updateConnectionMessage({
          messageId: phoneModal.messageId,
          instructions,
          messageType: "phone",
        });

        setPhoneScript(response.data.content);
        toast.success("Phone script updated successfully!");
      } catch (error) {
        const message = resolveErrorMessage(error, "Failed to update phone script.");
        setPhoneModal(prev => ({ ...prev, error: message }));
        toast.error(message);
      }
    },
    [phoneModal.messageId, resolveErrorMessage]
  );

  // Build leads query parameters
  const leadsParams: LeadsQueryParams = useMemo(() => {
    const params: LeadsQueryParams = {
      page: leadsPage,
      limit: leadsLimit,
    };
    if (leadsSearch) params.search = leadsSearch;
    if (filters.company.length > 0) params.companyId = filters.company.join(",");
    if (filters.country.length > 0) params.country = filters.country.join(",");
    if (filters.seniority.length > 0) params.seniority = filters.seniority.join(",");
    if (filters.stage.length > 0) params.stage = filters.stage.join(",");
    if (filters.hasEmail) params.hasEmail = true;
    if (filters.hasPhone) params.hasPhone = true;
    if (filters.hasLinkedin) params.hasLinkedin = true;
    if (filters.hasFavourite) params.isFavourite = true;
    // Sorting
    if (filters.sortBy === "newest") {
      params.sortBy = "createdAt";
      params.sortOrder = -1;
    } else if (filters.sortBy === "oldest") {
      params.sortBy = "createdAt";
      params.sortOrder = 1;
    } else if (filters.sortBy === "name-asc") {
      params.sortBy = "name";
      params.sortOrder = 1;
    } else if (filters.sortBy === "name-desc") {
      params.sortBy = "name";
      params.sortOrder = -1;
    }

    return params;
  }, [leadsPage, leadsLimit, leadsSearch, filters]);

  // Stats filters
  const statsFilters = useMemo(() => ({
    leadSearch: leadsSearch || undefined,
    company: filters.company.length > 0 ? filters.company.join(",") : undefined,
    stage: filters.stage.length > 0 ? filters.stage : undefined,
    seniority: filters.seniority.length > 0 ? filters.seniority : undefined,
    leadCountry: filters.country.length > 0 ? filters.country.join(",") : undefined,
    hasEmail: filters.hasEmail || undefined,
    hasPhone: filters.hasPhone || undefined,
    hasLinkedin: filters.hasLinkedin || undefined,
    hasFavourite: filters.hasFavourite || undefined,
  }), [leadsSearch, filters]);

  // Unified data fetching
  const { data: unifiedData, isLoading: leadsLoading } = useLeadsPageData(leadsParams, statsFilters);

  // Extract data
  const allCompaniesForFilter = unifiedData?.companiesForFilter || [];
  const paginatedLeads = unifiedData?.leads || [];
  const leadsPagination = unifiedData?.leadsPagination;
  const companyFilteredStats = unifiedData?.companyStats;
  const crmStats = unifiedData?.crmStats;

  const hasLeadAdvancedFilters = useMemo(() =>
    filters.country.length > 0 ||
    filters.seniority.length > 0 ||
    filters.company.length > 0 ||
    filters.stage.length > 0 ||
    filters.hasEmail ||
    filters.hasPhone ||
    filters.hasLinkedin ||
    filters.hasFavourite,
    [filters]
  );

  const totalFilteredLeads = leadsPagination?.totalDocs || 0;
  const totalPages = leadsPagination?.totalPages || 1;

  const effectiveTotalCompanies = useMemo(() => {
    if (leadsSearch || hasLeadAdvancedFilters) {
      const uniqueCompanyIds = new Set(
        paginatedLeads.map((lead) => lead.companyId).filter(Boolean)
      );
      return uniqueCompanyIds.size;
    }
    return companyFilteredStats?.totalCompanies ?? 0;
  }, [paginatedLeads, leadsSearch, hasLeadAdvancedFilters, companyFilteredStats]);

  const stats = useMemo(() =>
    buildStats(
      {
        totalCompanies: effectiveTotalCompanies, totalLeads: totalFilteredLeads,
        totalOutreach: companyFilteredStats?.totalOutreach ?? crmStats?.totalOutreach,
        totalDealsClosed: companyFilteredStats?.totalDealsClosed ?? crmStats?.totalDealsClosed,
        activeClients: companyFilteredStats?.activeClients ?? crmStats?.activeClients,
        messagesSent: companyFilteredStats?.messagesSent ?? crmStats?.messagesSent,
      }, "leads"),
    [effectiveTotalCompanies, totalFilteredLeads, companyFilteredStats, crmStats]
  );
  // Reset pagination when filters change
  useEffect(() => {
    setLeadsPage(1);
  }, [leadsSearch, filters, leadsLimit]);

  useEffect(() => {
    if (!pendingLeadIdentifier || !paginatedLeads) return;

    const { email, name } = pendingLeadIdentifier;
    const matchedLead =
      (email && paginatedLeads.find((lead) => lead.email?.toLowerCase() === email)) ||
      (name && paginatedLeads.find((lead) => lead.name?.toLowerCase() === name));

    if (matchedLead) {
      setSelectedLeadId(matchedLead._id);
      setSelectedExecutiveFallback(null);
      setPendingLeadIdentifier(null);
    } else if (!leadsLoading) {
      setPendingLeadIdentifier(null);
    }
  }, [pendingLeadIdentifier, paginatedLeads, leadsLoading]);

  const handleLeadClick = useCallback((leadId: string) => {
    setSelectedLeadId((prev) => (prev === leadId ? null : leadId));
    setSelectedExecutiveFallback(null);
  }, []);

  const isSidebarOpen = selectedLeadId !== null || selectedExecutiveFallback !== null;
  const selectedLeadDetails = paginatedLeads?.find((lead) => lead._id === selectedLeadId);

  return (
    <DashboardLayout>
      <motion.main
        ref={pageContentRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white h-screen overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="max-w-[1600px] mx-auto w-full flex flex-col flex-1 relative min-h-0"
        >
          <LeadsNavigation
            canCreate={canCreate("leads")}
            selectedSeniorities={selectedSeniorities}
            onSenioritiesChange={setSelectedSeniorities}
            seniorityOptions={seniorityOptions}
            onEnrichmentClick={() => setEnrichmentModalOpen(true)}
            leadsSearch={leadsSearch}
            onSearchChange={setLeadsSearch}
            leadsCompanyFilter={filters.company}
            onCompanyFilterChange={(company) => setFilters(prev => ({ ...prev, company }))}
            allCompaniesForFilter={allCompaniesForFilter}
            leadFiltersOpen={leadFiltersOpen}
            onFiltersOpenChange={setLeadFiltersOpen}
            hasLeadAdvancedFilters={hasLeadAdvancedFilters}
            leadsCountryFilter={filters.country}
            onCountryFilterChange={(country) => setFilters(prev => ({ ...prev, country }))}
            leadsSeniorityFilter={filters.seniority}
            onSeniorityFilterChange={(seniority) => setFilters(prev => ({ ...prev, seniority }))}
            leadsStageFilter={filters.stage}
            onStageFilterChange={(stage) => setFilters(prev => ({ ...prev, stage }))}
            leadsSortBy={filters.sortBy}
            onSortByChange={(sortBy) => setFilters(prev => ({ ...prev, sortBy }))}
            leadsHasEmailFilter={filters.hasEmail}
            onHasEmailFilterChange={(hasEmail) => setFilters(prev => ({ ...prev, hasEmail }))}
            leadsHasPhoneFilter={filters.hasPhone}
            onHasPhoneFilterChange={(hasPhone) => setFilters(prev => ({ ...prev, hasPhone }))}
            leadsHasLinkedinFilter={filters.hasLinkedin}
            onHasLinkedinFilterChange={(hasLinkedin) => setFilters(prev => ({ ...prev, hasLinkedin }))}
            leadsHasFavouriteFilter={filters.hasFavourite}
            onHasFavouriteFilterChange={(hasFavourite) => setFilters(prev => ({ ...prev, hasFavourite }))}
            onResetFilters={resetLeadAdvancedFilters}
          />
          <StatsCards stats={stats} isLoading={leadsLoading} />
          <div className={`flex flex-col lg:flex-row items-stretch flex-1 min-h-0 overflow-hidden ${isSidebarOpen ? "gap-2 sm:gap-3 md:gap-4 lg:gap-6" : ""}`}>
            <div className="relative pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full h-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] flex-1 min-w-0 flex flex-col overflow-hidden">
              <LeadsList
                leads={paginatedLeads}
                loading={leadsLoading}
                selectedLeadId={selectedLeadId}
                onSelectLead={handleLeadClick}
                onEmailClick={handleEmailClick}
                onPhoneClick={handlePhoneClickFromList}
                onLinkedinClick={handleLinkedinClick}
                search={leadsSearch}
                onSearchChange={setLeadsSearch}
                companyFilter={filters.company}
                companies={allCompaniesForFilter}
                page={leadsPage}
                totalPages={totalPages}
                onPageChange={setLeadsPage}
                totalLeads={totalFilteredLeads}
                showFilters={false}
                selectedLead={selectedLeadDetails}
                executiveFallback={selectedExecutiveFallback}
                onPhoneClickFromSidebar={handlePhoneClickFromSidebar}
                pageSize={leadsLimit}
                onPageSizeChange={setLeadsLimit}
                pageSizeOptions={pageSizeOptions}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
            <div className="hidden lg:block">
              <DetailsSidebar
                activeTab="leads"
                isOpen={isSidebarOpen}
                selectedLead={selectedLeadDetails}
              />
            </div>
          </div>
        </motion.div>
      </motion.main>

      <EmailDraftModal
        open={emailModal.open}
        onClose={() => setEmailModal(prev => ({ ...prev, open: false }))}
        leadName={selectedLead?.name}
        leadEmail={selectedLead?.email}
        content={emailDraft}
        metadata={emailMetadata}
        loading={emailModal.loading}
        error={emailModal.error}
        onRegenerate={handleEmailRegenerate}
        messageId={emailModal.messageId}
        onEdit={handleEmailEdit}
      />

      <LinkedinMessageModal
        open={linkedinModal.open}
        onClose={() => setLinkedinModal(prev => ({ ...prev, open: false }))}
        leadName={linkedinLead?.name}
        leadLinkedin={linkedinLead?.linkedinUrl}
        message={linkedinMessage}
        loading={linkedinModal.loading}
        error={linkedinModal.error}
        metadata={linkedinMetadata}
        onRegenerate={handleLinkedinRegenerate}
        messageId={linkedinModal.messageId}
        onEdit={handleLinkedinEdit}
      />

      <PhoneCallModal
        open={phoneModal.open}
        onClose={() => setPhoneModal(prev => ({ ...prev, open: false }))}
        leadName={phoneLead?.name ?? phoneFallbackExecutive?.name}
        phoneNumber={phoneLead?.phone ?? phoneFallbackExecutive?.phone}
        leadId={phoneLead?._id}
        script={phoneScript}
        metadata={phoneMetadata}
        loading={phoneModal.loading}
        error={phoneModal.error}
        onRegenerate={handlePhoneRegenerate}
        messageId={phoneModal.messageId}
        onEdit={handlePhoneEdit}
      />

      <LeadEnrichmentModal
        isOpen={enrichmentModalOpen}
        onClose={() => setEnrichmentModalOpen(false)}
        selectedSeniorities={selectedSeniorities}
        onEnrichmentStart={(searchId) => {
          toast.success(`Enrichment started! Tracking ID: ${searchId}`);
        }}
        onEnrichmentComplete={() => {
          toast.success("Enrichment completed! Leads list will refresh.");
          queryClient.invalidateQueries({ queryKey: ["leads-page-unified"] });
          queryClient.invalidateQueries({ queryKey: ["companies"] });
          setEnrichmentModalOpen(false);
        }}
      />
    </DashboardLayout>
  );
};

export default index;