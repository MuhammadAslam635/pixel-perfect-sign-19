import { FC } from "react";
import { Card } from "@/components/ui/card";
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
};

const DetailsSidebar: FC<DetailsSidebarProps> = ({
  activeTab,
  isOpen,
  selectedCompany,
  selectedLead,
  onSwitchToLeads,
  onExecutiveSelect,
}) => (
  <div
    className={`
      hidden lg:block
      fixed
      z-30
      top-[280px] lg:top-[290px] xl:top-[300px] 2xl:top-[310px]
      right-8 lg:right-12 xl:right-14 2xl:right-16 fhd:right-40 uhd:right-56
      transition-all
      duration-300
      ease-in-out
      ${
        isOpen
          ? "opacity-100 translate-x-0 pointer-events-auto"
          : "opacity-0 translate-x-full pointer-events-none"
      }
    `}
  >
    <Card
      className="
        w-[280px] lg:w-[320px] xl:w-[360px] 2xl:w-[400px]
        max-h-[calc(100vh-320px)] lg:max-h-[calc(100vh-340px)] xl:max-h-[calc(100vh-360px)] 2xl:max-h-[calc(100vh-380px)]
        bg-[#222B2C]/95
        backdrop-blur-sm
        border-[#3A3A3A]
        border
        p-4 lg:p-5 xl:p-6
        overflow-y-auto
        scrollbar-hide
        shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        rounded-2xl
      "
    >
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
