import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Plus,
  Search,
  Calendar as CalendarIcon,
  Clock,
  Calendar,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  Upload,
  Circle as CircleIcon,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  MoveRight,
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
import {
  Campaign,
  UpdateCampaignData,
  CreateCampaignData,
} from "@/services/campaigns.service";
import {
  useCampaigns,
  useUpdateCampaign,
  useDeleteCampaign,
  useRegenerateCampaign,
  useResetCampaignContent,
  useResetCampaignMedia,
  useCampaignSuggestions,
  useRegenerateCampaignSuggestions,
  campaignKeys,
} from "@/hooks/useCampaigns";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import ImageCarousel from "@/components/campaigns/ImageCarousel";
import CreateCampaignModal from "@/components/campaigns/CreateCampaignModal";
import FacebookIcon from "@/components/icons/FacebookIcon";
import { ArrowRight as ArrowRightIcon } from "lucide-react";
import AnalyticsCard from "@/components/campaigns/AnalyticsCard";
import { useUserAggregatedAnalytics } from "@/hooks/useAnalytics";

const CampaignsPage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [facebookDays, setFacebookDays] = useState<number>(7);
  const [googleDays, setGoogleDays] = useState<number>(7);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedCampaign, setEditedCampaign] = useState<Campaign | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [regenerateType, setRegenerateType] = useState<
    "content" | "media" | "both" | null
  >(null);
  const [regenerateDialogOpen, setRegenerateDialogOpen] =
    useState<boolean>(false);
  const [regenerateGuidelines, setRegenerateGuidelines] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [initialCampaignData, setInitialCampaignData] = useState<
    Partial<CreateCampaignData> | undefined
  >(undefined);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // React Query hooks
  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: 8,
      search: debouncedSearch || undefined,
      dateFrom: dateRange?.from ? dateRange.from.toISOString() : undefined,
      dateTo: dateRange?.to ? dateRange.to.toISOString() : undefined,
      platform: platformFilter !== "all" ? platformFilter : undefined,
    }),
    [debouncedSearch, dateRange, currentPage, platformFilter]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, dateRange, platformFilter]);

  const { data, isLoading, error, refetch } = useCampaigns(queryParams);
  const { mutate: updateCampaign, isPending: isUpdating } = useUpdateCampaign();
  const { mutate: deleteCampaign, isPending: isDeleting } = useDeleteCampaign();

  // Campaign Suggestions hooks
  const { data: suggestionsData, isLoading: suggestionsLoading } =
    useCampaignSuggestions({ limit: 10, status: "suggested" });
  const {
    mutate: regenerateSuggestions,
    isPending: isRegeneratingSuggestions,
  } = useRegenerateCampaignSuggestions();
  const { mutate: regenerateCampaign, isPending: isRegenerating } =
    useRegenerateCampaign();
  const { mutate: resetContent, isPending: isResettingContent } =
    useResetCampaignContent();
  const { mutate: resetMedia, isPending: isResettingMedia } =
    useResetCampaignMedia();

  // Fetch aggregated analytics for Facebook and Google
  const { data: facebookAnalytics } = useUserAggregatedAnalytics(
    "facebook",
    facebookDays
  );
  const { data: googleAnalytics } = useUserAggregatedAnalytics(
    "google",
    googleDays
  );

  // Use campaigns directly from API (platform filtering is now server-side)
  const campaigns = useMemo(() => {
    if (!data?.data?.docs) return [];
    return data.data.docs;
  }, [data]);

  useEffect(() => {
    if (selectedCampaign) {
      setEditedCampaign(selectedCampaign);
    }
  }, [selectedCampaign]);

  // Sync selectedCampaign with updated campaigns list when it changes
  useEffect(() => {
    if (selectedCampaign && campaigns.length > 0) {
      const updatedCampaign = campaigns.find(
        (campaign) => campaign._id === selectedCampaign._id
      );
      if (updatedCampaign && updatedCampaign !== selectedCampaign) {
        setSelectedCampaign(updatedCampaign);
      }
    }
  }, [campaigns, selectedCampaign]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  const getMediaUrl = (mediaFilename: string): string => {
    const backendUrl =
      import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000";
    // Remove /api from backend URL if present, as uploads are served from root
    // Also ensure we don't have trailing slashes
    const baseUrl = backendUrl.replace("/api", "").replace(/\/$/, "");
    return `${baseUrl}/uploads/${mediaFilename}`;
  };

  const handleViewDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setEditedCampaign(campaign);
    setIsModalOpen(true);
    setIsEditing(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "draft":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
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
      toast({
        title: "Validation error",
        description: "At least one platform is required",
        variant: "destructive",
      });
      return;
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

          toast({
            title: "Success",
            description: response.message || "Campaign updated successfully",
          });
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description:
              error.response?.data?.message || "Failed to update campaign",
            variant: "destructive",
          });
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

        toast({
          title: "Success",
          description: "Campaign content has been reset successfully",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to reset content",
          variant: "destructive",
        });
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

        toast({
          title: "Success",
          description: "Campaign media has been reset successfully",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to reset media",
          variant: "destructive",
        });
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
          toast({
            title: "Success",
            description:
              response.message ||
              `${regenerateType} regeneration has been started. You will receive a notification when it's ready.`,
          });

          setRegenerateDialogOpen(false);
          setRegenerateType(null);
          setRegenerateGuidelines("");
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description:
              error.response?.data?.message || "Failed to regenerate campaign",
            variant: "destructive",
          });
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

        toast({
          title: "Success",
          description: "Campaign deleted successfully",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description:
            error.response?.data?.message || "Failed to delete campaign",
          variant: "destructive",
        });
      },
    });
  };

  // Helper function to convert URLs in text to anchor tags
  const renderTextWithLinks = (
    text: string | undefined | null
  ): React.ReactNode => {
    if (!text || typeof text !== "string") return text || "";

    // Regex to match URLs (http, https, www, and common domains)
    const urlRegex =
      /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let hasUrls = false;

    while ((match = urlRegex.exec(text)) !== null) {
      hasUrls = true;
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Process the URL
      const url = match[0];
      let href = url;

      // Add protocol if missing
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        href = url.startsWith("www.") ? `https://${url}` : `https://${url}`;
      }

      // Add anchor tag
      parts.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {url}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return hasUrls ? parts : text;
  };

  const getPlatformIcon = (platforms: string[]) => {
    if (!platforms || platforms.length === 0) return null;

    const hasFacebook = platforms.some((p) => p.toLowerCase() === "facebook");
    const hasGoogle = platforms.some(
      (p) => p.toLowerCase() === "google" || p.toLowerCase() === "google ads"
    );

    if (hasFacebook && hasGoogle) {
      return (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <FacebookIcon className="w-8 h-8 sm:w-9 sm:h-9" />
          <svg
            className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0"
            viewBox="0 0 24 24"
          >
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </div>
      );
    } else if (hasFacebook) {
      return (
        <div className="flex items-center flex-shrink-0">
          <FacebookIcon className="w-8 h-8 sm:w-9 sm:h-9" />
        </div>
      );
    } else if (hasGoogle) {
      return (
        <div className="flex items-center flex-shrink-0">
          <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </div>
      );
    }

    // Default icon for other platforms
    return (
      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#1877F2] rounded-lg flex items-center justify-center flex-shrink-0">
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-white"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </div>
    );
  };

  const handleRegenerateSuggestions = () => {
    regenerateSuggestions(undefined, {
      onSuccess: () => {
        toast({
          title: "Success",
          description:
            "Campaign suggestions are being regenerated. You'll receive a notification when ready.",
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description:
            error?.response?.data?.message ||
            "Failed to regenerate suggestions",
          variant: "destructive",
        });
      },
    });
  };

  const handleUseSuggestion = (suggestion: any) => {
    // Map suggestion data to CreateCampaignData format
    const campaignData: Partial<CreateCampaignData> = {
      name: suggestion.suggestedTitle,
      userRequirements: suggestion.suggestedDescription,
      campaignType: suggestion.suggestedCampaignType,
      platform: suggestion.suggestedPlatform,
      targetAudience: suggestion.suggestedTargetAudience,
      location: suggestion.suggestedLocation,
      estimatedBudget: suggestion.suggestedBudget || 0,
      numberOfDays: suggestion.suggestedDuration || 7,
      status: "draft",
    };

    // Set the initial data and open the modal
    setInitialCampaignData(campaignData);
    setIsCreateModalOpen(true);
  };

  // Helper function to format large numbers
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

  // Helper to map days selection to API parameter
  const getDaysFromSelection = (selection: string): number => {
    switch (selection) {
      case "last-7-days":
        return 7;
      case "last-week":
        return 7;
      case "last-month":
        return 30;
      case "last-3-months":
        return 90;
      case "last-year":
        return 365;
      default:
        return 7;
    }
  };

  return (
    <DashboardLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-24 sm:pt-28 lg:pt-32 pb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto animate-in fade-in duration-1000">
        {/* Top Stats Section */}
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Facebook Ads Card */}
          <div className="relative flex-1 w-full">
            {/* Gradient glow behind card - more spread out and diffused */}
            <div className="absolute -inset-4 lg:-inset-8 bg-gradient-to-r from-[#1877F2]/30 via-[#1877F2]/15 to-transparent blur-3xl opacity-60" />
            <Card
              className="relative border-[#FFFFFF4D] shadow-2xl w-full"
              style={{
                height: "140px",
                borderRadius: "16px",
                opacity: 1,
                borderWidth: "1px",
                background:
                  "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
              }}
            >
              <CardContent className="p-2.5 sm:p-3 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0">
                      <FacebookIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <h3
                      className="text-white"
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 500,
                        fontSize: "14px",
                        lineHeight: "100%",
                        letterSpacing: "0%",
                      }}
                    >
                      Facebook Ads
                    </h3>
                  </div>
                  <Select
                    defaultValue="last-week"
                    onValueChange={(value) =>
                      setFacebookDays(getDaysFromSelection(value))
                    }
                  >
                    <SelectTrigger className="w-[110px] h-7 bg-[#252525] border-[#3a3a3a] text-gray-300 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <SelectItem
                        value="last-7-days"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        Last 7 Days
                      </SelectItem>
                      <SelectItem
                        value="last-week"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        Last Week
                      </SelectItem>
                      <SelectItem
                        value="last-month"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        Last Month
                      </SelectItem>
                      <SelectItem
                        value="last-3-months"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        Last 3 Months
                      </SelectItem>
                      <SelectItem
                        value="last-year"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        Last Year
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <div>
                    <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                      {facebookAnalytics?.data?.[0]
                        ? formatNumber(
                            facebookAnalytics.data[0].totalImpressions
                          )
                        : "0"}
                    </div>
                    <div className="text-[10px] text-gray-500 mb-0.5">
                      Impressions
                    </div>
                    <div className="text-[10px] font-medium text-gray-500">
                      {facebookAnalytics?.data?.[0]
                        ? `${formatNumber(
                            facebookAnalytics.data[0].totalReach
                          )} reach`
                        : "No data"}
                    </div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                      {facebookAnalytics?.data?.[0]
                        ? formatNumber(facebookAnalytics.data[0].totalClicks)
                        : "0"}
                    </div>
                    <div className="text-[10px] text-gray-500 mb-0.5">
                      Clicks
                    </div>
                    <div className="text-[10px] font-medium text-gray-500">
                      {facebookAnalytics?.data?.[0]
                        ? `${facebookAnalytics.data[0].avgCtr.toFixed(2)}% CTR`
                        : "No data"}
                    </div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                      $
                      {facebookAnalytics?.data?.[0]
                        ? formatNumber(facebookAnalytics.data[0].totalSpend)
                        : "0"}
                    </div>
                    <div className="text-[10px] text-gray-500 mb-0.5">
                      Spend
                    </div>
                    <div className="text-[10px] font-medium text-gray-500">
                      {facebookAnalytics?.data?.[0]
                        ? `$${facebookAnalytics.data[0].avgCpc.toFixed(2)} CPC`
                        : "No data"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Google Ads Card */}
          <div className="relative flex-1 w-full">
            {/* Gradient glow behind card - more spread out and diffused */}
            <div className="absolute -inset-4 lg:-inset-8 bg-gradient-to-r from-[#4285F4]/25 via-[#34A853]/20 to-transparent blur-3xl opacity-60" />
            <Card
              className="relative border-[#FFFFFF4D] shadow-2xl w-full"
              style={{
                height: "140px",
                borderRadius: "16px",
                opacity: 1,
                borderWidth: "1px",
                background:
                  "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
              }}
            >
              <CardContent className="p-2.5 sm:p-3 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 sm:w-7 sm:h-7"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </div>
                    <h3
                      className="text-white"
                      style={{
                        fontFamily: "Poppins",
                        fontWeight: 500,
                        fontSize: "14px",
                        lineHeight: "100%",
                        letterSpacing: "0%",
                      }}
                    >
                      Google Ads
                    </h3>
                  </div>
                  <Select
                    defaultValue="last-week"
                    onValueChange={(value) =>
                      setGoogleDays(getDaysFromSelection(value))
                    }
                  >
                    <SelectTrigger className="w-[110px] h-7 bg-[#252525] border-[#3a3a3a] text-gray-300 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <SelectItem
                        value="last-7-days"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        Last 7 Days
                      </SelectItem>
                      <SelectItem
                        value="last-week"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        Last Week
                      </SelectItem>
                      <SelectItem
                        value="last-month"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        Last Month
                      </SelectItem>
                      <SelectItem
                        value="last-3-months"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        Last 3 Months
                      </SelectItem>
                      <SelectItem
                        value="last-year"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        Last Year
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <div>
                    <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                      {googleAnalytics?.data?.[0]
                        ? formatNumber(googleAnalytics.data[0].totalImpressions)
                        : "0"}
                    </div>
                    <div className="text-[10px] text-gray-500 mb-0.5">
                      Impressions
                    </div>
                    <div className="text-[10px] font-medium text-gray-500">
                      {googleAnalytics?.data?.[0]
                        ? `${formatNumber(
                            googleAnalytics.data[0].totalReach
                          )} reach`
                        : "No data"}
                    </div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                      {googleAnalytics?.data?.[0]
                        ? formatNumber(googleAnalytics.data[0].totalClicks)
                        : "0"}
                    </div>
                    <div className="text-[10px] text-gray-500 mb-0.5">
                      Clicks
                    </div>
                    <div className="text-[10px] font-medium text-gray-500">
                      {googleAnalytics?.data?.[0]
                        ? `${googleAnalytics.data[0].avgCtr.toFixed(2)}% CTR`
                        : "No data"}
                    </div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-white mb-0.5">
                      $
                      {googleAnalytics?.data?.[0]
                        ? formatNumber(googleAnalytics.data[0].totalSpend)
                        : "0"}
                    </div>
                    <div className="text-[10px] text-gray-500 mb-0.5">
                      Spend
                    </div>
                    <div className="text-[10px] font-medium text-gray-500">
                      {googleAnalytics?.data?.[0]
                        ? `$${googleAnalytics.data[0].avgCpc.toFixed(2)} CPC`
                        : "No data"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Campaign Suggestions Section */}
        {suggestionsData && suggestionsData.data.docs.length > 0 && (
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-normal text-white flex items-center gap-2">
                AI Campaign Suggestions
              </h2>
              <Button
                size="sm"
                onClick={handleRegenerateSuggestions}
                disabled={isRegeneratingSuggestions}
                className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all w-full sm:w-auto overflow-hidden"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${
                    isRegeneratingSuggestions ? "animate-spin" : ""
                  }`}
                />
                <span>
                  {isRegeneratingSuggestions ? "Regenerating..." : "Regenerate"}
                </span>
              </Button>
            </div>

            {/* Suggestions Carousel */}
            <div className="relative -mx-4 sm:mx-0">
              <div className="overflow-x-auto pb-4 px-4 sm:px-0 scrollbar-hide">
                <div
                  className="flex gap-3 sm:gap-4"
                  style={{ minWidth: "min-content" }}
                >
                  {suggestionsData.data.docs.map((suggestion) => (
                    <Card
                      key={suggestion._id}
                      className="relative border-[#FFFFFF4D] shadow-xl w-[280px] sm:w-[320px] lg:w-[340px] flex-shrink-0"
                      style={{
                        borderRadius: "16px",
                        borderWidth: "1px",
                        background:
                          "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                      }}
                    >
                      <CardContent className="p-5">
                        <div className="flex flex-col gap-3">
                          {/* Title and Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-base font-semibold text-white line-clamp-2">
                              {suggestion.suggestedTitle}
                            </h3>
                            <Badge
                              variant="outline"
                              className="bg-blue-500/20 text-blue-300 border-blue-400/50 text-xs flex-shrink-0"
                            >
                              New
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-400 line-clamp-3">
                            {suggestion.suggestedDescription}
                          </p>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <FileText className="w-3.5 h-3.5" />
                              <span className="capitalize">
                                {suggestion.suggestedCampaignType}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate">
                                {suggestion.suggestedLocation}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <CircleIcon className="w-3.5 h-3.5 fill-current" />
                              <span className="capitalize">
                                {suggestion.suggestedTargetAudience}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {suggestion.suggestedDuration || 7} days
                              </span>
                            </div>
                          </div>

                          {/* Platform Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {suggestion.suggestedPlatform.map((platform) => (
                              <Badge
                                key={platform}
                                variant="secondary"
                                className="bg-white/10 text-gray-300 border-0 text-xs"
                              >
                                {platform === "facebook"
                                  ? "📘 Facebook"
                                  : "Google"}
                              </Badge>
                            ))}
                          </div>

                          {/* Budget */}
                          {suggestion.suggestedBudget && (
                            <div className="text-sm font-medium text-white">
                              Budget: $
                              {suggestion.suggestedBudget.toLocaleString()}
                            </div>
                          )}

                          {/* Action Button */}
                          <Button
                            size="sm"
                            onClick={() => handleUseSuggestion(suggestion)}
                            className="w-full h-9 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all mt-2"
                            style={{
                              background:
                                "linear-gradient(90deg, #66AFB7 0%, #5A9FA6 100%)",
                            }}
                          >
                            Use This Suggestion
                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Campaigns Section */}
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-5">
            {/* Heading */}
            <h2 className="text-xl sm:text-2xl font-normal text-white">
              Recent Campaigns
            </h2>

            {/* Controls Container - responsive layout */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Filter Buttons Row - wraps on mobile, stays in row on larger screens */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1">
                {/* Platform Select Dropdown */}
                <div className="relative w-full sm:w-auto sm:min-w-[140px]">
                  <Select
                    value={platformFilter}
                    onValueChange={setPlatformFilter}
                  >
                    <SelectTrigger
                      className="h-9 pl-10 pr-4 rounded-full border-0 text-gray-300 text-xs w-full sm:w-auto"
                      style={{
                        background: "#FFFFFF1A",
                        boxShadow:
                          "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                      }}
                    >
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="7"
                            height="7"
                            rx="1"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <rect
                            x="14"
                            y="3"
                            width="7"
                            height="7"
                            rx="1"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <rect
                            x="3"
                            y="14"
                            width="7"
                            height="7"
                            rx="1"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <rect
                            x="14"
                            y="14"
                            width="7"
                            height="7"
                            rx="1"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] rounded-xl">
                      <SelectItem
                        value="all"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        All Platforms
                      </SelectItem>
                      <SelectItem
                        value="facebook"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        Facebook
                      </SelectItem>
                      <SelectItem
                        value="google"
                        className="text-gray-300 focus:text-white focus:bg-white/10"
                      >
                        Google
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

              {/* Create Campaign Button - full width on mobile, auto on larger screens */}
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="relative h-9 px-4 rounded-full border-0 text-white text-xs hover:bg-[#2F2F2F]/60 transition-all w-full sm:w-auto lg:flex-shrink-0 overflow-hidden"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                {/* radial element 150px 150px */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[150px] h-[150px] rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, #66AFB7 0%, transparent 70%)",
                    backdropFilter: "blur(50px)",
                    WebkitBackdropFilter: "blur(50px)",
                    zIndex: -1,
                  }}
                ></div>
                <Plus className="w-4 h-4 mr-0 relative z-10" />
                <span className="relative z-10">Create Campaign</span>
              </Button>
            </div>
          </div>

          {/* Campaigns Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading campaigns...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-400">
                Error:{" "}
                {error instanceof Error
                  ? error.message
                  : "Failed to load campaigns"}
              </div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">No campaigns found</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {campaigns.map((campaign) => (
                <Card
                  key={campaign._id}
                  className="border-[#FFFFFF0D] hover:border-[#3a3a3a] transition-all duration-200"
                  style={{
                    background:
                      "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                  }}
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      {getPlatformIcon(campaign.platform || [])}
                      {campaign.location && (
                        <div
                          className="flex items-center justify-center gap-1.5 flex-shrink-0"
                          style={{
                            width: "105px",
                            height: "38px",
                            borderRadius: "8px",
                            opacity: 1,
                            background: "#66AFB74D",
                          }}
                        >
                          <MapPin
                            className="w-3 h-3"
                            style={{ color: "#66AFB7" }}
                          />
                          <span
                            className="text-xs"
                            style={{ color: "#66AFB7" }}
                          >
                            {campaign.location}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 leading-tight">
                      {campaign.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-4 flex-grow line-clamp-2 leading-relaxed">
                      {renderTextWithLinks(
                        campaign.userRequirements ||
                          campaign.content ||
                          "No description available"
                      )}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">
                          Budget:
                        </span>
                        <span className="text-xs text-white">
                          ${campaign.estimatedBudget?.toLocaleString() || "0"}
                        </span>
                      </div>
                      <ActiveNavButton
                        icon={ArrowRightIcon}
                        text="View Details"
                        onClick={() => handleViewDetails(campaign)}
                        className="h-5 text-[8px] pl-2 pr-2 gap-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                          currentPage <= 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
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
        </div>

        {/* Campaign Details Modal */}
        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              setIsEditing(false);
              if (selectedCampaign) {
                setEditedCampaign(selectedCampaign);
              }
            }
          }}
        >
          <DialogContent
            className="max-w-4xl max-h-[90vh] flex flex-col p-0 text-white border border-white/10 overflow-hidden rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
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
              {selectedCampaign && editedCampaign && (
                <>
                  <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <DialogTitle className="text-xs sm:text-sm font-semibold break-words text-white drop-shadow-lg">
                          {isEditing ? (
                            <Input
                              value={editedCampaign.name.replace(/\s/g, "")}
                              onChange={(e) =>
                                setEditedCampaign({
                                  ...editedCampaign,
                                  name: e.target.value.replace(/\s/g, ""),
                                })
                              }
                              className="text-xs sm:text-sm font-semibold bg-white/5 backdrop-blur-sm border-white/20 text-white focus:bg-white/10 focus:border-white/30 transition-all"
                            />
                          ) : (
                            selectedCampaign.name
                          )}
                        </DialogTitle>
                        <DialogDescription className="break-words text-xs text-white/70 mt-2">
                          Campaign details and progress
                        </DialogDescription>
                      </div>
                      {!isEditing ? (
                        <div className="flex gap-2 ml-2 pr-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRegenerateType("both");
                              setRegenerateDialogOpen(true);
                            }}
                            disabled={isRegenerating}
                            className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs h-7 px-3 py-1"
                          >
                            <RefreshCw className="w-3 h-3 mr-1.5" />
                            Regenerate Both
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all text-xs h-7 px-3 py-1"
                          >
                            <Edit2 className="w-3 h-3 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={isDeleting}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 backdrop-blur-sm transition-all text-xs h-7 px-3 py-1"
                          >
                            <Trash2 className="w-3 h-3 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2 ml-2 pr-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                            className="text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all text-xs h-7 px-3 py-1"
                          >
                            <X className="w-3 h-3 mr-1.5" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isUpdating}
                            className="bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all text-xs h-7 px-3 py-1"
                            style={{
                              background:
                                "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
                            }}
                          >
                            <Save className="w-3 h-3 mr-1.5" />
                            {isUpdating ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide py-4 min-h-0">
                    {/* Status Section */}
                    <div className="flex flex-wrap gap-4 items-center">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-white/70">
                            Status:
                          </Label>
                          <Select
                            value={editedCampaign.status}
                            onValueChange={(value) =>
                              setEditedCampaign({
                                ...editedCampaign,
                                status: value as any,
                              })
                            }
                          >
                            <SelectTrigger className="w-[180px] bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs focus:bg-white/10 focus:border-white/30 transition-all h-7">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white/10 backdrop-blur-xl border-white/20">
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="in-progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="paused">Paused</SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="cancelled">
                                Cancelled
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <Badge
                          className={getStatusColor(selectedCampaign.status)}
                        >
                          {selectedCampaign.status}
                        </Badge>
                      )}
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="break-words">
                          Last updated: {formatDate(selectedCampaign.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Analytics Card */}
                    {selectedCampaign && selectedCampaign._id && (
                      <AnalyticsCard campaignId={selectedCampaign._id} />
                    )}

                    <Separator className="bg-white/10" />

                    {/* User Requirements */}
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                      <CardHeader className="px-4 py-3">
                        <CardTitle className="text-xs flex items-center gap-2 text-white drop-shadow-md">
                          <FileText className="w-5 h-5" />
                          Requirements
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        {isEditing ? (
                          <Textarea
                            value={editedCampaign.userRequirements}
                            onChange={(e) =>
                              setEditedCampaign({
                                ...editedCampaign,
                                userRequirements: e.target.value,
                              })
                            }
                            rows={4}
                            className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                          />
                        ) : (
                          <p className="text-xs text-gray-300/90 whitespace-pre-wrap break-words">
                            {renderTextWithLinks(
                              selectedCampaign.userRequirements
                            )}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Content */}
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                      <CardHeader className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs flex items-center gap-2 text-white drop-shadow-md">
                            <FileText className="w-5 h-5" />
                            Content
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {!isEditing && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRegenerateType("content");
                                    setRegenerateDialogOpen(true);
                                  }}
                                  disabled={isRegenerating}
                                  className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs h-7 px-3 py-1"
                                >
                                  <RefreshCw className="w-3 h-3 mr-1.5" />
                                  Regenerate
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleResetContent}
                                  disabled={isResettingContent}
                                  className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs h-7 px-3 py-1"
                                >
                                  <RotateCcw className="w-3 h-3 mr-1.5" />
                                  Reset
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        {isEditing ? (
                          <Textarea
                            value={editedCampaign.content || ""}
                            onChange={(e) =>
                              setEditedCampaign({
                                ...editedCampaign,
                                content: e.target.value,
                              })
                            }
                            rows={6}
                            className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                            placeholder="Enter campaign content..."
                          />
                        ) : (
                          <p className="text-xs text-gray-300/90 whitespace-pre-wrap break-words">
                            {renderTextWithLinks(
                              selectedCampaign.content || "No content yet"
                            )}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Media */}
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                      <CardHeader className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xs flex items-center gap-2 text-white drop-shadow-md">
                            <ImageIcon className="w-5 h-5" />
                            Media (
                            {isEditing
                              ? editedCampaign.media.length
                              : selectedCampaign.media.length}
                            )
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {!isEditing && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setRegenerateType("media");
                                    setRegenerateDialogOpen(true);
                                  }}
                                  disabled={isRegenerating}
                                  className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs h-7 px-3 py-1"
                                >
                                  <RefreshCw className="w-3 h-3 mr-1.5" />
                                  Regenerate
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleResetMedia}
                                  disabled={isResettingMedia}
                                  className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs h-7 px-3 py-1"
                                >
                                  <RotateCcw className="w-3 h-3 mr-1.5" />
                                  Reset
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        {isEditing ? (
                          editedCampaign.media.length > 0 ? (
                            <ImageCarousel
                              images={editedCampaign.media}
                              onRemove={(index) => {
                                const newMedia = editedCampaign.media.filter(
                                  (_, i) => i !== index
                                );
                                setEditedCampaign({
                                  ...editedCampaign,
                                  media: newMedia,
                                });
                              }}
                              editable={true}
                            />
                          ) : (
                            <div className="text-center py-12 text-gray-400">
                              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No media uploaded yet</p>
                              <p className="text-xs mt-2">
                                Media will be generated automatically
                              </p>
                            </div>
                          )
                        ) : selectedCampaign.media.length > 0 ? (
                          <ImageCarousel
                            images={selectedCampaign.media}
                            editable={false}
                          />
                        ) : (
                          <div className="text-center py-12 text-gray-400">
                            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No media available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Campaign Details */}
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                      <CardHeader className="px-4 py-3">
                        <CardTitle className="text-xs flex items-center gap-2 text-white drop-shadow-md">
                          <Calendar className="w-5 h-5" />
                          Campaign Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 px-4 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-2">
                            <span className="text-gray-300/80 flex-shrink-0 text-xs">
                              Platform:
                            </span>
                            {isEditing ? (
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant={
                                    editedCampaign.platform?.includes(
                                      "facebook"
                                    )
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => {
                                    const currentPlatforms =
                                      editedCampaign.platform || [];
                                    const newPlatforms =
                                      currentPlatforms.includes("facebook")
                                        ? currentPlatforms.filter(
                                            (p) => p !== "facebook"
                                          )
                                        : [...currentPlatforms, "facebook"];
                                    setEditedCampaign({
                                      ...editedCampaign,
                                      platform: newPlatforms,
                                    });
                                  }}
                                  className={
                                    editedCampaign.platform?.includes(
                                      "facebook"
                                    )
                                      ? "bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all text-xs h-7 px-3 py-1"
                                      : "bg-white/5 backdrop-blur-sm border border-white/40 text-white/85 hover:bg-[#2F2F2F]/60 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] transition-all text-xs h-7 px-3 py-1"
                                  }
                                  style={
                                    editedCampaign.platform?.includes(
                                      "facebook"
                                    )
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
                                    editedCampaign.platform?.includes("google")
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => {
                                    const currentPlatforms =
                                      editedCampaign.platform || [];
                                    const newPlatforms =
                                      currentPlatforms.includes("google")
                                        ? currentPlatforms.filter(
                                            (p) => p !== "google"
                                          )
                                        : [...currentPlatforms, "google"];
                                    setEditedCampaign({
                                      ...editedCampaign,
                                      platform: newPlatforms,
                                    });
                                  }}
                                  className={
                                    editedCampaign.platform?.includes("google")
                                      ? "bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all text-xs h-7 px-3 py-1"
                                      : "bg-white/5 backdrop-blur-sm border border-white/40 text-white/85 hover:bg-[#2F2F2F]/60 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] transition-all text-xs h-7 px-3 py-1"
                                  }
                                  style={
                                    editedCampaign.platform?.includes("google")
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
                            ) : (
                              <span className="font-medium break-words uppercase text-white text-xs">
                                {selectedCampaign.platform?.join(", ") || "N/A"}
                              </span>
                            )}
                            {isEditing &&
                              (!editedCampaign.platform ||
                                editedCampaign.platform.length === 0) && (
                                <p className="text-xs text-red-400">
                                  At least one platform is required
                                </p>
                              )}
                          </div>
                          <div className="flex justify-between text-xs gap-2">
                            <span className="text-gray-300/80 flex-shrink-0">
                              Location:
                            </span>
                            <span className="font-medium break-words text-right uppercase text-white">
                              {selectedCampaign.location || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs gap-2">
                            <span className="text-gray-300/80 flex-shrink-0">
                              Target Audience:
                            </span>
                            <span className="font-medium break-words text-right uppercase text-white">
                              {selectedCampaign.targetAudience || "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs gap-2">
                            <span className="text-gray-300/80 flex-shrink-0">
                              Estimated Budget:
                            </span>
                            <span className="font-medium break-words text-right text-white">
                              {selectedCampaign.estimatedBudget
                                ? `$${selectedCampaign.estimatedBudget}`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs gap-2">
                            <span className="text-gray-300/80 flex-shrink-0">
                              Number of Days:
                            </span>
                            <span className="font-medium break-words text-right uppercase text-white">
                              {selectedCampaign.numberOfDays
                                ? `${selectedCampaign.numberOfDays} DAYS`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs gap-2">
                            <span className="text-gray-300/80 flex-shrink-0">
                              Campaign Type:
                            </span>
                            <span className="font-medium break-words text-right uppercase text-white">
                              {selectedCampaign.campaignType || "N/A"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                      <CardHeader className="px-4 py-3">
                        <CardTitle className="text-xs flex items-center gap-2 text-white drop-shadow-md">
                          <Calendar className="w-5 h-5" />
                          Timeline
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 px-4 pb-4">
                        <div className="flex justify-between text-xs gap-2">
                          <span className="text-gray-300/80 flex-shrink-0">
                            Created At:
                          </span>
                          <span className="font-medium break-words text-right text-white">
                            {formatDate(selectedCampaign.createdAt)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs gap-2">
                          <span className="text-gray-300/80 flex-shrink-0">
                            Last Updated:
                          </span>
                          <span className="font-medium break-words text-right text-white">
                            {formatDate(selectedCampaign.updatedAt)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs gap-2">
                          <span className="text-gray-300/80 flex-shrink-0">
                            Campaign ID:
                          </span>
                          <span className="font-mono text-xs break-all text-right text-white">
                            {selectedCampaign._id}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Regenerate Dialog */}
        <Dialog
          open={regenerateDialogOpen}
          onOpenChange={setRegenerateDialogOpen}
        >
          <DialogContent className="max-w-md text-white border-0 overflow-hidden p-0">
            {/* Glassmorphism Background - pointer-events-none so they don't block clicks */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-lg pointer-events-none" />
            <div className="absolute inset-0 bg-[#0b0f20]/80 backdrop-blur-md rounded-lg pointer-events-none" />
            <div className="absolute inset-[1px] bg-gradient-to-br from-white/5 to-transparent rounded-lg pointer-events-none" />
            <div className="absolute inset-0 border border-white/10 rounded-lg shadow-2xl shadow-black/50 pointer-events-none" />

            <div className="relative z-10 p-6">
              <DialogHeader className="mb-4 pb-4 border-b border-white/10">
                <DialogTitle className="text-xs sm:text-sm font-semibold text-white drop-shadow-lg ">
                  Regenerate Campaign {regenerateType}
                </DialogTitle>
                <DialogDescription className="text-xs text-white/70">
                  This will reset and regenerate the {regenerateType} for this
                  campaign. You can provide new guidelines or use the original
                  requirements.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="regenerate-guidelines"
                    className="text-xs text-white/70"
                  >
                    New Guidelines (Optional)
                  </Label>
                  <Textarea
                    id="regenerate-guidelines"
                    value={regenerateGuidelines}
                    onChange={(e) => setRegenerateGuidelines(e.target.value)}
                    placeholder="Enter new guidelines or leave empty to use original requirements..."
                    rows={4}
                    className="mt-1 bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRegenerateDialogOpen(false);
                      setRegenerateGuidelines("");
                      setRegenerateType(null);
                    }}
                    disabled={isRegenerating}
                    className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all text-xs h-7 px-3 py-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all text-xs h-7 px-3 py-1"
                    style={{
                      background:
                        "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
                    }}
                  >
                    {isRegenerating
                      ? "Starting..."
                      : `Regenerate ${regenerateType}`}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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

            // Refetch campaigns list after successful creation
            // The mutation's onSuccess already invalidates queries,
            // so we just need to explicitly refetch to ensure immediate update
            await refetch();
          }}
        />
      </main>
    </DashboardLayout>
  );
};

export default CampaignsPage;
