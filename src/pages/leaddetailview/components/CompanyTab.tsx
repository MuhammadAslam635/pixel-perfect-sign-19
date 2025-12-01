import { FC } from "react";
import { Lead } from "@/services/leads.service";
import {
  Building2,
  MapPin,
  Globe,
  Users,
  Briefcase,
  ExternalLink,
} from "lucide-react";

type CompanyTabProps = {
  lead?: Lead;
};

const CompanyTab: FC<CompanyTabProps> = ({ lead }) => {
  const company = lead?.company;
  const companyName = lead?.companyName || company?.name;
  const companyLocation = lead?.companyLocation || company?.address;

  if (!companyName && !company) {
    return (
      <div className="flex flex-col">
        <h2 className="text-xl font-bold text-white mb-4">Company</h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="w-12 h-12 text-white/30 mb-4" />
          <p className="text-sm text-white/60">
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
          <h2 className="text-xl font-bold text-white mb-2">{companyName}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
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
                <p className="text-sm font-medium text-white">Website</p>
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
              className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Visit <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {company?.employees && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <Users className="w-5 h-5 text-white/60" />
            <div>
              <p className="text-sm font-medium text-white">Company Size</p>
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
              <p className="text-sm font-medium text-white">Address</p>
              <p className="text-xs text-white/60">{company.address}</p>
            </div>
          </div>
        )}

        {/* Lead's Position in Company */}
        {lead?.position && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <Briefcase className="w-5 h-5 text-white/60" />
            <div>
              <p className="text-sm font-medium text-white">Position</p>
              <p className="text-xs text-white/60">{lead.position}</p>
            </div>
          </div>
        )}
      </div> 
    </div>
  );
};

export default CompanyTab;
