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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    <div className="flex flex-col space-y-6">
      {/* Company Header */}
      <div className="flex items-start gap-4">
        {company?.logo && (
          <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <img
              src={company.logo}
              alt={`${companyName} logo`}
              className="w-12 h-12 object-contain rounded"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xs sm:text-sm font-semibold text-white mb-2">
            {companyName}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
            {companyLocation && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{companyLocation}</span>
              </div>
            )}
            {company?.industry && (
              <div className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                <span>{company.industry}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="space-y-4">
        {company?.website && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-white/60" />
              <div>
                <p className="text-xs font-medium text-white">Website</p>
                <p className="text-xs text-white/60">{company.website}</p>
              </div>
            </div>
            <a
              href={
                company.website.startsWith("http")
                  ? company.website
                  : `https://${company.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Visit <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {company?.employees && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <Users className="w-5 h-5 text-white/60" />
            <div>
              <p className="text-xs font-medium text-white">Company Size</p>
              <p className="text-xs text-white/60">
                {company.employees > 1000
                  ? `${Math.floor(company.employees / 1000)}K+ employees`
                  : `${company.employees} employees`}
              </p>
            </div>
          </div>
        )}

        {company?.address && companyLocation !== company.address && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <MapPin className="w-5 h-5 text-white/60" />
            <div>
              <p className="text-xs font-medium text-white">Address</p>
              <p className="text-xs text-white/60">{company.address}</p>
            </div>
          </div>
        )}

        {/* Lead's Position in Company */}
        {lead?.position && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <Briefcase className="w-5 h-5 text-white/60" />
            <div>
              <p className="text-xs font-medium text-white">Position</p>
              <p className="text-xs text-white/60">{lead.position}</p>
            </div>
          </div>
        )}
      </div>

      {/* Company Leads Section */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-sm font-semibold text-white mb-4">
          People at {companyName}
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
                  className={`p-3 rounded-lg border transition-all ${
                    isCurrentLead
                      ? "bg-gradient-to-r from-[#67B0B7]/20 to-[#4066B3]/20 border-[#67B0B7]/40"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {companyLead.pictureUrl ? (
                      <img
                        src={companyLead.pictureUrl}
                        alt={companyLead.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-white/60" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-medium text-white truncate">
                          {companyLead.name}
                        </p>
                        {isCurrentLead && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#67B0B7]/30 text-[#67B0B7] border border-[#67B0B7]/50">
                            Current
                          </span>
                        )}
                      </div>
                      {companyLead.position && (
                        <p className="text-[10px] text-white/60 mb-2">
                          {companyLead.position}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        {companyLead.email && (
                          <div className="flex items-center gap-1 text-[10px] text-white/60">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">
                              {companyLead.email}
                            </span>
                          </div>
                        )}
                        {companyLead.phone && (
                          <div className="flex items-center gap-1 text-[10px] text-white/60">
                            <Phone className="w-3 h-3" />
                            <span>{companyLead.phone}</span>
                          </div>
                        )}
                        {companyLead.linkedinUrl && (
                          <a
                            href={companyLead.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300"
                          >
                            <Linkedin className="w-3 h-3" />
                            <span>LinkedIn</span>
                          </a>
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
