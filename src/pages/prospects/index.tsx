import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageSquare, Activity } from "lucide-react";
import ClientsTable from "./components/ClientsTable";
import CustomerSupportQueriesTable from "./components/CustomerSupportQueriesTable";

const ProspectsPage = () => {
  const [activeTab, setActiveTab] = useState("sessions");

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative mt-10 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 md:py-10 lg:py-12 xl:py-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white min-h-0 overflow-y-auto scrollbar-hide"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="max-w-[1600px] mx-auto w-full min-h-0"
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-5"
            >
              {/* Empty filters bar for now - can be added later if needed */}
            </motion.div>

            <div className="flex flex-col lg:flex-row items-start gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {/* Main Content Area */}
              <motion.div
                className="relative pt-3 sm:pt-4 py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              >
                <motion.div
                  className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.8 }}
                >
                  <div className="flex-1">
                    <motion.h1
                      className="text-3xl font-bold text-white"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 1.0 }}
                    >
                      Customer Support
                    </motion.h1>
                    <motion.p
                      className="text-gray-400 mt-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 1.2 }}
                    >
                      View and manage your customer support sessions and queries
                    </motion.p>
                  </div>

                  {/* Inline Tab Buttons */}
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 1.4 }}
                  >
                    <TabsList className="flex items-center gap-1 bg-transparent border-0 p-0">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TabsTrigger
                          value="sessions"
                          className="flex justify-center whitespace-nowrap gap-1.5 py-2 px-4 rounded-lg text-xs text-gray-300 font-medium
                                  data-[state=active]:text-white
                                  data-[state=active]:bg-white/10
                                  data-[state=active]:shadow-[0px_3.43px_3.43px_0px_#FFFFFF29_inset,0px_-3.43px_3.43px_0px_#FFFFFF29_inset]
                                  transition-all duration-300 hover:bg-white/5"
                        >
                          <Activity size={14} />
                          <span>Sessions</span>
                        </TabsTrigger>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TabsTrigger
                          value="queries"
                          className="flex justify-center whitespace-nowrap gap-1.5 py-2 px-4 rounded-lg text-xs text-gray-300 font-medium
                                  data-[state=active]:text-white
                                  data-[state=active]:bg-white/10
                                  data-[state=active]:shadow-[0px_3.43px_3.43px_0px_#FFFFFF29_inset,0px_-3.43px_3.43px_0px_#FFFFFF29_inset]
                                  transition-all duration-300 hover:bg-white/5"
                        >
                          <MessageSquare size={14} />
                          <span>Queries</span>
                        </TabsTrigger>
                      </motion.div>
                    </TabsList>
                  </motion.div>
                </motion.div>

                {/* Tab Content Area */}
                <div className="flex-1 min-h-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{
                        duration: 0.4,
                        ease: "easeInOut",
                      }}
                      className="h-full"
                    >
                      {activeTab === "sessions" && (
                        <TabsContent value="sessions" className="mt-0 h-full">
                          <motion.div
                            className="h-full overflow-y-auto"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                          >
                            <ClientsTable viewType="sessions" />
                          </motion.div>
                        </TabsContent>
                      )}

                      {activeTab === "queries" && (
                        <TabsContent value="queries" className="mt-0 h-full">
                          <motion.div
                            className="h-full overflow-y-auto"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                          >
                            <CustomerSupportQueriesTable />
                          </motion.div>
                        </TabsContent>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </Tabs>
        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default ProspectsPage;
