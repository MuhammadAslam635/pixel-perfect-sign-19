import AnalyticsCard from "@/pages/company/campaigns/components/AnalyticsCard";
import ImageCarousel from "@/pages/company/campaigns/components/ImageCarousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Campaign } from "@/services/campaigns.service";
import { CalendarIcon, Clock, Edit2, FileText, ImageIcon, Loader2, RefreshCw, RotateCcw, Save, SaveAll, Search, Trash2, X } from "lucide-react";

interface CampaignDetailsDialogProps {
    // modal
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    // campaign data
    selectedCampaign: Campaign | null;
    editedCampaign: Campaign | null;
    setEditedCampaign: (campaign: Campaign) => void;
    // states
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
    isLoadingCampaignDetails: boolean;
    setDeleteDialogOpen: (open: boolean) => void;
    // ids
    setViewingCampaignId: (id: string | null) => void;
    // actions
    handleSave: () => void;
    handleCancelEdit: () => void;
    handleResetContent: () => void;
    handleResetMedia: () => void;
    // flags
    isUpdating: boolean;
    isDeleting: boolean;
    isRegenerating: boolean;
    isResettingContent: boolean;
    isResettingMedia: boolean;
    // regenerate
    setRegenerateType: (type: "content" | "media" | "both") => void;
    setRegenerateDialogOpen: (open: boolean) => void;
    // utils
    formatDate: (date: string) => string;
    getStatusColor: (status: string) => string;
    renderTextWithLinks: (text?: string | null) => React.ReactNode;
    renderCleanContent: (text?: string) => React.ReactNode;
}

