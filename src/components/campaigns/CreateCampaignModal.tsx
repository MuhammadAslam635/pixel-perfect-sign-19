import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, ImageIcon, Circle, CheckCircle2, Loader2 } from "lucide-react";
import { CreateCampaignData, campaignsService, CampaignStreamEvent, DocumentCreationStep } from "@/services/campaigns.service";
import { useToast } from "@/hooks/use-toast";
import ImageCarousel from "./ImageCarousel";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Partial<CreateCampaignData>;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [formData, setFormData] = useState<CreateCampaignData>({
    name: "",
    userRequirements: "",
    campaignType: "awareness",
    platform: [],
    targetAudience: "all",
    location: "",
    estimatedBudget: 0,
    numberOfDays: 1,
    status: "draft",
  });
  const [media, setMedia] = useState<string[]>([]);
  const [documentSteps, setDocumentSteps] = useState<DocumentCreationStep[]>([
    {
      name: "Market Research Document",
      description: "Analyzing market insights and competitive landscape",
      status: "pending",
    },
    {
      name: "Offer/Service Brief",
      description: "Developing value propositions and messaging framework",
      status: "pending",
    },
    {
      name: "Necessary Briefs",
      description: "Generating campaign objectives and requirements",
      status: "pending",
    },
    {
      name: "Brand/Design Guidelines",
      description: "Developing visual identity and design specifications",
      status: "pending",
    },
  ]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  // Pre-fill form with initial data (e.g., from campaign suggestions)
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        name: "",
        userRequirements: "",
        campaignType: "awareness",
        platform: [],
        targetAudience: "all",
        location: "",
        estimatedBudget: 0,
        numberOfDays: 1,
        status: "draft",
      });
    }
  }, [initialData, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Convert files to base64 URLs (for preview only - backend doesn't accept media during creation)
    const newImageUrls: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImageUrls.push(reader.result as string);
        if (newImageUrls.length === files.length) {
          setMedia([...media, ...newImageUrls]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index);
    setMedia(newMedia);
  };

  const handlePlatformChange = (value: string) => {
    if (formData.platform.includes(value as "facebook" | "google")) {
      // Remove platform
      setFormData({
        ...formData,
        platform: formData.platform.filter((p) => p !== value),
      });
    } else {
      // Add platform
      setFormData({
        ...formData,
        platform: [...formData.platform, value as "facebook" | "google"],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Validation error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.name.includes(" ")) {
      toast({
        title: "Validation error",
        description: "Campaign name cannot contain spaces",
        variant: "destructive",
      });
      return;
    }

    if (!formData.userRequirements.trim()) {
      toast({
        title: "Validation error",
        description: "User requirements are required",
        variant: "destructive",
      });
      return;
    }

    if (formData.platform.length === 0) {
      toast({
        title: "Validation error",
        description: "At least one platform is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.location.trim()) {
      toast({
        title: "Validation error",
        description: "Location is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.estimatedBudget <= 0) {
      toast({
        title: "Validation error",
        description: "Estimated budget must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.numberOfDays < 1) {
      toast({
        title: "Validation error",
        description: "Number of days must be at least 1",
        variant: "destructive",
      });
      return;
    }

    setIsPending(true);
    setIsStreaming(true);
    setCurrentStep("Creating campaign...");

    // Reset document steps status
    setDocumentSteps([
      {
        name: "Market Research Document",
        description: "Analyzing market insights and competitive landscape",
        status: "pending",
      },
      {
        name: "Offer/Service Brief",
        description: "Developing value propositions and messaging framework",
        status: "pending",
      },
      {
        name: "Necessary Briefs",
        description: "Generating campaign objectives and requirements",
        status: "pending",
      },
      {
        name: "Brand/Design Guidelines",
        description: "Developing visual identity and design specifications",
        status: "pending",
      },
    ]);

    campaignsService
      .createCampaignStream(formData, (event: CampaignStreamEvent) => {
        // Handle streaming events
        if (event.type === "step") {
          setCurrentStep(event.step || null);
          
          // Update document steps based on step name
          if (event.step) {
            const stepName = event.step.toLowerCase();
            const description = event.description?.toLowerCase() || "";
            
            setDocumentSteps((prev) =>
              prev.map((step) => {
                const stepNameLower = step.name.toLowerCase();
                
                // Check if this step matches the current event
                const isMarketResearch = 
                  (stepNameLower.includes("market research") && 
                   (stepName.includes("market research") || description.includes("market")));
                
                const isOfferService = 
                  (stepNameLower.includes("offer") || stepNameLower.includes("service brief")) &&
                  (stepName.includes("offer") || stepName.includes("service") || description.includes("value proposition"));
                
                const isNecessaryBriefs = 
                  stepNameLower.includes("necessary briefs") &&
                  (stepName.includes("necessary") || description.includes("objectives"));
                
                const isBrandDesign = 
                  (stepNameLower.includes("brand") || stepNameLower.includes("design")) &&
                  (stepName.includes("brand") || stepName.includes("design") || description.includes("visual identity"));
                
                if (isMarketResearch || isOfferService || isNecessaryBriefs || isBrandDesign) {
                  // If step name includes "completed", mark as completed
                  if (stepName.includes("completed") || stepName.includes("successfully")) {
                    return { ...step, status: "completed" };
                  }
                  // Otherwise mark as in-progress
                  return { ...step, status: "in-progress" };
                }
                
                return step;
              })
            );
          }
        } else if (event.type === "campaign_created") {
          setCurrentStep("Campaign created successfully");
        } else if (event.type === "workflow_completed") {
          setCurrentStep("Workflow completed");
        } else if (event.type === "result") {
          setIsStreaming(false);
          setCurrentStep(null);
          toast({
            title: "Campaign created",
            description: `"${formData.name}" has been created successfully. The system is now running research, then will create content and generate media automatically.`,
          });

          // Reset form
          setFormData({
            name: "",
            userRequirements: "",
            campaignType: "awareness",
            platform: [],
            targetAudience: "all",
            location: "",
            estimatedBudget: 0,
            numberOfDays: 1,
            status: "draft",
          });
          setMedia([]);
          setIsPending(false);
          onClose();
          if (onSuccess) {
            onSuccess();
          }
        } else if (event.type === "error") {
          setIsStreaming(false);
          setCurrentStep(null);
          setIsPending(false);
          toast({
            title: "Creation failed",
            description: event.message || event.error || "Failed to create campaign",
            variant: "destructive",
          });
        }
      })
      .catch((error: any) => {
        setIsStreaming(false);
        setCurrentStep(null);
        setIsPending(false);
        toast({
          title: "Creation failed",
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to create campaign",
          variant: "destructive",
        });
      });
  };

  const handleClose = () => {
    if (!isPending) {
      setFormData({
        name: "",
        userRequirements: "",
        campaignType: "awareness",
        platform: [],
        targetAudience: "all",
        location: "",
        estimatedBudget: 0,
        numberOfDays: 1,
        status: "draft",
      });
      setMedia([]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col p-0 text-white border border-white/10 overflow-hidden rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.55)] "
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
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
            <DialogTitle className="text-xs sm:text-sm font-semibold text-white drop-shadow-lg -mb-1">
              Create New Campaign
            </DialogTitle>
            <DialogDescription className="text-xs text-white/70">
              Fill in the details to create a new marketing campaign
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide py-4 min-h-0">
              {/* Campaign Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs text-white/70">
                  Campaign Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value.replace(/\s/g, ""),
                    })
                  }
                  placeholder="e.g., Summer-Sale-2024 (no spaces allowed)"
                  required
                  disabled={isPending}
                  className="bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                />
              </div>

              {/* User Requirements */}
              <div className="space-y-2">
                <Label
                  htmlFor="userRequirements"
                  className="text-xs text-white/70"
                >
                  Requirements <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="userRequirements"
                  value={formData.userRequirements}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      userRequirements: e.target.value,
                    })
                  }
                  placeholder="Describe what you want to achieve with this campaign..."
                  rows={4}
                  required
                  disabled={isPending}
                  className="bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                />
              </div>

              {/* Campaign Type */}
              <div className="space-y-2">
                <Label htmlFor="campaignType" className="text-xs text-white/70">
                  Campaign Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.campaignType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      campaignType: value as CreateCampaignData["campaignType"],
                    })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="campaignType"
                    className="bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs focus:bg-white/10 focus:border-white/30 transition-all"
                  >
                    <SelectValue placeholder="Select campaign type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/10 backdrop-blur-xl border-white/20">
                    <SelectItem value="awareness">Awareness</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <Label className="text-xs text-white/70">
                  Platform <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={
                      formData.platform.includes("facebook")
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handlePlatformChange("facebook")}
                    disabled={isPending}
                    className={
                      formData.platform.includes("facebook")
                        ? "bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all"
                        : "bg-white/5 backdrop-blur-sm border border-white/40 text-white/85 hover:bg-[#2F2F2F]/60 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] transition-all"
                    }
                    style={
                      formData.platform.includes("facebook")
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
                      formData.platform.includes("google")
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handlePlatformChange("google")}
                    disabled={isPending}
                    className={
                      formData.platform.includes("google")
                        ? "bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all"
                        : "bg-white/5 backdrop-blur-sm border border-white/40 text-white/85 hover:bg-[#2F2F2F]/60 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] transition-all"
                    }
                    style={
                      formData.platform.includes("google")
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
                {formData.platform.length === 0 && (
                  <p className="text-sm text-red-400">
                    At least one platform is required
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs text-white/70">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., South Asia, North America"
                  required
                  disabled={isPending}
                  className="bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label
                  htmlFor="targetAudience"
                  className="text-xs text-white/70"
                >
                  Target Audience <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.targetAudience}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      targetAudience:
                        value as CreateCampaignData["targetAudience"],
                    })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="targetAudience"
                    className="bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs focus:bg-white/10 focus:border-white/30 transition-all"
                  >
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/10 backdrop-blur-xl border-white/20">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="children">Children</SelectItem>
                    <SelectItem value="youth">Youth</SelectItem>
                    <SelectItem value="adults">Adults</SelectItem>
                    <SelectItem value="teenagers">Teenagers</SelectItem>
                    <SelectItem value="seniors">Seniors</SelectItem>
                    <SelectItem value="elders">Elders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget and Days */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="estimatedBudget"
                    className="text-xs text-white/70"
                  >
                    Estimated Budget ($) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="estimatedBudget"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.estimatedBudget || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        estimatedBudget: e.target.value
                          ? parseFloat(e.target.value)
                          : 0,
                      })
                    }
                    placeholder="0.00"
                    required
                    disabled={isPending}
                    className="bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="numberOfDays"
                    className="text-xs text-white/70"
                  >
                    Number of Days <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="numberOfDays"
                    type="number"
                    min="1"
                    value={formData.numberOfDays || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numberOfDays: e.target.value
                          ? parseInt(e.target.value, 10)
                          : 1,
                      })
                    }
                    placeholder="e.g., 5"
                    required
                    disabled={isPending}
                    className="bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status" className="text-xs text-white/70">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      status: value as CreateCampaignData["status"],
                    })
                  }
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="status"
                    className="bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs focus:bg-white/10 focus:border-white/30 transition-all"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/10 backdrop-blur-xl border-white/20">
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Media Upload (Preview Only - Note: Backend doesn't accept media during creation) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-white/70">
                    Media Preview (Optional)
                  </Label>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="create-image-upload"
                      disabled={isPending}
                    />
                    <Label htmlFor="create-image-upload">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        asChild
                        disabled={isPending}
                        className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all"
                      >
                        <span className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Images
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Note: Media will be generated automatically after campaign
                  creation. Uploaded images are for preview only.
                </p>
                {media && media.length > 0 ? (
                  <ImageCarousel
                    images={media}
                    onRemove={handleRemoveImage}
                    editable={true}
                  />
                ) : (
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center text-gray-300/80 bg-white/5 backdrop-blur-sm">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No images uploaded</p>
                    <p className="text-xs mt-1">
                      Click "Upload Images" to add media preview
                    </p>
                  </div>
                )}
              </div>

              {/* Document Creation Steps */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-white/70 font-semibold">
                    Document Creation Steps
                  </Label>
                  {isStreaming && currentStep && (
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{currentStep}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  {isStreaming
                    ? "Documents are being generated in real-time..."
                    : "After campaign creation, the following documents will be automatically generated:"}
                </p>
                <div className="space-y-2">
                  {documentSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-3 p-2 rounded-lg backdrop-blur-sm border transition-all ${
                        step.status === "completed"
                          ? "bg-green-500/10 border-green-500/30"
                          : step.status === "in-progress"
                          ? "bg-blue-500/10 border-blue-500/30"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      {step.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-400 flex-shrink-0" />
                      ) : step.status === "in-progress" ? (
                        <Loader2 className="w-4 h-4 mt-0.5 text-blue-400 animate-spin flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 mt-0.5 text-white/50 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white">
                          {step.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">
                  {isStreaming
                    ? "These documents are being created in parallel, followed by content creation and media generation."
                    : "These documents will be created in parallel, followed by content creation and media generation."}
                </p>
              </div>
            </div>

            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all"
                style={{
                  background:
                    "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
                }}
              >
                {isPending ? "Creating..." : "Create Campaign"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignModal;
