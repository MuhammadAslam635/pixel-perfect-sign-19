import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { Company, CompanyPerson } from "@/services/companies.service";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import CompaniesList from "./components/CompaniesList";
import { DetailsSidebar } from "../shared/components";
import { useCompaniesPageData } from "../shared/hooks";
import { CompaniesQueryParams } from "@/services/companies.service";
import { StatsCards, SearchInput, FilterButton, CompanyFiltersInline } from "../shared/components";
import { buildStats } from "../shared/hooks";
import LeadEnrichmentModal from "@/components/lead-enrichment/LeadEnrichmentModal";
import SeniorityQuickSelector from "@/components/lead-enrichment/SeniorityQuickSelector";
import { useEnrichmentConfigs } from "@/hooks/useEnrichmentConfigs";
import type { SeniorityLevel } from "@/types/leadEnrichment";
import { SENIORITY_OPTIONS } from "@/types/leadEnrichment";
import { userService } from "@/services/user.service";
import { usePermissions } from "@/hooks/usePermissions";
import { COMPANY_EMPLOYEE_RANGES } from "@/mocks/dropdownMock";

type ViewMode = "compact" | "detailed" | "card";

const Index = () => {
  const { canCreate } = usePermissions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);
  const [selectedSeniorities, setSelectedSeniorities] = useState<SeniorityLevel[]>([]);
  const { seniorityOptions: dynamicSeniorityOptions } = useEnrichmentConfigs();
  const seniorityOptions = useMemo(() => dynamicSeniorityOptions.length > 0 ? dynamicSeniorityOptions : SENIORITY_OPTIONS, [dynamicSeniorityOptions]);
  const getLimitForView = (view: ViewMode) => (view === "card" ? 25 : 10);
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesLimit, setCompaniesLimit] = useState(getLimitForView(viewMode));
  const [filters, setFilters] = useState({ search: "", industry: [] as string[], employeeRange: [] as string[], country: [] as string[], hasPeople: false, hasWebsite: false, });
  const [companyFiltersOpen, setCompanyFiltersOpen] = useState(false);
  const resetFilters = useCallback(() => {
    setFilters({ search: "", industry: [], employeeRange: [], country: [], hasPeople: false, hasWebsite: false });
    setCompanyFiltersOpen(false);
  }, []);

  const [isInitialized, setIsInitialized] = useState(false);
  const prevSenioritiesRef = useRef<SeniorityLevel[] | string[] | null>(null);
  const { data: userPreferencesData, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ["userPreferences"],
    queryFn: async () => {
      const response = await userService.getUserPreferences();
      return response;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: { selectedSeniorities: SeniorityLevel[] }) => {
      const response = await userService.updateUserPreferences({
        selectedSeniorities: data.selectedSeniorities,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
    },
    onError: (error) => {
      toast.error("Failed to save preferences");
    },
  });

  useEffect(() => {
    if (isLoadingPreferences || isInitialized) return;

    let seniorities =
      userPreferencesData?.data?.preferences?.enrichment?.selectedSeniorities;

    if (!Array.isArray(seniorities) || seniorities.length === 0) {
      const localData = localStorage.getItem('selectedSeniorities');
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          seniorities = parsed;
        } catch (e) {
          console.error("localStorage parse error:", e);
        }
      }
    }

    if (Array.isArray(seniorities) && seniorities.length > 0) {
      prevSenioritiesRef.current = seniorities;
      setSelectedSeniorities(seniorities as SeniorityLevel[]);
    }

    if (userPreferencesData !== undefined) {
      setIsInitialized(true);
    }
  }, [userPreferencesData, isLoadingPreferences, isInitialized]);

  useEffect(() => {
    if (!isInitialized || seniorityOptions.length === 0) return;
    if (prevSenioritiesRef.current !== null && JSON.stringify(prevSenioritiesRef.current) === JSON.stringify(selectedSeniorities)) {
      prevSenioritiesRef.current = null;
      return;
    }
    try {localStorage.setItem('selectedSeniorities', JSON.stringify(selectedSeniorities));} catch (e) {console.error("localStorage save error:", e);}
    const timeoutId = setTimeout(() => {updatePreferencesMutation.mutate({ selectedSeniorities });}, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeniorities, seniorityOptions.length, isInitialized]);

  useEffect(() => {setCompaniesLimit(getLimitForView(viewMode));setCompaniesPage(1);}, [viewMode]);

  const companiesParams = useMemo(() => {
    const params: CompaniesQueryParams = {
      page: companiesPage,
      limit: companiesLimit,
      search: filters.search || undefined,
      sortBy: "createdAt",
      sortOrder: -1,
    };
    if (filters.industry.length > 0) params.industry = filters.industry.join(",");
    if (filters.employeeRange.length > 0) params.employeeRanges = filters.employeeRange.join(",");
    if (filters.hasPeople) params.hasPeople = true;
    if (filters.hasWebsite) params.hasWebsite = true;
    if (filters.country.length > 0) params.country = filters.country.join(",");
    return params;
  }, [companiesPage, companiesLimit, filters]);

  const { data: unifiedData, isLoading: loading, refetch, error } = useCompaniesPageData(companiesParams);
  const companies = unifiedData?.companies || [];
  const filteredTotalCompanies = unifiedData?.companiesPagination?.totalDocs;
  const companyCrmStats = unifiedData?.companyStats;
  const totalCompaniesForStats = unifiedData?.totalCompaniesCount;
  const allCompaniesForFilters = unifiedData?.allCompaniesForFilters || [];

  const hasCompaniesGeneratingLeads = useMemo(() => companies.some(c => c.leadsGenerationStatus === "in_progress"), [companies]);
  useEffect(() => {if (!hasCompaniesGeneratingLeads) return;const intervalId = setInterval(refetch, 5000);return () => clearInterval(intervalId);}, [hasCompaniesGeneratingLeads, refetch]);
  useEffect(() => {setCompaniesPage(1);}, [filters, companiesLimit]);

  const industryOptions = useMemo(() => {
    const industries = new Set<string>();
    allCompaniesForFilters.forEach(c => c.industry && industries.add(c.industry));
    return Array.from(industries).sort((a, b) => a.localeCompare(b));
  }, [allCompaniesForFilters]);

  const hasCompanyAdvancedFilters = useMemo(() => (
    filters.industry.length > 0 || filters.employeeRange.length > 0 || filters.country.length > 0 || filters.hasPeople || filters.hasWebsite
  ), [filters]);

  const effectiveTotalCompanies = companyCrmStats?.totalCompanies ?? filteredTotalCompanies ?? totalCompaniesForStats;
  const stats = useMemo(() => buildStats({
    totalCompanies: effectiveTotalCompanies,
    totalLeads: companyCrmStats?.totalLeads ?? 0,
    totalOutreach: companyCrmStats?.totalOutreach ?? 0,
    totalDealsClosed: companyCrmStats?.totalDealsClosed ?? 0,
    activeClients: companyCrmStats?.activeClients ?? 0,
    messagesSent: companyCrmStats?.messagesSent ?? 0,
    totalCompaniesWithPeople: companyCrmStats?.totalCompaniesWithPeople,
    totalCompaniesWithWebsite: companyCrmStats?.totalCompaniesWithWebsite,
  }, "companies"), [effectiveTotalCompanies, companyCrmStats]);

  useEffect(() => {
    if (error) toast.error(sanitizeErrorMessage(error, "Unable to load companies. Please try again."));
  }, [error]);
  const selectedCompany: Company | undefined = companies.find(c => c._id === selectedCompanyId);
  const handleCompanyClick = (companyId: string) => {
    const normalizedId = companyId === "" ? null : companyId;
    setSelectedCompanyId(prev => (prev === normalizedId ? null : normalizedId));
  };
  useEffect(() => {
    if (selectedCompanyId && !selectedCompany) setSelectedCompanyId(null);
  }, [selectedCompanyId, selectedCompany]);

  const handleExecutiveSelect = (executive: CompanyPerson) => navigate(`/leads/${executive._id}`);
  const isSidebarOpen = selectedCompanyId !== null;

  return (
    <DashboardLayout>
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white h-screen overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }} className="max-w-[1600px] mx-auto w-full flex flex-col flex-1 relative min-h-0">
          <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 flex-wrap">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }} className="flex-shrink-0">
              <CrmNavigation />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }} className="flex items-center gap-2 flex-1 justify-end min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                {canCreate("leads") && (
                  <SeniorityQuickSelector selectedSeniorities={selectedSeniorities} onChange={setSelectedSeniorities} seniorityOptions={seniorityOptions} />
                )}
                {canCreate("leads") && (
                  <Button onClick={() => setEnrichmentModalOpen(true)} className="bg-gradient-to-r from-[#69B4B7] to-[#3E64B4] hover:from-[#69B4B7]/80 hover:to-[#3E64B4]/80 text-white font-semibold rounded-full px-4 sm:px-6 h-10 shadow-[0_5px_18px_rgba(103,176,183,0.35)] hover:shadow-[0_8px_24px_rgba(103,176,183,0.45)] transition-all whitespace-nowrap">
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Find Leads</span>
                    <span className="sm:hidden">Find</span>
                  </Button>
                )}
              </div>
              <div className="flex items-center min-w-0 flex-1 justify-end">
                <AnimatePresence mode="wait">
                  {!companyFiltersOpen ? (
                    <motion.div key="filter-button" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }} className="flex items-center gap-2 flex-shrink-0">
                      <SearchInput placeholder="Search companies..." value={filters.search} onChange={(value) => setFilters(prev => ({ ...prev, search: value }))} />
                      <FilterButton hasFilters={hasCompanyAdvancedFilters} onClick={() => setCompanyFiltersOpen(true)} />
                    </motion.div>
                  ) : (
                    <motion.div key="filters-inline" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2, ease: "easeOut" }} className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-full">
                      <CompanyFiltersInline
                        search={filters.search}
                        onSearchChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                        industries={industryOptions}
                        industryFilter={filters.industry}
                        onIndustryFilterChange={(val) => setFilters(prev => ({ ...prev, industry: val }))}
                        employeeRanges={COMPANY_EMPLOYEE_RANGES}
                        employeeRange={filters.employeeRange}
                        onEmployeeRangeChange={(val) => setFilters(prev => ({ ...prev, employeeRange: val }))}
                        locationFilter={filters.country}
                        onLocationFilterChange={(val) => setFilters(prev => ({ ...prev, country: val }))}
                        hasPeopleFilter={filters.hasPeople}
                        onHasPeopleFilterChange={(val) => setFilters(prev => ({ ...prev, hasPeople: val }))}
                        hasWebsiteFilter={filters.hasWebsite}
                        onHasWebsiteFilterChange={(val) => setFilters(prev => ({ ...prev, hasWebsite: val }))}
                        hasFilters={hasCompanyAdvancedFilters}
                        onResetFilters={resetFilters}
                      />
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.15 }} className="flex-shrink-0">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-accent text-white hover:bg-accent/80 rounded-full flex items-center justify-center" onClick={() => setCompanyFiltersOpen(false)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
          <StatsCards stats={stats} isLoading={loading} />
          <div className="flex flex-col lg:flex-row items-stretch gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-1 min-h-0 overflow-hidden">
            <div className="relative pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full h-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] flex-1 min-w-0 flex flex-col overflow-hidden">
              <CompaniesList
                companies={companies}
                loading={loading}
                selectedCompanyId={selectedCompanyId}
                onSelectCompany={handleCompanyClick}
                search={filters.search}
                onSearchChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
                page={companiesPage}
                totalPages={unifiedData?.companiesPagination?.totalPages || 1}
                onPageChange={setCompaniesPage}
                totalCompanies={filteredTotalCompanies}
                showFilters={false}
                selectedCompany={selectedCompany}
                onViewAllLeads={() => { }}
                onExecutiveSelect={handleExecutiveSelect}
                // onMobileExecutivesViewChange={setIsMobileExecutivesView}
                pageSize={companiesLimit}
                onPageSizeChange={setCompaniesLimit}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
            <DetailsSidebar
              activeTab="companies"
              isOpen={isSidebarOpen}
              selectedCompany={selectedCompany}
              onExecutiveSelect={handleExecutiveSelect}
              onClose={() => setSelectedCompanyId(null)}
            />
          </div>
        </motion.div>
        <LeadEnrichmentModal
          isOpen={enrichmentModalOpen}
          onClose={() => setEnrichmentModalOpen(false)}
          selectedSeniorities={selectedSeniorities}
          onEnrichmentStart={(searchId) => {
            toast.success(`Enrichment started! Tracking ID: ${searchId}`);
          }}
          onEnrichmentComplete={(searchId) => {
            toast.success("Enrichment completed! Companies list will refresh.");
            refetch();
            setEnrichmentModalOpen(false);
          }}
        />
      </motion.main>
    </DashboardLayout>
  );
};

export default Index;