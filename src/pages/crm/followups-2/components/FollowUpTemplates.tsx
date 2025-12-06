import { useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Calendar,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchInput } from "../../shared/components";
import ActiveFollowUpPlans from "./ActiveFollowUpPlans";
import TemplateFormModal from "./TemplateFormModal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  useFollowupTemplates,
  useDeleteFollowupTemplate,
  useDuplicateFollowupTemplate,
} from "@/hooks/useFollowupTemplates";
import { FollowupTemplate } from "@/services/followupTemplates.service";
import { useToast } from "@/hooks/use-toast";
import { isAxiosError } from "axios";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

interface FollowUpTemplatesProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export interface FollowUpTemplatesRef {
  createTemplate: () => void;
}

const FollowUpTemplates = forwardRef<FollowUpTemplatesRef, FollowUpTemplatesProps>(({
  searchQuery = "",
  onSearchChange
}, ref) => {
  const [activeTab, setActiveTab] = useState<"templates" | "plans">(
    "plans"
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedTemplate, setSelectedTemplate] =
    useState<FollowupTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] =
    useState<FollowupTemplate | null>(null);

  const { toast } = useToast();
  const { mutate: deleteTemplate, isPending: isDeleting } =
    useDeleteFollowupTemplate();
  const { mutate: duplicateTemplate, isPending: isDuplicating } =
    useDuplicateFollowupTemplate();

  // Fetch followup templates from API
  const {
    data: templatesData,
    isLoading,
    isError,
  } = useFollowupTemplates({
    search: searchQuery,
    limit: 100,
  });

  // Extract templates from response
  const templates = useMemo(() => {
    const templatesResponse = templatesData as
      | { data?: { docs?: FollowupTemplate[] } }
      | undefined;
    return templatesResponse?.data?.docs || [];
  }, [templatesData]);

  const handleEdit = (template: FollowupTemplate) => {
    setSelectedTemplate(template);
    setFormMode("edit");
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setFormMode("create");
    setSelectedTemplate(null);
    setIsFormOpen(true);
  };

  useImperativeHandle(ref, () => ({
    createTemplate: handleCreate
  }), []);

  const handleDuplicate = (template: FollowupTemplate) => {
    duplicateTemplate(template._id, {
      onSuccess: (response) => {
        toast({
          title: "Template duplicated",
          description:
            response.message || `${template.title} has been duplicated.`,
        });
      },
      onError: (mutationError) => {
        toast({
          title: "Unable to duplicate template",
          description: getErrorMessage(mutationError, "Please try again."),
          variant: "destructive",
        });
      },
    });
  };

  const handleDelete = () => {
    if (!templateToDelete) return;

    deleteTemplate(templateToDelete._id, {
      onSuccess: (response) => {
        toast({
          title: "Template deleted",
          description:
            response.message || `${templateToDelete.title} was deleted.`,
        });
        setTemplateToDelete(null);
      },
      onError: (mutationError) => {
        toast({
          title: "Unable to delete template",
          description: getErrorMessage(mutationError, "Please try again."),
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}

      {/* Active Followup Plan Section with Tabs and Search */}
      <div>
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center gap-4">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1 rounded-lg p-0.5">
              <div className="relative pb-3">
                <button
                  onClick={() => setActiveTab("plans")}
                  className={`px-3 py-1 rounded-md text-2xl font-medium transition-all ${
                    activeTab === "plans"
                      ? "text-white"
                      : "text-[#FFFFFF4D] hover:text-white/80"
                  }`}
                >
                  Active Followup Plans
                </button>
                <p
                  className={`px-3 py-0.5 rounded-md text-[10px] font-light transition-all ${
                    activeTab === "plans"
                      ? "text-white/70"
                      : "text-[#FFFFFF4D]"
                  }`}
                >
                  View and manage your active followup campaigns
                </p>
              </div>
              <div className="relative pb-3">
                <button
                  onClick={() => setActiveTab("templates")}
                  className={`px-3 py-1.5 rounded-md text-2xl font-medium transition-all ${
                    activeTab === "templates"
                      ? "text-white"
                      : "text-[#FFFFFF4D] hover:text-white/80"
                  }`}
                >
                  Follow-up Templates
                </button>
                <p
                  className={`px-3 py-0.5 rounded-md text-[10px] font-light transition-all ${
                    activeTab === "templates"
                      ? "text-white/70"
                      : "text-[#FFFFFF4D]"
                  }`}
                >
                  Centralize touchpoints for every prospect across emails,
                  calls, and whatsapp
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Border with Active Tab Indicator */}
        <div className="relative border-b border-white/20 mb-4">
          <div
            className={`absolute bottom-0 h-[2px] bg-white transition-all duration-300 ${
              activeTab === "templates"
                ? "left-0 w-[380px]"
                : "left-[420px] w-[300px]"
            }`}
          />
        </div>

        {/* Conditional Content Based on Active Tab */}
        {activeTab === "templates" ? (
          /* Campaign Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {isLoading ? (
              <div className="col-span-full text-center text-white/60 py-10">
                Loading templates...
              </div>
            ) : isError ? (
              <div className="col-span-full text-center text-red-400 py-10">
                Error loading templates. Please try again.
              </div>
            ) : templates.length === 0 ? (
              <div className="col-span-full text-center text-white/60 py-10">
                No templates found. Create your first template to get started.
              </div>
            ) : (
              templates.map((template) => {
                // Format updated date
                const updatedDate = new Date(template.updatedAt);
                const now = new Date();
                const diffTime = Math.abs(
                  now.getTime() - updatedDate.getTime()
                );
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const updatedAt =
                  diffDays <= 1 ? "today" : `${diffDays} days ago`;

                return (
                  <Card
                    key={template._id}
                    className="relative border-0 hover:bg-[#2F2F2F] transition-all duration-300 rounded-2xl overflow-hidden"
                    style={{
                      background: "#2A2A2A",
                    }}
                  >
                    {/* Gradient overlay from top to bottom */}
                    <div
                      className="absolute top-0 left-0 right-0 pointer-events-none rounded-sm"
                      style={{
                        height: "calc(100% - 120px)",
                        background:
                          "linear-gradient(173.83deg, rgba(255, 255, 255, 0.16) 4.82%, rgba(255, 255, 255, 4e-05) 38.08%, rgba(255, 255, 255, 4e-05) 56.68%, rgba(255, 255, 255, 0.04) 95.1%)",
                        zIndex: 1,
                      }}
                    ></div>
                    <CardContent className="relative p-4 space-y-2 z-10">
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4
                            className="mb-1"
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: 500,
                              fontStyle: "Medium",
                              fontSize: "14px",
                            }}
                          >
                            {template.title}
                          </h4>
                          <p className="text-white/40 text-xs">
                            Update {updatedAt}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-white/80 hover:text-white/100 transition-colors">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-[#1a1a1a] border-white/10 text-white"
                          >
                            <DropdownMenuItem
                              onClick={() => handleEdit(template)}
                              className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(template)}
                              className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setTemplateToDelete(template)}
                              className="cursor-pointer hover:bg-red-500/20 focus:bg-red-500/20 text-red-400"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="border-b border-white/30"></div>
                      {/* Stats Grid - Horizontal Layout */}
                      <div className="flex items-start gap-3 flex-wrap">
                        {/* Run Time */}
                        <div className="flex items-center gap-2 text-sm">
                          <Clock
                            className="w-5 h-5 text-[#5A9EA1]"
                            strokeWidth={2}
                          />
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "Inter",
                              fontWeight: 400,
                              fontStyle: "Regular",
                              fontSize: "12px",
                              color: "#FFFFFF99",
                            }}
                          >
                            Run Time: {template.numberOfDaysToRun} days
                          </span>
                        </div>

                        {/* Calendar */}
                        <div className="flex items-center gap-2 text-sm ml-auto">
                          <Calendar
                            className="w-5 h-5 text-[#5A9EA1]"
                            strokeWidth={2}
                          />
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "Inter",
                              fontWeight: 400,
                              fontStyle: "Regular",
                              fontSize: "12px",
                              color: "#FFFFFF99",
                            }}
                          >
                            {new Date()
                              .toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                              .replace(/ /g, " - ")}
                          </span>
                        </div>
                      </div>

                      {/* Communication Channels Row */}
                      <div className="flex items-center justify-between gap-6">
                        {/* Emails */}
                        <div className="flex items-center gap-2 text-sm">
                          <Mail
                            className="w-5 h-5 text-[#5A9EA1]"
                            strokeWidth={2}
                          />
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "Inter",
                              fontWeight: 400,
                              fontStyle: "Regular",
                              fontSize: "12px",
                              color: "#FFFFFF99",
                            }}
                          >
                            {template.numberOfEmails
                              .toString()
                              .padStart(2, "0")}{" "}
                            Emails
                          </span>
                        </div>

                        {/* Messages */}
                        <div className="flex items-center gap-2 text-sm">
                          <MessageSquare
                            className="w-5 h-5 text-[#5A9EA1]"
                            strokeWidth={2}
                          />
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "Inter",
                              fontWeight: 400,
                              fontStyle: "Regular",
                              fontSize: "12px",
                              color: "#FFFFFF99",
                            }}
                          >
                            {template.numberOfWhatsappMessages
                              .toString()
                              .padStart(2, "0")}{" "}
                            Message
                          </span>
                        </div>

                        {/* Calls */}
                        <div className="flex items-center gap-2 text-sm">
                          <Phone
                            className="w-5 h-5 text-[#5A9EA1]"
                            strokeWidth={2}
                          />
                          <span
                            className="text-sm"
                            style={{
                              fontFamily: "Inter",
                              fontWeight: 400,
                              fontStyle: "Regular",
                              fontSize: "12px",
                              color: "#FFFFFF99",
                            }}
                          >
                            {template.numberOfCalls.toString().padStart(2, "0")}{" "}
                            Calls
                          </span>
                        </div>
                      </div>

                      {/* Footer: Day Time and Run Button */}
                      <div className="flex items-center justify-between pt-2">
                        <span
                          style={{
                            fontFamily: "Inter",
                            fontWeight: 400,
                            fontStyle: "Regular",
                            fontSize: "10px",
                            textAlign: "center",
                            color: "#FFFFFF80",
                          }}
                        >
                          Day time: {template.timeOfDayToRun} (UTC)
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="relative h-8 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all overflow-hidden"
                          style={{
                            background: "#FFFFFF1A",
                            boxShadow:
                              "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                          }}
                        >
                          {/* gradient element left to right */}
                          <div
                            className="absolute left-0 top-0 bottom-0 right-0 pointer-events-none rounded-full"
                            style={{
                              background:
                                "linear-gradient(to right, #66AFB7 0%, transparent 60%)",
                              zIndex: 0,
                            }}
                          ></div>
                          <span
                            className="relative z-10"
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: 400,
                              fontStyle: "Regular",
                              fontSize: "10px",
                              color: "#FFFFFF",
                            }}
                          >
                            Run Templates
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          <ActiveFollowUpPlans />
        )}
      </div>

      {/* Template Form Modal */}
      <TemplateFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode={formMode}
        template={selectedTemplate}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!templateToDelete}
        title="Delete Template"
        description={`Are you sure you want to delete "${templateToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setTemplateToDelete(null)}
        confirmVariant="destructive"
        isPending={isDeleting}
      />
    </div>
  );
});

FollowUpTemplates.displayName = "FollowUpTemplates";

export default FollowUpTemplates;
