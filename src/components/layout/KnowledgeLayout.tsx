import { ReactNode, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileCheck } from "lucide-react";

type KnowledgeLayoutProps = {
  children: ReactNode;
  onboardingContent?: ReactNode;
  initialTab?: "company-knowledge" | "onboarding";
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

const KnowledgeLayout = ({
  children,
  onboardingContent,
  initialTab = "company-knowledge",
}: KnowledgeLayoutProps) => {
  const [tabValue, setTabValue] = useState<"company-knowledge" | "onboarding">(
    initialTab
  );

  return (
    <DashboardLayout>
      <div className="relative flex-1 px-6 pb-12 pt-28 sm:px-10 md:px-14 lg:px-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1516] via-[#112123] to-[#070a0b] opacity-90" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-8">
          <header className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#1f3032] via-[#243f42] to-[#1b2c2d] p-8 text-white shadow-[0_22px_45px_-20px_rgba(19,82,87,0.55)]">
            <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
              Knowledge Base
            </span>
            <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">
              Centralize everything your company knows
            </h1>
            <p className="mt-2 max-w-2xl text-base text-white/70 md:text-lg">
              Maintain the documents, guidelines, and assets your AI agents need
              to speak in your voice and act with your insight.
            </p>
          </header>

          <Tabs
            value={tabValue}
            onValueChange={(value) =>
              setTabValue(value as "company-knowledge" | "onboarding")
            }
            className="grid gap-6 lg:grid-cols-[260px,1fr]"
            orientation="vertical"
          >
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#1e2f31] via-[#223538] to-[#1b2a2b] p-4 shadow-[0_18px_40px_-20px_rgba(20,74,78,0.6)] backdrop-blur-xl">
              <TabsList className="flex w-full flex-col gap-3 bg-transparent p-0">
                {tabItems.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-white/0 bg-white/5 px-2 py-4 text-left text-sm font-medium text-white/70 transition hover:border-cyan-300/20 hover:bg-white/10 data-[state=active]:border-cyan-300/40 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3aa7b3]/35 data-[state=active]:to-[#2d6f8a]/45 data-[state=active]:text-white"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-cyan-200/80 transition group-data-[state=active]:bg-white/15 group-data-[state=active]:text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="flex flex-1 flex-col gap-1 overflow-hidden text-left">
                        <span className="truncate">{tab.label}</span>
                        <span className="truncate text-xs font-normal text-white/55">
                          {tab.description}
                        </span>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1e2f31]/95 via-[#20383b]/90 to-[#182324]/95 p-8 shadow-[0_24px_55px_-25px_rgba(20,74,78,0.7)] backdrop-blur-xl">
              <TabsContent value="company-knowledge" className="m-0">
                {children}
              </TabsContent>
              {onboardingContent && (
                <TabsContent value="onboarding" className="m-0">
                  {onboardingContent}
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default KnowledgeLayout;
