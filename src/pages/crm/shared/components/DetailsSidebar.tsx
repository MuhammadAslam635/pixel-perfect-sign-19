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
      z-40
      top-[120px]           /* adjust if your header is taller/shorter */
      right-4 xl:right-8 2xl:right-16
      transition-all
      duration-300
      ease-in-out
      ${isOpen ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-4 pointer-events-none"}
    `}
  >
    <Card
      className="
        w-[320px] xl:w-[360px] 2xl:w-[380px]
        bg-[#222B2C]
        border-[#3A3A3A]
        p-3 sm:p-4 md:p-5
        max-h-[calc(100vh-140px)]
        overflow-y-auto
        scrollbar-hide
      "
    >
      {activeTab === "companies" ? (
        <CompanyExecutivesPanel
          company={selectedCompany}
          onViewAllLeads={onSwitchToLeads || (() => { })}
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
