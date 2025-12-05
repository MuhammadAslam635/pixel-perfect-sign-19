import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowUpTemplates from "./components/FollowUpTemplates";
import ActiveFollowUpPlans from "./components/ActiveFollowUpPlans";

const FollowUp2Page = () => {
  const [activeTab, setActiveTab] = useState("templates");

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
          className="rounded-xl sm:rounded-[30px] border border-white/10 bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] p-6"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 p-1 rounded-lg mb-6">
              <TabsTrigger
                value="templates"
                className="rounded-md text-white/70 data-[state=active]:bg-[#5B9FA5] data-[state=active]:text-white transition-all"
              >
                Follow-up Templates
              </TabsTrigger>
              <TabsTrigger
                value="plans"
                className="rounded-md text-white/70 data-[state=active]:bg-[#5B9FA5] data-[state=active]:text-white transition-all"
              >
                Active Followup Plans
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-0">
              <FollowUpTemplates />
            </TabsContent>

            <TabsContent value="plans" className="mt-0">
              <ActiveFollowUpPlans />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default FollowUp2Page;
