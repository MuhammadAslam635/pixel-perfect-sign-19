import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";
import { Layers } from "lucide-react";
import { CompanyPerson } from "@/services/companies.service";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { Lead } from "@/services/leads.service";
import { EmailDraftModal } from "./components/EmailDraftModal";
import { LinkedinMessageModal } from "./components/LinkedinMessageModal";
import { PhoneCallModal } from "./components/PhoneCallModal";
import { toast } from "sonner";
import LeadsList from "./components/LeadsList";
import { DetailsSidebar } from "../shared/components";
import {
  useCompaniesData,
  useCompanyCrmStatsData,
  useCrmStatsData,
  useLeadsData,
} from "../shared/hooks";
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
  LeadsFiltersInline,
} from "../shared/components";
import { buildStats } from "../shared/hooks";

type ViewMode = "compact" | "detailed" | "card";

const index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Selected lead state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");

  // Leads filters and pagination
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadsLimit, setLeadsLimit] = useState(viewMode === "card" ? 25 : 10);

  // Update limit when view mode changes
  useEffect(() => {
    setLeadsLimit(viewMode === "card" ? 25 : 10);
    // Reset to page 1 when changing view mode
    setLeadsPage(1);
  }, [viewMode]);

  const [leadsCountryFilter, setLeadsCountryFilter] = useState<string[]>([]);
  const [leadsSeniorityFilter, setLeadsSeniorityFilter] = useState<string[]>([]);
  const [leadsCompanyFilter, setLeadsCompanyFilter] = useState<string[]>([]);
  const [leadsStageFilter, setLeadsStageFilter] = useState<string[]>([]);
  const [leadsHasEmailFilter, setLeadsHasEmailFilter] = useState(false);
  const [leadsHasPhoneFilter, setLeadsHasPhoneFilter] = useState(false);
  const [leadsHasLinkedinFilter, setLeadsHasLinkedinFilter] = useState(false);
  const [leadsHasFavouriteFilter, setLeadsHasFavouriteFilter] = useState(false);
  const [leadsSortBy, setLeadsSortBy] = useState<string>("newest");

  // Reset filters
  const resetLeadAdvancedFilters = () => {
    setLeadsCountryFilter([]);
    setLeadsSeniorityFilter([]);
    setLeadsStageFilter([]);
    setLeadsHasEmailFilter(false);
    setLeadsHasPhoneFilter(false);
    setLeadsHasLinkedinFilter(false);
    setLeadsHasFavouriteFilter(false);
    setLeadsSortBy("newest");
  };

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
  const pageContentRef = useRef<HTMLElement | null>(null);
  const pageSizeOptions = [10, 25, 50, 100];
  const handleDesktopExecutivesFocus = () => {
    if (pageContentRef.current) {
      pageContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Leads filters and pagination

  // Fetch all companies for the leads filter dropdown (limit to 500 for dropdown)
  const { companies: allCompaniesForFilter } = useCompaniesData({
    page: 1,
    limit: 500,
  });

  // Fetch all leads (without pagination) to count leads per company
  const { leads: allLeadsForCount, query: leadsQuery } = useLeadsData(
    { page: 1, limit: 10000 },
    { enabled: true }
  );

  const hasLeadAdvancedFilters = useMemo(
    () =>
      leadsCountryFilter.length > 0 ||
      leadsSeniorityFilter.length > 0 ||
      leadsCompanyFilter.length > 0 ||
      leadsStageFilter.length > 0 ||
      leadsHasEmailFilter ||
      leadsHasPhoneFilter ||
      leadsHasLinkedinFilter ||
      leadsHasFavouriteFilter,
    [
      leadsCountryFilter,
      leadsSeniorityFilter,
      leadsCompanyFilter,
      leadsStageFilter,
      leadsHasEmailFilter,
      leadsHasPhoneFilter,
      leadsHasLinkedinFilter,
      leadsHasFavouriteFilter,
    ]
  );

  // Client-side filtering logic setup using allLeadsForCount
  const filteredLeads = useMemo(() => {
    let result = [...(allLeadsForCount || [])];

    // Text search (name, email, or company name)
    if (leadsSearch) {
      const searchLower = leadsSearch.toLowerCase();
      result = result.filter(
        (lead) =>
          lead.name?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.companyName?.toLowerCase().includes(searchLower)
      );
    }

    // Company filter (multi-select)
    if (leadsCompanyFilter.length > 0) {
      result = result.filter((lead) =>
        leadsCompanyFilter.includes(lead.companyId)
      );
    }

    // Country filter (multi-select)
    if (leadsCountryFilter.length > 0) {
      result = result.filter(
        (lead) => lead.country && leadsCountryFilter.includes(lead.country)
      );
    }

    // Position/Title filter (multi-select)
    if (leadsSeniorityFilter.length > 0) {
      result = result.filter(
        (lead) =>
          lead.seniority &&
          leadsSeniorityFilter.some((seniority) =>
            lead.seniority?.toLowerCase().includes(seniority.toLowerCase())
          )
      );
    }

    // Stage filter (multi-select)
    if (leadsStageFilter.length > 0) {
      result = result.filter((lead) => {
        // Determine the lead's current stage
        // Priority: manual stage > event-driven logic
        let leadStage = "New"; // Default

        if (lead.stage === "closed") {
          leadStage = "Deal Closed";
        } else if (lead.stage === "followup_close") {
          leadStage = "Follow-up to Close";
        } else if (lead.stage === "proposal_sent") {
          leadStage = "Proposal Sent";
        } else if (lead.stage === "appointment_booked") {
          leadStage = "Appointment Booked";
        } else if (lead.stage === "followup") {
          leadStage = "Follow-up";
        } else if (lead.stage === "interested") {
          leadStage = "Interested";
        } else if (lead.stage === "new") {
          leadStage = "New";
        } else {
          // Fallback to New if no recognized stage
          leadStage = "New";
        }

        return leadsStageFilter.includes(leadStage);
      });
    }

    // Boolean filters
    if (leadsHasEmailFilter) {
      result = result.filter((lead) => lead.email);
    }
    if (leadsHasPhoneFilter) {
      result = result.filter((lead) => lead.phone || lead.whatsapp);
    }
    if (leadsHasLinkedinFilter) {
      result = result.filter((lead) => lead.linkedinUrl);
    }
    if (leadsHasFavouriteFilter) {
      result = result.filter((lead) => lead.isFavourite === true);
    }

    // Sorting
    if (leadsSortBy === "newest") {
      result = result.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Newest first
      });
    } else if (leadsSortBy === "oldest") {
      result = result.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB; // Oldest first
      });
    } else if (leadsSortBy === "name-asc") {
      result = result.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB); // A-Z
      });
    } else if (leadsSortBy === "name-desc") {
      result = result.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameB.localeCompare(nameA); // Z-A
      });
    }

    return result;
  }, [
    allLeadsForCount,
    leadsSearch,
    leadsCompanyFilter,
    leadsCountryFilter,
    leadsSeniorityFilter,
    leadsStageFilter,
    leadsHasEmailFilter,
    leadsHasPhoneFilter,
    leadsHasLinkedinFilter,
    leadsHasFavouriteFilter,
    leadsSortBy,
  ]);

  // Client-side pagination
  const { paginatedLeads, totalFilteredLeads, totalPages } = useMemo(() => {
    const total = filteredLeads.length;
    const pages = Math.ceil(total / leadsLimit);
    const start = (leadsPage - 1) * leadsLimit;
    const end = start + leadsLimit;
    const sliced = filteredLeads.slice(start, end);

    return {
      paginatedLeads: sliced,
      totalFilteredLeads: total,
      totalPages: pages,
    };
  }, [filteredLeads, leadsPage, leadsLimit]);

  // Use local data instead of server query for the list
  const leadsLoading = leadsQuery.isLoading; // Correct loading check

  // Create pagination object matching the expected interface
  const clientPagination = {
    page: leadsPage,
    totalPages: totalPages,
    totalDocs: totalFilteredLeads,
    limit: leadsLimit,
    hasNextPage: leadsPage < totalPages,
    hasPrevPage: leadsPage > 1,
    nextPage: leadsPage < totalPages ? leadsPage + 1 : null,
    prevPage: leadsPage > 1 ? leadsPage - 1 : null,
    offset: (leadsPage - 1) * leadsLimit,
    pagingCounter: (leadsPage - 1) * leadsLimit + 1,
  };

  // Fetch total leads count without search/filter for stats
  const { totalLeads: totalLeadsForStats } = useLeadsData(
    { page: 1, limit: 1 },
    { enabled: true }
  );

  // Fetch shared CRM stats for top cards (including companies and leads counts)
  const { stats: companyFilteredStats } = useCompanyCrmStatsData({
    stage: leadsStageFilter.length > 0 ? leadsStageFilter : undefined,
    seniority: leadsSeniorityFilter.length > 0 ? leadsSeniorityFilter : undefined,
    country: leadsCountryFilter.length > 0 ? leadsCountryFilter.join(",") : undefined,
    hasEmail: leadsHasEmailFilter || undefined,
    hasPhone: leadsHasPhoneFilter || undefined,
    hasLinkedin: leadsHasLinkedinFilter || undefined,
    hasFavourite: leadsHasFavouriteFilter || undefined,
  });

  // General CRM stats for outreach/response/active clients/messages sent
  const { stats: crmStats } = useCrmStatsData();

  // Calculate filtered counts for stats
  const effectiveTotalLeads = totalFilteredLeads;
  
  // Calculate unique companies from filtered leads (respects all filters)
  const effectiveTotalCompanies = useMemo(() => {
    const uniqueCompanyIds = new Set(
      filteredLeads.map((lead) => lead.companyId).filter(Boolean)
    );
    return uniqueCompanyIds.size;
  }, [filteredLeads]);

  const stats = useMemo(
    () =>
      buildStats(
        {
          totalCompanies: effectiveTotalCompanies,
          totalLeads: effectiveTotalLeads,
          totalOutreach: companyFilteredStats?.totalOutreach ?? crmStats?.totalOutreach,
          totalDealsClosed: companyFilteredStats?.totalDealsClosed ?? crmStats?.totalDealsClosed,
          activeClients: companyFilteredStats?.activeClients ?? crmStats?.activeClients,
          messagesSent: companyFilteredStats?.messagesSent ?? crmStats?.messagesSent,
        },
        "leads"
      ),
    [
      effectiveTotalCompanies,
      effectiveTotalLeads,
      companyFilteredStats,
      crmStats,
    ]
  );

  // Reset pagination when filters change
  useEffect(() => {
    setLeadsPage(1);
  }, [
    leadsSearch,
    leadsCompanyFilter,
    leadsLimit,
    leadsCountryFilter,
    leadsSeniorityFilter,
    leadsStageFilter,
    leadsHasEmailFilter,
    leadsHasPhoneFilter,
    leadsHasLinkedinFilter,
    leadsHasFavouriteFilter,
  ]);

  useEffect(() => {
    if (!pendingLeadIdentifier || !allLeadsForCount) return;

    const { email, name } = pendingLeadIdentifier;

    const matchedLead =
      (email &&
        allLeadsForCount.find((lead) => lead.email?.toLowerCase() === email)) ||
      (name &&
        allLeadsForCount.find((lead) => lead.name?.toLowerCase() === name));

    if (matchedLead) {
      setSelectedLeadId(matchedLead._id);
      setSelectedExecutiveFallback(null);
      setPendingLeadIdentifier(null);
    } else if (!leadsLoading) {
      setPendingLeadIdentifier(null);
    }
  }, [pendingLeadIdentifier, allLeadsForCount, leadsLoading]);

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

    if (allLeadsForCount && allLeadsForCount.length > 0) {
      const matchedLead =
        (email &&
          allLeadsForCount.find(
            (lead) => lead.email?.toLowerCase() === email
          )) ||
        (name &&
          allLeadsForCount.find((lead) => lead.name?.toLowerCase() === name));

      if (matchedLead) {
        setSelectedLeadId(matchedLead._id);
        setSelectedExecutiveFallback(null);
        setPendingLeadIdentifier(null);
      }
    }
  };

  const isSidebarOpen =
    selectedLeadId !== null || selectedExecutiveFallback !== null;
  const selectedLeadDetails: Lead | undefined = allLeadsForCount?.find(
    (lead) => lead._id === selectedLeadId
  );

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
          {/* Wrapper with space-between */}
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Page Header with Companies Button */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="flex-shrink-0"
            >
              {/* <h1 className="text-2xl font-bold text-white">Leads</h1> */}
              <CrmNavigation />
            </motion.div>

            {/* Filters Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1"
            >
              {/* Controls Container */}
              <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 order-1 lg:order-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 flex-1">
                  <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                    {/* Search Input */}
                    <SearchInput
                      placeholder="Search leads by name, email, or company..."
                      value={leadsSearch}
                      onChange={setLeadsSearch}
                    />

                    {/* Company Filter Dropdown */}
                    <div className="relative w-56">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                        <Layers className="w-4 h-4 text-gray-400" />
                      </div>
                      <MultiSelect
                        options={allCompaniesForFilter.map((company) => {
                          const companyLeadsCount = allLeadsForCount.filter(
                            (lead) => lead.companyId === company._id
                          ).length;

                          return {
                            value: company._id,
                            label: `${company.name} (${companyLeadsCount} ${
                              companyLeadsCount === 1 ? "lead" : "leads"
                            })`,
                          };
                        })}
                        value={leadsCompanyFilter}
                        onChange={setLeadsCompanyFilter}
                        placeholder="All Companies"
                        searchPlaceholder="Search companies..."
                        emptyMessage="No companies found."
                        className="pl-10 h-9 text-xs"
                        maxDisplayItems={1}
                        popoverWidth="w-[320px]"
                        showCount={true}
                      />
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
                              countryFilter={leadsCountryFilter}
                              onCountryFilterChange={setLeadsCountryFilter}
                              seniorityFilter={leadsSeniorityFilter}
                              onSeniorityFilterChange={setLeadsSeniorityFilter}
                              stageFilter={leadsStageFilter}
                              onStageFilterChange={setLeadsStageFilter}
                              leads={allLeadsForCount}
                              sortBy={leadsSortBy}
                              onSortByChange={setLeadsSortBy}
                              hasEmailFilter={leadsHasEmailFilter}
                              onHasEmailFilterChange={setLeadsHasEmailFilter}
                              hasPhoneFilter={leadsHasPhoneFilter}
                              onHasPhoneFilterChange={setLeadsHasPhoneFilter}
                              hasLinkedinFilter={leadsHasLinkedinFilter}
                              onHasLinkedinFilterChange={
                                setLeadsHasLinkedinFilter
                              }
                              hasFavouriteFilter={leadsHasFavouriteFilter}
                              onHasFavouriteFilterChange={
                                setLeadsHasFavouriteFilter
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
                                className="h-8 w-8 p-0 bg-accent text-white hover:bg-accent/80 rounded-full flex items-center justify-center"
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
          </div>

          {/* Stats Cards */}
          <StatsCards stats={stats} />

          {/* Split View */}
          <div
            className={`flex flex-col lg:flex-row items-stretch flex-1 min-h-0 overflow-hidden ${
              isSidebarOpen ? "gap-2 sm:gap-3 md:gap-4 lg:gap-6" : ""
            }`}
          >
            {/* Left: Companies/Leads List */}
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
                companyFilter={leadsCompanyFilter}
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

            {/* Right: Executives/Details Panel (Desktop only) */}
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
