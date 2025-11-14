import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  campaignsService,
  CampaignsQueryParams,
  CreateCampaignData,
  UpdateCampaignData,
  RegenerateCampaignData
} from "@/services/campaigns.service";

// Query keys
export const campaignKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  list: (params: CampaignsQueryParams) => [...campaignKeys.lists(), params] as const,
  details: () => [...campaignKeys.all, "detail"] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
};

// Hooks
export const useCampaigns = (params: CampaignsQueryParams = {}) => {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: () => campaignsService.getCampaigns(params),
  });
};

export const useCampaign = (id: string) => {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignsService.getCampaignById(id),
    enabled: !!id,
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCampaignData) => campaignsService.createCampaign(data),
    onSuccess: () => {
      // Invalidate and refetch all campaign queries to ensure updated data
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      // Also explicitly refetch all list queries
      queryClient.refetchQueries({ queryKey: campaignKeys.lists() });
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignData }) =>
      campaignsService.updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignsService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
};

export const useRegenerateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RegenerateCampaignData }) =>
      campaignsService.regenerateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
};

export const useResetCampaignContent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignsService.resetCampaignContent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
};

export const useResetCampaignMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignsService.resetCampaignMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
};
