import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Settings, MessageSquare, Phone, Mail, Activity } from "lucide-react";
import {
  connectionMessagesService,
  type Prompt,
  type PromptType,
} from "@/services/connectionMessages.service";
import { adminService, type Company } from "@/services/admin.service";
import { toast } from "sonner";
import { PromptManagement } from "./components/PromptManagement";
import { PromptForm } from "./components/PromptForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PromptsPage = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState<PromptType>("linkedin");
  const [selectedCompanyForPrompt, setSelectedCompanyForPrompt] =
    useState<Company | null>(null);
  const [statistics, setStatistics] = useState({
    totalPrompts: 0,
    linkedinPrompts: 0,
    emailPrompts: 0,
    phonePrompts: 0,
    whatsappPrompts: 0,
  });
  const [statisticsLoading, setStatisticsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    promptType: "linkedin" as PromptType,
    promptCategory: "system" as any,
    content: "",
    name: "",
    description: "",
    metadata: {
      model: "gpt-4o-mini",
      temperature: 0.7,
    },
  });

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      // Use admin endpoint for pagination support
      const response = await adminService.getPromptsPaginated({
        limit: 1000, // Get all for statistics
      });

      // Map company information to prompts
      // Note: Backend already populates companyId with { _id, name, industry }
      const promptsWithCompanyInfo = response.data.prompts.map((prompt) => {
        if (prompt.companyId) {
          // Check if companyId is already populated (has _id property)
          if (typeof prompt.companyId === 'object' && prompt.companyId._id) {
            // Already populated by backend
            return {
              ...prompt,
              company: {
                _id: prompt.companyId._id,
                name: prompt.companyId.name,
              },
            };
          } else {
            // If not populated, look up in companies array
            const company = companies.find((c) => c._id === prompt.companyId);
            return {
              ...prompt,
              company: company ? { _id: company._id, name: company.name } : undefined,
            };
          }
        }
        return prompt;
      });

      // Debug: Log prompt types with detailed breakdown
      console.log("📊 Admin Prompts Debug Info:");
      console.log("├─ Total prompts fetched:", promptsWithCompanyInfo.length);
      console.log("├─ 🌐 Global prompts:", promptsWithCompanyInfo.filter(p => !p.companyId).length);
      console.log("└─ 🏢 Company-specific prompts:", promptsWithCompanyInfo.filter(p => p.companyId).length);

      // Log breakdown by type
      const promptsByType = {
        linkedin: promptsWithCompanyInfo.filter(p => p.promptType === "linkedin").length,
        email: promptsWithCompanyInfo.filter(p => p.promptType === "email").length,
        phone: promptsWithCompanyInfo.filter(p => p.promptType === "phone").length,
        whatsapp: promptsWithCompanyInfo.filter(p => p.promptType === "whatsapp").length,
      };
      console.log("📈 Prompts by type:", promptsByType);

      // If company-specific prompts exist, log their details
      const companySpecificPrompts = promptsWithCompanyInfo.filter(p => p.companyId);
      if (companySpecificPrompts.length > 0) {
        console.log("🏢 Company-specific prompt details:");
        companySpecificPrompts.forEach((p, idx) => {
          console.log(`   ${idx + 1}. ${p.promptType} - ${p.promptCategory}:`, {
            promptId: p._id,
            companyId: typeof p.companyId === 'object' ? p.companyId._id : p.companyId,
            companyName: p.company?.name || (typeof p.companyId === 'object' ? p.companyId.name : "Unknown"),
            isActive: p.isActive,
          });
        });
      } else {
        console.log("ℹ️ No company-specific prompts found. All prompts are global.");
      }

      setPrompts(promptsWithCompanyInfo);
      updateStatistics(promptsWithCompanyInfo);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      toast.error("Failed to fetch prompts");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const params = {
        page: 1,
        limit: 100,
      };
      const response = await adminService.getCompanies(params);
      setCompanies(response.data.companies as unknown as Company[]);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      toast.error("Failed to fetch companies");
    } finally {
      setCompaniesLoading(false);
    }
  };

  const updateStatistics = (promptsList: Prompt[]) => {
    setStatistics({
      totalPrompts: promptsList.length,
      linkedinPrompts: promptsList.filter((p) => p.promptType === "linkedin")
        .length,
      emailPrompts: promptsList.filter((p) => p.promptType === "email").length,
      phonePrompts: promptsList.filter((p) => p.promptType === "phone").length,
      whatsappPrompts: promptsList.filter((p) => p.promptType === "whatsapp")
        .length,
    });
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchCompanies(); // Load companies first
      await fetchPrompts(); // Then load prompts with company mapping
    };
    loadData();
  }, []);

  const handleCreatePrompt = async () => {
    try {
      const payload = {
        companyId: selectedCompanyForPrompt?._id || null,
        ...formData,
      };

      const response = await connectionMessagesService.createOrUpdatePrompt(
        payload
      );
      toast.success(response.message);

      setFormData({
        promptType: "linkedin",
        promptCategory: "system",
        content: "",
        name: "",
        description: "",
        metadata: {
          model: "gpt-4o-mini",
          temperature: 0.7,
        },
      });
      setSelectedCompanyForPrompt(null);
      setIsDialogOpen(false);
      fetchPrompts();
    } catch (error) {
      toast.error("Failed to create prompt");
    }
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      promptType: prompt.promptType,
      promptCategory: prompt.promptCategory,
      content: prompt.content,
      name: prompt.name || "",
      description: prompt.description || "",
      metadata: {
        model: prompt.metadata?.model || "gpt-4o-mini",
        temperature: prompt.metadata?.temperature || 0.7,
        ...prompt.metadata,
      },
    });

    if (prompt.companyId) {
      const company = companies.find((c) => c._id === prompt.companyId);
      if (company) {
        setSelectedCompanyForPrompt(company);
      }
    } else {
      setSelectedCompanyForPrompt(null);
    }

    setIsDialogOpen(true);
  };

  const handleUpdatePrompt = async () => {
    if (!selectedPrompt) return;

    try {
      const payload = {
        companyId: selectedCompanyForPrompt?._id || null,
        ...formData,
      };

      const response = await connectionMessagesService.createOrUpdatePrompt(
        payload
      );
      toast.success(response.message);

      setSelectedPrompt(null);
      setFormData({
        promptType: "linkedin",
        promptCategory: "system",
        content: "",
        name: "",
        description: "",
        metadata: {
          model: "gpt-4o-mini",
          temperature: 0.7,
        },
      });
      setSelectedCompanyForPrompt(null);
      setIsDialogOpen(false);
      fetchPrompts();
    } catch (error) {
      toast.error("Failed to update prompt");
    }
  };

  const handleDeletePrompt = (prompt: Prompt) => {
    setPromptToDelete(prompt);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePrompt = async () => {
    if (!promptToDelete) return;

    try {
      await connectionMessagesService.deletePrompt(promptToDelete._id);
      toast.success("Prompt deleted successfully");
      fetchPrompts();
      setIsDeleteDialogOpen(false);
      setPromptToDelete(null);
    } catch (error) {
      toast.error("Failed to delete prompt");
    }
  };

  const handleAddPrompt = () => {
    setSelectedPrompt(null);
    setSelectedCompanyForPrompt(null);
    setFormData({
      promptType: activeTab,
      promptCategory: "system",
      content: "",
      name: "",
      description: "",
      metadata: {
        model: "gpt-4o-mini",
        temperature: 0.7,
      },
    });
    setIsDialogOpen(true);
  };

  const handleFormDataChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AdminLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white min-h-screen"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="max-w-[1600px] mx-auto w-full flex flex-col flex-1"
        >
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
          >
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                AI Prompt Management
              </h1>
              <p className="text-white/60 text-sm">
                Configure AI prompts for LinkedIn, Email, Phone, and WhatsApp
                messages
              </p>
            </div>
            <Badge className="bg-white/10 text-white/85 border border-white/20 px-4 py-2 w-fit">
              <Settings className="w-4 h-4 mr-2" />
              PROMPT CONFIGURATION
            </Badge>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-6"
          >
            <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                  <Settings className="w-4 h-4" />
                  Total Prompts
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {statistics.totalPrompts}
                </div>
                <p className="text-xs text-white/60 mt-1">All prompt types</p>
              </CardContent>
            </Card>

            <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4" />
                  LinkedIn
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                  {statistics.linkedinPrompts}
                </div>
                <p className="text-xs text-white/60 mt-1">LinkedIn prompts</p>
              </CardContent>
            </Card>

            <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-green-400">
                  {statistics.emailPrompts}
                </div>
                <p className="text-xs text-white/60 mt-1">Email prompts</p>
              </CardContent>
            </Card>

            <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4" />
                  Phone
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-purple-400">
                  {statistics.phonePrompts}
                </div>
                <p className="text-xs text-white/60 mt-1">Phone prompts</p>
              </CardContent>
            </Card>

            <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-cyan-400">
                  {statistics.whatsappPrompts}
                </div>
                <p className="text-xs text-white/60 mt-1">WhatsApp prompts</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Prompt Management Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
          >
            <PromptManagement
              prompts={prompts}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onAddPrompt={handleAddPrompt}
              onEditPrompt={handleEditPrompt}
              onDeletePrompt={handleDeletePrompt}
            />
          </motion.div>

          {/* Prompt Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="bg-[linear-gradient(135deg,rgba(58,62,75,0.95),rgba(28,30,40,0.98))] border-cyan-500/20 text-white max-w-[95vw] lg:max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <DialogHeader className="border-b border-white/10 pb-4">
                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                  {selectedPrompt ? (
                    <>
                      <span>Edit Prompt</span>
                    </>
                  ) : (
                    <>
                      <span>Create New Prompt</span>
                    </>
                  )}
                </DialogTitle>
                <DialogDescription className="text-white/60 text-sm">
                  {selectedPrompt
                    ? "Update the existing prompt configuration and customize variables"
                    : "Create a new AI prompt for connection messages with dynamic variables"}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <PromptForm
                  formData={formData}
                  selectedCompanyForPrompt={selectedCompanyForPrompt}
                  companies={companies}
                  companiesLoading={companiesLoading}
                  onFormDataChange={handleFormDataChange}
                  onCompanySelect={(company) => {
                    setSelectedCompanyForPrompt(company);
                  }}
                  onSubmit={
                    selectedPrompt ? handleUpdatePrompt : handleCreatePrompt
                  }
                  onCancel={() => setIsDialogOpen(false)}
                  isEditing={!!selectedPrompt}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md w-[95vw]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-600/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  Delete Prompt
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this prompt? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>

              {promptToDelete && (
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-cyan-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-cyan-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">
                        {promptToDelete.promptType.charAt(0).toUpperCase() +
                          promptToDelete.promptType.slice(1)}{" "}
                        Prompt
                      </p>
                      <p className="text-white/60 text-xs">
                        {promptToDelete.promptCategory
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                        {promptToDelete.companyId
                          ? ` • Company-specific`
                          : ` • Global`}
                      </p>
                      {promptToDelete.companyId && (
                        <p className="text-cyan-400 text-xs font-mono truncate">
                          Company:{" "}
                          {companies.find(
                            (c) => c._id === promptToDelete!.companyId
                          )?.name || "Unknown"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeletePrompt}
                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                >
                  Delete Prompt
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </motion.main>
    </AdminLayout>
  );
};

export default PromptsPage;

