import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Users, Linkedin, ArrowRight } from "lucide-react";
import { Company } from "@/services/companies.service";

type CompanyExecutivesPanelProps = {
  company?: Company;
  onViewAllLeads: () => void;
};

const CompanyExecutivesPanel: FC<CompanyExecutivesPanelProps> = ({
  company,
  onViewAllLeads,
}) => (
  <>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="p-4 mr-2 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
        <h3 className="text-base font-medium text-foreground">Executives</h3>
      </div>
      <Button
        variant="link"
        className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80"
        onClick={onViewAllLeads}
      >
        View All <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </div>

    <div className="space-y-3">
      {company ? (
        company.people && company.people.length > 0 ? (
          company.people.map((exec, index) => (
            <div
              key={exec._id || exec.id || index}
              className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] px-4 py-3 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[55%] before:w-[4px] before:rounded-full before:bg-white/70"
            >
              <p className="text-sm font-semibold text-white mb-0.5">
                {exec.name || "N/A"}
              </p>
              <p className="text-xs text-white/60 mb-2">
                {exec.title || exec.position || "N/A"}
                {exec.email && ` | ${exec.email}`}
              </p>
              <div className="flex justify-end">
                {exec.linkedin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/70"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        exec.linkedin.startsWith("http")
                          ? exec.linkedin
                          : `https://${exec.linkedin}`,
                        "_blank"
                      );
                    }}
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))
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
    </div>
  </>
);

export default CompanyExecutivesPanel;
