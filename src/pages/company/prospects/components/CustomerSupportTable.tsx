import React from "react";
import { motion } from "framer-motion";
import { EyeIcon, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Client } from "@/services/clients.service";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDate, getStatusColor } from "@/utils/commonFunctions";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerSupportTableProps {
    data: {
        docs: Client[];
        offset: number;
        limit: number;
        totalDocs: number;
        totalPages: number;
        hasPrevPage: boolean;
        hasNextPage: boolean;
    };
    isLoading?: boolean;
    searchQuery?: string;
    currentPage: number;
    onViewDetails: (query: Client) => void;
    onPageChange: (page: number) => void;
    viewType?: "queries";
}

const CustomerSupportTable: React.FC<CustomerSupportTableProps> = ({
    data,
    isLoading = false,
    searchQuery = "",
    currentPage,
    onViewDetails,
    onPageChange,
    viewType = "queries"
}) => {
    if (isLoading) {
        return (
            <div>
                <div
                    className="space-y-3 p-4"
                >
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex space-x-4"
                        >
                            <Skeleton className="h-4 flex-1 bg-white/10" />
                            <Skeleton className="h-4 flex-1 bg-white/10" />
                            <Skeleton className="h-4 w-24 bg-white/10" />
                            <Skeleton className="h-4 w-24 bg-white/10" />
                        </div>
                    ))}
                </div>

                {/* Skeleton Pagination */}
                <div className="mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="h-4 w-48 bg-white/10 animate-pulse rounded" />
                        <div className="flex items-center justify-center space-x-2">
                            <div className="h-9 w-20 bg-white/10 animate-pulse rounded" />
                            <div className="flex items-center space-x-1">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="w-9 h-9 bg-white/10 animate-pulse rounded" />
                                ))}
                            </div>
                            <div className="h-9 w-20 bg-white/10 animate-pulse rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data || data.docs.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center text-gray-400 py-8"
            >
                {searchQuery
                    ? `No ${viewType} found matching "${searchQuery}"`
                    : `No ${viewType} found`}
            </motion.div>
        );
    }

    return (
        <>
            {/* Header */}
            <div
                className="mb-4 border border-[#FFFFFF1A] rounded-xl overflow-hidden"
            >
                <div
                    className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_0.8fr_80px] items-center gap-4 px-6 py-4 bg-[#FFFFFF05]"
                >
                    <div
                        className="text-sm text-gray-400"
                    >
                        Name
                    </div>
                    <div
                        className="text-sm text-gray-400"
                    >
                        Email
                    </div>
                    <div
                        className="text-sm text-gray-400"
                    >
                        Phone
                    </div>
                    <div
                        className="text-sm text-gray-400"
                    >
                        Start Time
                    </div>
                    <div
                        className="text-sm text-gray-400"
                    >
                        Status
                    </div>
                    <div
                        className="text-sm text-gray-400 text-center"
                    >
                        Messages
                    </div>
                    <div
                        className="text-sm text-gray-400 text-center"
                    >
                        Actions
                    </div>
                </div>
            </div>

            {/* Table Body */}
            <div className="w-full max-h-[150px] overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div
                        className="rounded-2xl overflow-hidden bg-[#FFFFFF03]"
                    >
                        {data.docs.map((query) => {
                            // Parse personalContactInfo for queries view
                            let contactInfo = null;
                            if (query.personalContactInfo?.value) {
                                try {
                                    contactInfo = JSON.parse(query.personalContactInfo.value);
                                } catch (e) {
                                    console.error("Error parsing personalContactInfo:", e);
                                }
                            }

                            return (
                                <div
                                    key={query._id}
                                    className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_0.8fr_80px] items-center gap-4 px-6 py-4 border-b border-[#FFFFFF0D] last:border-b-0 cursor-pointer relative overflow-hidden hover:bg-white/10 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] !transition-none">
                                    <div
                                        className="font-medium text-white truncate text-sm"
                                        title={contactInfo?.name || "N/A"}
                                    >
                                        {contactInfo?.name || "N/A"}
                                    </div>
                                    <div
                                        className="text-gray-300 text-sm truncate"
                                        title={contactInfo?.email || "N/A"}
                                    >
                                        {contactInfo?.email || "N/A"}
                                    </div>
                                    <div
                                        className="text-gray-300 text-sm truncate"
                                        title={contactInfo?.phone || "N/A"}
                                    >
                                        {contactInfo?.phone || "N/A"}
                                    </div>
                                    <div
                                        className="text-gray-300 text-sm"
                                    >
                                        {formatDate(query.startTime)}
                                    </div>
                                    <div>
                                        <Badge
                                            className={`${getStatusColor(
                                                query.status
                                            )} rounded-full px-3`}
                                        >
                                            {query.status}
                                        </Badge>
                                    </div>
                                    <div className="text-gray-300 text-sm text-center">
                                        {query.messagesTotal}
                                    </div>
                                    <div className="flex justify-center">
                                        <TooltipProvider>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="p-2 rounded-full text-gray-300"
                                                    >
                                                        <MoreVertical className="h-5 w-5" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-200 shadow-lg rounded-lg w-40"
                                                >
                                                    <div>
                                                        <DropdownMenuItem
                                                            onClick={() => onViewDetails(query)}
                                                            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                                                        >
                                                            <EyeIcon size={16} /> View Details
                                                        </DropdownMenuItem>
                                                    </div>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                    <div className="mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="text-sm text-gray-400 text-center sm:text-left">
                                Showing{" "}
                                <span className="font-medium text-white">
                                    {data.offset + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium text-white">
                                    {Math.min(
                                        data.offset + data.limit,
                                        data.totalDocs
                                    )}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-white">
                                    {data.totalDocs}
                                </span>{" "}
                                {viewType}
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                                    disabled={!data.hasPrevPage}
                                    className="px-3 bg-[#FFFFFF1A] border-0 text-gray-300 hover:bg-white/10"
                                    style={{
                                        boxShadow:
                                            "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                                    }}
                                >
                                    <span className="hidden sm:inline">Previous</span>
                                    <span className="sm:hidden">Prev</span>
                                </Button>

                                <div className="flex items-center space-x-1">
                                    {Array.from(
                                        { length: Math.min(5, data.totalPages) },
                                        (_, i) => {
                                            const pageNumber =
                                                Math.max(
                                                    1,
                                                    Math.min(
                                                        data.totalPages - 4,
                                                        currentPage - 2
                                                    )
                                                ) + i;

                                            if (pageNumber > data.totalPages) return null;

                                            return (
                                                <Button
                                                    key={pageNumber}
                                                    variant={
                                                        pageNumber === currentPage
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    size="sm"
                                                    onClick={() => onPageChange(pageNumber)}
                                                    className={`w-9 h-9 p-0 ${pageNumber === currentPage
                                                        ? "bg-white/20 text-white"
                                                        : "bg-[#FFFFFF1A] border-0 text-gray-300 hover:bg-white/10"
                                                        }`}
                                                    style={
                                                        pageNumber !== currentPage
                                                            ? {
                                                                boxShadow:
                                                                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                                                            }
                                                            : undefined
                                                    }
                                                >
                                                    {pageNumber}
                                                </Button>
                                            );
                                        }
                                    )}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(Math.min(currentPage + 1, data.totalPages))}
                                    disabled={!data.hasNextPage}
                                    className="px-3 bg-[#FFFFFF1A] border-0 text-gray-300 hover:bg-white/10"
                                    style={{
                                        boxShadow:
                                            "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                                    }}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CustomerSupportTable;