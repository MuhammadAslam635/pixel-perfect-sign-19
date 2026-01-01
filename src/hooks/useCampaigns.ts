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
  suggestions: () => [...campaignKeys.all, "suggestions"] as const,
  suggestionList: (params: any) => [...campaignKeys.suggestions(), params] as const,
};

// Hooks
export const useCampaigns = (params: CampaignsQueryParams = {}) => {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: () => campaignsService.getCampaigns(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts if data is stale
    refetchOnReconnect: true, // Refetch when reconnecting
    // Add polling when there are campaigns with processing status in progress
    refetchInterval: (data) => {
      if (data?.data?.docs) {
        const hasProcessingCampaigns = data.data.docs.some((campaign: any) =>
          campaign.processingStatus?.content?.status === 'in-progress' ||
          campaign.processingStatus?.media?.status === 'in-progress' ||
          campaign.processingStatus?.research?.status === 'in-progress'
        );
        return hasProcessingCampaigns ? 5000 : false; // Poll every 5 seconds if processing
      }
      return false;
    },
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
  });
};

export const useCampaign = (id: string) => {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignsService.getCampaignById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - campaign details change less frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2; // Less retries for individual campaigns
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
    // Add polling when campaign has processing status in progress
    refetchInterval: (data) => {
      if (data?.data) {
        const hasProcessingStatus = data.data.processingStatus?.content?.status === 'in-progress' ||
          data.data.processingStatus?.media?.status === 'in-progress' ||
          data.data.processingStatus?.research?.status === 'in-progress';
        return hasProcessingStatus ? 5000 : false; // Poll every 5 seconds if processing
      }
      return false;
    },
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCampaignData) => campaignsService.createCampaign(data),
    onSuccess: (newCampaign) => {
      // Invalidate and refetch all campaign queries to ensure updated data
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      // Also explicitly refetch all list queries
      queryClient.refetchQueries({ queryKey: campaignKeys.lists() });

      // Optimistically add the new campaign to the cache
      if (newCampaign?.data) {
        queryClient.setQueryData(
          campaignKeys.detail(newCampaign.data._id),
          newCampaign
        );
      }
    },
    onError: (error) => {
      console.error('Failed to create campaign:', error);
      // Error handling can be done in the component or with toast notifications
    },
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignData }) =>
      campaignsService.updateCampaign(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: campaignKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: campaignKeys.lists() });

      // Snapshot the previous values
      const previousCampaign = queryClient.getQueryData(campaignKeys.detail(id));
      const previousCampaigns = queryClient.getQueriesData({ queryKey: campaignKeys.lists() });

      // Optimistically update the cache
      queryClient.setQueryData(campaignKeys.detail(id), (old: any) => ({
        ...old,
        data: { ...old?.data, ...data }
      }));

      // Update all campaign lists
      queryClient.setQueriesData({ queryKey: campaignKeys.lists() }, (old: any) => {
        if (!old?.data?.docs) return old;
        return {
          ...old,
          data: {
            ...old.data,
            docs: old.data.docs.map((campaign: any) =>
              campaign._id === id ? { ...campaign, ...data } : campaign
            )
          }
        };
      });

      // Return a context object with the snapshotted values
      return { previousCampaign, previousCampaigns };
    },
    onError: (err, { id }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCampaign) {
        queryClient.setQueryData(campaignKeys.detail(id), context.previousCampaign);
      }
      if (context?.previousCampaigns) {
        context.previousCampaigns.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
    },
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => campaignsService.deleteCampaign(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: campaignKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: campaignKeys.lists() });

      // Snapshot the previous values
      const previousCampaign = queryClient.getQueryData(campaignKeys.detail(id));
      const previousCampaigns = queryClient.getQueriesData({ queryKey: campaignKeys.lists() });

      // Optimistically remove from cache
      queryClient.removeQueries({ queryKey: campaignKeys.detail(id) });

      // Update all campaign lists to remove the deleted campaign
      queryClient.setQueriesData({ queryKey: campaignKeys.lists() }, (old: any) => {
        if (!old?.data?.docs) return old;
        return {
          ...old,
          data: {
            ...old.data,
            docs: old.data.docs.filter((campaign: any) => campaign._id !== id),
            totalDocs: old.data.totalDocs - 1
          }
        };
      });

      return { previousCampaign, previousCampaigns };
    },
    onError: (err, id, context) => {
      // Roll back on error
      if (context?.previousCampaign) {
        queryClient.setQueryData(campaignKeys.detail(id), context.previousCampaign);
      }
      if (context?.previousCampaigns) {
        context.previousCampaigns.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch to ensure consistency
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

// Campaign Suggestions hooks
export const useCampaignSuggestions = (params: { page?: number; limit?: number; status?: string } = {}) => {
  return useQuery({
    queryKey: campaignKeys.suggestionList(params),
    queryFn: () => campaignsService.getCampaignSuggestions(params),
    staleTime: 10 * 60 * 1000, // 10 minutes - suggestions don't change often
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
  });
};

export const useRegenerateCampaignSuggestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => campaignsService.regenerateCampaignSuggestions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.suggestions() });
    },
  });
};

// Prefetch utilities for better UX
export const prefetchCampaign = (queryClient: ReturnType<typeof useQueryClient>, id: string) => {
  queryClient.prefetchQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => campaignsService.getCampaignById(id),
    staleTime: 2 * 60 * 1000,
  });
};

export const prefetchCampaigns = (
  queryClient: ReturnType<typeof useQueryClient>,
  params: CampaignsQueryParams = {}
) => {
  queryClient.prefetchQuery({
    queryKey: campaignKeys.list(params),
    queryFn: () => campaignsService.getCampaigns(params),
    staleTime: 5 * 60 * 1000,
  });
};
