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
  syncedLeadIds?: Set<string>;
  onLeadSynced?: (leadId: string) => void;
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
  syncedLeadIds,
  onLeadSynced,
}) => (
  <div
    className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out sticky top-6 ${
      isOpen
        ? "w-full sm:w-[320px] md:w-[350px] lg:w-[400px] opacity-100"
        : "w-0 opacity-0 pointer-events-none"
    }`}
  >
    <Card
      className={`bg-[#222B2C] border-[#3A3A3A] p-3 sm:p-4 md:p-5 h-[calc(100vh-380px)] sm:h-[calc(100vh-360px)] lg:h-[calc(100vh-340px)] min-h-[350px] sm:min-h-[400px] md:min-h-[500px] max-h-[800px] overflow-y-auto transition-all duration-300 ease-in-out ${
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
          syncedLeadIds={syncedLeadIds}
          onLeadSynced={onLeadSynced}
        />
      )}
    </Card>
  </div>
);

export default DetailsSidebar;
