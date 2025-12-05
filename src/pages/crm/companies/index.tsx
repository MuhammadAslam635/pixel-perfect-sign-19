import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Users } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Company, CompanyPerson } from "@/services/companies.service";
import { toast } from "sonner";
import CompaniesList from "./components/CompaniesList";
import { DetailsSidebar } from "../shared/components";
import {
  useCompaniesData,
  useCompanyCrmStatsData,
  useLeadsData,
  useCrmStatsData,
} from "../shared/hooks";
import { CompaniesQueryParams } from "@/services/companies.service";
import {
  StatsCards,
  SearchInput,
  FilterButton,
  CompanyFiltersPanel,
  CompanyFiltersInline,
} from "../shared/components";
import { buildStats } from "../shared/hooks";

// Leads imports
import { Lead } from "@/services/leads.service";
import { LeadsQueryParams } from "@/services/leads.service";
import {
  connectionMessagesService,
  EmailMessage,
  EmailMessageMetadata,
  PhoneScriptMetadata,
  ConnectionMessageData,
} from "@/services/connectionMessages.service";
import { useQueryClient } from "@tanstack/react-query";
import { LeadsFiltersPanel, LeadsFiltersInline } from "../shared/components";
import LeadsList from "../leads/components/LeadsList";
import { EmailDraftModal } from "../leads/components/EmailDraftModal";
import { LinkedinMessageModal } from "../leads/components/LinkedinMessageModal";
import { PhoneCallModal } from "../leads/components/PhoneCallModal";

const COMPANY_EMPLOYEE_RANGES = [
  { value: "all", label: "All company sizes" },
  { value: "small", label: "1-50 employees", min: 1, max: 50 },
  { value: "medium", label: "50-250 employees", min: 50, max: 250 },
  { value: "large", label: "250-1000 employees", min: 250, max: 1000 },
  { value: "enterprise", label: "1000+ employees", min: 1000 },
];

type ViewMode = "compact" | "detailed" | "card";

