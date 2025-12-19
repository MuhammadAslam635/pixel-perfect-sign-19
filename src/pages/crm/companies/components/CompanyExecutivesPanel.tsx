import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Users, Linkedin } from "lucide-react";
import { Company, CompanyPerson } from "@/services/companies.service";

type CompanyExecutivesPanelProps = {
  company?: Company;
  onViewAllLeads: () => void;
  onExecutiveSelect?: (executive: CompanyPerson) => void;
};

const CompanyExecutivesPanel: FC<CompanyExecutivesPanelProps> = ({
  company,
  onViewAllLeads,
  onExecutiveSelect,
}) => {
  // Get company LinkedIn URL (from company data or first executive)
  const companyLinkedIn =
    company?.people?.[0]?.linkedin ||
    (company?.website?.includes("linkedin.com") ? company.website : null);

  const hasLinkedIn = Boolean(companyLinkedIn);

  return (
    <>
      {/* Company Header with LinkedIn */}
      {company && (
        <div className="mb-4 pb-3 border-b border-white/10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white mb-1 truncate">
                {company.name}
              </h2>
              <p className="text-xs text-white/60 line-clamp-2">
                {company.description ||
                  company.about ||
                  "No description available"}
              </p>
            </div>
            {hasLinkedIn && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A66C2] text-white text-xs font-medium flex-shrink-0">
                <Linkedin className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">LinkedIn</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="hidden sm:flex sm:items-center sm:justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="p-2 sm:p-3 md:p-4 mr-1 sm:mr-2 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-medium text-foreground">
            Executives
          </h3>
        </div>
      </div>

      <>
        {company ? (
          company.people && company.people.length > 0 ? (
            company.people.map((exec, index) => {
              const hasLinkedin = Boolean(exec.linkedin);

              return (
                <div
                  key={exec._id || exec.id || index}
                  role="button"
                  tabIndex={0}
                  onClick={() => onExecutiveSelect?.(exec)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onExecutiveSelect?.(exec);
                    }
                  }}
                  className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/15 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] px-2 sm:px-3 py-2 mb-2 max-w-sm h-14 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] sm:before:absolute sm:before:content-[''] sm:before:left-0 sm:before:top-1/2 sm:before:-translate-y-1/2 sm:before:h-[55%] sm:before:w-[3px] lg:before:w-[4px] sm:before:rounded-full sm:before:bg-white/70 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60"
                >
                  <div className="flex items-center justify-between gap-2 h-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white mb-0.5 truncate">
                        {exec.name || "N/A"}
                      </p>
                      <p className="text-[10px] text-white/60 line-clamp-2">
                        {exec.title || exec.position || "N/A"}
                        {exec.email && (
                          <>
                            <span className="inline"> | </span>
                            <span className="truncate">{exec.email}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        disabled={!hasLinkedin}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border border-white/15 transition-colors ${
                          hasLinkedin
                            ? "bg-white/15 text-white hover:bg-white/25"
                            : "bg-white/10 text-white/40 cursor-not-allowed"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!hasLinkedin) return;
                          window.open(
                            exec.linkedin!.startsWith("http")
                              ? exec.linkedin
                              : `https://${exec.linkedin}`,
                            "_blank"
                          );
                        }}
                      >
                        <Linkedin
                          className={`h-3 w-3 ${
                            hasLinkedin ? "text-white" : "text-white/50"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground/60">
              No executives found for this company.
            </p>
          )
        ) : (
          <p className="text-sm text-muted-foreground/60">
            Select a company to view its executives.
          </p>
        )}
      </>
    </>
  );
};

export default CompanyExecutivesPanel;
