import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RegenerateDialogProps {
    regenerateDialogOpen: boolean;
    setRegenerateDialogOpen: (open: boolean) => void;

    regenerateType: "content" | "media" | "research" | "both" | null;
    setRegenerateType: (type: "content" | "media" | "research" | "both" | null) => void;  // ✅ ADD THIS

    regenerateGuidelines: string;
    setRegenerateGuidelines: (value: string) => void;

    isRegenerating: boolean;
    handleRegenerate: () => void;
}


const RegenerateDialog: React.FC<RegenerateDialogProps> = ({
    regenerateDialogOpen,
    setRegenerateDialogOpen,
    regenerateType,
    setRegenerateType,
    regenerateGuidelines,
    setRegenerateGuidelines,
    isRegenerating,
    handleRegenerate,
}) => {
    return (
        <Dialog
            open={regenerateDialogOpen}
            onOpenChange={setRegenerateDialogOpen}
        >
            <DialogContent className="max-w-md text-white border-0 overflow-hidden p-0">
                {/* Glassmorphism Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-lg pointer-events-none" />
                <div className="absolute inset-0 bg-[#0b0f20]/80 backdrop-blur-md rounded-lg pointer-events-none" />
                <div className="absolute inset-[1px] bg-gradient-to-br from-white/5 to-transparent rounded-lg pointer-events-none" />
                <div className="absolute inset-0 border border-white/10 rounded-lg shadow-2xl shadow-black/50 pointer-events-none" />

                <div className="relative z-10 p-6">
                    <DialogHeader className="mb-4 pb-4 border-b border-white/10">
                        <DialogTitle className="text-xs sm:text-sm font-semibold text-white drop-shadow-lg ">
                            Regenerate Campaign {regenerateType}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-white/70">
                            This will reset and regenerate the {regenerateType} for this
                            campaign. You can provide new guidelines or use the original
                            requirements.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label
                                htmlFor="regenerate-guidelines"
                                className="text-xs text-white/70"
                            >
                                New Guidelines (Optional)
                            </Label>
                            <Textarea
                                id="regenerate-guidelines"
                                value={regenerateGuidelines}
                                onChange={(e) => setRegenerateGuidelines(e.target.value)}
                                placeholder="Enter new guidelines or leave empty to use original requirements..."
                                rows={4}
                                className="mt-1 bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setRegenerateDialogOpen(false);
                                    setRegenerateGuidelines("");
                                    setRegenerateType(null);
                                }}
                                disabled={isRegenerating}
                                className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs h-7 px-3 py-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleRegenerate}
                                disabled={isRegenerating}
                                className="bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all text-xs h-7 px-3 py-1"
                                style={{
                                    background:
                                        "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
                                }}
                            >
                                {isRegenerating ? "Starting..." : `Regenerate ${regenerateType}`}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RegenerateDialog;