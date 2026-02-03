import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CompanyExecutivesPanel from "./CompanyExecutivesPanel";
import { Company } from "@/services/companies.service";

type Props = {
    company: Company;
    onBack: () => void;
    onViewAllLeads?: () => void;
    onExecutiveSelect?: (executive: unknown) => void;
};

const MobileExecutivesView = ({
    company,
    onBack,
    onViewAllLeads,
    onExecutiveSelect,
}: Props) => {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                className="flex flex-col md:hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.35 }}
            >
                <div className="hidden sm:flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <h3 className="text-base font-semibold text-white">
                        {company.name} – Executives
                    </h3>
                </div>

                <Card className="bg-transparent border-transparent sm:bg-[#1f3032] sm:border-[#3A3A3A] p-3 sm:p-4">
                    <CompanyExecutivesPanel
                        company={company}
                        onViewAllLeads={onViewAllLeads || (() => { })}
                        onExecutiveSelect={onExecutiveSelect}
                    />
                </Card>
            </motion.div>
        </AnimatePresence>
    );
};

export default MobileExecutivesView;
