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
import { Building2, Users, Activity, Building } from "lucide-react";
import {
  connectionMessagesService,
  type Prompt,
  type PromptType,
  type PromptCategory,
} from "@/services/connectionMessages.service";
import {
  adminService,
  type Company,
  type CompaniesResponse,
} from "@/services/admin.service";
import { toast } from "sonner";

// Import components
import { CompaniesList } from "./components/CompaniesList";

type ViewMode = "cards" | "table";

const Companies = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState<PromptType>("linkedin");
  const [companiesViewMode, setCompaniesViewMode] = useState<ViewMode>("table");
  const [selectedCompanyForPrompt, setSelectedCompanyForPrompt] =
    useState<Company | null>(null);
  const [statistics, setStatistics] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
  });
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  // Form state
  const [formData, setFormData] = useState({
    promptType: "linkedin" as PromptType,
    promptCategory: "system" as PromptCategory,
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
      const response = await connectionMessagesService.getPrompts();
      setPrompts(response.data.prompts);
    } catch (error) {
      toast.error("Failed to fetch prompts");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async (page: number = 1) => {
    try {
      setCompaniesLoading(true);
      const params = {
        page,
        limit: itemsPerPage,
      };

      const response: CompaniesResponse = await adminService.getCompanies(
        params
      );
      const companiesData = response.data.companies;
      setCompanies(companiesData);

      // Use totalPages from response, or calculate from totalRecords if not provided
      const totalPagesFromResponse = response.data.totalPages;
      const totalRecords = response.data.totalRecords || companiesData.length;
      const calculatedPages =
        totalPagesFromResponse || Math.ceil(totalRecords / itemsPerPage);
      setTotalPages(calculatedPages || 1);
      setCurrentPage(page);
    } catch (error) {
      console.error("Failed to fetch companies:", error);
      toast.error("Failed to fetch companies");
    } finally {
      setCompaniesLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setStatisticsLoading(true);
      const response = await adminService.getCompanyStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
      toast.error("Failed to fetch statistics");
    } finally {
      setStatisticsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
    fetchCompanies(currentPage);
    fetchStatistics();
  }, []);

  const handlePageChange = (page: number) => {
    fetchCompanies(page);
  };

  // Clear selected prompt and content when prompt type/category changes
  useEffect(() => {
    if (isDialogOpen) {
      setSelectedPrompt(null);
      // Keep company selection but clear content if it doesn't match new type/category
      if (selectedCompanyForPrompt) {
        const existingPrompt = prompts.find(
          (p) =>
            p.companyId === selectedCompanyForPrompt._id &&
            p.promptType === formData.promptType &&
            p.promptCategory === formData.promptCategory &&
            p.isActive
        );

        if (existingPrompt) {
          setSelectedPrompt(existingPrompt);
          setFormData((prev) => ({
            ...prev,
            content: existingPrompt.content,
            name: existingPrompt.name || "",
            description: existingPrompt.description || "",
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            content: "",
            name: "",
            description: "",
          }));
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          content: "",
          name: "",
          description: "",
        }));
      }
    }
  }, [formData.promptType, formData.promptCategory, isDialogOpen]);

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

      // Reset form
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

    // Set selected company if it's a company-specific prompt
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

  const cancelDeletePrompt = () => {
    setIsDeleteDialogOpen(false);
    setPromptToDelete(null);
  };

  const handleCompanySelect = (company: Company | null) => {
    setSelectedCompanyForPrompt(company);

    if (company) {
      // If company already has a prompt for current type/category, populate the form
      const existingPrompt = prompts.find(
        (p) =>
          p.companyId === company._id &&
          p.promptType === formData.promptType &&
          p.promptCategory === formData.promptCategory &&
          p.isActive
      );

      if (existingPrompt) {
        setSelectedPrompt(existingPrompt);
        setFormData((prev) => ({
          ...prev,
          content: existingPrompt.content,
          name: existingPrompt.name || "",
          description: existingPrompt.description || "",
        }));
      } else {
        setSelectedPrompt(null);
        // Clear content if switching to a company without a prompt
        setFormData((prev) => ({
          ...prev,
          content: "",
          name: "",
          description: "",
        }));
      }
    } else {
      // Global prompt selected
      setSelectedPrompt(null);
      setFormData((prev) => ({
        ...prev,
        content: "",
        name: "",
        description: "",
        metadata: {
          model: "gpt-4o-mini",
          temperature: 0.7,
        },
      }));
    }
  };

  const handleFormDataChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddPrompt = () => {
    setSelectedPrompt(null);
    setSelectedCompanyForPrompt(null);
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
    setIsDialogOpen(true);
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
                Admin Panel - Companies & Prompts
              </h1>
              <p className="text-white/60 text-sm">
                Global company management and AI prompt configuration
              </p>
            </div>
            <Badge className="bg-white/10 text-white/85 border border-white/20 px-4 py-2 w-fit">
              GLOBAL VIEW
            </Badge>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6"
          >
            <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                  <Building2 className="w-4 h-4" />
                  Total Companies
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {statisticsLoading ? (
                    <div className="animate-pulse">...</div>
                  ) : (
                    statistics.totalCompanies.toLocaleString()
                  )}
                </div>
                <p className="text-xs text-white/60 mt-1">Based on your role</p>
              </CardContent>
            </Card>

            <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4" />
                  Active Companies
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-green-400">
                  {statisticsLoading ? (
                    <div className="animate-pulse">...</div>
                  ) : (
                    statistics.activeCompanies.toLocaleString()
                  )}
                </div>
                <p className="text-xs text-white/60 mt-1">
                  {statistics.totalCompanies > 0
                    ? `${Math.round(
                        (statistics.activeCompanies /
                          statistics.totalCompanies) *
                          100
                      )}% active rate`
                    : "No companies"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] border-white/10 hover:border-white/20 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-white/70 flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4" />
                  Active Prompts
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-cyan-400">
                  {prompts.length}
                </div>
                <p className="text-xs text-white/60 mt-1">Configured prompts</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Companies Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
            className="mb-6"
          >
            <CompaniesList
              companies={companies}
              companiesLoading={companiesLoading}
              viewMode={companiesViewMode}
              onViewModeChange={setCompaniesViewMode}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
            />
          </motion.div>
        </motion.div>
      </motion.main>
    </AdminLayout>
  );
};

export default Companies;
