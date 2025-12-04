import { FC, MouseEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Phone,
  Send,
  Search,
  Loader2,
  Sparkles,
  Grid3X3,
  List,
  LayoutGrid,
  MessageCircle,
} from "lucide-react";
import { Lead } from "@/services/leads.service";
import { Company, companiesService } from "@/services/companies.service";
import { toast } from "sonner";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ViewMode = "compact" | "detailed" | "card";

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
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
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
  totalLeads,
  selectedLead,
  executiveFallback,
  onPhoneClickFromSidebar,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  viewMode = "detailed",
  onViewModeChange,
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

  // Render loading state with skeleton placeholders
  const renderLoading = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={
        viewMode === "card"
          ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
          : "space-y-2"
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
              ? "aspect-[3/1] rounded-lg border-0 bg-gradient-to-br from-gray-800/50 to-gray-900/30 border-white/10 overflow-hidden"
              : "rounded-[16px] sm:rounded-[20px] md:rounded-[26px] border-0 bg-gradient-to-br from-gray-800/50 to-gray-900/30 border-white/10 px-3 sm:px-4 md:px-5 lg:px-7 py-1.5 sm:py-2 pl-3 sm:pl-4 md:pl-5 lg:pl-7"
          }
        >
          <div className="flex flex-col gap-2">
            {/* Skeleton content */}
            <div className="flex items-center gap-2">
              <div className="h-3 bg-white/10 rounded animate-pulse w-20"></div>
              <div className="h-3 bg-white/5 rounded animate-pulse w-16"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 bg-white/10 rounded animate-pulse w-24"></div>
            </div>
            {viewMode === "detailed" && (
              <>
                <div className="h-2 bg-white/5 rounded animate-pulse w-full"></div>
                <div className="flex gap-2">
                  <div className="h-6 w-6 bg-white/10 rounded animate-pulse"></div>
                  <div className="h-6 w-6 bg-white/5 rounded animate-pulse"></div>
                  <div className="h-6 w-6 bg-white/10 rounded animate-pulse"></div>
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
    const canEnrich = Boolean(
      lead._id && lead.companyId && (!lead.phone || !lead.whatsapp)
    );

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

    if (viewMode === "card") {
      return (
        <Card
          key={lead._id}
          className={`relative flex flex-col gap-2 overflow-hidden border-0 rounded-lg p-3 transition-all duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.32)] cursor-pointer aspect-[3/1] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[50%] before:w-[3px] before:rounded-full ${
            isActive
              ? "ring-2 ring-primary before:bg-primary"
              : "before:bg-white/75"
          }`}
          style={{
            background: `linear-gradient(180deg, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0.08) 100%), radial-gradient(50% 100% at 50% 0%, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0) 100%)`,
          }}
          onClick={() => navigate(`/leads/${lead._id}`)}
        >
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-white leading-tight">
              {(() => {
                const name = lead.name || "";
                const position = lead.position ? ` | ${lead.position}` : "";
                const fullText = `${name}${position}`;
                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        {name.length > 20 ? `${name.slice(0, 20)}...` : name}
                        {lead.position && (
                          <span className="text-white/60 font-normal">
                            {lead.position.length > 20
                              ? ` | ${lead.position.slice(0, 20)}...`
                              : ` | ${lead.position}`}
                          </span>
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{fullText}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })()}
            </h3>

            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="rounded-full bg-primary/20 text-primary border-primary/30 px-1.5 py-0.5 text-xs">
                    {(lead.companyName || "Company").length > 20
                      ? `${(lead.companyName || "Company").slice(0, 20)}...`
                      : lead.companyName || "Company"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{lead.companyName || "Company"}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </Card>
      );
    }

    // Default list view (compact/detailed)
    return (
      <Card
        key={lead._id}
        className={`relative flex flex-col md:flex-row items-start md:items-center justify-between gap-1 sm:gap-1.5 md:gap-2 border-0 rounded-[16px] sm:rounded-[20px] md:rounded-[26px] px-3 sm:px-4 md:px-5 lg:px-7 py-1.5 sm:py-2 pl-3 sm:pl-4 md:pl-5 lg:pl-7 transition-all duration-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.3)] ${
          viewMode !== "compact"
            ? `before:absolute before:content-[''] before:-left-1 before:top-1/2 before:-translate-y-1/2 before:h-[60%] sm:before:h-[65%] before:w-[3px] sm:before:w-[4px] md:before:w-[6px] before:rounded-full backdrop-blur-[22.6px] ${
                isActive ? "before:bg-primary" : "before:bg-white/75"
              }`
            : ""
        }`}
        style={{
          background: `linear-gradient(180deg, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0.08) 100%), radial-gradient(50% 100% at 50% 0%, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0) 100%)`,
        }}
      >
        <div className="flex-1 w-full md:w-auto">
          <div className="flex flex-wrap items-center gap-2 text-white">
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-xs sm:text-base font-semibold cursor-default">
                  {lead.name.length > 20 ? `${lead.name.slice(0, 20)}...` : lead.name}
                </h3>
              </TooltipTrigger>
              <TooltipContent>
                <p>{lead.name}</p>
              </TooltipContent>
            </Tooltip>
            {lead.companyName && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-white/70 cursor-default">
                    | {lead.companyName.length > 20 ? `${lead.companyName.slice(0, 20)}...` : lead.companyName}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{lead.companyName}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {viewMode === "detailed" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-[8px] sm:text-[9px] font-bold text-white/60 mt-0.5 cursor-default">
                    {(lead.position || "Chief Executive Officer").length > 20
                      ? `${(lead.position || "Chief Executive Officer").slice(0, 20)}...`
                      : lead.position || "Chief Executive Officer"}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{lead.position || "Chief Executive Officer"}</p>
                </TooltipContent>
              </Tooltip>
              <div className="mt-0.5 sm:mt-1 md:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 md:gap-3 text-xs text-gray-300">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border border-white bg-white text-gray-900 flex-shrink-0 cursor-pointer">
                      <Linkedin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{lead.linkedinUrl || "No LinkedIn available"}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border border-white bg-white text-gray-900 flex-shrink-0 cursor-pointer">
                      <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{displayEmail}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 sm:gap-1 md:gap-2 w-full md:w-auto">
          {viewMode === "detailed" && (
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-wrap justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={getIconButtonClasses(!hasPhone)}
                    onClick={() => {
                      if (hasPhone) {
                        onPhoneClick?.(lead, executiveFallback);
                      }
                    }}
                    disabled={!hasPhone}
                    aria-disabled={!hasPhone}
                  >
                    <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{!hasPhone ? "No phone available" : "Call lead"}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={getIconButtonClasses(!hasEmail)}
                    onClick={() => {
                      if (hasEmail) {
                        onEmailClick?.(lead);
                      }
                    }}
                    disabled={!hasEmail}
                    aria-disabled={!hasEmail}
                  >
                    <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{!hasEmail ? "No email available" : "Email lead"}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={getIconButtonClasses(!hasPhone)}
                    onClick={handleWhatsAppOpen}
                    disabled={!hasPhone}
                    aria-disabled={!hasPhone}
                  >
                    <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{!hasPhone ? "No phone available" : "Open WhatsApp"}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
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
                  >
                    <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {!hasLinkedin ? "No LinkedIn available" : "Send LinkedIn DM"}
                  </p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
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
                  >
                    {isFilling ? (
                      <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {canEnrich
                      ? "Fill missing information"
                      : "Missing IDs to enrich"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          <ActiveNavButton
            icon={ArrowRight}
            text="View Details"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/leads/${lead._id}`);
            }}
            className="w-auto md:w-auto ml-auto md:ml-0 text-[10px] px-1.5 py-0.5 h-6"
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
              <SelectTrigger className="h-7 w-[100px] rounded-full border border-white/20 bg-transparent text-white text-xs">
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

  return (
    <div className={`flex flex-col pb-4 ${viewMode === "card" ? "px-2" : ""}`}>
      {renderPageSizeSelector("top")}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          className={
            viewMode === "card"
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              : "space-y-2"
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
              : leads.length === 0
              ? renderEmpty()
              : leads.map((lead, index) => (
                  <motion.div
                    key={lead._id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      duration: 0.4,
                      ease: "easeOut",
                      delay: index * 0.03,
                    }}
                    whileHover={{
                      scale: 1.02,
                      transition: { duration: 0.2 },
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {renderLeadCard(lead)}
                  </motion.div>
                ))}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

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
