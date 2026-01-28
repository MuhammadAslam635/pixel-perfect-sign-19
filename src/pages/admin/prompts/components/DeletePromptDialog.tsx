import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Company } from "@/services/admin.service";
import { Prompt } from "@/services/connectionMessages.service";

interface DeletePromptDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    promptToDelete: Prompt | null;
    companies: Company[];
    onConfirm: () => void;
}

export const DeletePromptDialog = ({ isOpen, onOpenChange, promptToDelete, companies, onConfirm }: DeletePromptDialogProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                        Are you sure you want to delete this prompt? This action cannot
                        be undone.
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
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                    >
                        Delete Prompt
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
