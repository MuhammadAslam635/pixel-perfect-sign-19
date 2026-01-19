import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Eye,
  MousePointerClick,
  DollarSign,
  Target,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar,
  Clock,
  BarChart3,
  Users,
  MapPin,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { campaignsService } from "@/services/campaigns.service";
import {
  useLatestCampaignAnalytics,
  useCampaignAnalytics,
  useSyncCampaignAnalytics,
} from "@/hooks/useAnalytics";
import { campaignKeys } from "@/hooks/useCampaigns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import FacebookIcon from "@/components/icons/FacebookIcon";
import { Skeleton } from "@/components/ui/skeleton";

const FacebookCampaignAnalysisPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  // Fetch campaign details
  const {
    data: campaignData,
    isLoading: isLoadingCampaign,
    error: campaignError,
  } = useQuery({
    queryKey: campaignKeys.detail(id || ""),
    queryFn: () => campaignsService.getCampaignById(id || ""),
    enabled: !!id,
  });

  // Fetch latest analytics
  const { data: latestAnalyticsData, isLoading: isLoadingLatestAnalytics } =
    useLatestCampaignAnalytics(id || "", "facebook");

  // Fetch historical analytics if date range is provided
  const {
    data: historicalAnalyticsData,
    isLoading: isLoadingHistoricalAnalytics,
  } = useCampaignAnalytics(id || "", {
    platform: "facebook",
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { mutate: syncAnalytics, isPending: isSyncing } =
    useSyncCampaignAnalytics();

  const campaign = campaignData?.data;
  const latestAnalytics = latestAnalyticsData?.data;
  const historicalAnalytics = historicalAnalyticsData?.data || [];

  const formatNumber = (num: number): string => {
    if (!num || num === 0) return "0";
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoadingCampaign) {
    return (
      <DashboardLayout>
        <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-24 sm:pt-28 lg:pt-32 pb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  if (campaignError || !campaign) {
    return (
      <DashboardLayout>
        <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-24 sm:pt-28 lg:pt-32 pb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <p className="text-red-400">Campaign not found</p>
            <Button
              onClick={() => navigate("/campaigns/facebook")}
              className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all"
              style={{
                background: "#FFFFFF1A",
                boxShadow:
                  "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Facebook Campaigns
            </Button>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-24 sm:pt-28 lg:pt-32 pb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto animate-in fade-in duration-1000">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/campaigns/facebook")}
              className="text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <FacebookIcon className="w-8 h-8" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-normal text-white">
                  {campaign.name}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  Facebook Campaign Analysis
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => syncAnalytics(campaign._id)}
            disabled={isSyncing}
            className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all"
            style={{
              background: "#FFFFFF1A",
              boxShadow:
                "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
            }}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? "Syncing..." : "Sync Analytics"}
          </Button>
        </div>

        {/* Campaign Info */}
        <Card
          className="border-[#FFFFFF0D]"
          style={{
            background:
              "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
          }}
        >
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="bg-blue-500/20 text-blue-300 border-blue-400/50"
                >
                  {campaign.status}
                </Badge>
                <span className="text-sm text-gray-400">
                  {campaign.campaignType}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{campaign.location || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Users className="w-4 h-4" />
                <span className="capitalize">{campaign.targetAudience}</span>
              </div>
            </div>
            <Separator className="my-4 bg-white/10" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Budget: </span>
                <span className="text-white font-medium">
                  ${campaign.estimatedBudget?.toLocaleString() || "0"}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Duration: </span>
                <span className="text-white font-medium">
                  {campaign.numberOfDays} days
                </span>
              </div>
              <div>
                <span className="text-gray-400">Created: </span>
                <span className="text-white font-medium">
                  {formatDate(campaign.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Last Updated: </span>
                <span className="text-white font-medium">
                  {formatDate(campaign.updatedAt)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Latest Analytics */}
        {isLoadingLatestAnalytics ? (
          <Card
            className="border-[#FFFFFF0D]"
            style={{
              background:
                "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
          >
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ) : latestAnalytics ? (
          <Card
            className="border-[#FFFFFF0D]"
            style={{
              background:
                "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Latest Analytics
                </CardTitle>
                <div className="text-xs text-gray-400">
                  Last synced: {formatDate(latestAnalytics.lastSyncAt)}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Period: {formatDate(latestAnalytics.period.startDate)} -{" "}
                {formatDate(latestAnalytics.period.endDate)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Impressions */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Impressions</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatNumber(latestAnalytics.metrics.impressions)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Reach: {formatNumber(latestAnalytics.metrics.reach)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Frequency: {latestAnalytics.metrics.frequency.toFixed(2)}
                  </div>
                </div>

                {/* Clicks */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <MousePointerClick className="w-4 h-4" />
                    <span className="text-sm">Clicks</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatNumber(latestAnalytics.metrics.clicks)}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {latestAnalytics.metrics.ctr > 2 ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-gray-500" />
                    )}
                    <span
                      className={
                        latestAnalytics.metrics.ctr > 2
                          ? "text-green-500"
                          : "text-gray-500"
                      }
                    >
                      CTR: {formatPercentage(latestAnalytics.metrics.ctr)}
                    </span>
                  </div>
                </div>

                {/* Spend */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Spend</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(latestAnalytics.metrics.spend)}
                  </div>
                  <div className="text-xs text-gray-500">
                    CPC: {formatCurrency(latestAnalytics.metrics.cpc)}
                  </div>
                  <div className="text-xs text-gray-500">
                    CPM: {formatCurrency(latestAnalytics.metrics.cpm)}
                  </div>
                </div>

                {/* Conversions */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">Conversions</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {latestAnalytics.metrics.conversions}
                  </div>
                  <div className="text-xs text-gray-500">
                    {latestAnalytics.metrics.conversions > 0
                      ? `${formatPercentage(
                          latestAnalytics.metrics.conversionRate
                        )}% rate`
                      : "No conversions"}
                  </div>
                  {latestAnalytics.metrics.conversions > 0 && (
                    <div className="text-xs text-gray-500">
                      Cost/Conv:{" "}
                      {formatCurrency(
                        latestAnalytics.metrics.costPerConversion
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card
            className="border-[#FFFFFF0D]"
            style={{
              background:
                "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
          >
            <CardContent className="p-6">
              <div className="text-center py-8 text-gray-400">
                <p className="mb-2">No analytics data available yet</p>
                <p className="text-sm text-gray-500">
                  Click "Sync Analytics" to fetch the latest data from Facebook
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historical Analytics */}
        {historicalAnalytics.length > 0 && (
          <Card
            className="border-[#FFFFFF0D]"
            style={{
              background:
                "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
          >
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Historical Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {historicalAnalytics.map((analytics, index) => (
                  <div
                    key={analytics._id || index}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-gray-400">
                        {formatDate(analytics.period.startDate)} -{" "}
                        {formatDate(analytics.period.endDate)}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          analytics.syncStatus === "success"
                            ? "bg-green-500/20 text-green-300 border-green-400/50"
                            : analytics.syncStatus === "failed"
                            ? "bg-red-500/20 text-red-300 border-red-400/50"
                            : "bg-yellow-500/20 text-yellow-300 border-yellow-400/50"
                        }
                      >
                        {analytics.syncStatus}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <div className="text-xs text-gray-400">Impressions</div>
                        <div className="text-base font-semibold text-white">
                          {formatNumber(analytics.metrics.impressions)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Clicks</div>
                        <div className="text-base font-semibold text-white">
                          {formatNumber(analytics.metrics.clicks)}
                        </div>
                        <div className="text-xs text-gray-500">
                          CTR: {formatPercentage(analytics.metrics.ctr)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Spend</div>
                        <div className="text-base font-semibold text-white">
                          {formatCurrency(analytics.metrics.spend)}
                        </div>
                        <div className="text-xs text-gray-500">
                          CPC: {formatCurrency(analytics.metrics.cpc)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Conversions</div>
                        <div className="text-base font-semibold text-white">
                          {analytics.metrics.conversions}
                        </div>
                        {analytics.metrics.conversions > 0 && (
                          <div className="text-xs text-gray-500">
                            {formatCurrency(
                              analytics.metrics.costPerConversion
                            )}
                            /conv
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campaign Requirements */}
        {campaign.userRequirements && (
          <Card
            className="border-[#FFFFFF0D]"
            style={{
              background:
                "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
          >
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">
                Campaign Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {campaign.userRequirements}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </DashboardLayout>
  );
};

export default FacebookCampaignAnalysisPage;
