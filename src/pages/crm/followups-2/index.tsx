import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import FollowUpTemplates from "./components/FollowUpTemplates";
import ActiveFollowUpPlans from "./components/ActiveFollowUpPlans";

const FollowUp2Page = () => {
  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white min-h-screen overflow-x-hidden"
      >
        {/* Wrapper with space-between */}
        <div className="flex items-center justify-between mb-4">
          {/* Page Header with CRM Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          >
            <CrmNavigation />
          </motion.div>
        </div>

        <FollowUpTemplates />

        <ActiveFollowUpPlans />
      </motion.main>
    </DashboardLayout>
  );
};

export default FollowUp2Page;
