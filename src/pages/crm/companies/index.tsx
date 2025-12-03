import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Company, CompanyPerson } from "@/services/companies.service";
import { toast } from "sonner";
import CompaniesList from "./components/CompaniesList";
import { DetailsSidebar } from "../shared/components";
import { useCompaniesData } from "../shared/hooks";
import { CompaniesQueryParams } from "@/services/companies.service";
import {
  StatsCards,
  SearchInput,
  FilterButton,
  CompanyFiltersPanel,
} from "../shared/components";
import { buildStats } from "../shared/hooks";

const COMPANY_EMPLOYEE_RANGES = [
  { value: "all", label: "All company sizes" },
  { value: "small", label: "1-50 employees", min: 1, max: 50 },
  { value: "medium", label: "50-250 employees", min: 50, max: 250 },
  { value: "large", label: "250-1000 employees", min: 250, max: 1000 },
  { value: "enterprise", label: "1000+ employees", min: 1000 },
];

const index = () => {
  const navigate = useNavigate();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null
  );
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
    () => buildStats(totalCompaniesForStats, undefined),
    [totalCompaniesForStats]
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
      <main className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white min-h-screen overflow-x-hidden">
        <div className="max-w-[1600px] mx-auto w-full min-h-0">
          {/* Filters Bar */}
          <div className="flex flex-col  justify-end sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-5">
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
                    <Popover
                      open={companyFiltersOpen}
                      onOpenChange={setCompanyFiltersOpen}
                    >
                      <PopoverTrigger asChild>
                        <FilterButton
                          hasFilters={hasCompanyAdvancedFilters}
                          onClick={() => setCompanyFiltersOpen(true)}
                        />
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        className="w-80 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-4"
                      >
                        <CompanyFiltersPanel
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
                          onClose={() => setCompanyFiltersOpen(false)}
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

        </div>
      </main>
    </DashboardLayout>
  );
};

export default index;
