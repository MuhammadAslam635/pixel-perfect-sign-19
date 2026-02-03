import { useState, useMemo, forwardRef, useImperativeHandle } from "react";
import ActiveFollowUpPlans from "./ActiveFollowUpPlans";
import TemplateFormModal from "./TemplateFormModal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useFollowupTemplates, useDeleteFollowupTemplate, useDuplicateFollowupTemplate, } from "@/hooks/useFollowupTemplates";
import { FollowupTemplate } from "@/services/followupTemplates.service";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/utils/commonFunctions";
import FollowUpTemplates from "./FollowUpTemplates";


interface TemplatesProps {
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export interface TemplatesRef {
    createTemplate: () => void;
}

const Templates = forwardRef<TemplatesRef, TemplatesProps>(({ searchQuery = "", onSearchChange }, ref) => {
    const [activeTab, setActiveTab] = useState<"templates" | "plans">("plans");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [selectedTemplate, setSelectedTemplate] = useState<FollowupTemplate | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<FollowupTemplate | null>(null);
    const { toast } = useToast();
    const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteFollowupTemplate();
    const { mutate: duplicateTemplate, isPending: isDuplicating } = useDuplicateFollowupTemplate();

    // Fetch followup templates from API
    const { data: templatesData, isLoading, isError } = useFollowupTemplates({ search: searchQuery, limit: 100 });

    // Extract templates from response
    const templates = useMemo(() => {
        const templatesResponse = templatesData as { data?: { docs?: FollowupTemplate[] } } | undefined;
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

    useImperativeHandle(ref, () => ({ createTemplate: handleCreate }), []);

    const handleDuplicate = (template: FollowupTemplate) => {
        duplicateTemplate(template._id, {
            onSuccess: (response) => {
                toast({ title: "Template duplicated", description: response.message || `${template.title} has been duplicated.`, });
            },
            onError: (mutationError) => {
                toast({ title: "Unable to duplicate template", description: getErrorMessage(mutationError, "Please try again."), variant: "destructive", });
            },
        });
    };

    const handleDelete = () => {
        if (!templateToDelete) return;
        deleteTemplate(templateToDelete._id, {
            onSuccess: (response) => {
                toast({ title: "Template deleted", description: response.message || `${templateToDelete.title} was deleted.`, });
                setTemplateToDelete(null);
            },
            onError: (mutationError) => {
                toast({ title: "Unable to delete template", description: getErrorMessage(mutationError, "Please try again."), variant: "destructive", });
            },
        });
    };



    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-center justify-between mb-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 rounded-lg p-0.5">
                            <div className="relative pb-3">
                                <button onClick={() => setActiveTab("plans")} className={`px-3 py-1 rounded-md text-2xl font-medium transition-all ${activeTab === "plans" ? "text-white" : "text-[#FFFFFF4D] hover:text-white/80"}`}>
                                    Active Followup Plans
                                </button>
                                <p className={`px-3 py-0.5 rounded-md text-[10px] font-light transition-all ${activeTab === "plans" ? "text-white/70" : "text-[#FFFFFF4D]"}`}>
                                    View and manage your active followup campaigns
                                </p>
                            </div>
                            <div className="relative pb-3">
                                <button onClick={() => setActiveTab("templates")} className={`px-3 py-1.5 rounded-md text-2xl font-medium transition-all ${activeTab === "templates" ? "text-white" : "text-[#FFFFFF4D] hover:text-white/80"}`}>
                                    Follow-up Templates
                                </button>
                                <p className={`px-3 py-0.5 rounded-md text-[10px] font-light transition-all ${activeTab === "templates" ? "text-white/70" : "text-[#FFFFFF4D]"}`}>
                                    Manage templates for emails, calls & WhatsApp
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Bottom Border with Active Tab Indicator */}
                <div className="relative border-b border-white/20 mb-4">
                    <div className={`absolute bottom-0 h-[2px] bg-white transition-all duration-300 ${activeTab === "plans" ? "left-0 w-[280px]" : "left-[300px] w-[260px]"}`} />
                </div>
                {/* Conditional Content Based on Active Tab */}
                {activeTab === "templates" ? (
                    <FollowUpTemplates
                        templates={templates}
                        isLoading={isLoading}
                        isError={isError}
                        onEdit={handleEdit}
                        onDelete={setTemplateToDelete}
                        onDuplicate={handleDuplicate}
                    />

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

Templates.displayName = "Templates";

export default Templates;