import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Company, CompanyPerson } from "@/services/companies.service";
import { toast } from "sonner";
import CompaniesList from "./components/CompaniesList";
import { DetailsSidebar } from "../shared/components";
import { useCompaniesData, useCrmStatsData } from "../shared/hooks";
import { CompaniesQueryParams } from "@/services/companies.service";
import {
  StatsCards,
  SearchInput,
  FilterButton,
  CompanyFiltersPanel,
  CompanyFiltersInline,
} from "../shared/components";
import { buildStats } from "../shared/hooks";

const COMPANY_EMPLOYEE_RANGES = [
  { value: "all", label: "All company sizes" },
  { value: "small", label: "1-50 employees", min: 1, max: 50 },
  { value: "medium", label: "50-250 employees", min: 50, max: 250 },
  { value: "large", label: "250-1000 employees", min: 250, max: 1000 },
  { value: "enterprise", label: "1000+ employees", min: 1000 },
];

type ViewMode = 'compact' | 'detailed' | 'card';

const index = () => {
  const navigate = useNavigate();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
  const [isMobileExecutivesView, setIsMobileExecutivesView] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');

  // Companies filters and pagination
  const [companiesPage, setCompaniesPage] = useState(1);
  const [companiesSearch, setCompaniesSearch] = useState("");
  const [companiesLimit, setCompaniesLimit] = useState(viewMode === 'card' ? 25 : 10);

  // Update limit when view mode changes
  useEffect(() => {
    setCompaniesLimit(viewMode === 'card' ? 25 : 10);
    // Reset to page 1 when changing view mode
    setCompaniesPage(1);
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
  const resetCompanyAdvancedFilters = useCallback(() => {
    setCompaniesIndustryFilter("all");
    setCompaniesEmployeeRange("all");
    setCompaniesLocationFilter("");
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

  const { stats: crmStats } = useCrmStatsData();

  // Fetch total companies count without search/filter for stats
  const { totalCompanies: totalCompaniesForStats } = useCompaniesData({
    page: 1,
    limit: 1,
  });

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

  const stats = useMemo(
    () =>
      buildStats({
        totalCompanies: totalCompaniesForStats,
        totalOutreach: crmStats?.totalOutreach,
        totalResponse: crmStats?.totalResponse,
        activeClients: crmStats?.activeClients,
        messagesSent: crmStats?.messagesSent,
      }),
    [
      totalCompaniesForStats,
      crmStats?.totalOutreach,
      crmStats?.totalResponse,
      crmStats?.activeClients,
      crmStats?.messagesSent,
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
    companiesLocationFilter,
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
                            onHasPeopleFilterChange={setCompaniesHasPeopleFilter}
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

          {/* Stats Cards */}
          <StatsCards stats={stats} />

          {/* Split View */}
          <div className="flex flex-col lg:flex-row items-start gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            {/* Left: Companies List */}
            <div
              className={`relative pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] ${isSidebarOpen ? "lg:mr-[360px] xl:mr-[420px]" : ""
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
                onViewAllLeads={() => { }}
                onExecutiveSelect={handleExecutiveSelect}
                onMobileExecutivesViewChange={setIsMobileExecutivesView}
                pageSize={companiesLimit}
                onPageSizeChange={setCompaniesLimit}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
          </div>

          {/* Fixed sidebar (desktop only) */}
          <DetailsSidebar
            activeTab="companies"
            isOpen={isSidebarOpen}
            selectedCompany={selectedCompany}
            onExecutiveSelect={handleExecutiveSelect}
          />

        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default index;
