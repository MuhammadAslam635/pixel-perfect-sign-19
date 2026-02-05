import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EyeIcon, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Client } from "@/services/clients.service";
import { headerVariants, rowVariants, tableVariants } from "@/helpers/customerSupport";
import { formatDate, formatDuration, getStatusColor } from "@/utils/commonFunctions";

interface TableBodyProps {
    data: {
        data: {
            docs: Client[];
            totalDocs: number;
            totalPages: number;
            offset: number;
            limit: number;
            hasPrevPage: boolean;
            hasNextPage: boolean;
        };
    } | undefined;
    isLoading: boolean;
    searchQuery: string;
    currentPage: number;
    onPageChange: (page: number) => void;
    onViewDetails: (client: Client) => void;
}

const ClientSessionTable: React.FC<TableBodyProps> = ({ data, isLoading, searchQuery, currentPage, onPageChange, onViewDetails }) => {
    if (isLoading) {
        return (
            <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex space-x-4">
                        <Skeleton className="h-4 flex-1 bg-white/10" />
                        <Skeleton className="h-4 flex-1 bg-white/10" />
                        <Skeleton className="h-4 w-24 bg-white/10" />
                        <Skeleton className="h-4 w-24 bg-white/10" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <div className="mb-4 border border-[#FFFFFF1A] rounded-xl overflow-hidden">
                <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr_80px] items-center gap-4 px-6 py-4 bg-[#FFFFFF05]">
                    <div className="text-sm text-gray-400">
                        Session ID
                    </div>
                    <div className="text-sm text-gray-400">
                        Start Time
                    </div>
                    <div className="text-sm text-gray-400">
                        Duration
                    </div>
                    <div className="text-sm text-gray-400">
                        Status
                    </div>
                    <div className="text-sm text-gray-400 text-center">
                        Messages
                    </div>
                    <div className="text-sm text-gray-400">
                        Avg Response
                    </div>
                    <div className="text-sm text-gray-400 text-center">
                        Actions
                    </div>
                </div>
            </div>
            {/* Table Body */}
            <div className="w-full max-h-[150px] overflow-hidden flex flex-col">
                <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <div className="rounded-2xl overflow-hidden bg-[#FFFFFF03]">
                        {data?.data.docs.map((client) => (
                            <div
                                key={client._id}
                                className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr_80px] items-center gap-4 px-6 py-4 border-b border-[#FFFFFF0D] last:border-b-0 cursor-pointer relative overflow-hidden"
                            >
                                <div className="font-medium text-white truncate font-mono text-sm" title={client.sessionId}>
                                    {client.sessionId}
                                </div>
                                <div className="text-gray-300 text-sm">
                                    {formatDate(client.startTime)}
                                </div>
                                <div className="text-gray-300 text-sm">
                                    {formatDuration(client.duration)}
                                </div>
                                <div>
                                    <Badge className={`${getStatusColor(client.status)} rounded-full px-3`}>
                                        {client.status}
                                    </Badge>
                                </div>
                                <div className="text-gray-300 text-sm text-center">
                                    {client.messagesTotal}
                                </div>
                                <div className="text-gray-300 text-sm">
                                    {client.averageResponse}ms
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
                                            <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-200 shadow-lg rounded-lg w-40">
                                                <div>
                                                    <DropdownMenuItem onClick={() => onViewDetails(client)} className="flex items-center gap-2 px-3 py-2 cursor-pointer"       >
                                                        <EyeIcon size={16} /> View Details
                                                    </DropdownMenuItem>
                                                </div>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TooltipProvider>
                                </div>
                            </div>
                        ))}

                        {data && data.data.docs.length === 0 && (
                            <div
                                className="text-center text-gray-400 py-8"
                            >
                                {searchQuery ? `No sessions found matching "${searchQuery}"` : "No sessions found"}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {data && data.data.totalPages > 1 && (
                    <div className="mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="text-sm text-gray-400 text-center sm:text-left">
                                Showing{" "}
                                <span className="font-medium text-white">
                                    {data.data.offset + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-medium text-white">
                                    {Math.min(
                                        data.data.offset + data.data.limit,
                                        data.data.totalDocs
                                    )}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-white">
                                    {data.data.totalDocs}
                                </span>{" "}
                                sessions
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                                    disabled={!data.data.hasPrevPage}
                                    className="px-3 bg-[#FFFFFF1A] border-0 text-gray-300 hover:bg-white/10"
                                    style={{ boxShadow: "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset", }}>
                                    <span className="hidden sm:inline">Previous</span>
                                    <span className="sm:hidden">Prev</span>
                                </Button>

                                <div className="flex items-center space-x-1">
                                    {Array.from(
                                        { length: Math.min(5, data.data.totalPages) },
                                        (_, i) => {
                                            const pageNumber = Math.max(1, Math.min(data.data.totalPages - 4, currentPage - 2)) + i;
                                            if (pageNumber > data.data.totalPages) return null;

                                            return (
                                                <Button
                                                    key={pageNumber}
                                                    variant={
                                                        pageNumber === currentPage ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => onPageChange(pageNumber)}
                                                    className={`w-9 h-9 p-0 ${pageNumber === currentPage ? "bg-white/20 text-white" : "bg-[#FFFFFF1A] border-0 text-gray-300 hover:bg-white/10"
                                                        }`}
                                                    style={pageNumber !== currentPage ? { boxShadow: "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset", } : undefined}
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
                                    onClick={() => onPageChange(Math.min(currentPage + 1, data.data.totalPages))}
                                    disabled={!data.data.hasNextPage}
                                    className="px-3 bg-[#FFFFFF1A] border-0 text-gray-300 hover:bg-white/10"
                                    style={{ boxShadow: "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset", }}   >
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

export default ClientSessionTable;