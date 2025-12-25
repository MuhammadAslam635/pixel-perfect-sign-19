import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ProfileTab as CompanyProfileTab } from "@/components/settings/ProfileTab";
import { ProfileTabCompanyUser } from "@/components/settings/ProfileTabCompanyUser";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { AdminProfileTab } from "@/components/settings/AdminProfileTab";
import { PerplexityPromptTab } from "@/components/settings/PerplexityPromptTab";
import { RootState } from "@/store/store";
import { Lock, Plug, Settings as SettingsIcon, User, Sparkles } from "lucide-react";

const SettingsPage = () => {
  const location = useLocation();
  const authState = useSelector((state: RootState) => state.auth);
  const userRole = authState.user?.role;
  const [activeTab, setActiveTab] = useState("profile");

  const isAdmin = userRole === "Admin";
  const isCompany = userRole === "Company";
  const canAccessIntegrations = ["Company", "CompanyAdmin"].includes(
    userRole ?? ""
  );
  const canManagePerplexityPrompt = ["Company", "CompanyAdmin"].includes(
    userRole ?? ""
  );
  const isCompanyUser = ["CompanyAdmin", "CompanyUser"].includes(
    userRole ?? ""
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const tabs = useMemo(() => {
    const baseTabs = [
      {
        value: "profile",
        label: "Profile",
        icon: User,
        hidden: false,
      },
      {
        value: "security",
        label: "Security",
        icon: Lock,
        hidden: false,
      },
      {
        value: "integrations",
        label: "Integrations",
        icon: Plug,
        hidden: !canAccessIntegrations,
      },
      {
        value: "notifications",
        label: "Notifications",
        icon: SettingsIcon,
        hidden: false,
      },
      {
        value: "perplexity-prompt",
        label: "AI Research Prompt",
        icon: Sparkles,
        hidden: !canManagePerplexityPrompt,
      },
    ];

    return baseTabs.filter((tab) => !tab.hidden);
  }, [canAccessIntegrations, canManagePerplexityPrompt]);

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative mt-32 mb-8 flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] text-white"
      >
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
          className="mx-auto flex flex-col gap-8 space-y-3 pt-3 sm:pt-4 pb-6 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] min-h-[600px] flex-1"
        >
          <header className="flex flex-col gap-2">
            <motion.h1
              className="text-3xl font-semibold tracking-tight text-white sm:text-4xl"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Settings
            </motion.h1>
            <motion.p
              className="max-w-2xl text-sm text-white/70 sm:text-base"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Manage your account preferences, security, and integrations in one
              place.
            </motion.p>
          </header>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            orientation="vertical"
            className="flex flex-col gap-6 lg:flex-row"
          >
            {/* Sidebar wrapper with card styling */}
            <div className="w-full shrink-0 rounded-3xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur lg:w-60 lg:p-4">
              {/* Tabs list wrapper - ensures tabs stay inside the card */}
              <div className="w-full">
                <TabsList className="flex h-auto w-full flex-col gap-2 bg-transparent p-0">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.value;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className={`flex w-full items-center justify-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isActive ? "text-white" : "text-white/70"
                          }`}
                        />
                        <span className="text-left">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 rounded-3xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur sm:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.2,
                    ease: "easeOut",
                  }}
                  className="h-full"
                >
                  <TabsContent value="profile" className="mt-0 space-y-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {isAdmin ? (
                        <AdminProfileTab />
                      ) : isCompany ? (
                        <CompanyProfileTab />
                      ) : isCompanyUser ? (
                        <ProfileTabCompanyUser />
                      ) : (
                        <CompanyProfileTab />
                      )}
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="security" className="mt-0 space-y-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <SecurityTab />
                    </motion.div>
                  </TabsContent>

                  {canAccessIntegrations && (
                    <TabsContent
                      value="integrations"
                      className="mt-0 space-y-6"
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <IntegrationsTab />
                      </motion.div>
                    </TabsContent>
                  )}

                  <TabsContent value="notifications" className="mt-0 space-y-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <NotificationsTab />
                    </motion.div>
                  </TabsContent>

                  {canManagePerplexityPrompt && (
                    <TabsContent
                      value="perplexity-prompt"
                      className="mt-0 space-y-6"
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <PerplexityPromptTab />
                      </motion.div>
                    </TabsContent>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.section>
      </motion.main>
    </DashboardLayout>
  );
};

export default SettingsPage;
