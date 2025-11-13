import { ReactNode } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileCheck } from "lucide-react";

type KnowledgeLayoutProps = {
  children: ReactNode;
  activeTab: "company-knowledge" | "onboarding";
};

const tabItems = [
  {
    id: "company-knowledge" as const,
    label: "Company Knowledge",
    icon: BookOpen,
    description: "Upload files to train your AI copilots",
  },
  {
    id: "onboarding" as const,
    label: "Onboarding",
    icon: FileCheck,
    description: "Company setup tasks and status",
  },
];

const KnowledgeLayout = ({ children, activeTab }: KnowledgeLayoutProps) => {
  return (
    <DashboardLayout>
      <div className="relative flex-1 px-6 pb-12 pt-28 sm:px-10 md:px-14 lg:px-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-transparent to-[#05060A] opacity-70" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-10">
          <header className="flex flex-col gap-3 text-white">
            <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
              Knowledge Base
            </span>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              Centralize everything your company knows
            </h1>
            <p className="max-w-2xl text-base text-white/70 md:text-lg">
              Maintain the documents, guidelines, and assets your AI agents need
              to speak in your voice and act with your insight.
            </p>
          </header>

          <Tabs
            value={activeTab}
            className="grid gap-6 lg:grid-cols-[260px,1fr]"
            orientation="vertical"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
              <TabsList className="flex w-full flex-col gap-2 bg-transparent p-4">
                {tabItems.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-white/5 px-4 py-3 text-left text-sm font-medium text-white/70 transition hover:border-white/15 hover:bg-white/10 data-[state=active]:border-white/20 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#5E5CE6] data-[state=active]:to-[#9B5CF6] data-[state=active]:text-white"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="flex flex-col gap-1">
                        <span>{tab.label}</span>
                        <span className="text-xs font-normal text-white/50">
                          {tab.description}
                        </span>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#222B2C]/80 p-6 shadow-[0_24px_45px_-20px_rgba(88,135,255,0.35)] backdrop-blur-xl">
              <TabsContent value={activeTab} className="m-0">
                {children}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default KnowledgeLayout;
