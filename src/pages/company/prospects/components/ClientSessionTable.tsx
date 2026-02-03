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
            <motion.div className="space-y-3 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div key={i} className="flex space-x-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{
                        duration: 0.4,
                        delay: i * 0.1,
                        ease: "easeOut",
                    }}>
                        <Skeleton className="h-4 flex-1 bg-white/10" />
                        <Skeleton className="h-4 flex-1 bg-white/10" />
                        <Skeleton className="h-4 w-24 bg-white/10" />
                        <Skeleton className="h-4 w-24 bg-white/10" />
                    </motion.div>
                ))}
            </motion.div>
        );
    }

    return (
        <>
            {/* Header */}
            <motion.div className="mb-4 border border-[#FFFFFF1A] rounded-xl overflow-hidden" variants={headerVariants}>
                <motion.div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr_80px] items-center gap-4 px-6 py-4 bg-[#FFFFFF05]" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{
                    duration: 0.4,
                    delay: 0.2,
                    ease: [0.25, 0.46, 0.45, 0.94],
                }}>
                    <motion.div className="text-sm text-gray-400" whileHover={{ color: "#ffffff", transition: { duration: 0.2 } }}>
                        Session ID
                    </motion.div>
                    <motion.div className="text-sm text-gray-400" whileHover={{ color: "#ffffff", scale: 1.02, transition: { duration: 0.2 } }}>
                        Start Time
                    </motion.div>
                    <motion.div className="text-sm text-gray-400" whileHover={{ color: "#ffffff", scale: 1.02, transition: { duration: 0.2 } }}>
                        Duration
                    </motion.div>
                    <motion.div className="text-sm text-gray-400" whileHover={{ color: "#ffffff", scale: 1.02, transition: { duration: 0.2 } }}>
                        Status
                    </motion.div>
                    <motion.div className="text-sm text-gray-400 text-center" whileHover={{ color: "#ffffff", scale: 1.02, transition: { duration: 0.2 } }}>
                        Messages
                    </motion.div>
                    <motion.div className="text-sm text-gray-400" whileHover={{ color: "#ffffff", scale: 1.02, transition: { duration: 0.2 } }}>
                        Avg Response
                    </motion.div>
                    <motion.div className="text-sm text-gray-400 text-center" whileHover={{ color: "#ffffff", scale: 1.02, transition: { duration: 0.2 } }}>
                        Actions
                    </motion.div>
                </motion.div>
            </motion.div>
            {/* Table Body */}
            <motion.div className="rounded-2xl overflow-hidden bg-[#FFFFFF03]" variants={tableVariants} initial="hidden" animate="visible"            >
                <AnimatePresence mode="popLayout">
                    {data?.data.docs.map((client) => (
                        <motion.div
                            key={client._id}
                            variants={rowVariants}
                            layout
                            layoutId={client._id}
                            whileHover={{
                                backgroundColor: "rgba(255, 255, 255, 0.08)", boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)", transition: {
                                    duration: 0.3,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                    backgroundColor: { duration: 0.2 },
                                },
                            }}
                            className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr_80px] items-center gap-4 px-6 py-4 border-b border-[#FFFFFF0D] last:border-b-0 cursor-pointer relative overflow-hidden"
                        >
                            <motion.div className="font-medium text-white truncate font-mono text-sm" title={client.sessionId} whileHover={{ color: "#ffffff", transition: { duration: 0.2 } }}>
                                {client.sessionId}
                            </motion.div>
                            <motion.div className="text-gray-300 text-sm" whileHover={{ scale: 1.02, color: "#ffffff", transition: { duration: 0.2 } }}
                            >
                                {formatDate(client.startTime)}
                            </motion.div>
                            <motion.div className="text-gray-300 text-sm" whileHover={{ scale: 1.02, color: "#ffffff", transition: { duration: 0.2 } }}
                            >
                                {formatDuration(client.duration)}
                            </motion.div>
                            <div>
                                <Badge className={`${getStatusColor(client.status)} rounded-full px-3`}>
                                    {client.status}
                                </Badge>
                            </div>
                            <motion.div className="text-gray-300 text-sm text-center" whileHover={{ scale: 1.02, color: "#ffffff", transition: { duration: 0.2 } }}
                            >
                                {client.messagesTotal}
                            </motion.div>
                            <motion.div className="text-gray-300 text-sm" whileHover={{ scale: 1.02, color: "#ffffff", transition: { duration: 0.2 } }}
                            >
                                {client.averageResponse}ms
                            </motion.div>
                            <div className="flex justify-center">
                                <TooltipProvider>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <motion.button
                                                className="p-2 rounded-full text-gray-300"
                                                whileHover={{
                                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                                    rotate: 90,
                                                    transition: { duration: 0.2 }
                                                }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <MoreVertical className="h-5 w-5" />
                                            </motion.button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-200 shadow-lg rounded-lg w-40">
                                            <motion.div whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)", transition: { duration: 0.15 } }} whileTap={{ scale: 0.98 }}>
                                                <DropdownMenuItem onClick={() => onViewDetails(client)} className="flex items-center gap-2 px-3 py-2 cursor-pointer"       >
                                                    <EyeIcon size={16} /> View Details
                                                </DropdownMenuItem>
                                            </motion.div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TooltipProvider>
                            </div>
                        </motion.div>
                    ))}

                    {data && data.data.docs.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="text-center text-gray-400 py-8"
                        >
                            {searchQuery ? `No sessions found matching "${searchQuery}"` : "No sessions found"}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

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
        </>
    );
};

export default ClientSessionTable;