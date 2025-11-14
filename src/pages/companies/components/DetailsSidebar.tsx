import { FC } from "react";
import { Card } from "@/components/ui/card";
import { Company, CompanyPerson } from "@/services/companies.service";
import { Lead } from "@/services/leads.service";
import CompanyExecutivesPanel from "./CompanyExecutivesPanel";
import LeadDetailsPanel from "./LeadDetailsPanel";

type DetailsSidebarProps = {
  activeTab: "companies" | "leads";
  isOpen: boolean;
  selectedCompany?: Company;
  selectedLead?: Lead;
  onSwitchToLeads: () => void;
  onEmailLead: (lead: Lead) => void;
  onExecutiveSelect?: (executive: CompanyPerson) => void;
  executiveFallback?: CompanyPerson | null;
  onPhoneLead?: (lead?: Lead, fallback?: CompanyPerson | null) => void;
};

const DetailsSidebar: FC<DetailsSidebarProps> = ({
  activeTab,
  isOpen,
  selectedCompany,
  selectedLead,
  onSwitchToLeads,
  onEmailLead,
  onExecutiveSelect,
  executiveFallback,
  onPhoneLead,
}) => (
  <div
    className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out sticky top-6 ${
      isOpen ? "w-[400px] opacity-100" : "w-0 opacity-0 pointer-events-none"
    }`}
  >
    <Card
      className={`bg-[#222B2C] border-[#3A3A3A] p-5 min-h-[400px] lg:min-h-[600px] max-h-[calc(100vh-260px)] overflow-y-auto transition-all duration-300 ease-in-out ${
        isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
      }`}
    >
      {activeTab === "companies" ? (
        <CompanyExecutivesPanel
          company={selectedCompany}
          onViewAllLeads={onSwitchToLeads}
          onExecutiveSelect={onExecutiveSelect}
        />
      ) : (
        <LeadDetailsPanel
          lead={selectedLead}
          onEmailClick={onEmailLead}
          fallbackExecutive={executiveFallback}
          onPhoneClick={onPhoneLead}
        />
      )}
    </Card>
  </div>
);

export default DetailsSidebar;
