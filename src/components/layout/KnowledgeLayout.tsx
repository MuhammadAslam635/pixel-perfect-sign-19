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
        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-8">
          <header className="rounded-3xl border border-white/10 p-8 text-white" style={{
            background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
          }}>
            <span className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-[9px] font-semibold uppercase  text-white/60">
              Knowledge Base
            </span>
            <h1 className="mt-2 text-sm md:text-lg font-semibold leading-tight">
              Centralize everything your company knows
            </h1>
            <p className="mt-1 max-w-2xl text-[10px] sm:text-xs text-white/70">
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
            <div className="rounded-3xl border border-white/10 p-4" style={{
              background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
            }}>
              <TabsList className="flex w-full flex-col gap-3 bg-transparent p-0">
                {tabItems.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="group flex w-full items-center gap-2 rounded-2xl border border-white/0 bg-white/5 px-2 py-2.5 text-left text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 data-[state=active]:border-white/20 data-[state=active]:bg-[#5B9FA5] data-[state=active]:text-white"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/60 transition group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex flex-1 flex-col gap-1 overflow-hidden text-left">
                        <span className="truncate">{tab.label}</span>
                        <span className="truncate text-[10px] font-normal text-white/55">
                          {tab.description}
                        </span>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            <div className="rounded-3xl border border-white/10 p-8" style={{
              background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
            }}>
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
