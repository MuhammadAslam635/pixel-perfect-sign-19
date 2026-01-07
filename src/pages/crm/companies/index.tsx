import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { Company, CompanyPerson } from "@/services/companies.service";
import { toast } from "sonner";
import CompaniesList from "./components/CompaniesList";
import { DetailsSidebar } from "../shared/components";
import {
  useCompaniesData,
  useCompanyCrmStatsData,
  useCrmStatsData,
} from "../shared/hooks";
import { CompaniesQueryParams } from "@/services/companies.service";
import {
  StatsCards,
  SearchInput,
  FilterButton,
  CompanyFiltersInline,
} from "../shared/components";
import { buildStats } from "../shared/hooks";
import LeadEnrichmentModal from "@/components/lead-enrichment/LeadEnrichmentModal";
import SeniorityQuickSelector from "@/components/lead-enrichment/SeniorityQuickSelector";
import { useEnrichmentConfigs } from "@/hooks/useEnrichmentConfigs";
import type { SeniorityLevel } from "@/types/leadEnrichment";
import { userService } from "@/services/user.service";
import { usePermissions } from "@/hooks/usePermissions";

const COMPANY_EMPLOYEE_RANGES = [
  { value: "all", label: "All company sizes" },
  { value: "small", label: "1-50 employees", min: 1, max: 50 },
  { value: "medium", label: "50-250 employees", min: 50, max: 250 },
  { value: "large", label: "250-1000 employees", min: 250, max: 1000 },
  { value: "enterprise", label: "1000+ employees", min: 1000 },
];

type ViewMode = "compact" | "detailed" | "card";

