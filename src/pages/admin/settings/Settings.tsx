import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { AdminProfileTab } from "@/pages/admin/settings/components/AdminProfileTab";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { IntegrationsTab } from "@/pages/company/settings/components/IntegrationsTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { AdminGlobalIntegrationsTab } from "@/pages/admin/settings/components/AdminGlobalIntegrationsTab";
import { AdminCompanyMailgunTab } from "@/pages/admin/settings/components/AdminCompanyMailgunTab";
import { PerplexityPromptTab } from "@/pages/company/settings/components/PerplexityPromptTab";
import { Lock, Plug, User, Shield, Database, Sparkles, Bell } from "lucide-react";

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const AdminSettings = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [companyName, setCompanyName] = useState<string | undefined>(undefined);
  const canAccessIntegrations = true;

  // Parse URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setActiveTab(params.get("tab") || "profile");
    setCompanyId(params.get("companyId") || undefined);
    const name = params.get("companyName");
    setCompanyName(name ? decodeURIComponent(name) : undefined);
  }, [location.search]);

  // Sidebar tabs
  const tabs = useMemo(
    () => [
      { value: "profile", label: "Profile", icon: User },
      { value: "security", label: "Security", icon: Lock },
      ...(canAccessIntegrations
        ? [
          { value: "integrations", label: "Integrations", icon: Plug },
          { value: "company-mailgun", label: "Company Mailgun", icon: Database },
        ]
        : []),
      { value: "ai-research-prompt", label: "AI Research Prompt", icon: Sparkles },
      { value: "notifications", label: "Notifications", icon: Bell },
    ],
    [canAccessIntegrations]
  );

  // Map tab contents dynamically
  const tabComponents: Record<string, JSX.Element | null> = {
    profile: <AdminProfileTab />,
    security: <SecurityTab />,
    integrations: canAccessIntegrations ? <IntegrationsTab /> : null,
    "company-mailgun": canAccessIntegrations ? <AdminCompanyMailgunTab /> : null,
    "ai-research-prompt": <PerplexityPromptTab companyId={companyId} companyName={companyName} />,
    notifications: <NotificationsTab />,
    "global-integrations": <AdminGlobalIntegrationsTab />,
    system: (
      <div className="grid gap-6 md:grid-cols-2">
        {/* Security Card */}
        <div className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border border-white/10 hover:border-white/20 transition-all duration-300 rounded-lg p-6">
          <h3 className="text-white/70 flex items-center gap-2 mb-4 font-semibold">
            <Shield className="w-5 h-5" />
            Security Settings
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Two-Factor Auth</span>
              <span className="text-green-400 font-semibold">Enabled</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Session Timeout</span>
              <span className="text-white font-semibold">24 hours</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Password Policy</span>
              <span className="text-yellow-400 font-semibold">Strong</span>
            </div>
          </div>
        </div>
        {/* Database Card */}
        <div className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border border-white/10 hover:border-white/20 transition-all duration-300 rounded-lg p-6">
          <h3 className="text-white/70 flex items-center gap-2 mb-4 font-semibold">
            <Database className="w-5 h-5" />
            Database Configuration
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-white/70">Backup Frequency</span>
              <span className="text-white font-semibold">Daily</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Retention Period</span>
              <span className="text-white font-semibold">90 days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70">Auto-scaling</span>
              <span className="text-green-400 font-semibold">Enabled</span>
            </div>
          </div>
        </div>
      </div>
    ),
  };

  // Helper for TabsTrigger styling
  const getTabClass = (isActive: boolean) =>
    `flex w-full items-center justify-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${isActive
      ? "bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white"
      : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;

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
              Manage your admin account preferences, security, integrations, and system configuration in one place.
            </motion.p>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex flex-col gap-6 lg:flex-row">
            {/* Sidebar */}
            <div className="w-full shrink-0 rounded-3xl border border-white/10 bg-white/[0.02] p-3 backdrop-blur lg:w-60 lg:p-4">
              <TabsList className="flex h-auto w-full flex-col gap-2 bg-transparent p-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger key={tab.value} value={tab.value} className={getTabClass(activeTab === tab.value)}>
                      <Icon className={`h-4 w-4 shrink-0 transition-colors ${activeTab === tab.value ? "text-white" : "text-white/70"}`} />
                      <span className="text-left">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <div className="mt-6 px-4 text-[11px] text-white/30 font-medium tracking-wider">
                Version 1.1
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 rounded-3xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur sm:p-6">
              <AnimatePresence mode="wait">
                <FadeIn>{tabComponents[activeTab]}</FadeIn>
              </AnimatePresence>
            </div>
          </Tabs>
        </motion.section>
      </motion.main>
    </AdminLayout>
  );
};

export default AdminSettings;