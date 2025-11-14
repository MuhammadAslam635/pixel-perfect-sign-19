import { FC, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { ArrowRight, Linkedin, Search } from "lucide-react";
import { Company } from "@/services/companies.service";

type CompaniesListProps = {
  companies: Company[];
  loading: boolean;
  selectedCompanyId: string | null;
  onSelectCompany: (companyId: string) => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalCompanies?: number;
  showFilters?: boolean;
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
  showFilters = true,
}) => {
  // Calculate pagination page range
  const paginationPages = useMemo<{ pages: number[]; startPage: number; endPage: number } | null>(() => {
    if (totalPages <= 1) return null;

    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

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

  // Render loading state
  const renderLoading = () => (
        <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
          <p className="text-white/60 text-sm">Loading companies...</p>
        </div>
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
    const { isActive, employeeCount, primaryEmail, companyLinkedIn } =
      getCompanyData(company);

        return (
          <Card
            key={company._id}
            onClick={() => onSelectCompany(company._id)}
            className={`relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between overflow-clip bg-gradient-to-r from-[#13363b] via-[#1f4c55] to-[#16383f] border ${
              isActive ? "border-primary/60" : "border-[#274a4f]"
            } rounded-[30px] px-7 py-6 cursor-pointer transition-all duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.32)] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[55%] before:w-[5px] before:rounded-full ${
              isActive ? "before:bg-primary" : "before:bg-white/75"
            }`}
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 text-white/90">
            <h3 className="text-xl font-semibold text-white">{company.name}</h3>
                {company.industry && (
                  <span className="text-sm text-white/70 font-medium">
                    | {company.industry}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-white/65 truncate max-w-[460px]">
                {company.description ||
                  company.about ||
                  "No description available"}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-white/75">
                <Badge className="rounded-full bg-white/15 text-white border-white/20 px-4 py-1">
                  {employeeCount}
                </Badge>
                {companyLinkedIn && (
                  <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 max-w-[220px]">
                    <Linkedin className="w-3.5 h-3.5 text-white/85" />
                    <span className="font-medium text-white/85 truncate">
                      {companyLinkedIn
                        .replace(/^https?:\/\//, "")
                        .replace(/^www\./, "")}
                    </span>
                  </div>
                )}
                {primaryEmail && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-4 py-1 font-medium text-white/80">
                    {primaryEmail}
                  </span>
                )}
              </div>
            </div>
            <div className="w-full md:w-[260px] flex flex-col items-center md:items-end gap-3 text-white/80">
              {(company.website || primaryEmail) && (
                <p className="text-sm font-semibold text-white/75 text-center md:text-right">
                  {company.website && (
                    <span className="text-white/85">{company.website}</span>
                  )}
                  {company.website && primaryEmail && (
                    <span className="mx-2 text-white/40">|</span>
                  )}
                  {primaryEmail && (
                    <span className="text-white/70">{primaryEmail}</span>
                  )}
                </p>
              )}
              {company.address && (
                <p className="text-xs text-white/55 text-center md:text-right max-w-[220px]">
                  {company.address}
                </p>
              )}
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCompany(company._id);
                }}
                className="rounded-full bg-white/15 px-6 py-1.5 text-xs font-semibold text-white hover:bg-white/25 border border-white/20"
              >
                {isActive ? "Close Executives" : "View Executives"}
                <ArrowRight className="ml-2 w-3 h-3" />
              </Button>
            </div>
          </Card>
        );
  };

  // Render pagination
  const renderPagination = () => {
    if (!paginationPages) return null;

    const { pages, startPage, endPage } = paginationPages;

    return (
      <div className="sticky bottom-0 left-0 right-0 z-10 bg-[#222B2C] py-2 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-white/10">
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

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-3 custom-scrollbar-list">
        {loading ? (
          renderLoading()
        ) : companies.length === 0 ? (
          renderEmpty()
        ) : (
          companies.map(renderCompanyCard)
        )}
      </div>

      {/* Fixed pagination at bottom */}
      {!loading && companies.length > 0 && renderPagination()}
    </div>
  );
};

export default CompaniesList;