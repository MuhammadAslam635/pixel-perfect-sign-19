import API from '@/utils/api';

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  frequency: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversionRate: number;
  costPerConversion: number;
}

export interface CampaignAnalytics {
  _id: string;
  userId: string;
  campaignId: string;
  platform: 'facebook' | 'google';
  externalCampaignId: string;
  customerId?: string;
  adAccountId?: string;
  metrics: CampaignMetrics;
  period: {
    startDate: string;
    endDate: string;
  };
  campaignStatus?: string;
  lastSyncAt: string;
  syncStatus: 'success' | 'failed' | 'pending';
  syncError?: string;
  platformData?: any;
  createdAt: string;
  updatedAt: string;
}

export interface AggregatedMetrics {
  _id: string;
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  totalReach: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  avgCpm: number;
}

export interface AnalyticsDashboard {
  summary: {
    totalActiveCampaigns: number;
    timeRange: {
      days: number;
      startDate: string;
      endDate: string;
    };
  };
  aggregated: AggregatedMetrics;
  platformBreakdown: {
    facebook: AggregatedMetrics;
    google: AggregatedMetrics;
  };
  recentAnalytics: CampaignAnalytics[];
}

/**
 * Get analytics for a specific campaign
 */
export const getCampaignAnalytics = async (
  campaignId: string,
  params?: {
    platform?: 'facebook' | 'google';
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<{ success: boolean; data: CampaignAnalytics[] }> => {
  const response = await API.get(`/analytics/campaign/${campaignId}`, { params });
  return response.data;
};

/**
 * Get latest analytics for a campaign
 */
export const getLatestCampaignAnalytics = async (
  campaignId: string,
  platform?: 'facebook' | 'google'
): Promise<{ success: boolean; data: CampaignAnalytics | null }> => {
  const response = await API.get(`/analytics/campaign/${campaignId}/latest`, {
    params: { platform },
  });
  return response.data;
};

/**
 * Get analytics dashboard summary
 */
export const getAnalyticsDashboard = async (
  days?: number
): Promise<{ success: boolean; data: AnalyticsDashboard }> => {
  const response = await API.get('/analytics/dashboard', {
    params: { days },
  });
  return response.data;
};

/**
 * Get aggregated analytics for user
 */
export const getUserAggregatedAnalytics = async (
  platform?: 'facebook' | 'google',
  days?: number
): Promise<{ success: boolean; data: AggregatedMetrics[] }> => {
  const response = await API.get('/analytics/user/aggregate', {
    params: { platform, days },
  });
  return response.data;
};

/**
 * Get all analytics for user's campaigns
 */
export const getUserAnalytics = async (params?: {
  platform?: 'facebook' | 'google';
  limit?: number;
  page?: number;
}): Promise<{
  success: boolean;
  data: {
    analytics: CampaignAnalytics[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}> => {
  const response = await API.get('/analytics/user', { params });
  return response.data;
};

/**
 * Manually trigger analytics sync for a campaign
 */
export const syncCampaignAnalytics = async (
  campaignId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await API.post(`/analytics/campaign/${campaignId}/sync`);
  return response.data;
};
