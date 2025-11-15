import { FC, useMemo } from "react";
import { Card } from "@/components/ui/card";
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
  ArrowRight,
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Search,
} from "lucide-react";
import { Lead } from "@/services/leads.service";
import { Company } from "@/services/companies.service";

type LeadsListProps = {
  leads: Lead[];
  loading: boolean;
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
  onEmailClick: (lead: Lead) => void;
  onPhoneClick: (lead: Lead) => void;
  onLinkedinClick: (lead: Lead) => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  companyFilter?: string | null;
  onCompanyFilterChange?: (companyId: string | null) => void;
  companies?: Company[];
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalLeads?: number;
  showFilters?: boolean;
};

const LeadsList: FC<LeadsListProps> = ({
  leads,
  loading,
  selectedLeadId,
  onSelectLead,
  onEmailClick,
  onPhoneClick,
  onLinkedinClick,
  search = "",
  companyFilter = null,
  page = 1,
  totalPages = 1,
  onPageChange,
  showFilters = true,
}) => {
  // Calculate pagination page range
  const paginationPages = useMemo<{
    pages: number[];
    startPage: number;
    endPage: number;
  } | null>(() => {
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

  // Extract lead data for rendering
  const getLeadData = (lead: Lead) => {
    const isActive = selectedLeadId === lead._id;
    const displayEmail = lead.email || "N/A";
    const displayPhone = lead.phone || "N/A";

    return {
      isActive,
      displayEmail,
      displayPhone,
    };
  };

  // Render loading state
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
      <p className="text-white/60 text-sm">Loading leads...</p>
    </div>
  );

  // Render empty state
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <Search className="w-6 h-6 text-white/30" />
      </div>
      <p className="text-white/70 text-base font-medium mb-1">
        {search || companyFilter ? "No leads found" : "No leads available"}
      </p>
      <p className="text-white/50 text-sm text-center max-w-md">
        {search || companyFilter
          ? "Try adjusting your filters or clear them to see all leads."
          : "There are no leads in the database yet."}
      </p>
    </div>
  );

  // Render lead card
  const renderLeadCard = (lead: Lead) => {
    const { isActive, displayEmail, displayPhone } = getLeadData(lead);

    const handleLinkedinOpen = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (lead.linkedinUrl) {
        window.open(
          lead.linkedinUrl.startsWith("http")
            ? lead.linkedinUrl
            : `https://${lead.linkedinUrl}`,
          "_blank"
        );
      }
    };

    const handleWhatsAppOpen = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (displayPhone !== "N/A") {
        const whatsappPhone = displayPhone.replace(/\D/g, "");
        window.open(`https://wa.me/${whatsappPhone}`, "_blank");
      }
    };

    return (
      <Card
        key={lead._id}
        onClick={() => onSelectLead(lead._id)}
        className={`relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 bg-gradient-to-r from-[#13363b] via-[#1f4c55] to-[#16383f] border ${
          isActive ? "border-primary/60" : "border-[#274a4f]"
        } rounded-[20px] sm:rounded-[26px] px-4 sm:px-6 md:px-8 py-3 sm:py-4 pl-4 sm:pl-6 transition-all duration-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.3)] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-[3px] sm:before:w-[5px] before:rounded-full ${
          isActive ? "before:bg-primary" : "before:bg-white/75"
        } cursor-pointer`}
      >
        <div className="flex-1 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-2 text-white">
            <h3 className="text-base sm:text-lg font-semibold">{lead.name}</h3>
            {lead.companyName && (
              <span className="text-xs sm:text-sm text-white/70">
                | {lead.companyName}
              </span>
            )}
          </div>
          <p className="text-xs text-white/60 mt-1">
            {lead.position || "Chief Executive Officer"}
          </p>
          <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-300">
            <div className="flex items-center gap-1.5">
              <Linkedin className="w-5 h-5 sm:w-6 sm:h-6 rounded-full text-gray-800 bg-white border p-1 border-white/20 flex-shrink-0" />
              <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                {lead.linkedinUrl || "linkedin.com"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 rounded-full text-gray-800 bg-white border p-1 border-white/20 flex-shrink-0" />
              <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                {displayEmail}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
            <button
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                if (lead.phone) {
                  onPhoneClick(lead);
                }
              }}
            >
              <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-800" />
            </button>
            <button
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onEmailClick(lead);
              }}
            >
              <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-800" />
            </button>
            <button
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
              onClick={handleLinkedinOpen}
            >
              <Linkedin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-800" />
            </button>
            <button
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
              onClick={handleWhatsAppOpen}
            >
              <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-800" />
            </button>
            <button
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onLinkedinClick(lead);
              }}
            >
              <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-800" />
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectLead(lead._id);
            }}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-full px-6 sm:px-12 py-1.5 flex items-center gap-2 sm:gap-3 transition-colors w-full md:w-auto justify-center"
          >
            <span className="hidden sm:inline">View Details</span>
            <span className="sm:hidden">Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
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
        ) : leads.length === 0 ? (
          renderEmpty()
        ) : (
          leads.map(renderLeadCard)
        )}
      </div>

      {/* Fixed pagination at bottom */}
      {!loading && leads.length > 0 && renderPagination()}
    </div>
  );
};

export default LeadsList;