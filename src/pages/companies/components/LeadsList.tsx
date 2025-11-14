import { FC } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  ArrowRight,
  Linkedin,
  Mail,
  MessageCircle,
  Phone,
  Send,
  Search,
  X,
  Filter,
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
  onSearchChange,
  companyFilter = null,
  onCompanyFilterChange,
  companies = [],
  page = 1,
  totalPages = 1,
  onPageChange,
  totalLeads,
  showFilters = true,
}) => {
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <Pagination className="mt-8">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault();
                onPageChange?.(Math.max(1, page - 1));
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
                  onPageChange?.(1);
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
                  onPageChange?.(p);
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
                  onPageChange?.(totalPages);
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
                onPageChange?.(Math.min(totalPages, page + 1));
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
    );
  };

  return (
    <div className="space-y-4">

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
          <p className="text-white/60 text-sm">Loading leads...</p>
        </div>
      ) : leads.length === 0 ? (
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
      ) : (
        <>
          {leads.map((lead) => {
        const isActive = selectedLeadId === lead._id;
        const displayEmail = lead.email || "N/A";
        const displayPhone = lead.phone || "N/A";

        return (
          <Card
            key={lead._id}
            onClick={() => onSelectLead(lead._id)}
            className={`relative flex items-center justify-between gap-6 bg-gradient-to-r from-[#13363b] via-[#1f4c55] to-[#16383f] border ${
              isActive ? "border-primary/60" : "border-[#274a4f]"
            } rounded-[26px] px-8 py-4 pl-6 transition-all duration-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.3)] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-[5px] before:rounded-full ${
              isActive ? "before:bg-primary" : "before:bg-white/75"
            } cursor-pointer`}
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 text-white">
                <h3 className="text-lg font-semibold">{lead.name}</h3>
                {lead.companyName && (
                  <span className="text-sm text-white/70">
                    | {lead.companyName}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">
                {lead.position || "Chief Executive Officer"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-300">
                <div className="flex items-center gap-1.5 ">
                  <Linkedin className="w-6 h-6 rounded-full text-gray-800 bg-white border p-1 border-white/20" />
                  <span className="font-medium truncate max-w-[200px]">
                    {lead.linkedinUrl || "linkedin.com"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ">
                  <Mail className="w-6 h-6 rounded-full text-gray-800 bg-white border p-1 border-white/20" />
                  <span className="font-medium truncate max-w-[200px]">
                    {displayEmail}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (lead.phone) {
                      onPhoneClick(lead);
                    }
                  }}
                >
                  <Phone className="w-3.5 h-3.5 text-gray-800" />
                </button>
                <button
                  className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEmailClick(lead);
                  }}
                >
                  <Mail className="w-3.5 h-3.5 text-gray-800" />
                </button>
                <button
                  className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (lead.linkedinUrl) {
                      window.open(
                        lead.linkedinUrl.startsWith("http")
                          ? lead.linkedinUrl
                          : `https://${lead.linkedinUrl}`,
                        "_blank"
                      );
                    }
                  }}
                >
                  <Linkedin className="w-3.5 h-3.5 text-gray-800" />
                </button>
                <button
                  className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (displayPhone !== "N/A") {
                      const whatsappPhone = displayPhone.replace(/\D/g, "");
                      window.open(`https://wa.me/${whatsappPhone}`, "_blank");
                    }
                  }}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-gray-800" />
                </button>
                <button
                  className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLinkedinClick(lead);
                  }}
                >
                  <Send className="w-3.5 h-3.5 text-gray-800" />
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLead(lead._id);
                }}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-full px-12 py-1.5 flex items-center gap-3 transition-colors"
              >
                View Details
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </Card>
        );
          })}
          {/* Pagination at Bottom */}
          {totalPages > 1 && renderPagination()}
        </>
      )}
    </div>
  );
};

export default LeadsList;
