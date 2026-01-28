import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AdminLayout } from "@/components/dashboard/DashboardLayout";
import { Settings, MessageSquare, Phone, Mail } from "lucide-react";
import { connectionMessagesService, type Prompt, type PromptType } from "@/services/connectionMessages.service";
import { adminService, type Company } from "@/services/admin.service";
import { toast } from "sonner";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import { PromptManagement } from "./components/PromptManagement";
import { StatCard } from "./components/StatCard";
import { PromptDialog } from "./components/PromptDialog";
import { DeletePromptDialog } from "./components/DeletePromptDialog";

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

  // Form state
  const [formData, setFormData] = useState({
    promptType: "linkedin" as PromptType,
    promptCategory: "system" as any,
    stage: "general" as any,
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
      const response = await adminService.getPromptsPaginated({
        limit: 1000,
      });
      const promptsWithCompanyInfo = response.data.prompts.map((prompt) => {
        const hasCompanyId =
          prompt.companyId !== null && prompt.companyId !== undefined;
        if (hasCompanyId) {
          if (typeof prompt.companyId === "object" && prompt.companyId._id) {
            return {
              ...prompt,
              company: {
                _id: prompt.companyId._id,
                name: prompt.companyId.name,
              },
              companyId: prompt.companyId,
            };
          } else if (typeof prompt.companyId === "string") {
            const company = companies.find((c) => c._id === prompt.companyId);
            return {
              ...prompt,
              company: company
                ? { _id: company._id, name: company.name }
                : undefined,
              companyId: prompt.companyId,
            };
          }
        }
        return {
          ...prompt,
          company: undefined,
          companyId: null,
        };
      });
      setPrompts(promptsWithCompanyInfo);
      updateStatistics(promptsWithCompanyInfo);
    } catch (error) {
      console.error("Error fetching prompts:", error);
      toast.error(sanitizeErrorMessage(error, "Unable to load prompts. Please try again."));
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
      toast.error(sanitizeErrorMessage(error, "Unable to load companies. Please try again."));
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
      await fetchCompanies();
      await fetchPrompts();
    };
    loadData();
  }, []);
  const resetFormState = () => {
    setFormData({
      promptType: "linkedin",
      promptCategory: "system",
      stage: "general",
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
    setSelectedPrompt(null);
  };
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
      resetFormState();
      fetchPrompts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create prompt");
    }
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      promptType: prompt.promptType,
      promptCategory: prompt.promptCategory,
      stage: prompt.stage || "general",
      content: prompt.content,
      name: prompt.name || "",
      description: prompt.description || "",
      metadata: {
        model: prompt.metadata?.model || "gpt-4o-mini",
        temperature: prompt.metadata?.temperature || 0.7,
        ...prompt.metadata,
      },
    });

    const companyId = prompt.companyId;
    if (!companyId || companyId === null) {
      setSelectedCompanyForPrompt(null);
    } else {
      const isPopulatedCompany = (
        id: string | { _id: string; name?: string; industry?: string } | null
      ): id is { _id: string; name?: string; industry?: string } => {
        return typeof id === "object" && id !== null && "_id" in id;
      };

      let companyIdValue: string | null = null;

      if (isPopulatedCompany(companyId)) {
        companyIdValue = companyId._id;
      } else if (typeof companyId === "string") {
        companyIdValue = companyId;
      }

      if (companyIdValue) {
        const company = companies.find((c) => c._id === companyIdValue);
        if (company) {
          setSelectedCompanyForPrompt(company);
        } else {
          if (isPopulatedCompany(companyId)) {
            setSelectedCompanyForPrompt({
              _id: companyId._id,
              name: companyId.name || "Unknown Company",
              email: "",
              role: "",
            } as Company);
          } else {
            setSelectedCompanyForPrompt(null);
          }
        }
      } else {
        setSelectedCompanyForPrompt(null);
      }
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
      const response = await connectionMessagesService.createOrUpdatePrompt(payload);
      toast.success(response.message);
      resetFormState();
      fetchPrompts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update prompt");
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
      toast.error(error.response?.data?.message || "Failed to delete prompt");
    }
  };

  const handleAddPrompt = () => {
    setSelectedPrompt(null);
    setSelectedCompanyForPrompt(null);
    setFormData({
      promptType: activeTab,
      promptCategory: "system",
      stage: "general",
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
        className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] mt-20 sm:mt-20 lg:mt-24 xl:mt-28 mb-0 flex flex-col gap-6 text-white flex-1 overflow-y-auto"
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              AI Prompt Management
            </h1>
            <p className="text-white/60">
              Configure AI prompts for LinkedIn, Email, Phone, and WhatsApp
              messages
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
        >
          <StatCard
            title="Total Prompts"
            icon={Settings}
            value={statistics.totalPrompts}
            label="All prompt types"
          />
          <StatCard
            title="LinkedIn"
            icon={MessageSquare}
            value={statistics.linkedinPrompts}
            label="LinkedIn prompts"
            valueColor="text-blue-400"
          />
          <StatCard
            title="Email"
            icon={Mail}
            value={statistics.emailPrompts}
            label="Email prompts"
            valueColor="text-green-400"
          />
          <StatCard
            title="Phone"
            icon={Phone}
            value={statistics.phonePrompts}
            label="Phone prompts"
            valueColor="text-purple-400"
          />
          <StatCard
            title="WhatsApp"
            icon={MessageSquare}
            value={statistics.whatsappPrompts}
            label="WhatsApp prompts"
            valueColor="text-cyan-400"
          />
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
        <PromptDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          selectedPrompt={selectedPrompt}
          formData={formData}
          selectedCompanyForPrompt={selectedCompanyForPrompt}
          companies={companies}
          companiesLoading={companiesLoading}
          onFormDataChange={handleFormDataChange}
          onCompanySelect={(company) => setSelectedCompanyForPrompt(company)}
          onSubmit={selectedPrompt ? handleUpdatePrompt : handleCreatePrompt}
        />

        {/* Delete Confirmation Dialog */}
        <DeletePromptDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          promptToDelete={promptToDelete}
          companies={companies}
          onConfirm={confirmDeletePrompt}
        />
      </motion.main>
    </AdminLayout>
  );
};

export default PromptsPage;