export function CampaignDetailsDialog({
    isModalOpen,
    setIsModalOpen,
    selectedCampaign,
    editedCampaign,
    setEditedCampaign,
    isEditing,
    setIsEditing,
    isLoadingCampaignDetails,
    setDeleteDialogOpen,
    setViewingCampaignId,
    handleSave,
    handleCancelEdit,
    handleResetContent,
    handleResetMedia,
    isUpdating,
    isDeleting,
    isRegenerating,
    isResettingContent,
    isResettingMedia,
    setRegenerateType,
    setRegenerateDialogOpen,
    formatDate,
    getStatusColor,
    renderTextWithLinks,
    renderCleanContent,
}: CampaignDetailsDialogProps) {
    return (
        <Dialog
            open={isModalOpen}
            onOpenChange={(open) => {
                setIsModalOpen(open);
                if (!open) {
                    setIsEditing(false);
                    setViewingCampaignId(null);
                    if (selectedCampaign) {
                        setEditedCampaign(selectedCampaign);
                    }
                }
            }}
        >
            <DialogContent
                className="max-w-4xl max-h-[90vh] flex flex-col p-0 text-white border border-white/10 overflow-hidden rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
                style={{
                    background: "#0a0a0a",
                }}
            >
                {/* Glassmorphism Background - pointer-events-none so they don't block clicks */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                    }}
                />

                <div className="relative z-10 flex flex-col h-full min-h-0">
                    {isLoadingCampaignDetails ||
                        !selectedCampaign ||
                        !editedCampaign ? (
                        <>
                            <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
                                <DialogTitle className="text-xs sm:text-sm font-semibold text-white drop-shadow-lg">
                                    Loading Campaign Details
                                </DialogTitle>
                                <DialogDescription className="text-xs text-white/70">
                                    Please wait while we fetch the latest campaign information
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 px-6">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                                <p className="text-sm text-gray-300">
                                    Loading campaign details...
                                </p>
                            </div>
                        </>
                    ) : selectedCampaign && editedCampaign ? (
                        <>
                            <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <DialogTitle className="text-xs sm:text-sm font-semibold break-words text-white drop-shadow-lg">
                                            {isEditing ? (
                                                <Input
                                                    value={editedCampaign.name}
                                                    onChange={(e) =>
                                                        setEditedCampaign({
                                                            ...editedCampaign,
                                                            name: e.target.value,
                                                        })
                                                    }
                                                    className="text-xs sm:text-sm font-semibold bg-white/5 backdrop-blur-sm border-white/20 text-white focus:bg-white/10 focus:border-white/30 transition-all"
                                                />
                                            ) : (
                                                selectedCampaign.name
                                            )}
                                        </DialogTitle>
                                        <DialogDescription className="break-words text-xs text-white/70 mt-2">
                                            Campaign details and progress
                                        </DialogDescription>
                                    </div>
                                    {!isEditing ? (
                                        <div className="flex gap-2 ml-2 pr-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setRegenerateType("both");
                                                    setRegenerateDialogOpen(true);
                                                }}
                                                disabled={isRegenerating}
                                                className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs h-7 px-3 py-1"
                                            >
                                                <RefreshCw className="w-3 h-3 mr-1.5" />
                                                Regenerate Both
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditing(true)}
                                                className="text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all text-xs h-7 px-3 py-1"
                                            >
                                                <Edit2 className="w-3 h-3 mr-1.5" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setDeleteDialogOpen(true)}
                                                disabled={isDeleting}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 backdrop-blur-sm transition-all text-xs h-7 px-3 py-1"
                                            >
                                                <Trash2 className="w-3 h-3 mr-1.5" />
                                                Delete
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 ml-2 pr-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCancelEdit}
                                                disabled={isUpdating}
                                                className="text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all text-xs h-7 px-3 py-1"
                                            >
                                                <X className="w-3 h-3 mr-1.5" />
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleSave}
                                                disabled={isUpdating}
                                                className="bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all text-xs h-7 px-3 py-1"
                                                style={{
                                                    background:
                                                        "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
                                                }}
                                            >
                                                <Save className="w-3 h-3 mr-1.5" />
                                                {isUpdating ? "Saving..." : "Save"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide py-4 min-h-0">
                                {/* Status Section */}
                                <div className="flex flex-wrap gap-4 items-center">
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs text-white/70">
                                                Status:
                                            </Label>
                                            <Select
                                                value={editedCampaign.status}
                                                onValueChange={(value) =>
                                                    setEditedCampaign({
                                                        ...editedCampaign,
                                                        status: value as any,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-[180px] bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs focus:bg-white/10 focus:border-white/30 transition-all h-7">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white/10 backdrop-blur-xl border-white/20">
                                                    <SelectItem value="draft">Draft</SelectItem>
                                                    <SelectItem value="in-progress">
                                                        In Progress
                                                    </SelectItem>
                                                    <SelectItem value="paused">Paused</SelectItem>
                                                    <SelectItem value="completed">
                                                        Completed
                                                    </SelectItem>
                                                    <SelectItem value="cancelled">
                                                        Cancelled
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <Badge
                                            className={getStatusColor(selectedCampaign.status)}
                                        >
                                            {selectedCampaign.status}
                                        </Badge>
                                    )}
                                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                                        <Clock className="w-4 h-4 flex-shrink-0" />
                                        <span className="break-words">
                                            Last updated: {formatDate(selectedCampaign.updatedAt)}
                                        </span>
                                    </div>
                                </div>

                                <Separator className="bg-white/10" />

                                {/* Analytics Card */}
                                {selectedCampaign && selectedCampaign._id && (
                                    <AnalyticsCard campaignId={selectedCampaign._id} />
                                )}

                                <Separator className="bg-white/10" />

                                {/* User Requirements */}
                                <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                                    <CardHeader className="px-4 py-3">
                                        <CardTitle className="text-xs flex items-center gap-2 text-white drop-shadow-md">
                                            <FileText className="w-5 h-5" />
                                            Requirements
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4">
                                        {isEditing ? (
                                            <Textarea
                                                value={editedCampaign.userRequirements}
                                                onChange={(e) =>
                                                    setEditedCampaign({
                                                        ...editedCampaign,
                                                        userRequirements: e.target.value,
                                                    })
                                                }
                                                rows={4}
                                                className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                                            />
                                        ) : (
                                            <p className="text-xs text-gray-300/90 whitespace-pre-wrap break-words">
                                                {renderTextWithLinks(
                                                    selectedCampaign.userRequirements
                                                )}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Research Documents */}
                                {selectedCampaign.researchDocs &&
                                    (selectedCampaign.researchDocs.marketResearch?.content ||
                                        selectedCampaign.researchDocs.offerServiceBrief
                                            ?.content ||
                                        selectedCampaign.researchDocs.necessaryBriefs
                                            ?.content ||
                                        selectedCampaign.researchDocs.brandDesign?.content) && (
                                        <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                                            <CardHeader className="px-4 py-3">
                                                <CardTitle className="text-xs flex items-center gap-2 text-white drop-shadow-md">
                                                    <Search className="w-5 h-5" />
                                                    Research Documents
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="px-4 pb-4">
                                                <Accordion
                                                    type="single"
                                                    collapsible
                                                    className="w-full"
                                                >
                                                    {selectedCampaign.researchDocs.marketResearch
                                                        ?.content && (
                                                            <AccordionItem
                                                                value="market-research"
                                                                className="border-b border-white/10"
                                                            >
                                                                <AccordionTrigger className="text-xs text-white hover:no-underline py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium">
                                                                            Market Research
                                                                        </span>
                                                                        {selectedCampaign.researchDocs
                                                                            .marketResearch.status && (
                                                                                <Badge
                                                                                    className={
                                                                                        selectedCampaign.researchDocs
                                                                                            .marketResearch.status ===
                                                                                            "completed"
                                                                                            ? "bg-green-500/20 text-green-300 border-green-400/50 text-[10px]"
                                                                                            : selectedCampaign.researchDocs
                                                                                                .marketResearch.status ===
                                                                                                "in-progress"
                                                                                                ? "bg-blue-500/20 text-blue-300 border-blue-400/50 text-[10px]"
                                                                                                : "bg-gray-500/20 text-gray-300 border-gray-400/50 text-[10px]"
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        selectedCampaign.researchDocs
                                                                                            .marketResearch.status
                                                                                    }
                                                                                </Badge>
                                                                            )}
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="pt-2 pb-4">
                                                                    <div className="space-y-2">
                                                                        {selectedCampaign.researchDocs
                                                                            .marketResearch.createdAt && (
                                                                                <div className="text-[10px] text-gray-400">
                                                                                    Created:{" "}
                                                                                    {formatDate(
                                                                                        selectedCampaign.researchDocs
                                                                                            .marketResearch
                                                                                            .createdAt as string
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        <div className="max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                                            <p className="text-xs text-gray-300/90 whitespace-pre-wrap break-words">
                                                                                {renderCleanContent(
                                                                                    selectedCampaign.researchDocs.marketResearch.content
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        )}

                                                    {selectedCampaign.researchDocs.offerServiceBrief
                                                        ?.content && (
                                                            <AccordionItem
                                                                value="offer-service-brief"
                                                                className="border-b border-white/10"
                                                            >
                                                                <AccordionTrigger className="text-xs text-white hover:no-underline py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium">
                                                                            Offer/Service Brief
                                                                        </span>
                                                                        {selectedCampaign.researchDocs
                                                                            .offerServiceBrief.status && (
                                                                                <Badge
                                                                                    className={
                                                                                        selectedCampaign.researchDocs
                                                                                            .offerServiceBrief.status ===
                                                                                            "completed"
                                                                                            ? "bg-green-500/20 text-green-300 border-green-400/50 text-[10px]"
                                                                                            : selectedCampaign.researchDocs
                                                                                                .offerServiceBrief.status ===
                                                                                                "in-progress"
                                                                                                ? "bg-blue-500/20 text-blue-300 border-blue-400/50 text-[10px]"
                                                                                                : "bg-gray-500/20 text-gray-300 border-gray-400/50 text-[10px]"
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        selectedCampaign.researchDocs
                                                                                            .offerServiceBrief.status
                                                                                    }
                                                                                </Badge>
                                                                            )}
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="pt-2 pb-4">
                                                                    <div className="space-y-2">
                                                                        {selectedCampaign.researchDocs
                                                                            .offerServiceBrief.createdAt && (
                                                                                <div className="text-[10px] text-gray-400">
                                                                                    Created:{" "}
                                                                                    {formatDate(
                                                                                        selectedCampaign.researchDocs
                                                                                            .offerServiceBrief
                                                                                            .createdAt as string
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        <div className="max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                                            <p className="text-xs text-gray-300/90 whitespace-pre-wrap break-words">
                                                                                {renderCleanContent(
                                                                                    selectedCampaign.researchDocs.offerServiceBrief.content
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        )}

                                                    {selectedCampaign.researchDocs.necessaryBriefs
                                                        ?.content && (
                                                            <AccordionItem
                                                                value="necessary-briefs"
                                                                className="border-b border-white/10"
                                                            >
                                                                <AccordionTrigger className="text-xs text-white hover:no-underline py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium">
                                                                            Campaign Brief
                                                                        </span>
                                                                        {selectedCampaign.researchDocs
                                                                            .necessaryBriefs.status && (
                                                                                <Badge
                                                                                    className={
                                                                                        selectedCampaign.researchDocs
                                                                                            .necessaryBriefs.status ===
                                                                                            "completed"
                                                                                            ? "bg-green-500/20 text-green-300 border-green-400/50 text-[10px]"
                                                                                            : selectedCampaign.researchDocs
                                                                                                .necessaryBriefs.status ===
                                                                                                "in-progress"
                                                                                                ? "bg-blue-500/20 text-blue-300 border-blue-400/50 text-[10px]"
                                                                                                : "bg-gray-500/20 text-gray-300 border-gray-400/50 text-[10px]"
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        selectedCampaign.researchDocs
                                                                                            .necessaryBriefs.status
                                                                                    }
                                                                                </Badge>
                                                                            )}
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="pt-2 pb-4">
                                                                    <div className="space-y-2">
                                                                        {selectedCampaign.researchDocs
                                                                            .necessaryBriefs.createdAt && (
                                                                                <div className="text-[10px] text-gray-400">
                                                                                    Created:{" "}
                                                                                    {formatDate(
                                                                                        selectedCampaign.researchDocs
                                                                                            .necessaryBriefs
                                                                                            .createdAt as string
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        <div className="max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                                            <p className="text-xs text-gray-300/90 whitespace-pre-wrap break-words">
                                                                                {renderCleanContent(
                                                                                    selectedCampaign.researchDocs.necessaryBriefs.content
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        )}

                                                    {selectedCampaign.researchDocs.brandDesign
                                                        ?.content && (
                                                            <AccordionItem
                                                                value="brand-design"
                                                                className="border-b border-white/10"
                                                            >
                                                                <AccordionTrigger className="text-xs text-white hover:no-underline py-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium">
                                                                            Brand & Design Guidelines
                                                                        </span>
                                                                        {selectedCampaign.researchDocs.brandDesign
                                                                            .status && (
                                                                                <Badge
                                                                                    className={
                                                                                        selectedCampaign.researchDocs
                                                                                            .brandDesign.status ===
                                                                                            "completed"
                                                                                            ? "bg-green-500/20 text-green-300 border-green-400/50 text-[10px]"
                                                                                            : selectedCampaign.researchDocs
                                                                                                .brandDesign.status ===
                                                                                                "in-progress"
                                                                                                ? "bg-blue-500/20 text-blue-300 border-blue-400/50 text-[10px]"
                                                                                                : "bg-gray-500/20 text-gray-300 border-gray-400/50 text-[10px]"
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        selectedCampaign.researchDocs
                                                                                            .brandDesign.status
                                                                                    }
                                                                                </Badge>
                                                                            )}
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="pt-2 pb-4">
                                                                    <div className="space-y-2">
                                                                        {selectedCampaign.researchDocs.brandDesign
                                                                            .createdAt && (
                                                                                <div className="text-[10px] text-gray-400">
                                                                                    Created:{" "}
                                                                                    {formatDate(
                                                                                        selectedCampaign.researchDocs
                                                                                            .brandDesign.createdAt as string
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        <div className="max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                                                            <p className="text-xs text-gray-300/90 whitespace-pre-wrap break-words">
                                                                                {renderCleanContent(
                                                                                    selectedCampaign.researchDocs.brandDesign.content
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        )}
                                                </Accordion>
                                            </CardContent>
                                        </Card>
                                    )}

                                {/* Research Generation Indicator */}
                                {selectedCampaign.processingStatus?.research?.status ===
                                    "in-progress" && (
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                                            <div className="flex items-center gap-2 text-blue-400">
                                                <Search className="w-4 h-4" />
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-sm font-medium">
                                                    Generating research documents...
                                                </span>
                                            </div>
                                            <p className="text-xs text-blue-300/70 mt-1 ml-6">
                                                This may take a few moments
                                            </p>
                                        </div>
                                    )}

                                {/* Content */}
                                <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                                    <CardHeader className="px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xs flex items-center gap-2 text-white drop-shadow-md">
                                                <FileText className="w-5 h-5" />
                                                Content
                                                {selectedCampaign.processingStatus?.content
                                                    ?.status === "in-progress" && (
                                                        <div className="flex items-center gap-1 text-blue-400">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            <span className="text-xs">Generating...</span>
                                                        </div>
                                                    )}
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                {!isEditing && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setRegenerateType("content");
                                                                setRegenerateDialogOpen(true);
                                                            }}
                                                            disabled={
                                                                isRegenerating ||
                                                                selectedCampaign.processingStatus?.content
                                                                    ?.status === "in-progress"
                                                            }
                                                            className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs h-7 px-3 py-1"
                                                        >
                                                            <RefreshCw className="w-3 h-3 mr-1.5" />
                                                            Regenerate
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleResetContent}
                                                            disabled={
                                                                isResettingContent ||
                                                                selectedCampaign.processingStatus?.content
                                                                    ?.status === "in-progress"
                                                            }
                                                            className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs h-7 px-3 py-1"
                                                        >
                                                            <RotateCcw className="w-3 h-3 mr-1.5" />
                                                            Reset
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4">
                                        {selectedCampaign.processingStatus?.content?.status ===
                                            "in-progress" ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
                                                <p className="text-sm text-blue-300 font-medium">
                                                    Generating content...
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    This may take a few moments
                                                </p>
                                            </div>
                                        ) : isEditing ? (
                                            <Textarea
                                                value={editedCampaign.content || ""}
                                                onChange={(e) =>
                                                    setEditedCampaign({
                                                        ...editedCampaign,
                                                        content: e.target.value,
                                                    })
                                                }
                                                rows={6}
                                                className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                                                placeholder="Enter campaign content..."
                                            />
                                        ) : (
                                            <p className="text-xs text-gray-300/90 whitespace-pre-wrap break-words">
                                                {renderTextWithLinks(
                                                    selectedCampaign.content || "No content yet"
                                                )}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Media */}
                                <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                                    <CardHeader className="px-4 py-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xs flex items-center gap-2 text-white drop-shadow-md">
                                                <ImageIcon className="w-5 h-5" />
                                                Media (
                                                {isEditing
                                                    ? editedCampaign.media.length
                                                    : selectedCampaign.media.length}
                                                )
                                                {selectedCampaign.processingStatus?.media
                                                    ?.status === "in-progress" && (
                                                        <div className="flex items-center gap-1 text-blue-400">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            <span className="text-xs">Generating...</span>
                                                        </div>
                                                    )}
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                {!isEditing && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setRegenerateType("media");
                                                                setRegenerateDialogOpen(true);
                                                            }}
                                                            disabled={
                                                                isRegenerating ||
                                                                selectedCampaign.processingStatus?.media
                                                                    ?.status === "in-progress"
                                                            }
                                                            className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs h-7 px-3 py-1"
                                                        >
                                                            <RefreshCw className="w-3 h-3 mr-1.5" />
                                                            Regenerate
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleResetMedia}
                                                            disabled={
                                                                isResettingMedia ||
                                                                selectedCampaign.processingStatus?.media
                                                                    ?.status === "in-progress"
                                                            }
                                                            className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs h-7 px-3 py-1"
                                                        >
                                                            <RotateCcw className="w-3 h-3 mr-1.5" />
                                                            Reset
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-4 pb-4">
                                        {selectedCampaign.processingStatus?.media?.status ===
                                            "in-progress" ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
                                                <p className="text-sm text-blue-300 font-medium">
                                                    Generating media...
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    This may take a few moments
                                                </p>
                                            </div>
                                        ) : isEditing ? (
                                            editedCampaign.media.length > 0 ? (
                                                <ImageCarousel
                                                    images={editedCampaign.media}
                                                    onRemove={(index) => {
                                                        const newMedia = editedCampaign.media.filter(
                                                            (_, i) => i !== index
                                                        );
                                                        setEditedCampaign({
                                                            ...editedCampaign,
                                                            media: newMedia,
                                                        });
                                                    }}
                                                    editable={true}
                                                />
                                            ) : (
                                                <div className="text-center py-12 text-gray-400">
                                                    <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                    <p>No media uploaded yet</p>
                                                    <p className="text-xs mt-2">
                                                        Media will be generated automatically
                                                    </p>
                                                </div>
                                            )
                                        ) : selectedCampaign.media.length > 0 ? (
                                            <ImageCarousel
                                                images={selectedCampaign.media}
                                                editable={false}
                                            />
                                        ) : (
                                            <div className="text-center py-12 text-gray-400">
                                                <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                <p>No media available</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Campaign Details */}
                                <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                                    <CardHeader className="px-4 py-3">
                                        <CardTitle className="text-xs flex items-center gap-2 text-white drop-shadow-md">
                                            <CalendarIcon className="w-5 h-5" />
                                            Campaign Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 px-4 pb-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-gray-300/80 flex-shrink-0 text-xs">
                                                    Platform:
                                                </span>
                                                {isEditing ? (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant={
                                                                editedCampaign.platform?.includes(
                                                                    "facebook"
                                                                )
                                                                    ? "default"
                                                                    : "outline"
                                                            }
                                                            size="sm"
                                                            onClick={() => {
                                                                const currentPlatforms =
                                                                    editedCampaign.platform || [];
                                                                const newPlatforms =
                                                                    currentPlatforms.includes("facebook")
                                                                        ? currentPlatforms.filter(
                                                                            (p) => p !== "facebook"
                                                                        )
                                                                        : [...currentPlatforms, "facebook"];
                                                                setEditedCampaign({
                                                                    ...editedCampaign,
                                                                    platform: newPlatforms,
                                                                });
                                                            }}
                                                            className={
                                                                editedCampaign.platform?.includes(
                                                                    "facebook"
                                                                )
                                                                    ? "bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all text-xs h-7 px-3 py-1"
                                                                    : "bg-white/5 backdrop-blur-sm border border-white/40 text-white/85 hover:bg-[#2F2F2F]/60 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] transition-all text-xs h-7 px-3 py-1"
                                                            }
                                                            style={
                                                                editedCampaign.platform?.includes(
                                                                    "facebook"
                                                                )
                                                                    ? {
                                                                        background:
                                                                            "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
                                                                    }
                                                                    : undefined
                                                            }
                                                        >
                                                            Facebook
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={
                                                                editedCampaign.platform?.includes("google")
                                                                    ? "default"
                                                                    : "outline"
                                                            }
                                                            size="sm"
                                                            onClick={() => {
                                                                const currentPlatforms =
                                                                    editedCampaign.platform || [];
                                                                const newPlatforms =
                                                                    currentPlatforms.includes("google")
                                                                        ? currentPlatforms.filter(
                                                                            (p) => p !== "google"
                                                                        )
                                                                        : [...currentPlatforms, "google"];
                                                                setEditedCampaign({
                                                                    ...editedCampaign,
                                                                    platform: newPlatforms,
                                                                });
                                                            }}
                                                            className={
                                                                editedCampaign.platform?.includes("google")
                                                                    ? "bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all text-xs h-7 px-3 py-1"
                                                                    : "bg-white/5 backdrop-blur-sm border border-white/40 text-white/85 hover:bg-[#2F2F2F]/60 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] transition-all text-xs h-7 px-3 py-1"
                                                            }
                                                            style={
                                                                editedCampaign.platform?.includes("google")
                                                                    ? {
                                                                        background:
                                                                            "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
                                                                    }
                                                                    : undefined
                                                            }
                                                        >
                                                            Google
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="font-medium break-words uppercase text-white text-xs">
                                                        {selectedCampaign.platform?.join(", ") || "N/A"}
                                                    </span>
                                                )}
                                                {isEditing &&
                                                    (!editedCampaign.platform ||
                                                        editedCampaign.platform.length === 0) && (
                                                        <p className="text-xs text-red-400">
                                                            At least one platform is required
                                                        </p>
                                                    )}
                                            </div>
                                            <div className="flex justify-between text-xs gap-2">
                                                <span className="text-gray-300/80 flex-shrink-0">
                                                    Location:
                                                </span>
                                                <span className="font-medium break-words text-right uppercase text-white">
                                                    {selectedCampaign.location || "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs gap-2">
                                                <span className="text-gray-300/80 flex-shrink-0">
                                                    Target Audience:
                                                </span>
                                                <span className="font-medium break-words text-right uppercase text-white">
                                                    {selectedCampaign.targetAudience || "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs gap-2">
                                                <span className="text-gray-300/80 flex-shrink-0">
                                                    Estimated Budget:
                                                </span>
                                                <span className="font-medium break-words text-right text-white">
                                                    {selectedCampaign.estimatedBudget
                                                        ? `$${selectedCampaign.estimatedBudget}`
                                                        : "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs gap-2">
                                                <span className="text-gray-300/80 flex-shrink-0">
                                                    Number of Days:
                                                </span>
                                                <span className="font-medium break-words text-right uppercase text-white">
                                                    {selectedCampaign.numberOfDays
                                                        ? `${selectedCampaign.numberOfDays} DAYS`
                                                        : "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs gap-2">
                                                <span className="text-gray-300/80 flex-shrink-0">
                                                    Campaign Type:
                                                </span>
                                                <span className="font-medium break-words text-right uppercase text-white">
                                                    {selectedCampaign.campaignType || "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Timeline */}
                                <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                                    <CardHeader className="px-4 py-3">
                                        <CardTitle className="text-xs flex items-center gap-2 text-white drop-shadow-md">
                                            <CalendarIcon className="w-5 h-5" />
                                            Timeline
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 px-4 pb-4">
                                        <div className="flex justify-between text-xs gap-2">
                                            <span className="text-gray-300/80 flex-shrink-0">
                                                Created At:
                                            </span>
                                            <span className="font-medium break-words text-right text-white">
                                                {formatDate(selectedCampaign.createdAt)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs gap-2">
                                            <span className="text-gray-300/80 flex-shrink-0">
                                                Last Updated:
                                            </span>
                                            <span className="font-medium break-words text-right text-white">
                                                {formatDate(selectedCampaign.updatedAt)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs gap-2">
                                            <span className="text-gray-300/80 flex-shrink-0">
                                                Campaign ID:
                                            </span>
                                            <span className="font-mono text-xs break-all text-right text-white">
                                                {selectedCampaign._id}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
