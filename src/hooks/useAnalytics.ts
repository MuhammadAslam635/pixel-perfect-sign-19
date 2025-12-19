import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as analyticsService from '@/services/analytics.service';
import { useToast } from './use-toast';

export const analyticsKeys = {
  all: ['analytics'] as const,
  campaign: (campaignId: string) => [...analyticsKeys.all, 'campaign', campaignId] as const,
  campaignLatest: (campaignId: string, platform?: string) =>
    [...analyticsKeys.campaign(campaignId), 'latest', platform] as const,
  dashboard: (days?: number) => [...analyticsKeys.all, 'dashboard', days] as const,
  userAggregate: (platform?: string, days?: number) =>
    [...analyticsKeys.all, 'user', 'aggregate', platform, days] as const,
  user: (params?: any) => [...analyticsKeys.all, 'user', params] as const,
};

/**
 * Hook to fetch analytics for a specific campaign
 */
export const useCampaignAnalytics = (
  campaignId: string,
  params?: {
    platform?: 'facebook' | 'google';
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: analyticsKeys.campaign(campaignId),
    queryFn: () => analyticsService.getCampaignAnalytics(campaignId, params),
    enabled: !!campaignId,
  });
};

/**
 * Hook to fetch latest analytics for a campaign
 */
export const useLatestCampaignAnalytics = (
  campaignId: string,
  platform?: 'facebook' | 'google'
) => {
  return useQuery({
    queryKey: analyticsKeys.campaignLatest(campaignId, platform),
    queryFn: () => analyticsService.getLatestCampaignAnalytics(campaignId, platform),
    enabled: !!campaignId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

/**
 * Hook to fetch analytics dashboard
 */
export const useAnalyticsDashboard = (days?: number) => {
  return useQuery({
    queryKey: analyticsKeys.dashboard(days),
    queryFn: () => analyticsService.getAnalyticsDashboard(days),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

/**
 * Hook to fetch aggregated analytics for user
 */
export const useUserAggregatedAnalytics = (
  platform?: 'facebook' | 'google',
  days?: number
) => {
  return useQuery({
    queryKey: analyticsKeys.userAggregate(platform, days),
    queryFn: () => analyticsService.getUserAggregatedAnalytics(platform, days),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

/**
 * Hook to fetch all analytics for user's campaigns
 */
export const useUserAnalytics = (params?: {
  platform?: 'facebook' | 'google';
  limit?: number;
  page?: number;
}) => {
  return useQuery({
    queryKey: analyticsKeys.user(params),
    queryFn: () => analyticsService.getUserAnalytics(params),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

/**
 * Hook to manually trigger analytics sync
 */
export const useSyncCampaignAnalytics = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (campaignId: string) => analyticsService.syncCampaignAnalytics(campaignId),
    onSuccess: (data, campaignId) => {
      // Invalidate analytics queries for this campaign
      queryClient.invalidateQueries({ queryKey: analyticsKeys.campaign(campaignId) });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });

      toast({
        title: 'Success',
        description: data.message || 'Analytics sync triggered successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to trigger analytics sync',
        variant: 'destructive',
      });
    },
  });
};
