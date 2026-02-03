import { ReactNode, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileCheck, File, FileText, ExternalLink } from "lucide-react";
import { SupportingDocument } from "@/types/onboarding.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import API from "@/utils/api";
import { getAuthToken } from "@/utils/authHelpers";
import { formatDate, formatFileSize } from "@/utils/commonFunctions";

type KnowledgeFile = {
  _id: string;
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  filePath?: string;
  uploadedAt?: string;
  updatedAt?: string;
};

type KnowledgeLayoutProps = {
  children: ReactNode;
  onboardingContent?: ReactNode;
  proposalExamplesContent?: ReactNode;
  initialTab?: "company-knowledge" | "proposal-examples" | "onboarding";
  supportingDocuments?: SupportingDocument[];
  knowledgeDocuments?: KnowledgeFile[];
  onKnowledgeDocumentClick?: (doc: KnowledgeFile) => void;
};

const tabItems = [
  {
    id: "company-knowledge" as const,
    label: "Company Knowledge",
    icon: BookOpen,
    description: "Upload files to train your AI copilots",
  },
  {
    id: "proposal-examples" as const,
    label: "Proposals",
    icon: FileText,
    description: "Upload winning proposals",
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
  proposalExamplesContent,
  initialTab = "company-knowledge",
  supportingDocuments = [],
  knowledgeDocuments = [],
  onKnowledgeDocumentClick,
}: KnowledgeLayoutProps) => {
  const [tabValue, setTabValue] = useState<"company-knowledge" | "proposal-examples" | "onboarding">(
    initialTab
  );
  const [docsView, setDocsView] = useState<"knowledge" | "onboarding">("knowledge");

  const handleOnboardingDocumentClick = async (doc: SupportingDocument) => {
    try {
      const token = getAuthToken();
      const baseURL = API.defaults.baseURL || "";
      const documentUrl = `${baseURL}/onboarding/documents/${doc._id}/view?token=${token}`;
      window.open(documentUrl, "_blank");
    } catch (error) {
      console.error("Error opening document:", error);
    }
  };

  return (
    <DashboardLayout>
      <div className="relative flex-1 px-6 pb-12 pt-28 sm:px-10 md:px-14 lg:px-20">
        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-8">
          <header
            className="rounded-3xl border border-white/10 p-8 text-white"
            style={{ background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)", }}
          >
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
            <div
              className="rounded-3xl border border-white/10 p-4"
              style={{ background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)", }}
            >
              <TabsList className="flex w-full flex-col gap-3 bg-transparent p-0">
                {tabItems.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="group flex w-full items-center gap-2 rounded-2xl border border-white/0 bg-white/5 px-2 py-2.5 text-left text-xs font-medium text-white/70 transition hover:border-white/20 hover:bg-white/10 data-[state=active]:border-cyan-500/30 data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-700/80 data-[state=active]:to-cyan-600/60 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-cyan-500/20"
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
            <div
              className="rounded-3xl border border-white/10 p-8"
              style={{ background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)", }}
            >
              <TabsContent value="company-knowledge" className="m-0">
                <div className="flex flex-col gap-6">
                  {/* Document Viewer Tabs */}
                  <div className="flex gap-2 border-b border-white/10 pb-2">
                    <button
                      onClick={() => setDocsView("knowledge")}
                      className={`px-4 py-2 text-xs font-medium rounded-lg transition ${docsView === "knowledge" ? "bg-cyan-600/60 text-white border border-cyan-500/30" : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"}`}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5" />
                        Knowledge Documents
                      </div>
                    </button>
                    <button
                      onClick={() => setDocsView("onboarding")}
                      className={`px-4 py-2 text-xs font-medium rounded-lg transition ${docsView === "onboarding" ? "bg-cyan-600/60 text-white border border-cyan-500/30" : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"}`}
                    >
                      <div className="flex items-center gap-2">
                        <File className="h-3.5 w-3.5" />
                        Onboarding Documents
                      </div>
                    </button>
                  </div>

                  {/* Content Area */}
                  {docsView === "knowledge" ? (
                    <div>{children}</div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {supportingDocuments && supportingDocuments.length > 0 ? (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                          {supportingDocuments.map((doc, index) => (
                            <Card
                              key={doc._id || index}
                              className="border border-white/10 bg-transparent text-white cursor-pointer hover:border-cyan-500/30 transition-all"
                              onClick={() => handleOnboardingDocumentClick(doc)}
                            >
                              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                                <div className="space-y-1 flex-1">
                                  <CardTitle className="text-lg font-semibold text-white">
                                    {doc.fileName}
                                  </CardTitle>
                                  <CardDescription className="text-xs text-white/60">
                                    {doc.fileType || "application/pdf"}
                                  </CardDescription>
                                </div>
                                <ExternalLink className="h-4 w-4 text-white/40" />
                              </CardHeader>
                              <CardContent className="px-6 pb-6 space-y-3 text-sm text-white/70">
                                <div className="flex justify-between">
                                  <span>Size</span>
                                  <span>{formatFileSize(doc.fileSize)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Uploaded</span>
                                  <span>{formatDate(doc.uploadedAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Last updated</span>
                                  <span>
                                    {formatDate(
                                      doc.updatedAt || doc.uploadedAt
                                    )}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="border border-white/10 bg-transparent text-white">
                          <CardContent className="p-8 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="rounded-full bg-white/10 p-4">
                                <File className="h-8 w-8 text-white/40" />
                              </div>
                              <div>
                                <h3 className="text-sm font-semibold mb-1">
                                  No supporting documents
                                </h3>
                                <p className="text-xs text-white/60">
                                  Upload documents in the onboarding process to
                                  see them here.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
              {proposalExamplesContent && (
                <TabsContent value="proposal-examples" className="m-0">
                  {proposalExamplesContent}
                </TabsContent>
              )}
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