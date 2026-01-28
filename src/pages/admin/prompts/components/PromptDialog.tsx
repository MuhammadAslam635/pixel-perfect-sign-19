import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PromptForm } from "./PromptForm";
import { Company } from "@/services/admin.service";
import { Prompt } from "@/services/connectionMessages.service";

interface PromptDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedPrompt: Prompt | null;
    formData: any;
    selectedCompanyForPrompt: Company | null;
    companies: Company[];
    companiesLoading: boolean;
    onFormDataChange: (field: any, value: any) => void;
    onCompanySelect: (company: Company | null) => void;
    onSubmit: () => void;
}

export const PromptDialog = ({
    isOpen,
    onOpenChange,
    selectedPrompt,
    formData,
    selectedCompanyForPrompt,
    companies,
    companiesLoading,
    onFormDataChange,
    onCompanySelect,
    onSubmit,
}: PromptDialogProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[linear-gradient(135deg,rgba(58,62,75,0.95),rgba(28,30,40,0.98))] border-cyan-500/20 text-white max-w-[95vw] lg:max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto hide-scrollbar">
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
                        onFormDataChange={onFormDataChange}
                        onCompanySelect={onCompanySelect}
                        onSubmit={onSubmit}
                        onCancel={() => onOpenChange(false)}
                        isEditing={!!selectedPrompt}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
