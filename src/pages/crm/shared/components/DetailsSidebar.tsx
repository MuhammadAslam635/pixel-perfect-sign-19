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
  executiveFallback,
}) => (
  <div
    className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out sticky top-6 ${
      isOpen
        ? "w-full sm:w-[320px] md:w-[350px] lg:w-[400px] opacity-100"
        : "w-0 opacity-0 pointer-events-none"
    }`}
  >
    <Card
      className={`bg-[#222B2C] border-[#3A3A3A] p-3 sm:p-4 md:p-5 h-[calc(100vh-380px)] sm:h-[calc(100vh-360px)] lg:h-[calc(100vh-340px)] min-h-[350px] sm:min-h-[400px] md:min-h-[500px] max-h-[800px] overflow-y-auto scrollbar-hide transition-all duration-300 ease-in-out ${
        isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
      }`}
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
