import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointerClick,
  DollarSign,
  Target,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { CampaignAnalytics } from '@/services/analytics.service';
import { useLatestCampaignAnalytics, useSyncCampaignAnalytics } from '@/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsCardProps {
  campaignId: string;
  platform?: 'facebook' | 'google';
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ campaignId, platform }) => {
  const { data, isLoading, error } = useLatestCampaignAnalytics(campaignId, platform);
  const { mutate: syncAnalytics, isPending: isSyncing } = useSyncCampaignAnalytics();

  if (isLoading) {
    return (
      <Card className="border-[#FFFFFF0D] bg-gradient-to-br from-white/5 to-transparent">
        <CardHeader className="px-4 py-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-[#FFFFFF0D] bg-gradient-to-br from-red-500/10 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Failed to load analytics</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const analytics = data?.data;

  if (!analytics) {
    return (
      <Card className="border-[#FFFFFF0D] bg-gradient-to-br from-white/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">No analytics data available yet</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => syncAnalytics(campaignId)}
              disabled={isSyncing}
              className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { metrics, period, platformData, lastSyncAt } = analytics;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(0);
  };

  const formatCurrency = (num: number): string => {
    return `$${num.toFixed(2)}`;
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(2)}%`;
  };

  const lastSync = new Date(lastSyncAt);
  const timeSinceSync = Math.floor((Date.now() - lastSync.getTime()) / 1000 / 60); // minutes

  return (
    <Card
      className="border-[#FFFFFF0D] shadow-lg"
      style={{
        background:
          'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)',
      }}
    >
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold text-white">
              Campaign Analytics
            </CardTitle>
            <Badge variant="outline" className="bg-white/10 text-gray-300 border-0 text-xs">
              {platform || 'All'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {timeSinceSync < 1
                ? 'Just now'
                : timeSinceSync < 60
                ? `${timeSinceSync}m ago`
                : `${Math.floor(timeSinceSync / 60)}h ago`}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => syncAnalytics(campaignId)}
              disabled={isSyncing}
              className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Impressions */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-xs">Impressions</span>
            </div>
            <div className="text-lg font-bold text-white">{formatNumber(metrics.impressions)}</div>
            <div className="text-xs text-gray-500">
              Reach: {formatNumber(metrics.reach)}
            </div>
          </div>

          {/* Clicks */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-gray-400">
              <MousePointerClick className="w-3.5 h-3.5" />
              <span className="text-xs">Clicks</span>
            </div>
            <div className="text-lg font-bold text-white">{formatNumber(metrics.clicks)}</div>
            <div className="flex items-center gap-1 text-xs">
              {metrics.ctr > 2 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-gray-500" />
              )}
              <span className={metrics.ctr > 2 ? 'text-green-500' : 'text-gray-500'}>
                CTR: {formatPercentage(metrics.ctr)}
              </span>
            </div>
          </div>

          {/* Spend */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-gray-400">
              <DollarSign className="w-3.5 h-3.5" />
              <span className="text-xs">Spend</span>
            </div>
            <div className="text-lg font-bold text-white">{formatCurrency(metrics.spend)}</div>
            <div className="text-xs text-gray-500">CPC: {formatCurrency(metrics.cpc)}</div>
          </div>

          {/* Conversions */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Target className="w-3.5 h-3.5" />
              <span className="text-xs">Conversions</span>
            </div>
            <div className="text-lg font-bold text-white">{metrics.conversions}</div>
            <div className="text-xs text-gray-500">
              {metrics.conversions > 0
                ? `${formatCurrency(metrics.costPerConversion)}/conv`
                : 'No conversions'}
            </div>
          </div>
        </div>

        {/* Period Info */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              Period: {new Date(period.startDate).toLocaleDateString()} -{' '}
              {new Date(period.endDate).toLocaleDateString()}
            </span>
            <span>CPM: {formatCurrency(metrics.cpm)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;
