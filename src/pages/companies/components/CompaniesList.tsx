import { FC } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Linkedin } from "lucide-react";
import { Company } from "@/services/companies.service";

type CompaniesListProps = {
  companies: Company[];
  loading: boolean;
  selectedCompanyId: string | null;
  onSelectCompany: (companyId: string) => void;
};

const CompaniesList: FC<CompaniesListProps> = ({
  companies,
  loading,
  selectedCompanyId,
  onSelectCompany,
}) => {
  if (loading) {
    return (
      <div className="text-center text-white/70 py-8">Loading companies...</div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="text-center text-white/70 py-8">No companies found</div>
    );
  }

  return (
    <>
      {companies.map((company) => {
        const isActive = selectedCompanyId === company._id;
        const employeeCount = company.employees
          ? `${company.employees} employees`
          : "N/A";
        const primaryExecutive = company.people?.[0];
        const primaryEmail =
          primaryExecutive?.email || primaryExecutive?.emails?.[0] || null;
        const companyLinkedIn =
          primaryExecutive?.linkedin || company.website || null;

        return (
          <Card
            key={company._id}
            onClick={() => onSelectCompany(company._id)}
            className={`relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between overflow-hidden bg-gradient-to-r from-[#13363b] via-[#1f4c55] to-[#16383f] border ${
              isActive ? "border-primary/60" : "border-[#274a4f]"
            } rounded-[30px] px-7 py-6 cursor-pointer transition-all duration-300 hover:shadow-[0_20px_45px_rgba(0,0,0,0.32)] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[55%] before:w-[5px] before:rounded-full ${
              isActive ? "before:bg-primary" : "before:bg-white/75"
            }`}
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 text-white/90">
                <h3 className="text-xl font-semibold text-white">
                  {company.name}
                </h3>
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
      })}
    </>
  );
};

export default CompaniesList;
