import { FC, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Info, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Company, CompanyPerson, companiesService } from "@/services/companies.service";
import { usePermissions } from "@/hooks/usePermissions";
import CompanyExecutivesTab from "./CompanyExecutivesTab";
import CompanyDetailsTab from "./CompanyDetailsTab";

type CompanyExecutivesPanelProps = {
  company?: Company;
  onViewAllLeads: () => void;
  onExecutiveSelect?: (executive: CompanyPerson) => void;
};

type TabType = "executives" | "details";

const CompanyExecutivesPanel: FC<CompanyExecutivesPanelProps> = ({ company, onViewAllLeads, onExecutiveSelect }) => {
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [showLeads, setShowLeads] = useState(false);
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [shouldPoll, setShouldPoll] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const previousCompanyId = useRef<string | undefined>(undefined);
  const { canView } = usePermissions();
  const hasLeadsPermission = canView("leads");
  useEffect(() => {
    const currentCompanyId = company?._id;
    if (currentCompanyId && currentCompanyId !== previousCompanyId.current) {
      setActiveTab("details");
      setShowLeads(false);
      setIsDescriptionExpanded(false);
      previousCompanyId.current = currentCompanyId;
    }
  }, [company?._id]);

  const { data: latestCompany, isLoading } = useQuery({
    queryKey: ["company", company?._id],
    queryFn: () => (company?._id ? companiesService.getCompanyById(company._id) : null),
    enabled: !!company?._id,
    refetchInterval: shouldPoll ? 5000 : false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  const displayCompany = latestCompany || company;

  useEffect(() => {
    const isGenerating = displayCompany?.leadsGenerationStatus === 'in_progress' || displayCompany?.leadsGenerationStatus === 'pending';
    setShouldPoll(isGenerating);
  }, [displayCompany?.leadsGenerationStatus]);

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <motion.button
          onClick={() => {
            setActiveTab("details");
            setShowLeads(false);
            if (activeTab !== "details") {
              setShowLoadingSkeleton(true);
              setMapLoaded(false);
              setTimeout(() => setShowLoadingSkeleton(false), 500);
              setTimeout(() => setMapLoaded(true), 3000);
            }
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === "details" ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
          <motion.div
            animate={{
              rotate: activeTab === "details" ? [0, -10, 10, 0] : 0,
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Info className="w-4 h-4" />
          </motion.div>
          <span className="text-sm font-medium">Company Details</span>
        </motion.button>
        {hasLeadsPermission && (
          <motion.button
            onClick={() => {
              setActiveTab("executives");
              setShowLeads(true);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === "executives" ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
          >
            <motion.div
              animate={{
                rotate: activeTab === "executives" ? [0, -10, 10, 0] : 0,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Users className="w-4 h-4" />
            </motion.div>
            <span className="text-sm font-medium">
              Executives {displayCompany?.people?.length ? `(${displayCompany.people.length})` : ""}
            </span>
          </motion.button>
        )}
      </div>

      {/* Tab Content */}
      <div className="relative">
        {/* Company Executives Tab Content */}
        {activeTab === "executives" && (
          <CompanyExecutivesTab
            displayCompany={displayCompany}
            showLeads={showLeads}
            onExecutiveSelect={onExecutiveSelect}
          />
        )}

        {/* Company Details Tab Content */}
        {activeTab === "details" && (
          <CompanyDetailsTab
            displayCompany={displayCompany}
            isDescriptionExpanded={isDescriptionExpanded}
            setIsDescriptionExpanded={setIsDescriptionExpanded}
          />
        )}
      </div>
    </>
  );
};

export default CompanyExecutivesPanel;