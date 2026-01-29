import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { AdminProfileTab } from "@/components/settings/AdminProfileTab";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { AdminGlobalIntegrationsTab } from "@/components/admin/integrations/AdminGlobalIntegrationsTab";
import { AdminCompanyMailgunTab } from "@/components/admin/integrations/AdminCompanyMailgunTab";

import {
  Lock,
  Plug,
  Settings as SettingsIcon,
  User,
  Shield,
  Database,
} from "lucide-react";

const AdminSettings = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const canAccessIntegrations = true;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    const companyIdParam = params.get("companyId");
    const companyNameParam = params.get("companyName");
    if (tabParam) {
      setActiveTab(tabParam);
    }
    if (companyIdParam) {
      setCompanyId(companyIdParam);
    }
    if (companyNameParam) {
      setCompanyName(decodeURIComponent(companyNameParam));
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
        value: "company-mailgun",
        label: "Company Mailgun",
        icon: Database,
        hidden: !canAccessIntegrations,
      },

    ];

    return baseTabs.filter((tab) => !tab.hidden);
  }, [canAccessIntegrations]);

  return (
    <AdminLayout>
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
          className="mx-auto flex flex-col gap-8 space-y-3 pt-3 sm:pt-4 px-3 sm:px-6 rounded-xl sm:rounded-[30px] w-full border-0 sm:border sm:border-white/10 bg-transparent sm:bg-[linear-gradient(173.83deg,_rgba(255,255,255,0.08)_4.82%,_rgba(255,255,255,0)_38.08%,_rgba(255,255,255,0)_56.68%,_rgba(255,255,255,0.02)_95.1%)] min-h-[600px] flex-1"
        >
          <header className="flex flex-col gap-2">
            <motion.h1
              className="text-2xl font-bold tracking-tight text-white"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Admin Settings
            </motion.h1>
            <motion.p
              className="text-white/70"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Manage your admin account preferences, security, integrations and
              system configuration in one place.
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
                      <AdminProfileTab />
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

                  <TabsContent value="system" className="mt-0 space-y-6">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border border-white/10 hover:border-white/20 transition-all duration-300 rounded-lg p-6">
                          <h3 className="text-white/70 flex items-center gap-2 mb-4 font-semibold">
                            <Shield className="w-5 h-5" />
                            Security Settings
                          </h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-white/70">
                                Two-Factor Auth
                              </span>
                              <span className="text-green-400 font-semibold">
                                Enabled
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70">
                                Session Timeout
                              </span>
                              <span className="text-white font-semibold">
                                24 hours
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70">
                                Password Policy
                              </span>
                              <span className="text-yellow-400 font-semibold">
                                Strong
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border border-white/10 hover:border-white/20 transition-all duration-300 rounded-lg p-6">
                          <h3 className="text-white/70 flex items-center gap-2 mb-4 font-semibold">
                            <Database className="w-5 h-5" />
                            Database Configuration
                          </h3>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-white/70">
                                Backup Frequency
                              </span>
                              <span className="text-white font-semibold">
                                Daily
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70">
                                Retention Period
                              </span>
                              <span className="text-white font-semibold">
                                90 days
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-white/70">
                                Auto-scaling
                              </span>
                              <span className="text-green-400 font-semibold">
                                Enabled
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </TabsContent>

                  <TabsContent
                    value="global-integrations"
                    className="mt-0 space-y-6"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <AdminGlobalIntegrationsTab />
                    </motion.div>
                  </TabsContent>

                  {canAccessIntegrations && (
                    <TabsContent
                      value="company-mailgun"
                      className="mt-0 space-y-6"
                    >
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <AdminCompanyMailgunTab />
                      </motion.div>
                    </TabsContent>
                  )}


                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.section>
      </motion.main>
    </AdminLayout>
  );
};

export default AdminSettings;
