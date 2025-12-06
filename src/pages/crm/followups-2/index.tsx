import { motion } from "framer-motion";
import { useState, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FollowUpTemplates, {
  FollowUpTemplatesRef,
} from "./components/FollowUpTemplates";
import { CrmNavigation } from "../shared/components/CrmNavigation";
import { Button } from "@/components/ui/button";
import { SearchInput } from "../shared/components";
import { Plus } from "lucide-react";

const FollowUp2Page = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const templatesRef = useRef<FollowUpTemplatesRef>(null);

  const handleCreateTemplate = () => {
    templatesRef.current?.createTemplate();
  };

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white min-h-screen overflow-x-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="max-w-[1600px] mx-auto w-full min-h-0"
        >
          {/* Wrapper with space-between */}
          <div className="flex items-center justify-between mb-4">
            {/* Page Header with Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            >
              <CrmNavigation />
            </motion.div>

            {/* Filters Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="flex flex-col justify-end sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3"
            >
              {/* Controls Container */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-3 order-1 lg:order-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 flex-1">
                  <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                    <SearchInput
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCreateTemplate}
                      className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all w-full sm:w-auto lg:flex-shrink-0 overflow-hidden"
                      style={{
                        background: "#FFFFFF1A",
                        boxShadow:
                          "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                      }}
                    >
                      {/* radial element 150px 150px */}
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[150px] h-[150px] rounded-full pointer-events-none"
                        style={{
                          background:
                            "radial-gradient(circle, #66AFB7 0%, transparent 70%)",
                          backdropFilter: "blur(50px)",
                          WebkitBackdropFilter: "blur(50px)",
                          zIndex: -1,
                        }}
                      ></div>
                      <Plus className="w-4 h-4 mr-2 relative z-10" />
                      <span className="relative z-10">New Template</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.5 }}
            className="rounded-xl sm:rounded-[30px] p-6"
          >
            <FollowUpTemplates
              ref={templatesRef}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </motion.div>
        </motion.div>
      </motion.main>
    </DashboardLayout>
  );
};

export default FollowUp2Page;
