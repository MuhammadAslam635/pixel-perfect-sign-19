import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Plus, RefreshCw, Search, ArrowRight as ArrowRightIcon, } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react'
import { DateRange } from 'react-day-picker';
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { getPlatformIcon, renderTextWithLinks } from '@/helpers/campaigns';
import { ActiveNavButton } from '@/components/ui/primary-btn';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { prefetchCampaign, useCampaigns } from '@/hooks/useCampaigns';
import { useQueryClient } from '@tanstack/react-query';
import { Campaign } from '@/services/campaigns.service';

interface RecentCampaignsProps {
    onViewDetails: (campaign: Campaign) => void;
    onCreateCampaign: any;
}

const RecentCampaign: React.FC<RecentCampaignsProps> = ({ onViewDetails, onCreateCampaign, }) => {
    const [platformFilter, setPlatformFilter] = useState<string>("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [searchInput, setSearchInput] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const queryClient = useQueryClient();
    const [debouncedSearch, setDebouncedSearch] = useState<string>("");
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editedCampaign, setEditedCampaign] = useState<Campaign | null>(null);
    const [viewingCampaignId, setViewingCampaignId] = useState<string | null>(null);
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
    const { data, isLoading, error, refetch } = useCampaigns(queryParams);
    const campaigns = useMemo(() => {
        if (!data?.data?.docs) return [];
        return data.data.docs;
    }, [data]);

    const handleViewDetails = (campaign: Campaign) => {
        setSelectedCampaign(null);
        setEditedCampaign(null);
        setViewingCampaignId(campaign._id);
        setIsModalOpen(true);
        setIsEditing(false);
    };

    useEffect(() => {
        if (selectedCampaign && campaigns.length > 0 && !isModalOpen) {
            const updatedCampaign = campaigns.find(
                (campaign) => campaign._id === selectedCampaign._id
            );
            if (updatedCampaign) {
                // Don't override if current selectedCampaign has completed status but updated has in-progress
                const shouldUpdate = JSON.stringify(updatedCampaign) !== JSON.stringify(selectedCampaign) && !(selectedCampaign.processingStatus?.content?.status === "completed" && updatedCampaign.processingStatus?.content?.status === "in-progress"
                ) && !(selectedCampaign.processingStatus?.media?.status === "completed" && updatedCampaign.processingStatus?.media?.status === "in-progress");

                if (shouldUpdate) {
                    setSelectedCampaign(updatedCampaign);
                    if (!isEditing) {
                        setEditedCampaign(updatedCampaign);
                    }
                }
            }
        }
    }, [campaigns, selectedCampaign, isEditing, isModalOpen]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchInput);
            setCurrentPage(1); // search pe page reset
        }, 500); // 500ms debounce

        return () => {
            clearTimeout(handler);
        };
    }, [searchInput]);

    return (
        <>
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
                                        <SelectItem value="all" className="text-gray-300 focus:text-white focus:bg-white/10">
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
                                <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-[#2a2a2a]" align="start">
                                    <CalendarComponent
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
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
                            onClick={onCreateCampaign}
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
                            className="bg-white/5 backdrop-blur-sm border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30 transition-all"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
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
                                className="border-[#FFFFFF0D] hover:border-[#3a3a3a] transition-all duration-200 cursor-pointer"
                                style={{
                                    background:
                                        "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                                }}
                                onClick={() => onViewDetails(campaign)}
                                onMouseEnter={() =>
                                    prefetchCampaign(queryClient, campaign._id)
                                }
                            >
                                <CardContent className="p-4 sm:p-5 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                                        {getPlatformIcon(campaign.platform || [])}
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
                                            className={`cursor-pointer hover:bg-white/10 transition-colors h-7 w-7 p-0 flex items-center justify-center [&>span]:hidden ${currentPage <= 1
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
                                            className={`cursor-pointer hover:bg-white/10 transition-colors h-7 w-7 p-0 flex items-center justify-center [&>span]:hidden ${currentPage >= data.data.totalPages
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
        </>
    )
}

export default RecentCampaign