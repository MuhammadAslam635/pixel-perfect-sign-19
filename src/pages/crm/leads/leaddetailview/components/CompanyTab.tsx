import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lead, leadsService } from "@/services/leads.service";
import {
  Building2,
  MapPin,
  Globe,
  Users,
  Briefcase,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Linkedin,
  Facebook,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AvatarFallback } from "@/components/ui/avatar-fallback";
import { CompanyLogoFallback } from "@/components/ui/company-logo-fallback";
import { companiesService } from "@/services/companies.service";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CompanyTabProps = {
  lead?: Lead;
};

const CompanyTab: FC<CompanyTabProps> = ({ lead }) => {
  const navigate = useNavigate();
  const company = lead?.company;
  const companyName = lead?.companyName || company?.name;
  const companyLocation = lead?.companyLocation || company?.address;
  const companyId = lead?.companyId;

  // Fetch leads from the same company
  const {
    data: companyLeadsResponse,
    isLoading: isLoadingLeads,
    error: leadsError,
  } = useQuery({
    queryKey: ["company-leads", companyId, companyName],
    queryFn: () => {
      if (!companyId) throw new Error("Company ID is required");
      return leadsService.getLeads({
        companyId: companyId,
        limit: 100, // Get all leads from this company
        sortBy: "name",
        sortOrder: "asc",
      });
    },
    enabled: !!companyId,
  });

  // Filter leads by exact company name since multiple companies can share the same companyId
  const allLeads = companyLeadsResponse?.data || [];
  const companyLeads = companyName
    ? allLeads.filter((l) => l.companyName === companyName)
    : allLeads;

  // Fetch full company details
  const { data: fullCompany } = useQuery({
    queryKey: ["company-details", companyId],
    queryFn: () => (companyId ? companiesService.getCompanyById(companyId) : null),
    enabled: !!companyId,
  });

  const displayCompany = fullCompany || company;

  // Helper function to format large financial numbers
  const formatFinancialValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return value.toString();

    // If it's already a formatted string like "39.0B", just return it
    if (typeof value === "string" && /[KMBT]$/i.test(value)) return value;

    if (num >= 1e12) return (num / 1e12).toFixed(1) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toString();
  };

  // Helper function to get revenue with fallback
  const getRevenue = () => {
    const dc = displayCompany as any;
    if (dc?.revenue) return dc.revenue;
    if (dc?.organization_revenue_printed)
      return dc.organization_revenue_printed;
    if (dc?.organization_revenue) return dc.organization_revenue;
    return null;
  };

  const revenue = getRevenue();
  const dc = displayCompany as any;
  const marketCap = dc?.marketcap;
  const foundedYear = dc?.foundedYear;
  const companyPhone = dc?.phone;

  // Social Links
  const linkedinUrl = dc?.linkedinUrl || dc?.linkedin_url;
  const facebookUrl = dc?.facebook;

  const getFullUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  };

  if (!companyName && !company) {
    return (
      <div className="flex flex-col">
        <h2 className="text-xs sm:text-sm font-semibold text-white mb-4">
          Company
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="w-12 h-12 text-white/30 mb-4" />
          <p className="text-xs text-white/60">
            No company information available for this lead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      {/* Company Header */}
      <div className="flex items-start gap-4 mb-2">
        <div className="flex flex-col gap-2">
          <CompanyLogoFallback
            name={companyName || ""}
            logo={company?.logo}
            size="md"
            className="rounded-xl border border-white/10 shadow-sm"
          />
          
          {(linkedinUrl || facebookUrl) && (
            <div className="flex items-center gap-2 px-0.5">
              {linkedinUrl && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={getFullUrl(linkedinUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-white text-gray-900 transition-colors hover:bg-white/90 shadow-sm"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Company LinkedIn</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {facebookUrl && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={getFullUrl(facebookUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-white text-gray-900 transition-colors hover:bg-white/90 shadow-sm"
                    >
                      <Facebook className="w-3.5 h-3.5" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Company Facebook</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 py-1">
          <h2 className="text-base font-bold text-white mb-1 truncate">
            {companyName}
          </h2>
          <div className="flex flex-col gap-1.5 min-w-0">
            {company?.industry && (
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                {/* <Briefcase className="w-3.5 h-3.5 flex-shrink-0" /> */}
                <span className="truncate">{company.industry}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="space-y-1.5">
        {company?.website && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <Globe className="w-3 h-3 text-white/60 flex-shrink-0" />
                  <p className="text-[10px] text-white truncate">{company.website}</p>
                </div>
                <a
                  href={
                    company.website.startsWith("http")
                      ? company.website
                      : `https://${company.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors ml-2 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  Visit <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{company.website}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {companyPhone && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                <Phone className="w-3 h-3 text-white/60 flex-shrink-0" />
                <a
                  href={`tel:${companyPhone}`}
                  className="text-[10px] text-white truncate hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {companyPhone}
                </a>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Phone: {companyPhone}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {company?.employees && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                <Users className="w-3 h-3 text-white/60 flex-shrink-0" />
                <p className="text-[10px] text-white truncate">
                  {company.employees > 1000
                    ? `${Math.floor(company.employees / 1000)}K+ employees`
                    : `${company.employees} employees`}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Company Size: {company.employees} employees</p>
            </TooltipContent>
          </Tooltip>
        )}

        {companyLocation && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                <MapPin className="w-3 h-3 text-white/60 flex-shrink-0" />
                <p className="text-[10px] text-white truncate">{companyLocation}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{companyLocation}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {revenue && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                <DollarSign className="w-3 h-3 text-white/60 flex-shrink-0" />
                <p className="text-[10px] text-white truncate">
                  Revenue: ${formatFinancialValue(revenue)}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Annual Revenue: ${formatFinancialValue(revenue)}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {marketCap && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                <TrendingUp className="w-3 h-3 text-white/60 flex-shrink-0" />
                <p className="text-[10px] text-white truncate">
                  Market Cap: ${formatFinancialValue(marketCap)}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Market Capitalization: ${formatFinancialValue(marketCap)}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {foundedYear && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                <Calendar className="w-3 h-3 text-white/60 flex-shrink-0" />
                <p className="text-[10px] text-white truncate">
                  Founded: {foundedYear}
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Founded: {foundedYear}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Lead's Position in Company */}
        {/* {lead?.position && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1a1a1a] border border-white/10 hover:bg-white/20 transition-colors">
                <Briefcase className="w-3 h-3 text-white/60 flex-shrink-0" />
                <p className="text-[10px] text-white truncate">{lead.position}</p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Position: {lead.position}</p>
            </TooltipContent>
          </Tooltip>
        )} */}
      </div>

      {/* Company Leads Section */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-sm font-semibold text-white mb-4">
          People at {companyName} ({companyLeadsResponse?.pagination?.totalDocs || companyLeads.length})
        </h3>

        {isLoadingLeads ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
          </div>
        ) : leadsError ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-red-400">Failed to load company leads</p>
          </div>
        ) : companyLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="w-12 h-12 text-white/30 mb-4" />
            <p className="text-xs text-white/60">
              No other leads found for this company.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {companyLeads.map((companyLead) => {
              const isCurrentLead = companyLead._id === lead?._id;
              return (
                <div
                  key={companyLead._id}
                  onClick={() => {
                    if (!isCurrentLead) {
                      navigate(`/leads/${companyLead._id}`);
                    }
                  }}
                  className={`p-2 rounded-lg border transition-all ${
                    isCurrentLead
                      ? "bg-gradient-to-r from-[#67B0B7]/20 to-[#4066B3]/20 border-[#67B0B7]/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AvatarFallback
                      name={companyLead.name}
                      pictureUrl={companyLead.pictureUrl}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-white truncate">
                          {companyLead.name}
                        </p>
                        {isCurrentLead && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#67B0B7]/30 text-[#67B0B7] border border-[#67B0B7]/50 flex-shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      {companyLead.position && (
                        <p className="text-[10px] text-white/50 truncate mb-1.5">
                          {companyLead.position}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        {companyLead.email && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-help border border-white/5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Mail className="w-3 h-3" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Email: {companyLead.email}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        
                        {companyLead.phone && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a 
                                href={`tel:${companyLead.phone}`}
                                className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Phone: {companyLead.phone}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {companyLead.linkedinUrl && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={companyLead.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/5"
                              >
                                <Linkedin className="w-3 h-3" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>LinkedIn Profile</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyTab;
