import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Users, Linkedin, ArrowRight } from "lucide-react";
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
  return (
    <>
      <div className="hidden sm:flex sm:items-center sm:justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 sm:p-3 md:p-4 mr-1 sm:mr-2 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-sm sm:text-base font-medium text-foreground">
            Executives
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="link"
            className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80"
            onClick={onViewAllLeads}
          >
            <span className="hidden sm:inline">View All</span>
            <span className="sm:hidden">All</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
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
                  className="relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/15 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] px-3 sm:px-4 py-2.5 sm:py-3 mb-2 sm:mb-3 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] sm:before:absolute sm:before:content-[''] sm:before:left-0 sm:before:top-1/2 sm:before:-translate-y-1/2 sm:before:h-[55%] sm:before:w-[3px] lg:before:w-[4px] sm:before:rounded-full sm:before:bg-white/70 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/60"
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-white mb-0.5 truncate">
                        {exec.name || "N/A"}
                      </p>
                      <p className="text-xs text-white/60 mb-1 sm:mb-2 line-clamp-2">
                        {exec.title || exec.position || "N/A"}
                        {exec.email && (
                          <>
                            <span className="hidden sm:inline"> | </span>
                            <span className="block sm:inline truncate">
                              {exec.email}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        disabled={!hasLinkedin}
                        className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/15 transition-colors ${
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
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
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
