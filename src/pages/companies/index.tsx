import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ArrowRight,
  Search,
  Filter,
  Layers,
  Upload,
  Loader2,
  Plus,
} from "lucide-react";
import CompaniesIcon from "@/components/icons/CompaniesIcon";
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

const COMPANY_EMPLOYEE_RANGES = [
  { value: "all", label: "All company sizes" },
  { value: "small", label: "1-50 employees", min: 1, max: 50 },
  { value: "medium", label: "50-250 employees", min: 50, max: 250 },
  { value: "large", label: "250-1000 employees", min: 250, max: 1000 },
  { value: "enterprise", label: "1000+ employees", min: 1000 },
] as const;

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
  const [isMobileExecutivesView, setIsMobileExecutivesView] = useState(false);

  // Companies filters and pagination
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesSearch, setCompaniesSearch] = useState("");
  const [companiesLimit, setCompaniesLimit] = useState(10);
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
  const [bulkSyncingLeads, setBulkSyncingLeads] = useState(false);
  const [syncedLeadIds, setSyncedLeadIds] = useState<Set<string>>(new Set());
  const [companyFiltersOpen, setCompanyFiltersOpen] = useState(false);
  const [leadFiltersOpen, setLeadFiltersOpen] = useState(false);
  const resetCompanyAdvancedFilters = useCallback(() => {
    setCompaniesIndustryFilter("all");
    setCompaniesEmployeeRange("all");
    setCompaniesLocationFilter("");
    setCompaniesHasPeopleFilter(false);
    setCompaniesHasWebsiteFilter(false);
  }, []);
  const resetLeadAdvancedFilters = useCallback(() => {
    setLeadsLocationFilter("");
    setLeadsPositionFilter("");
    setLeadsHasEmailFilter(false);
    setLeadsHasPhoneFilter(false);
    setLeadsHasLinkedinFilter(false);
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    companies: null,
    leads: null,
  });
  const [indicatorStyles, setIndicatorStyles] = useState({ width: 0, left: 0 });
  const pageSizeOptions = [10, 25, 50, 100];

  const companiesParams = useMemo(() => {
    const params: CompaniesQueryParams = {
      page: companiesPage,
      limit: companiesLimit,
      search: companiesSearch || undefined,
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

  const industryOptions = useMemo(() => {
    const industries = new Set<string>();
    allCompaniesForFilter.forEach((company) => {
      if (company.industry) {
        industries.add(company.industry);
      }
    });
    return Array.from(industries).sort((a, b) => a.localeCompare(b));
  }, [allCompaniesForFilter]);

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

  const companyFiltersPanel = (
    <div className="flex flex-col gap-3 text-gray-100 text-xs">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mb-2">
          Industry
        </p>
        <Select
          value={companiesIndustryFilter}
          onValueChange={setCompaniesIndustryFilter}
        >
          <SelectTrigger className="h-9 w-full rounded-lg border border-white/15 bg-transparent text-white text-xs">
            <SelectValue placeholder="All industries" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] rounded-xl max-h-60">
            <SelectItem
              value="all"
              className="text-gray-300 focus:text-white focus:bg-white/10"
            >
              All industries
            </SelectItem>
            {industryOptions.map((industry) => (
              <SelectItem
                key={industry}
                value={industry}
                className="text-gray-300 focus:text-white focus:bg-white/10"
              >
                {industry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mb-2">
          Company size
        </p>
        <Select
          value={companiesEmployeeRange}
          onValueChange={setCompaniesEmployeeRange}
        >
          <SelectTrigger className="h-9 w-full rounded-lg border border-white/15 bg-transparent text-white text-xs">
            <SelectValue placeholder="Company size" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] rounded-xl">
            {COMPANY_EMPLOYEE_RANGES.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-gray-300 focus:text-white focus:bg-white/10"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mb-2">
          Location
        </p>
        <Input
          type="text"
          placeholder="City, state, or region"
          value={companiesLocationFilter}
          onChange={(e) => setCompaniesLocationFilter(e.target.value)}
          className="h-9 rounded-lg border border-white/15 bg-transparent text-white placeholder:text-gray-500 text-xs"
        />
      </div>
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={companiesHasPeopleFilter}
            onCheckedChange={(checked) =>
              setCompaniesHasPeopleFilter(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span>Only companies with saved contacts</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={companiesHasWebsiteFilter}
            onCheckedChange={(checked) =>
              setCompaniesHasWebsiteFilter(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span>Only companies with websites</span>
        </label>
      </div>
      <div className="flex items-center justify-between">
        {hasCompanyAdvancedFilters ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-300 hover:text-white px-2 py-1"
            onClick={() => {
              resetCompanyAdvancedFilters();
              setCompanyFiltersOpen(false);
            }}
          >
            Clear filters
          </Button>
        ) : (
          <p className="text-[11px] text-gray-500">No filters applied</p>
        )}
        <Button
          size="sm"
          variant="secondary"
          className="px-3 py-1 text-xs"
          onClick={() => setCompanyFiltersOpen(false)}
        >
          Close
        </Button>
      </div>
    </div>
  );

  const leadFiltersPanel = (
    <div className="flex flex-col gap-3 text-gray-100 text-xs">
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mb-2">
          Location
        </p>
        <Input
          type="text"
          placeholder="City, state, or region"
          value={leadsLocationFilter}
          onChange={(e) => setLeadsLocationFilter(e.target.value)}
          className="h-9 rounded-lg border border-white/15 bg-transparent text-white placeholder:text-gray-500 text-xs"
        />
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mb-2">
          Title / Role
        </p>
        <Input
          type="text"
          placeholder="VP of Sales, CEO, ..."
          value={leadsPositionFilter}
          onChange={(e) => setLeadsPositionFilter(e.target.value)}
          className="h-9 rounded-lg border border-white/15 bg-transparent text-white placeholder:text-gray-500 text-xs"
        />
      </div>
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={leadsHasEmailFilter}
            onCheckedChange={(checked) =>
              setLeadsHasEmailFilter(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span>Has verified email</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={leadsHasPhoneFilter}
            onCheckedChange={(checked) =>
              setLeadsHasPhoneFilter(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span>Has phone number</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={leadsHasLinkedinFilter}
            onCheckedChange={(checked) =>
              setLeadsHasLinkedinFilter(Boolean(checked))
            }
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
          />
          <span>Has LinkedIn profile</span>
        </label>
      </div>
      <div className="flex items-center justify-between">
        {hasLeadAdvancedFilters ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-300 hover:text-white px-2 py-1"
            onClick={() => {
              resetLeadAdvancedFilters();
              setLeadFiltersOpen(false);
            }}
          >
            Clear filters
          </Button>
        ) : (
          <p className="text-[11px] text-gray-500">No filters applied</p>
        )}
        <Button
          size="sm"
          variant="secondary"
          className="px-3 py-1 text-xs"
          onClick={() => setLeadFiltersOpen(false)}
        >
          Close
        </Button>
      </div>
    </div>
  );

  const leadsParams = useMemo(() => {
    const params: LeadsQueryParams = {
      page: leadsPage,
      limit: leadsLimit,
      search: leadsSearch || undefined,
      companyId: leadsCompanyFilter || undefined,
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
  }, [
    companiesSearch,
    companiesLimit,
    companiesIndustryFilter,
    companiesEmployeeRange,
    companiesLocationFilter,
    companiesHasPeopleFilter,
    companiesHasWebsiteFilter,
  ]);

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
          <div className="hidden md:flex items-center justify-between mb-6 gap-4">
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
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {stats.map((stat) => (
              <div key={stat.title} className="relative flex-1 w-full">
                {/* Gradient glow behind card */}
                <div className="absolute -inset-3 lg:-inset-5 bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-transparent blur-2xl opacity-50" />
                <Card
                  className="relative border-[#FFFFFF33] shadow-xl w-full"
                  style={{
                    borderRadius: "22px",
                    opacity: 1,
                    borderWidth: "1px",
                    background:
                      "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                  }}
                >
                  <CardContent className="p-3 sm:p-4 lg:p-5 h-full flex flex-col justify-between min-h-[120px] gap-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[11px] sm:text-xs text-gray-300 font-medium tracking-tight">
                        {stat.title}
                      </p>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-[11px] text-gray-400 hover:text-white transition-colors"
                      >
                        <span className="hidden sm:inline">{stat.link}</span>
                        <ArrowRight className="w-3 h-3 sm:ml-1" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
                        <stat.icon className="w-full h-full text-white" />
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-white">
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
            <div
              className={`${
                isMobileExecutivesView ? "hidden sm:flex" : "flex"
              } items-center gap-3 md:gap-4 order-2 lg:order-1`}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:hidden flex items-center justify-center flex-shrink-0">
                <CompaniesIcon className="w-full h-full" />
              </div>
              <h2 className="text-lg sm:text-lg font-normal text-white">
                {activeTab === "companies" ? "Companies" : "Leads"}
              </h2>
              {activeTab === "companies" && (
                <Button
                  className="ml-auto md:hidden flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-white font-normal sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(218, 228, 241, 0.2) 0%, rgba(221, 224, 238, 0.2) 100%)",
                    backgroundBlendMode: "luminosity",
                    boxShadow:
                      "0px 4px 4px 0px #FFFFFF40 inset, 0px -4px 4px 0px #FFFFFF40 inset",
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center sm:w-5 sm:h-5">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                  <span className="tracking-tight">Add new Company</span>
                </Button>
              )}
            </div>

            {/* Controls Container - responsive layout */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 order-1 lg:order-2">
              {/* Filter Buttons Row - wraps on mobile, stays in row on larger screens */}
            <div
              className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 ${
                activeTab === "companies" ? "sm:gap-1" : "sm:gap-3"
              }`}
            >
                {activeTab === "companies" ? (
                  <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    <div className="relative min-w-[220px] flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none z-10" />
                      <Input
                        type="text"
                        placeholder="Search companies..."
                        value={companiesSearch}
                        onChange={(e) => setCompaniesSearch(e.target.value)}
                        className="px-4 border border-white sm:border-0 text-white placeholder:text-white text-xs w-full h-9 pl-10 pr-4 rounded-lg sm:!rounded-full focus:outline-none focus:ring-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.4)] bg-[linear-gradient(173.83deg,rgba(255,255,255,0.08)_4.82%,rgba(255,255,255,0.00002)_38.08%,rgba(255,255,255,0.00002)_56.68%,rgba(255,255,255,0.02)_95.1%)]"
                      />
                    </div>
                    {filteredTotalCompanies !== undefined && (
                      <div className="px-3 py-1.5 rounded-full border border-gray-600 text-gray-300 text-xs sm:text-sm font-medium whitespace-nowrap bg-gray-800/50 sm:bg-[#FFFFFF1A]">
                        {filteredTotalCompanies}{" "}
                        {filteredTotalCompanies === 1 ? "company" : "companies"}
                      </div>
                    )}
                    <Popover open={companyFiltersOpen} onOpenChange={setCompanyFiltersOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-9 rounded-full border border-white/20 bg-white/5 text-xs text-white flex items-center gap-2"
                        >
                          <Filter className="w-3.5 h-3.5" />
                          <span>Filters</span>
                          {hasCompanyAdvancedFilters && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        className="w-80 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-4"
                      >
                        {companyFiltersPanel}
                      </PopoverContent>
                    </Popover>
                  </div>
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
                        className="h-9 pl-10 pr-12 sm:pr-4 rounded-lg sm:!rounded-full border border-gray-600 sm:border-0 text-white placeholder:text-gray-500 text-xs w-full bg-gray-800/50 sm:bg-[#FFFFFF1A] mobile-search-input"
                        style={{
                          boxShadow: "none",
                        }}
                      />
                      {/* Filter Icon - Mobile Only */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 sm:hidden pointer-events-none z-10">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 32 32"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M28.3334 16.0001H11.86M6.04535 16.0001H3.66669M6.04535 16.0001C6.04535 15.2292 6.35159 14.4898 6.8967 13.9447C7.4418 13.3996 8.18112 13.0934 8.95202 13.0934C9.72292 13.0934 10.4622 13.3996 11.0073 13.9447C11.5524 14.4898 11.8587 15.2292 11.8587 16.0001C11.8587 16.771 11.5524 17.5103 11.0073 18.0554C10.4622 18.6005 9.72292 18.9067 8.95202 18.9067C8.18112 18.9067 7.4418 18.6005 6.8967 18.0554C6.35159 17.5103 6.04535 16.771 6.04535 16.0001ZM28.3334 24.8094H20.6694M20.6694 24.8094C20.6694 25.5805 20.3624 26.3206 19.8171 26.8659C19.2719 27.4111 18.5324 27.7174 17.7614 27.7174C16.9905 27.7174 16.2511 27.4098 15.706 26.8647C15.1609 26.3196 14.8547 25.5803 14.8547 24.8094M20.6694 24.8094C20.6694 24.0383 20.3624 23.2995 19.8171 22.7543C19.2719 22.209 18.5324 21.9027 17.7614 21.9027C16.9905 21.9027 16.2511 22.209 15.706 22.7541C15.1609 23.2992 14.8547 24.0385 14.8547 24.8094M14.8547 24.8094H3.66669M28.3334 7.19072H24.1934M18.3787 7.19072H3.66669M18.3787 7.19072C18.3787 6.41983 18.6849 5.68051 19.23 5.1354C19.7751 4.59029 20.5145 4.28406 21.2854 4.28406C21.6671 4.28406 22.045 4.35924 22.3977 4.50531C22.7503 4.65139 23.0708 4.86549 23.3407 5.1354C23.6106 5.40531 23.8247 5.72574 23.9708 6.07839C24.1168 6.43104 24.192 6.80902 24.192 7.19072C24.192 7.57243 24.1168 7.9504 23.9708 8.30306C23.8247 8.65571 23.6106 8.97614 23.3407 9.24605C23.0708 9.51596 22.7503 9.73006 22.3977 9.87613C22.045 10.0222 21.6671 10.0974 21.2854 10.0974C20.5145 10.0974 19.7751 9.79115 19.23 9.24605C18.6849 8.70094 18.3787 7.96162 18.3787 7.19072Z"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeMiterlimit="10"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
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
                    <div className="flex items-center gap-2">
                      {filteredTotalLeads !== undefined && (
                        <div
                          className="hidden sm:flex px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-full border border-gray-600 sm:border-0 text-gray-300 text-xs sm:text-sm font-medium whitespace-nowrap items-center justify-center bg-gray-800/50 sm:bg-[#FFFFFF1A] mobile-count-badge"
                          style={{
                            boxShadow: "none",
                          }}
                        >
                          {filteredTotalLeads}{" "}
                          {filteredTotalLeads === 1 ? "lead" : "leads"}
                        </div>
                      )}
                      <Popover open={leadFiltersOpen} onOpenChange={setLeadFiltersOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-9 rounded-full border border-white/20 bg-white/5 text-xs text-white flex items-center gap-2"
                          >
                            <Filter className="w-3.5 h-3.5" />
                            <span>Filters</span>
                            {hasLeadAdvancedFilters && (
                              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="end"
                          className="w-80 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-4"
                        >
                          {leadFiltersPanel}
                        </PopoverContent>
                      </Popover>
                    </div>
                    {false && (
                    <div className="flex flex-col gap-2 border border-white/10 rounded-xl p-3 bg-white/5 mt-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="w-full sm:flex-1">
                          <Input
                            type="text"
                            placeholder="Filter by location"
                            value={leadsLocationFilter}
                            onChange={(e) => setLeadsLocationFilter(e.target.value)}
                            className="h-9 rounded-lg border border-white/10 text-xs text-white placeholder:text-gray-400 bg-transparent"
                          />
                        </div>
                        <div className="w-full sm:flex-1">
                          <Input
                            type="text"
                            placeholder="Filter by title or role"
                            value={leadsPositionFilter}
                            onChange={(e) => setLeadsPositionFilter(e.target.value)}
                            className="h-9 rounded-lg border border-white/10 text-xs text-white placeholder:text-gray-400 bg-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={leadsHasEmailFilter}
                            onCheckedChange={(checked) =>
                              setLeadsHasEmailFilter(Boolean(checked))
                            }
                            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                          />
                          Has email
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={leadsHasPhoneFilter}
                            onCheckedChange={(checked) =>
                              setLeadsHasPhoneFilter(Boolean(checked))
                            }
                            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                          />
                          Has phone
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={leadsHasLinkedinFilter}
                            onCheckedChange={(checked) =>
                              setLeadsHasLinkedinFilter(Boolean(checked))
                            }
                            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                          />
                          Has LinkedIn
                        </label>
                        {hasLeadAdvancedFilters && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-300 hover:text-white px-2 py-1"
                            onClick={resetLeadAdvancedFilters}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
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
              className="relative pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)]"
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
                  onMobileExecutivesViewChange={setIsMobileExecutivesView}
                  pageSize={companiesLimit}
                  onPageSizeChange={setCompaniesLimit}
                  pageSizeOptions={pageSizeOptions}
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
                  pageSize={leadsLimit}
                  onPageSizeChange={setLeadsLimit}
                  pageSizeOptions={pageSizeOptions}
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