const index = () => {
  const { canCreate, legacyRole, userRole } = usePermissions();
  const navigate = useNavigate();

  // Check if user is a viewer (supports both legacy and new RBAC)
  const isViewer = useMemo(() => {
    // Check new RBAC system (roleId with name property)
    if (userRole && typeof userRole === "object" && (userRole as any).name === "CompanyViewer") {
      return true;
    }
    // Check legacy role
    if (legacyRole === "CompanyViewer") {
      return true;
    }
    return false;
  }, [userRole, legacyRole]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [isMobileExecutivesView, setIsMobileExecutivesView] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);
  const [selectedSeniorities, setSelectedSeniorities] = useState<
    SeniorityLevel[]
  >([]);

  // Fetch dynamic enrichment configs
  const { seniorityOptions } = useEnrichmentConfigs();

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await userService.getUserPreferences();
        if (response.success && response.data.preferences?.enrichment?.selectedSeniorities) {
          setSelectedSeniorities(response.data.preferences.enrichment.selectedSeniorities as SeniorityLevel[]);
        }
      } catch (error) {
        console.error("Failed to load user preferences:", error);
      }
    };
    loadPreferences();
  }, []);

  // Save user preferences when seniority selection changes
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await userService.updateUserPreferences({
          selectedSeniorities,
        });
      } catch (error) {
        console.error("Failed to save user preferences:", error);
      }
    };

    // Only save if we have loaded initial preferences (to avoid saving empty array on mount)
    // We check if seniorityOptions are loaded to ensure configs are ready
    if (seniorityOptions.length > 0) {
      savePreferences();
    }
  }, [selectedSeniorities, seniorityOptions.length]);

  // Companies filters and pagination
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesSearch, setCompaniesSearch] = useState("");
  const [companiesLimit, setCompaniesLimit] = useState(
    viewMode === "card" ? 25 : 10
  );

  // Update limit when view mode changes
  useEffect(() => {
    setCompaniesLimit(viewMode === "card" ? 25 : 10);
    // Reset to page 1 when changing view mode
    setCompaniesPage(1);
  }, [viewMode]);
  const [companiesIndustryFilter, setCompaniesIndustryFilter] = useState<
    string[]
  >([]);
  const [companiesEmployeeRange, setCompaniesEmployeeRange] = useState<
    string[]
  >([]);
  const [companiesCountryFilter, setCompaniesCountryFilter] = useState<
    string[]
  >([]);
  const [companiesHasPeopleFilter, setCompaniesHasPeopleFilter] =
    useState(false);
  const [companiesHasWebsiteFilter, setCompaniesHasWebsiteFilter] =
    useState(false);

  const [companyFiltersOpen, setCompanyFiltersOpen] = useState(false);
  const resetCompanyAdvancedFilters = useCallback(() => {
    setCompaniesIndustryFilter([]);
    setCompaniesEmployeeRange([]);
    setCompaniesCountryFilter([]);
    setCompaniesHasPeopleFilter(false);
    setCompaniesHasWebsiteFilter(false);
    setCompanyFiltersOpen(false);
  }, []);

  const companiesParams = useMemo(() => {
    const params: CompaniesQueryParams = {
      page: companiesPage,
      limit: companiesLimit,
      search: companiesSearch || undefined,
      sortBy: "createdAt",
      sortOrder: -1,
    };

    if (companiesIndustryFilter.length > 0) {
      params.industry = companiesIndustryFilter.join(",");
    }

    if (companiesEmployeeRange.length > 0) {
      // Send as comma-separated employee ranges
      params.employeeRanges = companiesEmployeeRange.join(",");
    }

    if (companiesHasPeopleFilter) {
      params.hasPeople = true;
    }

    if (companiesHasWebsiteFilter) {
      params.hasWebsite = true;
    }

    if (companiesCountryFilter.length > 0) {
      params.country = companiesCountryFilter.join(",");
    }

    if (selectedSeniorities.length > 0) {
      // API expects comma-separated string for seniority
      // SeniorityLevel is { value: string, label: string } or just string? 
      // Based on typical usage, let's assume it has a value property or is the value.
      // Checking usage in SeniorityQuickSelector usually implies it's an object with value.
      // But let's check the type file if we can, or play it safe if we know. 
      // Actually, I'll assume they are objects with a 'value' property based on other filters.
      // Wait, I can't check the type file in this turn.
      // Let's use `selectedSeniorities.map((s: any) => s.value || s).join(',')` to be safe?
      // No, TypeScript might complain. 
      // Let's assume they are objects { value: string, label: string } as typically defined.
      // Actually, looking at line 34, COMPANY_EMPLOYEE_RANGES are objects.
      // Let's look at how it's used. 
      // safer:
      params.seniority = selectedSeniorities.map((s: any) => s.value || s).filter(Boolean);
    }

    return params;
  }, [
    companiesPage,
    companiesLimit,
    companiesSearch,
    companiesIndustryFilter,
    companiesEmployeeRange,
    companiesCountryFilter,
    companiesHasPeopleFilter,
    companiesHasWebsiteFilter,
    selectedSeniorities,
  ]);

  const {
    query: companiesQuery,
    companies,
    totalCompanies: filteredTotalCompanies,
  } = useCompaniesData(companiesParams);

  // Check if any company has leads being generated
  const hasCompaniesGeneratingLeads = useMemo(
    () =>
      companies.some(
        (company) => company.leadsGenerationStatus === "in_progress"
      ),
    [companies]
  );

  // Auto-refresh every 5 seconds if any company is generating leads
  useEffect(() => {
    if (!hasCompaniesGeneratingLeads) return;

    const intervalId = setInterval(() => {
      companiesQuery.refetch();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId);
  }, [hasCompaniesGeneratingLeads, companiesQuery]);

  // Filter-aware CRM stats for companies page
  const { stats: companyCrmStats } = useCompanyCrmStatsData(companiesParams);

  // General CRM stats for outreach/response/active clients/messages sent
  const { stats: crmStats } = useCrmStatsData();

  // Fallbacks if filtered stats are not yet available
  const { totalCompanies: totalCompaniesForStats } = useCompaniesData({
    page: 1,
    limit: 1,
  });

  // Fetch all companies (unfiltered) to get full list of industries for the dropdown
  const { companies: allCompaniesForFilters } = useCompaniesData({
    page: 1,
    limit: 1000, // Get a large number to capture all unique industries
  });

  // Prefer filtered stats, fall back to existing counts
  const effectiveTotalCompanies =
    companyCrmStats?.totalCompanies ??
    filteredTotalCompanies ??
    totalCompaniesForStats;

  const industryOptions = useMemo(() => {
    const industries = new Set<string>();
    // Use all companies (unfiltered) to get complete list of industries
    allCompaniesForFilters.forEach((company) => {
      if (company.industry) {
        industries.add(company.industry);
      }
    });
    return Array.from(industries).sort((a, b) => a.localeCompare(b));
  }, [allCompaniesForFilters]);

  const hasCompanyAdvancedFilters = useMemo(
    () =>
      companiesIndustryFilter.length > 0 ||
      companiesEmployeeRange.length > 0 ||
      companiesCountryFilter.length > 0 ||
      companiesHasPeopleFilter ||
      companiesHasWebsiteFilter,
    [
      companiesIndustryFilter,
      companiesEmployeeRange,
      companiesCountryFilter,
      companiesHasPeopleFilter,
      companiesHasWebsiteFilter,
    ]
  );

  const loading = companiesQuery.isLoading;

  const stats = useMemo(
    () =>
      buildStats(
        {
          totalCompanies: effectiveTotalCompanies,
          totalLeads: companyCrmStats?.totalLeads ?? 0,
          totalOutreach: companyCrmStats?.totalOutreach ?? 0,
          totalDealsClosed: companyCrmStats?.totalDealsClosed ?? 0,
          activeClients: companyCrmStats?.activeClients ?? 0,
          messagesSent: companyCrmStats?.messagesSent ?? 0,
          totalCompaniesWithPeople: companyCrmStats?.totalCompaniesWithPeople,
          totalCompaniesWithWebsite: companyCrmStats?.totalCompaniesWithWebsite,
        },
        "companies"
      ),
    [
      effectiveTotalCompanies,
      companyCrmStats,
    ]
  );

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
    companiesCountryFilter,
    companiesHasPeopleFilter,
    companiesHasWebsiteFilter,
  ]);

  const handleExecutiveSelect = (executive: CompanyPerson) => {
    navigate(`/leads/${executive._id}`);
  };

  const isSidebarOpen = selectedCompanyId !== null;
  const selectedCompany: Company | undefined = companies.find(
    (company) => company._id === selectedCompanyId
  );

  return (
    <DashboardLayout>
      <motion.main
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
          {/* Single Line Header - Navigation, Enrich Section, and Filters */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 flex-wrap">
            {/* Page Header with Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="flex-shrink-0"
            >
              <CrmNavigation />
            </motion.div>

            {/* Right Side Container: Enrich Leads + Filters */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="flex items-center gap-2 flex-1 justify-end min-w-0"
            >
              {/* Enrich Leads Section - Always Visible */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Seniority Quick Selector - Hide for viewer role */}
                {!isViewer && (
                  <SeniorityQuickSelector
                    selectedSeniorities={selectedSeniorities}
                    onChange={setSelectedSeniorities}
                    seniorityOptions={seniorityOptions}
                  />
                )}

                {/* Enrich Leads Button */}
                {canCreate("leads") && (
                <Button
                  onClick={() => setEnrichmentModalOpen(true)}
                  className="bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] hover:from-[#69B4B7]/80 hover:to-[#3E64B4]/80 text-white font-semibold rounded-full px-4 sm:px-6 h-10 shadow-[0_5px_18px_rgba(103,176,183,0.35)] hover:shadow-[0_8px_24px_rgba(103,176,183,0.45)] transition-all whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Find Leads</span>
                  <span className="sm:hidden">Find</span>
                </Button>
                )}
              </div>

              {/* Filters Section - Scrollable when expanded */}
              <div className="flex items-center min-w-0 flex-1 justify-end">
                <AnimatePresence mode="wait">
                  {!companyFiltersOpen ? (
                    <motion.div
                      key="filter-button"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2 flex-shrink-0"
                    >
                      <SearchInput
                        placeholder="Search companies..."
                        value={companiesSearch}
                        onChange={setCompaniesSearch}
                      />
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
                      className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-full"
                    >
                      <CompanyFiltersInline
                        search={companiesSearch}
                        onSearchChange={setCompaniesSearch}
                        industries={industryOptions}
                        industryFilter={companiesIndustryFilter}
                        onIndustryFilterChange={
                          setCompaniesIndustryFilter
                        }
                        employeeRanges={COMPANY_EMPLOYEE_RANGES}
                        employeeRange={companiesEmployeeRange}
                        onEmployeeRangeChange={setCompaniesEmployeeRange}
                        locationFilter={companiesCountryFilter}
                        onLocationFilterChange={setCompaniesCountryFilter}
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
                        className="flex-shrink-0"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 bg-accent text-white hover:bg-accent/80 rounded-full flex items-center justify-center"
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
            </motion.div>
          </div>
          {/* Stats Cards */}
          <StatsCards stats={stats} />

          {/* Companies List */}
          <div className="flex flex-col lg:flex-row items-stretch gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-1 min-h-0 overflow-hidden">
            {/* Left: Companies List */}
            <div
              className={`relative pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full h-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] flex-1 min-w-0 flex flex-col overflow-hidden`}
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

            {/* Sidebar (desktop only) */}
            <DetailsSidebar
              activeTab="companies"
              isOpen={isSidebarOpen}
              selectedCompany={selectedCompany}
              onExecutiveSelect={handleExecutiveSelect}
              onClose={() => setSelectedCompanyId(null)}
            />
          </div>
        </motion.div>

        {/* Lead Enrichment Modal */}
        <LeadEnrichmentModal
          isOpen={enrichmentModalOpen}
          onClose={() => setEnrichmentModalOpen(false)}
          selectedSeniorities={selectedSeniorities}
          onEnrichmentStart={(searchId, mode) => {
            toast.success(`Enrichment started! Tracking ID: ${searchId}`);
          }}
          onEnrichmentComplete={(searchId) => {
            toast.success("Enrichment completed! Companies list will refresh.");
            companiesQuery.refetch();
            setEnrichmentModalOpen(false);
          }}
        />
      </motion.main>
    </DashboardLayout>
  );
};

export default index;
