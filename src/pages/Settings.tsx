import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ProfileTab as CompanyProfileTab } from "@/components/settings/ProfileTab";
import { ProfileTabCompanyUser } from "@/components/settings/ProfileTabCompanyUser";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { SecurityTab } from "@/components/settings/SecurityTab";
import { AdminProfileTab } from "@/components/settings/AdminProfileTab";
import { RootState } from "@/store/store";
import { Lock, Plug, Settings as SettingsIcon, User } from "lucide-react";

const SettingsPage = () => {
  const location = useLocation();
  const authState = useSelector((state: RootState) => state.auth);
  const userRole = authState.user?.role;
  const [activeTab, setActiveTab] = useState("profile");

  const isAdmin = userRole === "Admin";
  const isCompany = userRole === "Company";
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
        hidden: !isCompany,
      },
      {
        value: "notifications",
        label: "Notifications",
        icon: SettingsIcon,
        hidden: false,
      },
    ];

    return baseTabs.filter((tab) => !tab.hidden);
  }, [isCompany]);

  return (
    <DashboardLayout>
      <main className="relative mt-24 mb-8 flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] text-white">
        <section className="mx-auto flex flex-col gap-8 space-y-3 bg-[#222B2C] p-6 rounded-2xl min-h-[600px] flex-1">
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Settings
            </h1>
            <p className="max-w-2xl text-sm text-white/70 sm:text-base">
              Manage your account preferences, security, and integrations in one
              place.
            </p>
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
                        className={`flex w-full items-center justify-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all data-[state=active]:shadow-none ${
                          isActive
                            ? "bg-gradient-to-r from-cyan-500/60 to-[#1F4C55] text-white shadow-[0_12px_32px_rgba(72,155,255,0.35)]"
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
              <TabsContent value="profile" className="mt-0 space-y-6">
                {isAdmin ? (
                  <AdminProfileTab />
                ) : isCompany ? (
                  <CompanyProfileTab />
                ) : isCompanyUser ? (
                  <ProfileTabCompanyUser />
                ) : (
                  <CompanyProfileTab />
                )}
              </TabsContent>

              <TabsContent value="security" className="mt-0 space-y-6">
                <SecurityTab />
              </TabsContent>

              {isCompany && (
                <TabsContent value="integrations" className="mt-0 space-y-6">
                  <IntegrationsTab />
                </TabsContent>
              )}

              <TabsContent value="notifications" className="mt-0 space-y-6">
                <NotificationsTab />
              </TabsContent>
            </div>
          </Tabs>
        </section>
      </main>
    </DashboardLayout>
  );
};

export default SettingsPage;
