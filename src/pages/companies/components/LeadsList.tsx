import { FC, MouseEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Loader2,
  Sparkles,
} from "lucide-react";
import { Lead } from "@/services/leads.service";
import { Company, companiesService } from "@/services/companies.service";
import LeadDetailsPanel from "./LeadDetailsPanel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ActiveNavButton } from "@/components/ui/active-nav-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LeadsListProps = {
  leads: Lead[];
  loading: boolean;
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
  onEmailClick: (lead: Lead) => void;
  onPhoneClick: (lead: Lead, executiveFallback: any) => void;
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
  selectedLead?: Lead;
  executiveFallback?: any;
  onPhoneClickFromSidebar?: (lead?: Lead, fallback?: any) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
};

const getIconButtonClasses = (isDisabled: boolean) =>
  `h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/40 ${
    isDisabled
      ? "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
      : "bg-white border-white text-gray-900 hover:bg-white/80 hover:text-gray-950"
  }`;

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
  totalLeads,
  selectedLead,
  executiveFallback,
  onPhoneClickFromSidebar,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
}) => {
  const navigate = useNavigate();
  const [fillingLeads, setFillingLeads] = useState<Record<string, boolean>>({});

  const handleFillLeadData = async (lead: Lead) => {
    if (!lead._id || !lead.companyId) {
      toast.error("Cannot enrich: Missing lead or company information");
      return;
    }

    setFillingLeads((prev) => ({ ...prev, [lead._id]: true }));

    try {
      const response = await companiesService.fillPersonData({
        companyId: lead.companyId,
        personId: lead._id,
      });

      if (response?.success) {
        toast.success(
          response.message || "Enrichment request submitted successfully"
        );
      } else {
        toast.error(response?.message || "Failed to enrich lead");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to fill missing information";
      toast.error(errorMessage);
    } finally {
      setFillingLeads((prev) => ({ ...prev, [lead._id]: false }));
    }
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

  // Bulk sync button removed - now handled in parent component (index.tsx)

  // Render lead card
  const renderLeadCard = (lead: Lead) => {
    const { isActive, displayEmail, displayPhone } = getLeadData(lead);
    const hasPhone = displayPhone !== "N/A";
    const hasEmail = displayEmail !== "N/A";
    const hasLinkedin = Boolean(lead.linkedinUrl && lead.linkedinUrl.trim());
    const isFilling = fillingLeads[lead._id];
    const canEnrich = Boolean(lead._id && lead.companyId);

    const handleLinkedinOpen = (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (hasLinkedin && lead.linkedinUrl) {
        window.open(
          lead.linkedinUrl.startsWith("http")
            ? lead.linkedinUrl
            : `https://${lead.linkedinUrl}`,
          "_blank"
        );
      }
    };

    const handleWhatsAppOpen = (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (hasPhone && displayPhone !== "N/A") {
        const whatsappPhone = displayPhone.replace(/\D/g, "");
        window.open(`https://wa.me/${whatsappPhone}`, "_blank");
      }
    };

    const viewButtonLabelDesktop = isActive ? "Close Details" : "View Details";
    const viewButtonLabelMobile = isActive ? "Close" : "Details";

    return (
      <Card
        key={lead._id}
        className={`relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 border-0 rounded-[20px] sm:rounded-[26px] px-4 sm:px-6 md:px-8 py-3 sm:py-4 pl-4 sm:pl-6 transition-all duration-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.3)] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-[3px] sm:before:w-[5px] before:rounded-full backdrop-blur-[22.6px] ${
          isActive ? "before:bg-primary" : "before:bg-white/75"
        }`}
        style={{
          background: `linear-gradient(180deg, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0.08) 100%), radial-gradient(50% 100% at 50% 0%, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0) 100%)`,
        }}
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
              className={getIconButtonClasses(!hasPhone)}
              onClick={() => {
                if (hasPhone) {
                  onPhoneClick?.(lead, executiveFallback);
                }
              }}
              disabled={!hasPhone}
              aria-disabled={!hasPhone}
              title={!hasPhone ? "No phone available" : "Call lead"}
            >
              <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              className={getIconButtonClasses(!hasEmail)}
              onClick={() => {
                if (hasEmail) {
                  onEmailClick?.(lead);
                }
              }}
              disabled={!hasEmail}
              aria-disabled={!hasEmail}
              title={!hasEmail ? "No email available" : "Email lead"}
            >
              <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              className={getIconButtonClasses(!hasLinkedin)}
              onClick={handleLinkedinOpen}
              disabled={!hasLinkedin}
              aria-disabled={!hasLinkedin}
              title={!hasLinkedin ? "No LinkedIn available" : "Open LinkedIn"}
            >
              <Linkedin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              className={getIconButtonClasses(!hasPhone)}
              onClick={handleWhatsAppOpen}
              disabled={!hasPhone}
              aria-disabled={!hasPhone}
              title={!hasPhone ? "No phone available" : "Open WhatsApp"}
            >
              <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              className={getIconButtonClasses(!hasLinkedin)}
              onClick={(e) => {
                e.stopPropagation();
                if (hasLinkedin) {
                  onLinkedinClick(lead);
                }
              }}
              disabled={!hasLinkedin}
              aria-disabled={!hasLinkedin}
              title={
                !hasLinkedin ? "No LinkedIn available" : "Send LinkedIn DM"
              }
            >
              <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
            <button
              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/40 ${
                !canEnrich
                  ? "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
                  : isFilling
                  ? "bg-white/15 border-white/20 text-white cursor-wait"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/15 hover:text-white"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (canEnrich) {
                  handleFillLeadData(lead);
                }
              }}
              disabled={!canEnrich || isFilling}
              aria-disabled={!canEnrich || isFilling}
              title={
                canEnrich ? "Fill missing information" : "Missing IDs to enrich"
              }
            >
              {isFilling ? (
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
            </button>
          </div>
          <ActiveNavButton
            icon={ArrowRight}
            text="View Details"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/leads/${lead._id}`);
            }}
            className="w-full md:w-auto justify-center"
          />
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
    const totalCount = totalLeads ?? leads.length;
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
            ? `Showing ${start}-${end} of ${totalCount} leads`
            : "No leads to display"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange?.(Number(value))}
          >
            <SelectTrigger className="h-8 w-[110px] rounded-full border border-white/20 bg-transparent text-white text-xs">
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
    );
  };

  return (
    <div className="flex flex-col pb-4">
      {renderPageSizeSelector("top")}
      <div className="space-y-4">
        {loading
          ? renderLoading()
          : leads.length === 0
          ? renderEmpty()
          : leads.map((lead) => (
              <div key={lead._id}>
                {renderLeadCard(lead)}
                {/* Show lead details panel inline on mobile/tablet after the clicked lead */}
                {selectedLeadId === lead._id && (
                  <div className="lg:hidden mt-4 mb-4">
                    <Card className="bg-[#1f3032] border-[#3A3A3A] p-3 sm:p-4">
                      <LeadDetailsPanel
                        lead={selectedLead}
                        onEmailClick={onEmailClick}
                        fallbackExecutive={executiveFallback}
                        onPhoneClick={onPhoneClickFromSidebar}
                        onLinkedinClick={onLinkedinClick}
                      />
                    </Card>
                  </div>
                )}
              </div>
            ))}
      </div>

      {/* Fixed pagination at bottom */}
      {!loading && leads.length > 0 && (
        <>
          {renderPagination()}
          {renderPageSizeSelector("bottom")}
        </>
      )}
    </div>
  );
};

export default LeadsList;
