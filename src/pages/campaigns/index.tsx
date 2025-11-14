import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, Search, Calendar as CalendarIcon, Clock, Calendar, FileText, Image as ImageIcon, RotateCcw, Upload, Circle as CircleIcon, RefreshCw, CheckCircle2, Trash2, Edit2, Save, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { campaignsService, Campaign, UpdateCampaignData } from '@/services/campaigns.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import ImageCarousel from '@/components/campaigns/ImageCarousel';
import CreateCampaignModal from '@/components/campaigns/CreateCampaignModal';
import FacebookIcon from '@/components/icons/FacebookIcon';

const CampaignsPage = () => {
  const [date, setDate] = useState<Date>();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchInput, setSearchInput] = useState<string>('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedCampaign, setEditedCampaign] = useState<Campaign | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [regenerateType, setRegenerateType] = useState<'content' | 'media' | 'both' | null>(null);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState<boolean>(false);
  const [regenerateGuidelines, setRegenerateGuidelines] = useState<string>('');
  const [isResettingContent, setIsResettingContent] = useState<boolean>(false);
  const [isResettingMedia, setIsResettingMedia] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedCampaign) {
      setEditedCampaign(selectedCampaign);
    }
  }, [selectedCampaign]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchInput]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await campaignsService.getCampaigns({
          search: searchQuery || undefined,
          limit: 100, // Fetch more campaigns to allow filtering
        });

        if (response.success && response.data.docs) {
          let filteredCampaigns = response.data.docs;

          // Apply platform filter
          if (platformFilter !== 'all') {
            filteredCampaigns = filteredCampaigns.filter((campaign) =>
              campaign.platform?.some((p) => 
                p.toLowerCase() === platformFilter.toLowerCase()
              )
            );
          }

          setCampaigns(filteredCampaigns);
        } else {
          setCampaigns([]);
        }
      } catch (err: any) {
        console.error('Error fetching campaigns:', err);
        setError(err.response?.data?.message || 'Failed to fetch campaigns');
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [searchQuery, platformFilter]);

  const getMediaUrl = (mediaFilename: string): string => {
    const backendUrl = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:3000';
    // Remove /api from backend URL if present, as uploads are served from root
    // Also ensure we don't have trailing slashes
    const baseUrl = backendUrl.replace('/api', '').replace(/\/$/, '');
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

  const handleSave = async () => {
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

    try {
      setIsUpdating(true);
      const updateData: UpdateCampaignData = {
        name: editedCampaign.name,
        userRequirements: editedCampaign.userRequirements,
        content: editedCampaign.content,
        status: editedCampaign.status as any,
        media: editedCampaign.media,
        isContentFinalized: editedCampaign.isContentFinalized,
        isMediaFinalized: editedCampaign.isMediaFinalized,
        platform: editedCampaign.platform,
      };
      
      const response = await campaignsService.updateCampaign(selectedCampaign._id, updateData);
      
      // Update the campaign in the list
      setCampaigns(campaigns.map(c => c._id === selectedCampaign._id ? response.data : c));
      setSelectedCampaign(response.data);
      setEditedCampaign(response.data);
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: response.message || "Campaign updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update campaign",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetContent = async () => {
    if (!selectedCampaign) return;

    try {
      setIsResettingContent(true);
      const response = await campaignsService.resetCampaignContent(selectedCampaign._id);
      
      setCampaigns(campaigns.map(c => c._id === selectedCampaign._id ? response.data : c));
      setSelectedCampaign(response.data);
      if (editedCampaign) {
        setEditedCampaign(response.data);
      }
      
      toast({
        title: "Success",
        description: "Campaign content has been reset successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reset content",
        variant: "destructive",
      });
    } finally {
      setIsResettingContent(false);
    }
  };

  const handleResetMedia = async () => {
    if (!selectedCampaign) return;

    try {
      setIsResettingMedia(true);
      const response = await campaignsService.resetCampaignMedia(selectedCampaign._id);
      
      setCampaigns(campaigns.map(c => c._id === selectedCampaign._id ? response.data : c));
      setSelectedCampaign(response.data);
      if (editedCampaign) {
        setEditedCampaign(response.data);
      }
      
      toast({
        title: "Success",
        description: "Campaign media has been reset successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to reset media",
        variant: "destructive",
      });
    } finally {
      setIsResettingMedia(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedCampaign || !regenerateType) return;

    try {
      setIsRegenerating(true);
      const response = await campaignsService.regenerateCampaign(selectedCampaign._id, {
        type: regenerateType,
        userGuidelines: regenerateGuidelines || undefined,
      });
      
      toast({
        title: "Success",
        description: response.message || `${regenerateType} regeneration has been started. You will receive a notification when it's ready.`,
      });
      
      // Refresh campaign data after a delay
      setTimeout(() => {
        refreshCampaignData();
      }, 2000);
      
      setRegenerateDialogOpen(false);
      setRegenerateType(null);
      setRegenerateGuidelines('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to regenerate campaign",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleFinalize = async (type: 'content' | 'media') => {
    if (!selectedCampaign) return;

    try {
      setIsUpdating(true);
      const updateData: UpdateCampaignData = {};
      if (type === 'content') {
        updateData.isContentFinalized = true;
      } else {
        updateData.isMediaFinalized = true;
      }

      const response = await campaignsService.updateCampaign(selectedCampaign._id, updateData);
      
      // Update the campaign in the list
      setCampaigns(campaigns.map(c => c._id === selectedCampaign._id ? response.data : c));
      setSelectedCampaign(response.data);
      
      toast({
        title: "Success",
        description: `${type === 'content' ? 'Content' : 'Media'} finalized successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || `Failed to finalize ${type}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!selectedCampaign) return;

    try {
      setIsDeleting(true);
      await campaignsService.deleteCampaign(selectedCampaign._id);
      
      // Remove campaign from list
      setCampaigns(campaigns.filter(c => c._id !== selectedCampaign._id));
      setIsModalOpen(false);
      setSelectedCampaign(null);
      setDeleteDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete campaign",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const refreshCampaignData = async () => {
    if (!selectedCampaign) return;

    try {
      const response = await campaignsService.getCampaignById(selectedCampaign._id);
      setSelectedCampaign(response.data);
      setCampaigns(campaigns.map(c => c._id === selectedCampaign._id ? response.data : c));
    } catch (error: any) {
      console.error('Error refreshing campaign:', error);
    }
  };

  const getPlatformIcon = (platforms: string[]) => {
    if (!platforms || platforms.length === 0) return null;

    const hasFacebook = platforms.some((p) => p.toLowerCase() === 'facebook');
    const hasGoogle = platforms.some(
      (p) => p.toLowerCase() === 'google' || p.toLowerCase() === 'google ads'
    );

    if (hasFacebook && hasGoogle) {
      return (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <FacebookIcon className="w-8 h-8 sm:w-9 sm:h-9" />
          <svg className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
      );
    }

    // Default icon for other platforms
    return (
      <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#1877F2] rounded-lg flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </div>
    );
  };
  return (
    <DashboardLayout>
      <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] pt-24 sm:pt-28 lg:pt-32 pb-8 flex flex-col gap-6 text-white flex-1 overflow-y-auto">
        {/* Top Stats Section */}
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Facebook Ads Card */}
          <div className="relative flex-1 w-full">
            {/* Gradient glow behind card - more spread out and diffused */}
            <div className="absolute -inset-4 lg:-inset-8 bg-gradient-to-r from-[#1877F2]/30 via-[#1877F2]/15 to-transparent blur-3xl opacity-60" />
            <Card
              className="relative border-[#FFFFFF4D] shadow-2xl w-full"
              style={{
                height: '251px',
                borderRadius: '30px',
                opacity: 1,
                borderWidth: '1px',
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <CardContent className="p-4 sm:p-5 lg:p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
                      <FacebookIcon className="w-10 h-10 sm:w-12 sm:h-12" />
                    </div>
                    <h3 className="text-white" style={{
                      fontFamily: 'Poppins',
                      fontWeight: 500,
                      fontSize: '24px',
                      lineHeight: '100%',
                      letterSpacing: '0%'
                    }}>Facebook Ads</h3>
                  </div>
                  <Select defaultValue="last-month">
                    <SelectTrigger className="w-[130px] h-9 bg-[#252525] border-[#3a3a3a] text-gray-300 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <SelectItem value="last-7-days" className="text-gray-300 focus:text-white focus:bg-white/10">Last 7 Days</SelectItem>
                      <SelectItem value="last-week" className="text-gray-300 focus:text-white focus:bg-white/10">Last Week</SelectItem>
                      <SelectItem value="last-month" className="text-gray-300 focus:text-white focus:bg-white/10">Last Month</SelectItem>
                      <SelectItem value="last-3-months" className="text-gray-300 focus:text-white focus:bg-white/10">Last 3 Months</SelectItem>
                      <SelectItem value="last-year" className="text-gray-300 focus:text-white focus:bg-white/10">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">1.2M</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Impressions</div>
                    <div className="text-xs font-medium text-green-500">↑ 12%</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">845K</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Reach</div>
                    <div className="text-xs font-medium text-green-500">↑ 8%</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">32.5K</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Clicks</div>
                    <div className="text-xs font-medium text-red-500">↓ 3%</div>
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
                height: '251px',
                borderRadius: '30px',
                opacity: 1,
                borderWidth: '1px',
                background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
              }}
            >
              <CardContent className="p-4 sm:p-5 lg:p-6 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <h3 className="text-white" style={{
                      fontFamily: 'Poppins',
                      fontWeight: 500,
                      fontSize: '24px',
                      lineHeight: '100%',
                      letterSpacing: '0%'
                    }}>Google Ads</h3>
                  </div>
                  <Select defaultValue="last-month">
                    <SelectTrigger className="w-[130px] h-9 bg-[#252525] border-[#3a3a3a] text-gray-300 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <SelectItem value="last-7-days" className="text-gray-300 focus:text-white focus:bg-white/10">Last 7 Days</SelectItem>
                      <SelectItem value="last-week" className="text-gray-300 focus:text-white focus:bg-white/10">Last Week</SelectItem>
                      <SelectItem value="last-month" className="text-gray-300 focus:text-white focus:bg-white/10">Last Month</SelectItem>
                      <SelectItem value="last-3-months" className="text-gray-300 focus:text-white focus:bg-white/10">Last 3 Months</SelectItem>
                      <SelectItem value="last-year" className="text-gray-300 focus:text-white focus:bg-white/10">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">980K</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Impressions</div>
                    <div className="text-xs font-medium text-green-500">↑ 15%</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">765K</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Reach</div>
                    <div className="text-xs font-medium text-green-500">↑ 10%</div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">28.3K</div>
                    <div className="text-xs text-gray-500 mb-1 sm:mb-1.5">Clicks</div>
                    <div className="text-xs font-medium text-red-500">↓ 2%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Campaigns Section */}
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Recent Campaigns</h2>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Platform Select Dropdown */}
              <div className="relative">
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger
                    className="h-9 pl-10 pr-4 rounded-full border-0 text-gray-300 text-xs min-w-[140px]"
                    style={{
                      background: '#FFFFFF1A',
                      boxShadow: '0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset'
                    }}
                  >
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] rounded-xl">
                    <SelectItem value="all" className="text-gray-300 focus:text-white focus:bg-white/10">All Platforms</SelectItem>
                    <SelectItem value="facebook" className="text-gray-300 focus:text-white focus:bg-white/10">Facebook</SelectItem>
                    <SelectItem value="google" className="text-gray-300 focus:text-white focus:bg-white/10">Google</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Input */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative h-9 pl-10 pr-4 rounded-full border-0 text-gray-400 hover:opacity-80 text-xs min-w-[140px] justify-start"
                    style={{
                      background: '#FFFFFF1A',
                      boxShadow: '0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset'
                    }}
                  >
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <span>{date ? format(date, 'PPP') : 'Select Date'}</span>
                  </Button>
                </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-[#2a2a2a]" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="rounded-md border-0"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center text-white",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal text-gray-300 hover:bg-white/10 hover:text-white rounded-md aria-selected:opacity-100",
                      day_range_end: "day-range-end",
                      day_selected: "bg-white/20 text-white hover:bg-white/30 hover:text-white focus:bg-white/20 focus:text-white",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "day-outside text-gray-600 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-gray-600 opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                </PopoverContent>
              </Popover>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                <Input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="h-9 pl-10 pr-4 !rounded-full border-0 text-gray-300 placeholder:text-gray-500 text-xs min-w-[160px]"
                  style={{
                    background: '#FFFFFF1A',
                    boxShadow: '0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset'
                  }}
                />
              </div>

              {/* Create Campaign Button */}
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="relative h-9 px-4 rounded-full border border-white/40 text-white text-xs bg-white/5 backdrop-blur-sm shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all"
                style={{
                  background:
                    "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </div>

          {/* Campaigns Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading campaigns...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-400">Error: {error}</div>
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
                    background: 'linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)'
                  }}
                >
                  <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      {getPlatformIcon(campaign.platform || [])}
                      {campaign.location && (
                        <div className="flex items-center gap-1.5 bg-[#252525] rounded-md px-2 py-1 flex-shrink-0">
                          <MapPin className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-400">{campaign.location}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 leading-tight">{campaign.name}</h3>
                    <p className="text-xs text-gray-500 mb-4 flex-grow line-clamp-2 leading-relaxed">
                      {campaign.userRequirements || campaign.content || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Budget</div>
                        <div className="text-sm font-bold text-white">
                          ${campaign.estimatedBudget?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-[#252525] border-[#333333] text-gray-300 hover:bg-[#2a2a2a] hover:text-white h-7 text-xs px-3 rounded-md"
                        onClick={() => handleViewDetails(campaign)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Campaign Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setIsEditing(false);
            if (selectedCampaign) {
              setEditedCampaign(selectedCampaign);
            }
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 text-white border-0">
            {/* Glassmorphism Background - pointer-events-none so they don't block clicks */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-lg pointer-events-none" />
            <div className="absolute inset-0 bg-[#0b0f20]/80 backdrop-blur-md rounded-lg pointer-events-none" />
            <div className="absolute inset-[1px] bg-gradient-to-br from-white/5 to-transparent rounded-lg pointer-events-none" />
            <div className="absolute inset-0 border border-white/10 rounded-lg shadow-2xl shadow-black/50 pointer-events-none" />
            
            <div className="relative z-10 overflow-y-auto scrollbar-hide max-h-[90vh] p-9">
            {selectedCampaign && editedCampaign && (
              <>
                <DialogHeader className="mb-6 pb-4 border-b border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <DialogTitle className="text-2xl font-bold break-words text-white drop-shadow-lg">
                        {isEditing ? (
                          <Input
                            value={editedCampaign.name.replace(/\s/g, "")}
                            onChange={(e) =>
                              setEditedCampaign({
                                ...editedCampaign,
                                name: e.target.value.replace(/\s/g, ""),
                              })
                            }
                            className="text-2xl font-bold bg-white/5 backdrop-blur-sm border-white/20 text-white focus:bg-white/10 focus:border-white/30 transition-all"
                          />
                        ) : (
                          selectedCampaign.name
                        )}
                      </DialogTitle>
                      <DialogDescription className="break-words text-gray-300/80 mt-2">
                        Campaign details and progress
                      </DialogDescription>
                    </div>
                    {!isEditing ? (
                      <div className="flex gap-2 ml-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRegenerateType("both");
                            setRegenerateDialogOpen(true);
                          }}
                        disabled={isRegenerating}
                        className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate Both
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                        className="text-gray-300 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSave} 
                        disabled={isUpdating} 
                        className="bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all"
                        style={{
                          background:
                            "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isUpdating ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4 overflow-hidden">
                {/* Status Section */}
                <div className="flex flex-wrap gap-4 items-center">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Label className="text-gray-300">Status:</Label>
                      <Select
                        value={editedCampaign.status}
                        onValueChange={(value) =>
                          setEditedCampaign({
                            ...editedCampaign,
                            status: value as any,
                          })
                        }
                      >
                        <SelectTrigger className="w-[180px] bg-white/5 backdrop-blur-sm border-white/20 text-white focus:bg-white/10 focus:border-white/30 transition-all">
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
                    ) : (
                      <Badge className={getStatusColor(selectedCampaign.status)}>
                        {selectedCampaign.status}
                      </Badge>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="break-words">Last updated: {formatDate(selectedCampaign.updatedAt)}</span>
                    </div>
                  </div>

                <Separator className="bg-white/10" />

                {/* User Requirements */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                      <FileText className="w-5 h-5" />
                      Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                        className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                      />
                    ) : (
                      <p className="text-sm text-gray-300/90 whitespace-pre-wrap break-words">
                        {selectedCampaign.userRequirements}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Content */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
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
                              className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Regenerate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleResetContent}
                              disabled={isResettingContent}
                              className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Reset
                            </Button>
                          </>
                        )}
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="contentFinalized"
                                checked={editedCampaign.isContentFinalized}
                                onChange={(e) =>
                                  setEditedCampaign({
                                    ...editedCampaign,
                                    isContentFinalized: e.target.checked,
                                  })
                                }
                                className="w-4 h-4"
                              />
                              <Label htmlFor="contentFinalized" className="text-sm text-gray-400">
                                Finalized
                              </Label>
                            </div>
                          ) : selectedCampaign.isContentFinalized ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Finalized
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              <CircleIcon className="w-3 h-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  <CardContent>
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
                        className="w-full bg-white/5 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
                        placeholder="Enter campaign content..."
                      />
                    ) : (
                      <p className="text-sm text-gray-300/90 whitespace-pre-wrap break-words">
                        {selectedCampaign.content || "No content yet"}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Media */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                        <ImageIcon className="w-5 h-5" />
                        Media ({isEditing ? editedCampaign.media.length : selectedCampaign.media.length})
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
                              className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all"
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Regenerate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleResetMedia}
                              disabled={isResettingMedia}
                              className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Reset
                            </Button>
                          </>
                        )}
                          {isEditing ? (
                            <>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="mediaFinalized"
                                  checked={editedCampaign.isMediaFinalized}
                                  onChange={(e) =>
                                    setEditedCampaign({
                                      ...editedCampaign,
                                      isMediaFinalized: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4"
                                />
                                <Label htmlFor="mediaFinalized" className="text-sm text-gray-400">
                                  Finalized
                                </Label>
                              </div>
                            </>
                          ) : selectedCampaign.isMediaFinalized ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Finalized
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              <CircleIcon className="w-3 h-3 mr-1" />
                              Draft
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        editedCampaign.media.length > 0 ? (
                          <ImageCarousel
                            images={editedCampaign.media}
                            onRemove={(index) => {
                              const newMedia = editedCampaign.media.filter((_, i) => i !== index);
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
                            <p className="text-sm mt-2">
                              Media will be generated automatically
                            </p>
                          </div>
                        )
                      ) : selectedCampaign.media.length > 0 ? (
                        <ImageCarousel images={selectedCampaign.media} editable={false} />
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
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                      <Calendar className="w-5 h-5" />
                      Campaign Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-2">
                        <span className="text-gray-300/80 flex-shrink-0 text-sm">Platform:</span>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={editedCampaign.platform?.includes("facebook") ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const currentPlatforms = editedCampaign.platform || [];
                                const newPlatforms = currentPlatforms.includes("facebook")
                                  ? currentPlatforms.filter((p) => p !== "facebook")
                                  : [...currentPlatforms, "facebook"];
                                setEditedCampaign({
                                  ...editedCampaign,
                                  platform: newPlatforms,
                                });
                              }}
                              className={
                                editedCampaign.platform?.includes("facebook")
                                  ? "bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all"
                                  : "bg-white/5 backdrop-blur-sm border border-white/40 text-white/85 hover:bg-[#2F2F2F]/60 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] transition-all"
                              }
                              style={
                                editedCampaign.platform?.includes("facebook")
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
                              variant={editedCampaign.platform?.includes("google") ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const currentPlatforms = editedCampaign.platform || [];
                                const newPlatforms = currentPlatforms.includes("google")
                                  ? currentPlatforms.filter((p) => p !== "google")
                                  : [...currentPlatforms, "google"];
                                setEditedCampaign({
                                  ...editedCampaign,
                                  platform: newPlatforms,
                                });
                              }}
                              className={
                                editedCampaign.platform?.includes("google")
                                  ? "bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all"
                                  : "bg-white/5 backdrop-blur-sm border border-white/40 text-white/85 hover:bg-[#2F2F2F]/60 hover:text-white hover:shadow-[0_16px_28px_rgba(0,0,0,0.35)] transition-all"
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
                          <span className="font-medium break-words uppercase text-white">
                            {selectedCampaign.platform?.join(", ") || "N/A"}
                          </span>
                        )}
                        {isEditing && (!editedCampaign.platform || editedCampaign.platform.length === 0) && (
                          <p className="text-sm text-red-400">At least one platform is required</p>
                        )}
                      </div>
                      <div className="flex justify-between text-sm gap-2">
                        <span className="text-gray-300/80 flex-shrink-0">Location:</span>
                        <span className="font-medium break-words text-right uppercase text-white">
                          {selectedCampaign.location || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm gap-2">
                        <span className="text-gray-300/80 flex-shrink-0">Target Audience:</span>
                        <span className="font-medium break-words text-right uppercase text-white">
                          {selectedCampaign.targetAudience || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm gap-2">
                        <span className="text-gray-300/80 flex-shrink-0">Estimated Budget:</span>
                        <span className="font-medium break-words text-right text-white">
                          {selectedCampaign.estimatedBudget ? `$${selectedCampaign.estimatedBudget}` : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm gap-2">
                        <span className="text-gray-300/80 flex-shrink-0">Number of Days:</span>
                        <span className="font-medium break-words text-right uppercase text-white">
                          {selectedCampaign.numberOfDays ? `${selectedCampaign.numberOfDays} DAYS` : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm gap-2">
                        <span className="text-gray-300/80 flex-shrink-0">Campaign Type:</span>
                        <span className="font-medium break-words text-right uppercase text-white">
                          {selectedCampaign.campaignType || "N/A"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white drop-shadow-md">
                      <Calendar className="w-5 h-5" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-gray-300/80 flex-shrink-0">Created At:</span>
                      <span className="font-medium break-words text-right text-white">
                        {formatDate(selectedCampaign.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-gray-300/80 flex-shrink-0">Last Updated:</span>
                      <span className="font-medium break-words text-right text-white">
                        {formatDate(selectedCampaign.updatedAt)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-gray-300/80 flex-shrink-0">Campaign ID:</span>
                      <span className="font-mono text-xs break-all text-right text-white">{selectedCampaign._id}</span>
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
        <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
          <DialogContent className="max-w-md text-white border-0 overflow-hidden p-0">
            {/* Glassmorphism Background - pointer-events-none so they don't block clicks */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-xl rounded-lg pointer-events-none" />
            <div className="absolute inset-0 bg-[#0b0f20]/80 backdrop-blur-md rounded-lg pointer-events-none" />
            <div className="absolute inset-[1px] bg-gradient-to-br from-white/5 to-transparent rounded-lg pointer-events-none" />
            <div className="absolute inset-0 border border-white/10 rounded-lg shadow-2xl shadow-black/50 pointer-events-none" />
            
            <div className="relative z-10 p-6">
              <DialogHeader className="mb-4 pb-4 border-b border-white/10">
                <DialogTitle className="text-white drop-shadow-lg">Regenerate Campaign {regenerateType}</DialogTitle>
                <DialogDescription className="text-gray-300/80 mt-2">
                  This will reset and regenerate the {regenerateType} for this campaign.
                  You can provide new guidelines or use the original requirements.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="regenerate-guidelines" className="text-gray-300">New Guidelines (Optional)</Label>
                  <Textarea
                    id="regenerate-guidelines"
                    value={regenerateGuidelines}
                    onChange={(e) => setRegenerateGuidelines(e.target.value)}
                    placeholder="Enter new guidelines or leave empty to use original requirements..."
                    rows={4}
                    className="mt-1 bg-white/5 backdrop-blur-sm border-white/20 text-white placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all"
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
                    className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="bg-white/5 backdrop-blur-sm border border-white/40 text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] hover:bg-[#2F2F2F]/60 transition-all"
                    style={{
                      background:
                        "radial-gradient(circle at left, rgba(64, 102, 179, 0.4) 0%, rgba(103, 176, 183, 0.3) 50%, transparent 70%)",
                    }}
                  >
                    {isRegenerating ? "Starting..." : `Regenerate ${regenerateType}`}
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
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            // Refetch campaigns after successful creation
            const fetchCampaigns = async () => {
              try {
                setLoading(true);
                setError(null);
                const response = await campaignsService.getCampaigns({
                  search: searchQuery || undefined,
                  limit: 100,
                });

                if (response.success && response.data.docs) {
                  let filteredCampaigns = response.data.docs;

                  if (platformFilter !== 'all') {
                    filteredCampaigns = filteredCampaigns.filter((campaign) =>
                      campaign.platform?.some((p) => 
                        p.toLowerCase() === platformFilter.toLowerCase()
                      )
                    );
                  }

                  setCampaigns(filteredCampaigns);
                } else {
                  setCampaigns([]);
                }
              } catch (err: any) {
                console.error('Error fetching campaigns:', err);
                setError(err.response?.data?.message || 'Failed to fetch campaigns');
                setCampaigns([]);
              } finally {
                setLoading(false);
              }
            };
            fetchCampaigns();
          }}
        />
      </main>
    </DashboardLayout>
  );
};

export default CampaignsPage;
