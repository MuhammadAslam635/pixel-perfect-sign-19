import { FC } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Company, CompanyPerson } from "@/services/companies.service";
import { Lead } from "@/services/leads.service";
import CompanyExecutivesPanel from "../../companies/components/CompanyExecutivesPanel";

type DetailsSidebarProps = {
  activeTab: "companies" | "leads";
  isOpen: boolean;
  selectedCompany?: Company;
  selectedLead?: Lead;
  onSwitchToLeads?: () => void;
  onExecutiveSelect?: (executive: CompanyPerson) => void;
  executiveFallback?: CompanyPerson | null;
  onClose?: () => void;
};

const DetailsSidebar: FC<DetailsSidebarProps> = ({
  activeTab,
  isOpen,
  selectedCompany,
  selectedLead,
  onSwitchToLeads,
  onExecutiveSelect,
  onClose,
}) => (
  <div
    className={`
      hidden lg:block
      flex-shrink-0
      transition-all
      duration-300
      ease-in-out
      ${
        isOpen
          ? "opacity-100 translate-x-0 pointer-events-auto w-[280px] lg:w-[320px] xl:w-[360px] 2xl:w-[400px]"
          : "opacity-0 translate-x-full pointer-events-none w-0"
      }
    `}
  >
    <Card
      className="
        w-full
        h-fit
        min-h-[calc(100vh-320px)] lg:min-h-[calc(100vh-340px)] xl:min-h-[calc(100vh-320px)] 2xl:min-h-[calc(100vh-330px)]
        bg-[#222B2C]/95
        backdrop-blur-sm
        border-[#3A3A3A]
        border
        p-4 lg:p-5 xl:p-6
        overflow-y-auto
        scrollbar-hide
        shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        rounded-2xl
        relative
        sticky
        top-[280px] lg:top-[290px] xl:top-[300px] 2xl:top-[310px]
      "
    >
      {/* Close Button */}
      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2 h-7 w-7 p-0  hover:bg-white/10 text-neutral-500 hover:text-neutral-400 rounded-full flex items-center justify-center z-10"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      {activeTab === "companies" ? (
        <CompanyExecutivesPanel
          company={selectedCompany}
          onViewAllLeads={onSwitchToLeads || (() => {})}
          onExecutiveSelect={onExecutiveSelect}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-center p-6">
          <div>
            <p className="text-white/60 text-sm mb-2">Lead Details</p>
            <p className="text-white/40 text-xs">
              Lead details panel has been removed.
            </p>
          </div>
        </div>
      )}
    </Card>
  </div>
);

export default DetailsSidebar;
