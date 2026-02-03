import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Campaign, UpdateCampaignData, CreateCampaignData, CampaignResponse, } from "@/services/campaigns.service";
import { useUpdateCampaign, useDeleteCampaign, useRegenerateCampaign, useResetCampaignContent, useResetCampaignMedia, campaignKeys, } from "@/hooks/useCampaigns";
import { campaignsService } from "@/services/campaigns.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useUserAggregatedAnalytics } from "@/hooks/useAnalytics";
import { formatDate, } from "@/utils/commonFunctions";
import { getStatusColor, renderCleanContent, renderTextWithLinks } from "@/helpers/campaigns";
import AdsCard from "./components/AdsCard";
import AICampaignSuggestion from "./components/AICampaignSuggestion";
import RecentCampaign from "./components/RecentCampaign";
import { CampaignDetailsDialog } from "./components/CampaignDetailsDialog";
import RegenerateCampaignDialog from "./components/RegenerateCampaignDialog";
import CreateCampaignModal from "./components/CreateCampaignModal";

const CampaignsPage = () => {
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [facebookDays, setFacebookDays] = useState<number>(7);
  const [googleDays, setGoogleDays] = useState<number>(7);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedCampaign, setEditedCampaign] = useState<Campaign | null>(null);
  const [viewingCampaignId, setViewingCampaignId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [regenerateType, setRegenerateType] = useState<"content" | "media" | "research" | "both" | null>(null);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState<boolean>(false);
  const [regenerateGuidelines, setRegenerateGuidelines] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [initialCampaignData, setInitialCampaignData] = useState<Partial<CreateCampaignData> | undefined>(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: updateCampaign, isPending: isUpdating } = useUpdateCampaign();
  // Get fresh campaign data when modal is open
  const { data: freshCampaignData, isLoading: isLoadingCampaignDetails } = useQuery({
    queryKey: campaignKeys.detail(viewingCampaignId || ""),
    queryFn: () => campaignsService.getCampaignById(viewingCampaignId || ""),
    enabled: isModalOpen && !!viewingCampaignId,
    staleTime: 0, // Always refetch when modal opens
    refetchOnMount: true,
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
    // Add polling when campaign has processing status in progress
    refetchInterval: (query) => {
      const response = query.state.data as CampaignResponse | undefined;
      if (response && "data" in response && response.data) {
        const campaign = response.data;
        const hasProcessingStatus = campaign.processingStatus?.content?.status === "in-progress" || campaign.processingStatus?.media?.status === "in-progress" || campaign.processingStatus?.research?.status === "in-progress";
        return hasProcessingStatus ? 5000 : false; // Poll every 5 seconds if processing
      }
      return false;
    },
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
  });

  // Update selectedCampaign and editedCampaign when fresh data arrives
  useEffect(() => {
    if (freshCampaignData?.data && isModalOpen) {
      setSelectedCampaign(freshCampaignData.data);
      // Only update edited campaign if we are NOT currently editing to prevent overwriting user input
      if (!isEditing) {
        setEditedCampaign(freshCampaignData.data);
      }
    }
  }, [freshCampaignData, isModalOpen, isEditing]);
  const { mutate: deleteCampaign, isPending: isDeleting } = useDeleteCampaign();
  // Campaign Suggestions hooks
  const { mutate: regenerateCampaign, isPending: isRegenerating } = useRegenerateCampaign();
  const { mutate: resetContent, isPending: isResettingContent } = useResetCampaignContent();
  const { mutate: resetMedia, isPending: isResettingMedia } = useResetCampaignMedia();
  // Fetch aggregated analytics for Facebook and Google
  const { data: facebookAnalytics } = useUserAggregatedAnalytics("facebook", facebookDays);
  const { data: googleAnalytics } = useUserAggregatedAnalytics("google", googleDays);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const handleViewDetails = (campaign: Campaign) => {
    setSelectedCampaign(null);
    setEditedCampaign(null);
    setViewingCampaignId(campaign._id);
    setIsModalOpen(true);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    if (selectedCampaign) {
      setEditedCampaign(selectedCampaign);
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!editedCampaign || !selectedCampaign) return;
    // Validation
    if (!editedCampaign.platform || editedCampaign.platform.length === 0) {
      toast({ title: "Validation error", description: "At least one platform is required", variant: "destructive", }); return;
    }

    const updateData: UpdateCampaignData = {
      name: editedCampaign.name,
      userRequirements: editedCampaign.userRequirements,
      content: editedCampaign.content,
      media: editedCampaign.media,
      status: editedCampaign.status as any,
      platform: (editedCampaign.platform || []) as ("facebook" | "google")[],
    };
    updateCampaign(
      { id: selectedCampaign._id, data: updateData },
      {
        onSuccess: (response) => {
          setSelectedCampaign(response.data);
          setEditedCampaign(response.data);
          setIsEditing(false);
          toast({ title: "Success", description: response.message || "Campaign updated successfully", });
        },
        onError: (error: any) => {
          toast({ title: "Error", description: error.response?.data?.message || "Failed to update campaign", variant: "destructive", });
        },
      }
    );
  };

  const handleResetContent = () => {
    if (!selectedCampaign) return;
    resetContent(selectedCampaign._id, {
      onSuccess: (response) => {
        setSelectedCampaign(response.data);
        if (editedCampaign) {
          setEditedCampaign(response.data);
        }
        toast({ title: "Success", description: "Campaign content has been reset successfully", });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.response?.data?.message || "Failed to reset content", variant: "destructive", });
      },
    });
  };

  const handleResetMedia = () => {
    if (!selectedCampaign) return;
    resetMedia(selectedCampaign._id, {
      onSuccess: (response) => {
        setSelectedCampaign(response.data);
        if (editedCampaign) {
          setEditedCampaign(response.data);
        }

        toast({ title: "Success", description: "Campaign media has been reset successfully", });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.response?.data?.message || "Failed to reset media", variant: "destructive", });
      },
    });
  };

  const handleRegenerate = () => {
    if (!selectedCampaign || !regenerateType) return;
    regenerateCampaign(
      {
        id: selectedCampaign._id,
        data: {
          type: regenerateType,
          userGuidelines: regenerateGuidelines || undefined,
        },
      },
      {
        onSuccess: (response) => {
          toast({ title: "Success", description: response.message || `${regenerateType} regeneration has been started. You will receive a notification when it's ready.`, });
          setRegenerateDialogOpen(false);
          setRegenerateType(null);
          setRegenerateGuidelines("");
        },
        onError: (error: any) => {
          toast({ title: "Error", description: error.response?.data?.message || "Failed to regenerate campaign", variant: "destructive", });
        },
      }
    );
  };

  const handleDeleteCampaign = () => {
    if (!selectedCampaign) return;
    deleteCampaign(selectedCampaign._id, {
      onSuccess: () => {
        setIsModalOpen(false);
        setSelectedCampaign(null);
        setDeleteDialogOpen(false);
        toast({ title: "Success", description: "Campaign deleted successfully", });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.response?.data?.message || "Failed to delete campaign", variant: "destructive", });
      },
    });
  };

  return (
    <DashboardLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-24 sm:pt-28 lg:pt-32 pb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto animate-in fade-in duration-1000">
        {/* Top Stats Section */}
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Facebook Ads Card */}
          <AdsCard platform="facebook" analytics={facebookAnalytics} onDaysChange={setFacebookDays} />
          {/* Google Ads Card */}
          <AdsCard platform="google" analytics={googleAnalytics} onDaysChange={setGoogleDays} />
        </div>
        {/* Campaign Suggestions Section */}
        <AICampaignSuggestion />
        {/* Recent Campaigns Section */}
        <RecentCampaign onViewDetails={handleViewDetails} onCreateCampaign={setIsCreateModalOpen} />
        {/* Campaign Details Modal */}
        <CampaignDetailsDialog
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          selectedCampaign={selectedCampaign}
          editedCampaign={editedCampaign}
          setEditedCampaign={setEditedCampaign}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isLoadingCampaignDetails={isLoadingCampaignDetails}
          setViewingCampaignId={setViewingCampaignId}
          handleSave={handleSave}
          handleCancelEdit={handleCancelEdit}
          handleResetContent={handleResetContent}
          handleResetMedia={handleResetMedia}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          isRegenerating={isRegenerating}
          isResettingContent={isResettingContent}
          isResettingMedia={isResettingMedia}
          setRegenerateType={setRegenerateType}
          setRegenerateDialogOpen={setRegenerateDialogOpen}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          renderTextWithLinks={renderTextWithLinks}
          renderCleanContent={renderCleanContent}
          setDeleteDialogOpen={setDeleteDialogOpen}
        />
        {/* Regenerate Dialog */}
        <RegenerateCampaignDialog
          regenerateDialogOpen={regenerateDialogOpen}
          setRegenerateDialogOpen={setRegenerateDialogOpen}
          regenerateType={regenerateType}
          regenerateGuidelines={regenerateGuidelines}
          setRegenerateGuidelines={setRegenerateGuidelines}
          isRegenerating={isRegenerating}
          handleRegenerate={handleRegenerate}
          setRegenerateType={setRegenerateType}
        />
        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete Campaign?"
          description="This will permanently delete this campaign. This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          isPending={isDeleting}
          confirmVariant="destructive"
          onConfirm={handleDeleteCampaign}
          onCancel={() => setDeleteDialogOpen(false)}
        />
        {/* Create Campaign Modal */}
        <CreateCampaignModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setInitialCampaignData(undefined); // Clear initial data when closing
          }}
          initialData={initialCampaignData}
          onSuccess={async () => {
            // Clear search filter so the new campaign is visible
            // The new campaign might not match the current search term
            if (searchInput) {
              setSearchInput("");
              setDebouncedSearch("");
            }

            // Invalidate campaigns list after successful creation
            // Since the modal uses streaming API, we need to manually invalidate
            queryClient.invalidateQueries({ queryKey: campaignKeys.all });
          }}
        />
      </main>
    </DashboardLayout>
  );
};

export default CampaignsPage;