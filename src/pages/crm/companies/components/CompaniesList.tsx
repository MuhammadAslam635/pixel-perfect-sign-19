import { FC, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Linkedin,
  Search,
  ArrowLeft,
  Users,
  Grid3X3,
  List,
  LayoutGrid,
} from "lucide-react";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { Company } from "@/services/companies.service";
import CompanyExecutivesPanel from "./CompanyExecutivesPanel";
import { CompanyLogoFallback } from "@/components/ui/company-logo-fallback";

type ViewMode = "compact" | "detailed" | "card";

type CompaniesListProps = {
  companies: Company[];
  loading: boolean;
  selectedCompanyId: string | null;
  onSelectCompany: (companyId: string) => void;
  onDesktopExecutivesFocus?: () => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalCompanies?: number;
  showFilters?: boolean;
  selectedCompany?: Company;
  onViewAllLeads?: () => void;
  onExecutiveSelect?: (executive: any) => void;
  onMobileExecutivesViewChange?: (isOpen: boolean) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
};

const CompaniesList: FC<CompaniesListProps> = ({
  companies,
  loading,
  selectedCompanyId,
  onSelectCompany,
  search = "",
  page = 1,
  totalPages = 1,
  onPageChange,
  totalCompanies,
  selectedCompany,
  onViewAllLeads,
  onExecutiveSelect,
  onMobileExecutivesViewChange,
  onDesktopExecutivesFocus,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  viewMode = "detailed",
  onViewModeChange,
}) => {
  // State to track if mobile executives view is open
  const [mobileExecutivesView, setMobileExecutivesView] = useState(false);
  useEffect(() => {
    onMobileExecutivesViewChange?.(mobileExecutivesView);
  }, [mobileExecutivesView, onMobileExecutivesViewChange]);

  useEffect(() => {
    return () => {
      onMobileExecutivesViewChange?.(false);
    };
  }, [onMobileExecutivesViewChange]);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(2);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setVisibleCount(Math.min(2, companies.length));
    } else {
      setVisibleCount(companies.length);
    }
  }, [isMobile, companies.length]);

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + 2, companies.length));
  };

  const displayedCompanies = isMobile
    ? companies.slice(0, visibleCount)
    : companies;
  // Helper function to format URL and create clickable link
  const formatWebsiteUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    // Remove protocol and www for display
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  };

  // Helper function to get full URL with protocol
  const getFullUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    // Add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  };
  // Calculate pagination page range
  const paginationPages = useMemo<{
    pages: number[];
    startPage: number;
    endPage: number;
  } | null>(() => {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return { pages, startPage, endPage };
  }, [page, totalPages]);

  const handlePageChange = (newPage: number) => {
    onPageChange?.(newPage);
  };

  const handlePrevious = () => {
    if (page > 1) {
      handlePageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      handlePageChange(page + 1);
    }
  };

  // Extract company data for rendering
  const getCompanyData = (company: Company) => {
    const isActive = selectedCompanyId === company._id;
    const employeeCount = company.employees
      ? `${company.employees} employees`
      : "N/A";
    const primaryExecutive = company.people?.[0];
    const primaryEmail =
      primaryExecutive?.email || primaryExecutive?.emails?.[0] || null;
    const companyLinkedIn =
      primaryExecutive?.linkedin || company.website || null;

    return {
      isActive,
      employeeCount,
      primaryEmail,
      companyLinkedIn,
    };
  };

  // Render loading state with skeleton placeholders
  const renderLoading = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={
        viewMode === "card"
          ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          : "space-y-4"
      }
    >
      {Array.from({ length: viewMode === "card" ? 8 : 5 }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: index * 0.1,
            ease: "easeOut",
          }}
          className={
            viewMode === "card"
              ? "w-full aspect-[3/1] rounded-lg border-0 bg-gradient-to-br from-gray-800/50 to-gray-900/30 border-white/10 overflow-hidden"
              : "rounded-[16px] sm:rounded-[20px] md:rounded-[26px] border-0 bg-gradient-to-br from-gray-800/50 to-gray-900/30 border-white/10 px-3 sm:px-4 md:px-5 lg:px-7 py-1.5 sm:py-2 pl-3 sm:pl-4 md:pl-5 lg:pl-7"
          }
        >
          <div className="flex flex-col gap-2">
            {/* Skeleton content */}
            <div className="flex items-center gap-2">
              <div
                className={`h-4 bg-white/10 rounded animate-pulse ${
                  viewMode === "card" ? "w-full" : "w-32"
                }`}
              ></div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 bg-white/5 rounded animate-pulse ${
                  viewMode === "card" ? "w-3/4" : "w-20"
                }`}
              ></div>
              <div
                className={`h-3 bg-white/10 rounded animate-pulse ${
                  viewMode === "card" ? "w-1/2" : "w-16"
                }`}
              ></div>
            </div>
            {viewMode === "detailed" && (
              <>
                <div className="h-2 bg-white/5 rounded animate-pulse w-full"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-6 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-6 w-6 bg-white/5 rounded animate-pulse"></div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );

  // Render empty state
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Search className="w-6 h-6 text-white/30" />
      </div>
      <p className="text-white/70 text-base font-medium mb-1">
        {search ? "No companies found" : "No companies available"}
      </p>
      <p className="text-white/50 text-sm text-center max-w-md">
        {search
          ? "Try adjusting your search terms or clear the filter to see all companies."
          : "There are no companies in the database yet."}
      </p>
    </div>
  );

  // Render company card
  const renderCompanyCard = (company: Company) => {
    const isActive = selectedCompanyId === company._id;
    const employeeCount = company.employees
      ? `${company.employees} employees`
      : "N/A";
    const primaryExecutive = company.people?.[0];
    const primaryEmail =
      primaryExecutive?.email || primaryExecutive?.emails?.[0] || null;
    const primaryLinkedIn = primaryExecutive?.linkedin || null;


    if (viewMode === "card") {
      return (
        <Card
          key={company._id}
          className={`relative flex items-center gap-2.5 overflow-hidden border-0 rounded-lg p-2.5 transition-all duration-300 hover:bg-white/5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.32)] cursor-pointer ${
            selectedCompanyId ? "aspect-[3/1]" : "aspect-[4/1]"
          } before:absolute before:content-[''] before:-left-1 before:top-1/2 before:-translate-y-1/2 before:h-[55%] sm:before:h-[60%] before:w-0 md:before:w-[3px] lg:before:w-[4px] xl:before:w-[6px] before:rounded-full backdrop-blur-[22.6px] ${
            isActive ? "md:before:bg-primary" : "md:before:bg-white/75"
          }`}
          style={{
            background: `linear-gradient(180deg, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0.08) 100%), radial-gradient(50% 100% at 50% 0%, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0) 100%)`,
          }}
          onClick={() => {
            if (window.innerWidth < 768) {
              setMobileExecutivesView(true);
              onSelectCompany(company._id);
            } else {
              onSelectCompany(company._id);
              onDesktopExecutivesFocus?.();
            }
          }}
        >
          {/* Company Logo */}
          <CompanyLogoFallback
            name={company.name}
            logo={company.logo}
            size="md"
          />

          {/* Content */}
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            {/* First Row: Company Name and Industry */}
            <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight overflow-hidden text-ellipsis whitespace-nowrap">
              {company.name}
              {company.industry && (
                <span className="text-white/60 font-normal">
                  {" | "}
                  {company.industry}
                </span>
              )}
            </h3>

            {/* Second Row: Website */}
            {company.website && (
              <div className="flex items-center gap-1 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[6px] text-white/80">🌐</span>
                </div>
                <a
                  href={getFullUrl(company.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] sm:text-xs text-white/70 overflow-hidden text-ellipsis whitespace-nowrap hover:text-white hover:underline"
                >
                  {formatWebsiteUrl(company.website)}
                </a>
              </div>
            )}
          </div>
        </Card>
      );
    }

    // Default list view (compact/detailed)
    return (
      <Card
        key={company._id}
        className={`relative flex flex-col gap-0.5 sm:gap-1 md:flex-row md:items-center md:justify-between overflow-hidden border-0 mb-1.5 sm:mb-2 rounded-[16px] sm:rounded-[20px] md:rounded-[30px] px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 transition-all duration-300 hover:bg-white/5 hover:shadow-[0_20px_45px_rgba(0,0,0,0.32)] ${
          viewMode !== "compact"
            ? `before:absolute before:content-[''] before:-left-1 before:top-1/2 before:-translate-y-1/2 before:h-[55%] sm:before:h-[60%] before:w-0 md:before:w-[3px] lg:before:w-[4px] xl:before:w-[6px] before:rounded-full backdrop-blur-[22.6px] ${
                isActive ? "md:before:bg-primary" : "md:before:bg-white/75"
              }`
            : ""
        }`}
        style={{
          background: `linear-gradient(180deg, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0.08) 100%), radial-gradient(50% 100% at 50% 0%, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0) 100%)`,
        }}
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 text-white/90">
            <div className="text-xs sm:text-sm font-semibold text-white text-center sm:text-left sm:mx-0 mx-auto">
              {company.name}
            </div>
            {company.industry && (
              <span className="text-xs text-white/70 font-medium">
                | {company.industry}
              </span>
            )}
            {viewMode === "compact" && (
              <Badge className="rounded-full bg-white/15 text-white border-white/20 px-2 py-0.5 text-xs">
                {employeeCount}
              </Badge>
            )}
          </div>
          {viewMode === "detailed" && (
            <p className="mt-0.5 text-xs text-white/65 line-clamp-2">
              {company.description ||
                company.about ||
                "No description available"}
            </p>
          )}
          {/* Mobile: Side by side layout */}
          {viewMode === "detailed" && (
            <div className="mt-0.5 sm:mt-1 md:mt-2 md:hidden flex flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-white/75">
                <Badge className="rounded-full bg-white/15 text-white border-white/20 px-3 sm:px-4 py-1 text-xs">
                  {employeeCount}
                </Badge>
                {primaryLinkedIn && (
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 border border-white/20 rounded-full px-2 sm:px-3 py-1 max-w-[150px] sm:max-w-[220px]">
                    <Linkedin className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white/85 flex-shrink-0" />
                    <a
                      href={getFullUrl(primaryLinkedIn)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-white/85 truncate hover:text-white hover:underline text-xs"
                    >
                      {formatWebsiteUrl(primaryLinkedIn)}
                    </a>
                  </div>
                )}
                {primaryEmail && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 sm:px-4 py-1 font-medium text-white/80 text-xs truncate max-w-[200px]">
                    {primaryEmail}
                  </span>
                )}
              </div>
              <div className="flex flex-row gap-2 items-center justify-end text-white/80">
                {(company.website || primaryEmail) && (
                  <p className="text-xs sm:text-sm font-semibold text-white/75 text-right break-words">
                    {company.website && (
                      <a
                        href={getFullUrl(company.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-white/85 hover:text-white hover:underline"
                      >
                        {formatWebsiteUrl(company.website)}
                      </a>
                    )}
                    {company.website && primaryEmail && (
                      <span className="mx-2 text-white/40">|</span>
                    )}
                    {primaryEmail && (
                      <span className="text-white/70 break-all">
                        {primaryEmail}
                      </span>
                    )}
                  </p>
                )}
                {company.address && (
                  <p className="text-xs text-white/55 text-right max-w-[220px]">
                    {company.address}
                  </p>
                )}
              </div>
            </div>
          )}
          {/* Desktop: Original badges layout */}
          {viewMode === "detailed" && (
            <div className="hidden md:block mt-0.5 sm:mt-1 md:mt-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-white/75">
                <Badge className="rounded-full bg-white/15 text-white border-white/20 px-3 sm:px-4 py-1 text-xs">
                  {employeeCount}
                </Badge>
                {primaryLinkedIn && (
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 border border-white/20 rounded-full px-2 sm:px-3 py-1 max-w-[150px] sm:max-w-[220px]">
                    <Linkedin className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white/85 flex-shrink-0" />
                    <a
                      href={getFullUrl(primaryLinkedIn)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-white/85 truncate hover:text-white hover:underline text-xs"
                    >
                      {formatWebsiteUrl(primaryLinkedIn)}
                    </a>
                  </div>
                )}
                {primaryEmail && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 sm:px-4 py-1 font-medium text-white/80 text-xs truncate max-w-[200px]">
                    {primaryEmail}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="w-full md:w-[240px] lg:w-[260px] flex flex-col items-center md:items-end gap-0.5 sm:gap-1 md:gap-2 text-white/80 md:ml-4 lg:ml-8">
          {viewMode === "detailed" && (
            <div className="hidden md:flex flex-row md:flex-col gap-1.5 md:gap-1 items-center md:items-end">
              {(company.website || primaryEmail) && (
                <p className="text-xs sm:text-sm font-semibold text-white/75 text-center md:text-right break-words flex-1 md:flex-none">
                  {company.website && (
                    <a
                      href={getFullUrl(company.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-white/85 hover:text-white hover:underline"
                    >
                      {formatWebsiteUrl(company.website)}
                    </a>
                  )}
                  {company.website && primaryEmail && (
                    <span className="mx-2 text-white/40">|</span>
                  )}
                  {primaryEmail && (
                    <span className="text-white/70 break-all">
                      {primaryEmail}
                    </span>
                  )}
                </p>
              )}
              {company.address && (
                <p className="text-xs text-white/55 text-center md:text-right max-w-full md:max-w-[220px] flex-1 md:flex-none">
                  {company.address}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center md:items-center justify-end gap-0.5 sm:gap-1 w-full md:w-auto">
            <ActiveNavButton
              icon={Users}
              text={isActive ? "Close Details" : "View Details"}
              onClick={() => {
                if (window.innerWidth < 768) {
                  // Mobile: show executives view and hide companies
                  setMobileExecutivesView(true);
                  onSelectCompany(company._id);
                } else {
                  // Desktop: toggle executives panel
                  onSelectCompany(company._id);
                  onDesktopExecutivesFocus?.();
                }
              }}
              className="w-auto md:w-auto ml-auto md:ml-0 text-[10px] px-1.5 py-0.5 h-6"
            />
          </div>
        </div>
      </Card>
    );
  };

  // Render pagination
  const renderPagination = () => {
    if (!paginationPages) return null;

    const { pages, startPage, endPage } = paginationPages;

    return (
      <div className="bg-[#222B2C]/40 py-3 px-4 sm:px-6 border border-white/10 rounded-2xl">
        <Pagination>
          <PaginationContent className="gap-1">
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  handlePrevious();
                }}
                className={
                  page <= 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer hover:bg-white/10 transition-colors"
                }
              />
            </PaginationItem>

            {startPage > 1 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(1);
                    }}
                    className="cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {startPage > 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}

            {pages.map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(p);
                  }}
                  isActive={p === page}
                  className="cursor-pointer hover:bg-white/10 transition-colors"
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(totalPages);
                    }}
                    className="cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  handleNext();
                }}
                className={
                  page >= totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer hover:bg-white/10 transition-colors"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  const renderPageSizeSelector = (position: "top" | "bottom") => {
    const totalCount = totalCompanies ?? companies.length;
    const hasData = totalCount > 0;
    const start = hasData ? (page - 1) * pageSize + 1 : 0;
    const end = hasData ? Math.min(page * pageSize, totalCount) : 0;

    return (
      <div
        className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
          position === "top" ? "mb-4" : "mt-4"
        }`}
      >
        <p className="text-xs text-white/60">
          {hasData
            ? `Showing ${start}-${end} of ${totalCount} companies`
            : "No companies to display"}
        </p>
        <div className="flex items-center gap-3">
          {position === "top" && onViewModeChange && (
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
              <Button
                variant={viewMode === "compact" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("compact")}
                className={`h-7 px-3 rounded-full text-xs font-medium transition-all ${
                  viewMode === "compact"
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Grid3X3 className="w-3 h-3 mr-1.5" />
                Compact
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("card")}
                className={`h-7 px-3 rounded-full text-xs font-medium transition-all ${
                  viewMode === "card"
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <LayoutGrid className="w-3 h-3 mr-1.5" />
                Card
              </Button>
              <Button
                variant={viewMode === "detailed" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("detailed")}
                className={`h-7 px-3 rounded-full text-xs font-medium transition-all ${
                  viewMode === "detailed"
                    ? "bg-primary text-white shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <List className="w-3 h-3 mr-1.5" />
                Detailed
              </Button>
            </div>
          )}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
            <span className="text-xs text-white/60 px-2">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange?.(Number(value))}
            >
              <SelectTrigger className="h-7 w-[115px] rounded-full border border-white/20 bg-transparent text-white text-xs">
                <SelectValue placeholder={`${pageSize}`} />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f1f] border border-white/10 text-white">
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  };

  // Mobile executives view - show only executives list
  if (mobileExecutivesView && selectedCompany) {
    return (
      <div className="flex flex-col md:hidden">
        <div className="hidden sm:flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMobileExecutivesView(false);
              onSelectCompany("");
            }}
            className="text-white hover:text-white/80 hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h3 className="text-base font-semibold text-white">
            {selectedCompany.name} - Executives
          </h3>
        </div>
        <div className="pb-4">
          <div className="flex items-center gap-3 mb-3 sm:hidden">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <img
                src="/assets/leads-icon.png"
                alt="Executives icon"
                className="w-7 h-7 object-contain"
              />
            </div>
            <span className="text-lg font-semibold text-white">Executives</span>
          </div>
          <Card className="bg-transparent border-transparent shadow-none sm:bg-[#1f3032] sm:border-[#3A3A3A] sm:shadow-sm p-3 sm:p-4">
            <CompanyExecutivesPanel
              company={selectedCompany}
              onViewAllLeads={onViewAllLeads || (() => {})}
              onExecutiveSelect={onExecutiveSelect}
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${viewMode === "card" ? "px-2" : ""}`}>
      {renderPageSizeSelector("top")}
      <div className="w-full pb-4">
        <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          className={
            viewMode === "card"
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              : "space-y-4"
          }
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            staggerChildren: 0.05,
            delayChildren: 0.1,
          }}
          layout
        >
          <AnimatePresence mode="popLayout">
            {loading
              ? renderLoading()
              : companies.length === 0
              ? renderEmpty()
              : displayedCompanies.map((company, index) => (
                  <motion.div
                    key={company._id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                      delay: index * 0.03,
                    }}
                  >
                    {renderCompanyCard(company)}
                    {/* Executives panel below the company card should not appear on desktop */}
                    {selectedCompanyId === company._id &&
                      viewMode !== "card" && (
                        <div className="block lg:hidden mt-2 mb-2">
                          <Card className="bg-[#1f3032] border-[#3A3A3A] p-3 sm:p-4">
                            <CompanyExecutivesPanel
                              company={selectedCompany}
                              onViewAllLeads={onViewAllLeads || (() => {})}
                              onExecutiveSelect={onExecutiveSelect}
                            />
                          </Card>
                        </div>
                      )}
                  </motion.div>
                ))}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
      </div>

      {isMobile && companies.length > 2 && (
        <div className="flex flex-col items-center gap-2 pb-4">
          <p className="text-xs text-white/70">
            Showing 1 - {Math.min(visibleCount, companies.length)} of{" "}
            {companies.length} Companies
          </p>
          {visibleCount < companies.length && (
            <Button
              onClick={handleLoadMore}
              className="rounded-md px-6 py-2 text-sm font-medium text-white bg-[#596C6D] shadow-[0px_20px_40px_rgba(0,0,0,0.45)]"
            >
              Load More
            </Button>
          )}
        </div>
      )}

      {/* Fixed pagination at bottom */}
      {/* {!loading && companies.length > 0 && (
        <>
          {renderPagination()}
          {renderPageSizeSelector("bottom")}
        </>
      )} */}
    </div>
  );
};

export default CompaniesList;
