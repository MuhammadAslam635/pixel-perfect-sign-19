import React, { useState } from "react";
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
import { Upload, ImageIcon } from "lucide-react";
import { campaignsService, CreateCampaignData } from "@/services/campaigns.service";
import { useToast } from "@/hooks/use-toast";
import ImageCarousel from "./ImageCarousel";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState<boolean>(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      await campaignsService.createCampaign(formData);
      toast({
        title: "Campaign created",
        description: `"${formData.name}" has been created successfully. Content and media will be generated automatically.`,
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
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Creation failed",
        description:
          error?.response?.data?.message || error?.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 text-white border-0 overflow-hidden">
        {/* Glassmorphism Background - pointer-events-none so they don't block clicks */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-lg pointer-events-none" />
        <div className="absolute inset-0 bg-[#0b0f20]/80 backdrop-blur-md rounded-lg pointer-events-none" />
        <div className="absolute inset-[1px] bg-gradient-to-br from-white/5 to-transparent rounded-lg pointer-events-none" />
        <div className="absolute inset-0 border border-white/10 rounded-lg shadow-2xl shadow-black/50 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col h-full min-h-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
            <DialogTitle className="text-2xl font-bold text-white drop-shadow-lg">Create New Campaign</DialogTitle>
            <DialogDescription className="text-gray-300/80">
              Fill in the details to create a new marketing campaign
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide py-4 min-h-0">
            {/* Campaign Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                Campaign Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value.replace(/\s/g, "") })
                }
                placeholder="e.g., Summer-Sale-2024 (no spaces allowed)"
                required
                disabled={isPending}
                className="bg-white/5 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
              />
            </div>

            {/* User Requirements */}
            <div className="space-y-2">
              <Label htmlFor="userRequirements" className="text-gray-300">
                Requirements <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="userRequirements"
                value={formData.userRequirements}
                onChange={(e) =>
                  setFormData({ ...formData, userRequirements: e.target.value })
                }
                placeholder="Describe what you want to achieve with this campaign..."
                rows={4}
                required
                disabled={isPending}
                className="bg-white/5 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
              />
            </div>

            {/* Campaign Type */}
            <div className="space-y-2">
              <Label htmlFor="campaignType" className="text-gray-300">
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
                  className="bg-white/5 backdrop-blur-sm border-white/20 text-white focus:bg-white/10 focus:border-white/30 transition-all"
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
              <Label className="text-gray-300">
                Platform <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.platform.includes("facebook") ? "default" : "outline"}
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
                  variant={formData.platform.includes("google") ? "default" : "outline"}
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
                <p className="text-sm text-red-400">At least one platform is required</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-gray-300">
                Location <span className="text-red-500">*</span>
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., South Asia, North America"
                required
                disabled={isPending}
                className="bg-white/5 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <Label htmlFor="targetAudience" className="text-gray-300">
                Target Audience <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.targetAudience}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    targetAudience: value as CreateCampaignData["targetAudience"],
                  })
                }
                disabled={isPending}
              >
                <SelectTrigger
                  id="targetAudience"
                  className="bg-white/5 backdrop-blur-sm border-white/20 text-white focus:bg-white/10 focus:border-white/30 transition-all"
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
                <Label htmlFor="estimatedBudget" className="text-gray-300">
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
                      estimatedBudget: e.target.value ? parseFloat(e.target.value) : 0,
                    })
                  }
                  placeholder="0.00"
                  required
                  disabled={isPending}
                  className="bg-white/5 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfDays" className="text-gray-300">
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
                      numberOfDays: e.target.value ? parseInt(e.target.value, 10) : 1,
                    })
                  }
                  placeholder="e.g., 5"
                  required
                  disabled={isPending}
                  className="bg-white/5 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-300">
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
                  className="bg-white/5 backdrop-blur-sm border-white/20 text-white focus:bg-white/10 focus:border-white/30 transition-all"
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
                <Label className="text-gray-300">Media Preview (Optional)</Label>
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
                Note: Media will be generated automatically after campaign creation. Uploaded images
                are for preview only.
              </p>
              {media && media.length > 0 ? (
                <ImageCarousel images={media} onRemove={handleRemoveImage} editable={true} />
              ) : (
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center text-gray-300/80 bg-white/5 backdrop-blur-sm">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No images uploaded</p>
                  <p className="text-xs mt-1">Click "Upload Images" to add media preview</p>
                </div>
              )}
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

