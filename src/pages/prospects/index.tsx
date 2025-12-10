import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageSquare, Activity } from "lucide-react";
import ClientsTable from "./components/ClientsTable";
import CustomerSupportQueriesTable from "./components/CustomerSupportQueriesTable";

// Enhanced animation variants with floating elements and sophisticated effects
const pageVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.95,
    filter: "blur(10px)",
    rotateX: 5
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    rotateX: 0,
    transition: {
      duration: 1.2,
      ease: [0.23, 1, 0.32, 1],
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const floatingElementsVariants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.1,
      delayChildren: 0.5
    }
  }
};

const containerVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.98,
    filter: "blur(5px)"
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const titleVariants = {
  hidden: {
    opacity: 0,
    x: -50,
    scale: 0.85,
    filter: "blur(5px)",
    rotateY: -15
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    rotateY: 0,
    transition: {
      duration: 1,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.1
    }
  }
};

const tabContainerVariants = {
  hidden: {
    opacity: 0,
    x: 40,
    scale: 0.9,
    filter: "blur(3px)",
    rotateY: 10
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    rotateY: 0,
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: 0.4,
      staggerChildren: 0.08
    }
  }
};

const tabContentVariants = {
  hidden: {
    opacity: 0,
    x: 60,
    scale: 0.92,
    filter: "blur(12px)",
    rotateX: 8
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    rotateX: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.12,
      delayChildren: 0.2
    }
  },
  exit: {
    opacity: 0,
    x: -60,
    scale: 0.92,
    filter: "blur(12px)",
    rotateX: -8,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};

const floatingOrbVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay: 1
    }
  },
  animate: {
    y: [0, -20, 0],
    scale: [1, 1.1, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const ProspectsPage = () => {
  const [activeTab, setActiveTab] = useState("sessions");

  return (
    <DashboardLayout>
      <motion.main
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="relative mt-10 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 md:py-10 lg:py-12 xl:py-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white min-h-0 overflow-y-auto scrollbar-hide"
      >
        <motion.div
          variants={containerVariants}
          className="max-w-[1600px] mx-auto w-full min-h-0"
        >
          {/* Floating Background Elements - positioned absolutely on the container */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <motion.div
              className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-2xl"
              variants={floatingOrbVariants}
              initial="hidden"
              animate="visible"
            />
            <motion.div
              className="absolute bottom-40 right-32 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/8 to-pink-500/8 blur-xl"
              variants={floatingOrbVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 1.2 }}
            />
            <motion.div
              className="absolute top-1/2 left-1/3 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500/6 to-orange-500/6 blur-lg"
              variants={floatingOrbVariants}
              initial="hidden"
              animate={["visible", "animate"]}
              transition={{ delay: 1.4 }}
            />
          </motion.div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full relative z-10"
          >
            <div className="flex flex-col lg:flex-row items-start gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              {/* Main Content Area */}
              <motion.div
                className="relative pt-3 sm:pt-4 py-4 sm:py-6 md:py-8 lg:py-10 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] overflow-hidden"
                initial={{
                  opacity: 0,
                  scale: 0.9,
                  y: 40,
                  filter: "blur(15px)",
                  rotateX: 10
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  filter: "blur(0px)",
                  rotateX: 0
                }}
                transition={{
                  duration: 1.2,
                  ease: [0.23, 1, 0.32, 1],
                  delay: 0.3
                }}
              >
                <motion.div
                  className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.5
                  }}
                >
                  <motion.div
                    className="flex-1"
                    variants={titleVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.7 }}
                  >
                    <motion.h1
                      className="text-3xl font-bold text-white"
                      whileHover={{
                        scale: 1.02,
                        textShadow: "0px 0px 20px rgba(255, 255, 255, 0.3)",
                        transition: { duration: 0.3 }
                      }}
                    >
                      Customer Support
                    </motion.h1>
                    <motion.p
                      className="text-gray-400 mt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.9,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                    >
                      View and manage your customer support sessions and queries
                    </motion.p>
                  </motion.div>

                  {/* Inline Tab Buttons */}
                  <motion.div
                    className="flex items-center gap-2"
                    variants={tabContainerVariants}
                  >
                    <TabsList className="flex items-center gap-1 bg-transparent border-0 p-0">
                      <motion.div
                        whileHover={{
                          scale: 1.08,
                          rotateY: 5,
                          filter: "brightness(1.2)"
                        }}
                        whileTap={{
                          scale: 0.92,
                          rotateY: -2
                        }}
                        transition={{
                          duration: 0.3,
                          ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                      >
                        <TabsTrigger
                          value="sessions"
                          className="flex justify-center whitespace-nowrap gap-1.5 py-2 px-4 rounded-lg text-xs text-gray-300 font-medium
                                  data-[state=active]:text-white
                                  data-[state=active]:bg-white/10
                                  data-[state=active]:shadow-[0px_3.43px_3.43px_0px_#FFFFFF29_inset,0px_-3.43px_3.43px_0px_#FFFFFF29_inset]
                                  transition-all duration-300 hover:bg-white/5 hover:shadow-lg hover:shadow-white/10"
                        >
                          <motion.div
                            animate={{
                              rotate: activeTab === "sessions" ? [0, 10, -10, 0] : 0
                            }}
                            transition={{
                              duration: 0.6,
                              ease: "easeInOut",
                              delay: 0.5
                            }}
                          >
                            <Activity size={14} />
                          </motion.div>
                          <span>Sessions</span>
                        </TabsTrigger>
                      </motion.div>

                      <motion.div
                        whileHover={{
                          scale: 1.08,
                          rotateY: 5,
                          filter: "brightness(1.2)"
                        }}
                        whileTap={{
                          scale: 0.92,
                          rotateY: -2
                        }}
                        transition={{
                          duration: 0.3,
                          ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                      >
                        <TabsTrigger
                          value="queries"
                          className="flex justify-center whitespace-nowrap gap-1.5 py-2 px-4 rounded-lg text-xs text-gray-300 font-medium
                                  data-[state=active]:text-white
                                  data-[state=active]:bg-white/10
                                  data-[state=active]:shadow-[0px_3.43px_3.43px_0px_#FFFFFF29_inset,0px_-3.43px_3.43px_0px_#FFFFFF29_inset]
                                  transition-all duration-300 hover:bg-white/5 hover:shadow-lg hover:shadow-white/10"
                        >
                          <motion.div
                            animate={{
                              rotate: activeTab === "queries" ? [0, -5, 5, 0] : 0,
                              scale: activeTab === "queries" ? [1, 1.1, 1] : 1
                            }}
                            transition={{
                              duration: 0.8,
                              ease: "easeInOut",
                              delay: 0.3
                            }}
                          >
                            <MessageSquare size={14} />
                          </motion.div>
                          <span>Queries</span>
                        </TabsTrigger>
                      </motion.div>
                    </TabsList>
                  </motion.div>
                </motion.div>

                {/* Tab Content Area */}
                <motion.div
                  className="flex-1 min-h-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.8,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      variants={tabContentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="h-full"
                    >
                      {activeTab === "sessions" && (
                        <TabsContent value="sessions" className="mt-0 h-full">
                          <motion.div
                            className="h-full overflow-y-auto"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.4,
                              delay: 0.2,
                              ease: [0.25, 0.46, 0.45, 0.94]
                            }}
                          >
                            <ClientsTable viewType="sessions" />
                          </motion.div>
                        </TabsContent>
                      )}

                      {activeTab === "queries" && (
                        <TabsContent value="queries" className="mt-0 h-full">
                          <motion.div
                            className="h-full overflow-y-auto"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.4,
                              delay: 0.2,
                              ease: [0.25, 0.46, 0.45, 0.94]
                            }}
                          >
                            <CustomerSupportQueriesTable />
                          </motion.div>
                        </TabsContent>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </div>
          </Tabs>
        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default ProspectsPage;