const index = () => {
  const navigate = useNavigate();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [isMobileExecutivesView, setIsMobileExecutivesView] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");
  const [activeTab, setActiveTab] = useState<"companies" | "leads">(
    "companies"
  );

  // Companies filters and pagination
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesSearch, setCompaniesSearch] = useState("");
  const [companiesLimit, setCompaniesLimit] = useState(
    viewMode === "card" ? 25 : 10
  );

  // Update limit when view mode changes
  useEffect(() => {
    setCompaniesLimit(viewMode === "card" ? 25 : 10);
    setLeadsLimit(viewMode === "card" ? 25 : 10);
    // Reset to page 1 when changing view mode
    setCompaniesPage(1);
    setLeadsPage(1);
  }, [viewMode]);
  const [companiesIndustryFilter, setCompaniesIndustryFilter] =
    useState<string>("all");
  const [companiesEmployeeRange, setCompaniesEmployeeRange] =
    useState<string>("all");
  const [companiesLocationFilter, setCompaniesLocationFilter] =
    useState<string>("");
  const [companiesHasPeopleFilter, setCompaniesHasPeopleFilter] =
    useState(false);
  const [companiesHasWebsiteFilter, setCompaniesHasWebsiteFilter] =
    useState(false);

  const [companyFiltersOpen, setCompanyFiltersOpen] = useState(false);

  // Leads state variables
  const queryClient = useQueryClient();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadsLimit, setLeadsLimit] = useState(viewMode === "card" ? 25 : 10);
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
  const [emailMessageId, setEmailMessageId] = useState<string | null>(null);
  const [linkedinModalOpen, setLinkedinModalOpen] = useState(false);
  const [linkedinLead, setLinkedinLead] = useState<Lead | null>(null);
  const [linkedinMessage, setLinkedinMessage] = useState<string | null>(null);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [linkedinError, setLinkedinError] = useState<string | null>(null);
  const [linkedinMetadata, setLinkedinMetadata] =
    useState<ConnectionMessageData | null>(null);
  const [linkedinMessageId, setLinkedinMessageId] = useState<string | null>(
    null
  );
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneLead, setPhoneLead] = useState<Lead | null>(null);
  const [phoneFallbackExecutive, setPhoneFallbackExecutive] =
    useState<CompanyPerson | null>(null);
  const [phoneScript, setPhoneScript] = useState<string | null>(null);
  const [phoneMetadata, setPhoneMetadata] =
    useState<PhoneScriptMetadata | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneMessageId, setPhoneMessageId] = useState<string | null>(null);
  const [leadFiltersOpen, setLeadFiltersOpen] = useState(false);
  const resetCompanyAdvancedFilters = useCallback(() => {
    setCompaniesIndustryFilter("all");
    setCompaniesEmployeeRange("all");
    setCompaniesLocationFilter("");
    setCompaniesHasPeopleFilter(false);
    setCompaniesHasWebsiteFilter(false);
    setCompanyFiltersOpen(false);
  }, []);

  // Leads callback functions
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
    async (lead: Lead, regenerate = false) => {
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
          regenerate,
        });

        setEmailDraft(response.data.email);
        setEmailMetadata(response.data.messageMetadata ?? null);
        setEmailMessageId(response.data.messageId || null);
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
    async (lead: Lead, regenerate = false) => {
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
            regenerate,
          });

        setLinkedinMessage(response.data.connectionMessage);
        setLinkedinMetadata(response.data);
        setLinkedinMessageId(response.data.messageId || null);
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
    async (lead: Lead, regenerate = false) => {
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
          regenerate,
        });

        setPhoneScript(response.data.script);
        setPhoneMetadata(response.data.metadata ?? null);
        setPhoneMessageId(response.data.messageId || null);
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
      setEmailMessageId(null);
      fetchEmailDraft(lead);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    [fetchEmailDraft, queryClient]
  );

  const handleEmailRegenerate = useCallback(() => {
    if (selectedLead) {
      fetchEmailDraft(selectedLead, true); // Pass regenerate flag
    }
  }, [fetchEmailDraft, selectedLead]);

  const handleEmailEdit = useCallback(
    async (instructions: string) => {
      if (!emailMessageId) return;

      try {
        const response =
          await connectionMessagesService.updateConnectionMessage({
            messageId: emailMessageId,
            instructions,
            messageType: "email",
          });

        // Update the email with the new content
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
        setEmailError(message);
        toast.error(message);
      }
    },
    [emailMessageId, emailDraft, resolveErrorMessage]
  );

  const handleLinkedinClick = useCallback(
    (lead: Lead) => {
      setLinkedinLead(lead);
      setLinkedinModalOpen(true);
      setLinkedinMessage(null);
      setLinkedinError(null);
      setLinkedinMetadata(null);
      setLinkedinMessageId(null);
      fetchLinkedinMessage(lead);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
    [fetchLinkedinMessage, queryClient]
  );

  const handleLinkedinRegenerate = useCallback(() => {
    if (linkedinLead) {
      fetchLinkedinMessage(linkedinLead, true); // Pass regenerate flag
    }
  }, [fetchLinkedinMessage, linkedinLead]);

  const handleLinkedinEdit = useCallback(
    async (instructions: string) => {
      if (!linkedinMessageId) return;

      try {
        const response =
          await connectionMessagesService.updateConnectionMessage({
            messageId: linkedinMessageId,
            instructions,
            messageType: "linkedin",
          });

        // Update the message with the new content
        setLinkedinMessage(response.data.content);
        toast.success("LinkedIn message updated successfully!");
      } catch (error) {
        const message = resolveErrorMessage(
          error,
          "Failed to update LinkedIn message."
        );
        setLinkedinError(message);
        toast.error(message);
      }
    },
    [linkedinMessageId, resolveErrorMessage]
  );

  const openPhoneModal = useCallback(
    (lead: Lead | null, fallback: CompanyPerson | null = null) => {
      setPhoneLead(lead);
      setPhoneFallbackExecutive(fallback);
      setPhoneScript(null);
      setPhoneMetadata(null);
      setPhoneError(null);
      setPhoneMessageId(null);
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
      fetchPhoneScript(phoneLead, true); // Pass regenerate flag
    } else {
      setPhoneError(
        "Cannot generate a phone script without selecting a synced lead."
      );
    }
  }, [fetchPhoneScript, phoneLead]);

  const handlePhoneEdit = useCallback(
    async (instructions: string) => {
      if (!phoneMessageId) return;

      try {
        const response =
          await connectionMessagesService.updateConnectionMessage({
            messageId: phoneMessageId,
            instructions,
            messageType: "phone",
          });

        // Update the script with the new content
        setPhoneScript(response.data.content);
        toast.success("Phone script updated successfully!");
      } catch (error) {
        const message = resolveErrorMessage(
          error,
          "Failed to update phone script."
        );
        setPhoneError(message);
        toast.error(message);
      }
    },
    [phoneMessageId, resolveErrorMessage]
  );

  const companiesParams = useMemo(() => {
    const params: CompaniesQueryParams = {
      page: companiesPage,
      limit: companiesLimit,
      search: companiesSearch || undefined,
      sortBy: "createdAt",
      sortOrder: -1,
    };

    if (companiesIndustryFilter !== "all") {
      params.industry = companiesIndustryFilter;
    }

    if (companiesEmployeeRange !== "all") {
      const range = COMPANY_EMPLOYEE_RANGES.find(
        (option) => option.value === companiesEmployeeRange
      );
      if (range) {
        if (typeof range.min === "number") {
          params.minEmployees = range.min;
        }
        if (typeof range.max === "number") {
          params.maxEmployees = range.max;
        }
      }
    }

    if (companiesHasPeopleFilter) {
      params.hasPeople = true;
    }

    if (companiesHasWebsiteFilter) {
      params.hasWebsite = true;
    }

    if (companiesLocationFilter.trim()) {
      params.location = companiesLocationFilter.trim();
    }

    return params;
  }, [
    companiesPage,
    companiesLimit,
    companiesSearch,
    companiesIndustryFilter,
    companiesEmployeeRange,
    companiesHasPeopleFilter,
    companiesHasWebsiteFilter,
    companiesLocationFilter,
  ]);

  const {
    query: companiesQuery,
    companies,
    totalCompanies: filteredTotalCompanies,
  } = useCompaniesData(companiesParams);

  // Filter-aware CRM stats for companies page
  const { stats: companyCrmStats } = useCompanyCrmStatsData(companiesParams);

  // Fallbacks if filtered stats are not yet available
  const { totalCompanies: totalCompaniesForStats } = useCompaniesData({
    page: 1,
    limit: 1,
  });

  const { totalLeads: totalLeadsForStats } = useLeadsData(
    { page: 1, limit: 1 },
    { enabled: true }
  );

  // Leads data fetching
  const pageSizeOptions = [10, 25, 50, 100];

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

  // Fetch shared CRM stats for leads page
  const { stats: crmStats } = useCrmStatsData();

  // Prefer filtered stats, fall back to existing counts
  const effectiveTotalCompanies =
    companyCrmStats?.totalCompanies ??
    filteredTotalCompanies ??
    totalCompaniesForStats;

  const effectiveTotalLeads = companyCrmStats?.totalLeads ?? totalLeadsForStats;

  const industryOptions = useMemo(() => {
    const industries = new Set<string>();
    companies.forEach((company) => {
      if (company.industry) {
        industries.add(company.industry);
      }
    });
    return Array.from(industries).sort((a, b) => a.localeCompare(b));
  }, [companies]);

  const hasCompanyAdvancedFilters = useMemo(
    () =>
      companiesIndustryFilter !== "all" ||
      companiesEmployeeRange !== "all" ||
      companiesLocationFilter.trim() !== "" ||
      companiesHasPeopleFilter ||
      companiesHasWebsiteFilter,
    [
      companiesIndustryFilter,
      companiesEmployeeRange,
      companiesLocationFilter,
      companiesHasPeopleFilter,
      companiesHasWebsiteFilter,
    ]
  );

  const loading = companiesQuery.isLoading;

  const leadsLoading = leadsQuery.isLoading || leadsQuery.isFetching;

  const stats = useMemo(() => {
    if (activeTab === "companies") {
      return buildStats({
        totalCompanies: effectiveTotalCompanies,
        totalLeads: effectiveTotalLeads,
        totalOutreach: companyCrmStats?.totalOutreach,
        totalResponse: companyCrmStats?.totalResponse,
        activeClients: companyCrmStats?.activeClients,
        messagesSent: companyCrmStats?.messagesSent,
      });
    } else {
      // For leads tab, use different stats
      return buildStats({
        totalLeads: totalLeadsForStats,
        totalOutreach: crmStats?.totalOutreach,
        totalResponse: crmStats?.totalResponse,
        activeClients: crmStats?.activeClients,
        messagesSent: crmStats?.messagesSent,
      });
    }
  }, [
    activeTab,
    effectiveTotalCompanies,
    effectiveTotalLeads,
    companyCrmStats?.totalOutreach,
    companyCrmStats?.totalResponse,
    companyCrmStats?.activeClients,
    companyCrmStats?.messagesSent,
    totalLeadsForStats,
    crmStats?.totalOutreach,
    crmStats?.totalResponse,
    crmStats?.activeClients,
    crmStats?.messagesSent,
  ]);

  useEffect(() => {
    if (companiesQuery.error) {
      const error = companiesQuery.error as any;
      toast.error(
        error?.response?.data?.message || "Failed to fetch companies"
      );
    }
  }, [companiesQuery.error]);

  const handleCompanyClick = (companyId: string) => {
    setSelectedCompanyId((prev) => (prev === companyId ? null : companyId));
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCompaniesPage(1);
  }, [
    companiesSearch,
    companiesLimit,
    companiesIndustryFilter,
    companiesEmployeeRange,
    companiesLocationFilter,
    companiesHasPeopleFilter,
    companiesHasWebsiteFilter,
  ]);

  // Reset leads pagination when filters change
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

  // Leads selection and pending lead identifier logic
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
    } else if (!leadsQuery.isLoading) {
      setPendingLeadIdentifier(null);
    }
  }, [pendingLeadIdentifier, leads, leadsQuery.isLoading]);

  const handleExecutiveSelect = (executive: CompanyPerson) => {
    navigate(`/leads/${executive._id}`);
  };

  const handleLeadClick = (leadId: string) => {
    setSelectedLeadId((prev) => (prev === leadId ? null : leadId));
    setSelectedExecutiveFallback(null);
  };

  const handleLeadExecutiveSelect = (executive: CompanyPerson) => {
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

  const isSidebarOpen = selectedCompanyId !== null;
  const selectedCompany: Company | undefined = companies.find(
    (company) => company._id === selectedCompanyId
  );

  const isLeadsSidebarOpen =
    selectedLeadId !== null || selectedExecutiveFallback !== null;
  const selectedLeadDetails: Lead | undefined = leads.find(
    (lead) => lead._id === selectedLeadId
  );

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white min-h-screen overflow-x-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="max-w-[1600px] mx-auto w-full min-h-0"
        >
          {/* Filters Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="flex flex-col  justify-end sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-5"
          >
            {/* Controls Container */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 order-1 lg:order-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 flex-1">
                <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                  <SearchInput
                    placeholder="Search companies..."
                    value={companiesSearch}
                    onChange={setCompaniesSearch}
                  />
                  <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                      {!companyFiltersOpen ? (
                        <motion.div
                          key="filter-button"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                        >
                          <FilterButton
                            hasFilters={hasCompanyAdvancedFilters}
                            onClick={() => setCompanyFiltersOpen(true)}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="filters-inline"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="flex items-center gap-2"
                        >
                          <CompanyFiltersInline
                            industries={industryOptions}
                            industryFilter={companiesIndustryFilter}
                            onIndustryFilterChange={setCompaniesIndustryFilter}
                            employeeRanges={COMPANY_EMPLOYEE_RANGES}
                            employeeRange={companiesEmployeeRange}
                            onEmployeeRangeChange={setCompaniesEmployeeRange}
                            locationFilter={companiesLocationFilter}
                            onLocationFilterChange={setCompaniesLocationFilter}
                            hasPeopleFilter={companiesHasPeopleFilter}
                            onHasPeopleFilterChange={
                              setCompaniesHasPeopleFilter
                            }
                            hasWebsiteFilter={companiesHasWebsiteFilter}
                            onHasWebsiteFilterChange={
                              setCompaniesHasWebsiteFilter
                            }
                            hasFilters={hasCompanyAdvancedFilters}
                            onResetFilters={resetCompanyAdvancedFilters}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, duration: 0.15 }}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full flex items-center justify-center"
                              onClick={() => setCompanyFiltersOpen(false)}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
            className="flex items-center gap-1 p-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 w-fit mb-4"
          >
            <button
              onClick={() => setActiveTab("companies")}
              className={`relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "companies"
                  ? "bg-gradient-to-r from-[#30cfd0] via-[#2a9cb3] to-[#1f6f86] text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              style={
                activeTab === "companies"
                  ? {
                      boxShadow:
                        "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset, 0 16px 28px rgba(0,0,0,0.35)",
                    }
                  : undefined
              }
            >
              {activeTab === "companies" && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[100px] h-[100px] rounded-full pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                    filter: "blur(20px)",
                    WebkitFilter: "blur(20px)",
                  }}
                ></div>
              )}
              <Building2 className="w-4 h-4 flex-shrink-0 text-white drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)]" />
              <span className="drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)]">
                Companies
              </span>
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              className={`relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "leads"
                  ? "bg-gradient-to-r from-[#30cfd0] via-[#2a9cb3] to-[#1f6f86] text-white shadow-lg"
                  : "text-gray-300 hover:text-white hover:bg-white/10"
              }`}
              style={
                activeTab === "leads"
                  ? {
                      boxShadow:
                        "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset, 0 16px 28px rgba(0,0,0,0.35)",
                    }
                  : undefined
              }
            >
              {activeTab === "leads" && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[100px] h-[100px] rounded-full pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                    filter: "blur(20px)",
                    WebkitFilter: "blur(20px)",
                  }}
                ></div>
              )}
              <Users className="w-4 h-4 flex-shrink-0 text-white drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)]" />
              <span className="drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)]">
                Leads
              </span>
            </button>
          </motion.div>

          {/* Conditional Filters Based on Active Tab */}
          <AnimatePresence mode="wait">
            {activeTab === "companies" ? (
              <motion.div
                key="companies-filters"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Filters Bar */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                  className="flex flex-col  justify-end sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-5"
                >
                  {/* Controls Container */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 order-1 lg:order-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 flex-1">
                      <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                        <SearchInput
                          placeholder="Search companies..."
                          value={companiesSearch}
                          onChange={setCompaniesSearch}
                        />
                        <div className="flex items-center gap-2">
                          <AnimatePresence mode="wait">
                            {!companyFiltersOpen ? (
                              <motion.div
                                key="filter-button"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                              >
                                <FilterButton
                                  hasFilters={hasCompanyAdvancedFilters}
                                  onClick={() => setCompanyFiltersOpen(true)}
                                />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="filters-inline"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="flex items-center gap-2"
                              >
                                <CompanyFiltersInline
                                  industries={industryOptions}
                                  industryFilter={companiesIndustryFilter}
                                  onIndustryFilterChange={
                                    setCompaniesIndustryFilter
                                  }
                                  employeeRanges={COMPANY_EMPLOYEE_RANGES}
                                  employeeRange={companiesEmployeeRange}
                                  onEmployeeRangeChange={
                                    setCompaniesEmployeeRange
                                  }
                                  locationFilter={companiesLocationFilter}
                                  onLocationFilterChange={
                                    setCompaniesLocationFilter
                                  }
                                  hasPeopleFilter={companiesHasPeopleFilter}
                                  onHasPeopleFilterChange={
                                    setCompaniesHasPeopleFilter
                                  }
                                  hasWebsiteFilter={companiesHasWebsiteFilter}
                                  onHasWebsiteFilterChange={
                                    setCompaniesHasWebsiteFilter
                                  }
                                  hasFilters={hasCompanyAdvancedFilters}
                                  onResetFilters={resetCompanyAdvancedFilters}
                                />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1, duration: 0.15 }}
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full flex items-center justify-center"
                                    onClick={() => setCompanyFiltersOpen(false)}
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </Button>
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="leads-filters"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {/* Filters Bar */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
                  className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-5"
                >
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
                              setLeadsCompanyFilter(
                                value === "all" ? null : value
                              )
                            }
                          >
                            <SelectTrigger
                              className="h-9 pl-10 pr-4 rounded-lg sm:rounded-full border border-gray-600 sm:border-0 text-gray-300 text-xs w-full sm:w-auto bg-gray-800/50 sm:bg-[#FFFFFF1A] mobile-select-trigger"
                              style={{
                                boxShadow: "none",
                              }}
                            >
                              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                <Building2 className="w-4 h-4 text-gray-400" />
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
                                      {totalLeadsForStats === 1
                                        ? "lead"
                                        : "leads"}
                                      )
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                              {allCompaniesForFilter.map((company) => {
                                // Count leads for this company from all leads (not just current page)
                                const companyLeadsCount =
                                  allLeadsForCount.filter(
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
                                        {companyLeadsCount === 1
                                          ? "lead"
                                          : "leads"}
                                        )
                                      </span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <AnimatePresence mode="wait">
                            {!leadFiltersOpen ? (
                              <motion.div
                                key="filter-button"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                              >
                                <FilterButton
                                  hasFilters={hasLeadAdvancedFilters}
                                  onClick={() => setLeadFiltersOpen(true)}
                                />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="filters-inline"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="flex items-center gap-2"
                              >
                                <LeadsFiltersInline
                                  locationFilter={leadsLocationFilter}
                                  onLocationFilterChange={
                                    setLeadsLocationFilter
                                  }
                                  positionFilter={leadsPositionFilter}
                                  onPositionFilterChange={
                                    setLeadsPositionFilter
                                  }
                                  hasEmailFilter={leadsHasEmailFilter}
                                  onHasEmailFilterChange={
                                    setLeadsHasEmailFilter
                                  }
                                  hasPhoneFilter={leadsHasPhoneFilter}
                                  onHasPhoneFilterChange={
                                    setLeadsHasPhoneFilter
                                  }
                                  hasLinkedinFilter={leadsHasLinkedinFilter}
                                  onHasLinkedinFilterChange={
                                    setLeadsHasLinkedinFilter
                                  }
                                  hasFilters={hasLeadAdvancedFilters}
                                  onResetFilters={resetLeadAdvancedFilters}
                                />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: 0.1, duration: 0.15 }}
                                >
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 rounded-full flex items-center justify-center"
                                    onClick={() => setLeadFiltersOpen(false)}
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </Button>
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Cards */}
          <StatsCards stats={stats} />

          {/* Conditional Content Based on Active Tab */}
          <AnimatePresence mode="wait">
            {activeTab === "companies" ? (
              <motion.div
                key="companies-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col lg:flex-row items-start gap-2 sm:gap-3 md:gap-4 lg:gap-6"
              >
                {/* Left: Companies List */}
                <div
                  className={`relative pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] ${
                    isSidebarOpen ? "lg:mr-[360px] xl:mr-[420px]" : ""
                  }`}
                >
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
                    onViewAllLeads={() => {}}
                    onExecutiveSelect={handleExecutiveSelect}
                    onMobileExecutivesViewChange={setIsMobileExecutivesView}
                    pageSize={companiesLimit}
                    onPageSizeChange={setCompaniesLimit}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="leads-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col lg:flex-row items-start gap-2 sm:gap-3 md:gap-4 lg:gap-6"
              >
                {/* Left: Leads List */}
                <div
                  className={`relative pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] ${
                    isLeadsSidebarOpen ? "lg:mr-[360px] xl:mr-[420px]" : ""
                  }`}
                >
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
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conditional Sidebar Based on Active Tab */}
          <AnimatePresence mode="wait">
            {activeTab === "companies" ? (
              <DetailsSidebar
                key="companies-sidebar"
                activeTab="companies"
                isOpen={isSidebarOpen}
                selectedCompany={selectedCompany}
                onExecutiveSelect={handleExecutiveSelect}
              />
            ) : (
              <DetailsSidebar
                key="leads-sidebar"
                activeTab="leads"
                isOpen={isLeadsSidebarOpen}
                selectedLead={selectedLeadDetails}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.main>

      {/* Leads Modals */}
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
        messageId={emailMessageId}
        onEdit={handleEmailEdit}
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
        messageId={linkedinMessageId}
        onEdit={handleLinkedinEdit}
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
        messageId={phoneMessageId}
        onEdit={handlePhoneEdit}
      />
    </DashboardLayout>
  );
};

export default index;
