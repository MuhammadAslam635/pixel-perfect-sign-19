import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar as CalendarIcon,
  Clock,
  Eye,
  MousePointerClick,
  DollarSign,
  Target,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Campaign } from "@/services/campaigns.service";
import { useCampaigns, campaignKeys } from "@/hooks/useCampaigns";
import { useQuery } from "@tanstack/react-query";
import { useLatestCampaignAnalytics } from "@/hooks/useAnalytics";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import FacebookIcon from "@/components/icons/FacebookIcon";
import { Badge } from "@/components/ui/badge";

const FacebookCampaignsPage = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // React Query hooks - filter for Facebook platform only
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: 12,
      search: debouncedSearch || undefined,
      dateFrom: dateRange?.from ? dateRange.from.toISOString() : undefined,
      dateTo: dateRange?.to ? dateRange.to.toISOString() : undefined,
      platform: "facebook", // Always filter for Facebook
    }),
    [debouncedSearch, dateRange, currentPage]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, dateRange]);

  const { data, isLoading, error, refetch } = useCampaigns(queryParams);

  // Use campaigns directly from API
  const campaigns = useMemo(() => {
    if (!data?.data?.docs) return [];
    return data.data.docs;
  }, [data]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

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

  const handleViewAnalysis = (campaignId: string) => {
    navigate(`/campaigns/facebook/${campaignId}`);
  };

  return (
    <DashboardLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-24 sm:pt-28 lg:pt-32 pb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto animate-in fade-in duration-1000">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-5">
          <div className="flex items-center gap-3">
            <FacebookIcon className="w-8 h-8 sm:w-9 sm:h-9" />
            <h1 className="text-2xl sm:text-3xl font-normal text-white">
              Facebook Campaigns Analysis
            </h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Date Range Input */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="relative h-9 pl-10 pr-4 rounded-full border-0 text-gray-400 hover:opacity-80 text-xs w-full sm:w-auto sm:min-w-[200px] justify-start"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <span className="truncate">
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Select date range"
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-[#1a1a1a] border-[#2a2a2a]"
              align="start"
            >
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="rounded-md border-0"
                classNames={{
                  months:
                    "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption:
                    "flex justify-center pt-1 relative items-center text-white",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button:
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell:
                    "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-9 w-9 p-0 font-normal text-gray-300 hover:bg-white/10 hover:text-white rounded-md aria-selected:opacity-100",
                  day_range_end: "day-range-end",
                  day_selected:
                    "bg-white/20 text-white hover:bg-white/30 hover:text-white focus:bg-white/20 focus:text-white",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside:
                    "day-outside text-gray-600 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-gray-600 opacity-50",
                  day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </PopoverContent>
          </Popover>

          {/* Search Input */}
          <div className="relative w-full sm:w-auto sm:min-w-[160px] sm:flex-1 lg:flex-none lg:min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
            <Input
              type="text"
              placeholder="Search campaigns..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 pl-10 pr-4 !rounded-full border-0 text-gray-300 placeholder:text-gray-500 text-xs w-full"
              style={{
                background: "#FFFFFF1A",
                boxShadow:
                  "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
            />
          </div>
        </div>

        {/* Campaigns Table with Analytics */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-red-400 text-center">
              <p className="font-medium">Failed to load campaigns</p>
              <p className="text-sm text-gray-400 mt-1">
                {error instanceof Error
                  ? error.message
                  : "An unexpected error occurred"}
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all"
              style={{
                background: "#FFFFFF1A",
                boxShadow:
                  "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">No Facebook campaigns found</div>
          </div>
        ) : (
          <Card
            className="border-[#FFFFFF0D] overflow-hidden"
            style={{
              background:
                "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                      Campaign Name
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                      Impressions
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                      Clicks
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                      CTR
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                      Spend
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                      CPC
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                      Conversions
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <CampaignTableRow
                      key={campaign._id}
                      campaign={campaign}
                      onViewAnalysis={handleViewAnalysis}
                      formatNumber={formatNumber}
                      formatCurrency={formatCurrency}
                      formatPercentage={formatPercentage}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {data?.data && data.data.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1 w-fit">
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1)
                          setCurrentPage((prev) => Math.max(prev - 1, 1));
                      }}
                      className={`cursor-pointer hover:bg-white/10 transition-colors h-7 w-7 p-0 flex items-center justify-center [&>span]:hidden ${
                        currentPage <= 1 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </PaginationItem>

                  {(() => {
                    const totalPages = data.data.totalPages;
                    let startPage = Math.max(1, currentPage - 1);
                    let endPage = startPage + 2;

                    if (endPage > totalPages) {
                      endPage = totalPages;
                      startPage = Math.max(1, endPage - 2);
                    }

                    const pages: (number | "ellipsis")[] = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }

                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) pages.push("ellipsis");
                      pages.push(totalPages);
                    }

                    return pages.map((p, idx) => (
                      <PaginationItem key={idx}>
                        {p === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(p as number);
                            }}
                            isActive={p === currentPage}
                            className="cursor-pointer hover:bg-white/10 transition-colors h-7 w-7 text-xs"
                          >
                            {p}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ));
                  })()}

                  <PaginationItem>
                    <PaginationNext
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < data.data.totalPages)
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, data.data.totalPages)
                          );
                      }}
                      className={`cursor-pointer hover:bg-white/10 transition-colors h-7 w-7 p-0 flex items-center justify-center [&>span]:hidden ${
                        currentPage >= data.data.totalPages
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

// Component to display campaign table row with analytics
interface CampaignTableRowProps {
  campaign: Campaign;
  onViewAnalysis: (campaignId: string) => void;
  formatNumber: (num: number) => string;
  formatCurrency: (num: number) => string;
  formatPercentage: (num: number) => string;
}

const CampaignTableRow: React.FC<CampaignTableRowProps> = ({
  campaign,
  onViewAnalysis,
  formatNumber,
  formatCurrency,
  formatPercentage,
}) => {
  const { data: analyticsData, isLoading: isLoadingAnalytics } =
    useLatestCampaignAnalytics(campaign._id, "facebook");

  const analytics = analyticsData?.data;

  return (
    <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
          <FacebookIcon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium text-white">
            {campaign.name}
          </span>
        </div>
      </td>
      <td className="py-4 px-4">
        <Badge
          variant="outline"
          className="bg-blue-500/20 text-blue-300 border-blue-400/50 text-xs"
        >
          {campaign.status}
        </Badge>
      </td>
      <td className="py-4 px-4 text-right">
        {isLoadingAnalytics ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-400 inline-block" />
        ) : analytics ? (
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-white">
              {formatNumber(analytics.metrics.impressions)}
            </span>
            <span className="text-xs text-gray-500">
              {formatNumber(analytics.metrics.reach)} reach
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        {isLoadingAnalytics ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-400 inline-block" />
        ) : analytics ? (
          <span className="text-sm font-semibold text-white">
            {formatNumber(analytics.metrics.clicks)}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        {isLoadingAnalytics ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-400 inline-block" />
        ) : analytics ? (
          <div className="flex items-center justify-end gap-1">
            {analytics.metrics.ctr > 2 ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-gray-500" />
            )}
            <span
              className={`text-sm font-semibold ${
                analytics.metrics.ctr > 2 ? "text-green-500" : "text-white"
              }`}
            >
              {formatPercentage(analytics.metrics.ctr)}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        {isLoadingAnalytics ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-400 inline-block" />
        ) : analytics ? (
          <span className="text-sm font-semibold text-white">
            {formatCurrency(analytics.metrics.spend)}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        {isLoadingAnalytics ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-400 inline-block" />
        ) : analytics ? (
          <span className="text-sm text-gray-300">
            {formatCurrency(analytics.metrics.cpc)}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        {isLoadingAnalytics ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-400 inline-block" />
        ) : analytics ? (
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-white">
              {analytics.metrics.conversions}
            </span>
            {analytics.metrics.conversions > 0 && (
              <span className="text-xs text-gray-500">
                {formatCurrency(analytics.metrics.costPerConversion)}/conv
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        <Button
          onClick={() => onViewAnalysis(campaign._id)}
          size="sm"
          className="relative h-7 px-3 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all"
          style={{
            background: "#FFFFFF1A",
            boxShadow:
              "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
          }}
        >
          View
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </td>
    </tr>
  );
};

export default FacebookCampaignsPage;
