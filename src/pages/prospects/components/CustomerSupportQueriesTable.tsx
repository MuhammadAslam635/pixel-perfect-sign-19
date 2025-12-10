import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { EyeIcon, RefreshCwIcon, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCustomerSupportQueries,
  useSyncFromAirtableTable,
} from "@/hooks/useProspects";
import type { Client } from "@/services/clients.service";
import ClientDetailsModal from "./ClientDetailsModal";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";

const CustomerSupportQueriesTable: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedQuery, setSelectedQuery] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const { mutate: syncFromAirtable, isPending: isSyncing } =
    useSyncFromAirtableTable();

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const queryParams = useMemo(
    () => ({
      page: currentPage,
      limit: 10,
      search: debouncedSearch || undefined,
    }),
    [currentPage, debouncedSearch]
  );

  const { data, isLoading, error } = useCustomerSupportQueries(queryParams);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Active":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Idle Timeout":
        return "bg-gradient-to-r from-[#30cfd0] via-[#2a9cb3] to-[#1f6f86] text-white hover:from-[#25b8ba] hover:via-[#1f8ba0] hover:to-[#1a5f72]";
      case "Disconnected":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  const handleViewDetails = (query: Client) => {
    setSelectedQuery(query);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQuery(null);
  };

  const handleSync = () => {
    syncFromAirtable(
      {},
      {
        onSuccess: (response) => {
          toast({
            title: "Sync Successful",
            description: response.message,
          });
        },
        onError: (error: any) => {
          toast({
            title: "Sync Failed",
            description:
              error?.response?.data?.message || "Failed to sync from Airtable",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (error) {
    return (
      <Card
        className="border-[#FFFFFF0D]"
        style={{
          background:
            "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
        }}
      >
        <CardContent className="p-6">
          <div className="text-center text-red-400">
            Error loading queries: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const containerVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 40,
      scale: 0.95,
      filter: "blur(8px)",
      rotateX: 8
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      rotateX: 0,
      transition: {
        duration: 0.9,
        ease: [0.23, 1, 0.32, 1],
        staggerChildren: 0.12,
        delayChildren: 0.2,
      },
    },
  };

  const tableVariants = {
    hidden: {
      opacity: 0,
      scale: 0.92,
      y: 30,
      filter: "blur(6px)",
      rotateX: 5
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      rotateX: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.08,
        delayChildren: 0.4,
      },
    },
  };

  const headerVariants = {
    hidden: {
      opacity: 0,
      y: -25,
      scale: 0.9,
      filter: "blur(4px)",
      rotateX: -5
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      rotateX: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.05
      },
    },
  };

  const searchInputVariants = {
    hidden: {
      opacity: 0,
      x: -30,
      scale: 0.95,
      filter: "blur(3px)"
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: 0.6
      },
    },
  };

  const rowVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 25,
      scale: 0.95,
      filter: "blur(4px)",
      rotateX: 3
    },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      rotateX: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: index * 0.08,
      },
    }),
    exit: {
      opacity: 0,
      y: -15,
      scale: 0.92,
      filter: "blur(4px)",
      rotateX: -3,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.div
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div
        className="border border-[#FFFFFF0D] p-6 rounded-xl"
        style={{
          background:
            "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
        }}
      >
        <motion.div
          className="mb-6 bg-transparent border-[#FFFFFF1A] rounded-xl overflow-hidden"
          variants={searchInputVariants}
        >
          <Card className="bg-transparent border-0">
            <CardContent className="flex flex-col md:flex-row md:items-center gap-4 p-4">
              <div className="flex-1 relative">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                </motion.div>
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    placeholder="Search by name, email, phone, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full rounded-full bg-[#FFFFFF1A] border border-white/40 text-gray-300 placeholder:text-gray-500 focus:ring-0 focus:border-white/60 focus:bg-white/10 transition-all duration-300"
                    style={{
                      boxShadow:
                        "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                      borderRadius: "9999px",
                    }}
                  />
                </motion.div>
              </div>
              <motion.button
                onClick={handleSync}
                disabled={isSyncing}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                  filter: "brightness(1.1)"
                }}
                whileTap={{
                  scale: 0.95,
                  rotate: -2
                }}
                className="group relative overflow-hidden flex items-center justify-center h-10 rounded-full border border-white/40 px-3.5 gap-2 text-xs font-medium tracking-wide transition-all duration-400 ease-elastic text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5 before:rounded-t-full before:bg-gradient-to-b before:from-white/15 before:to-transparent before:transition-all before:duration-300 before:ease-in-out hover:before:from-white/25 hover:before:duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "#FFFFFF1A",
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[100px] h-[100px] rounded-full pointer-events-none"
                  animate={{
                    scale: isSyncing ? [1, 1.2, 1] : 1,
                    opacity: isSyncing ? [0.5, 0.8, 0.5] : 0.5
                  }}
                  transition={{
                    duration: 2,
                    repeat: isSyncing ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                  style={{
                    background:
                      "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                    filter: "blur(20px)",
                    WebkitFilter: "blur(20px)",
                  }}
                />
                <motion.div
                  animate={{
                    rotate: isSyncing ? 360 : 0,
                    scale: isSyncing ? [1, 1.1, 1] : 1
                  }}
                  transition={{
                    duration: isSyncing ? 1 : 0.3,
                    repeat: isSyncing ? Infinity : 0,
                    ease: "linear"
                  }}
                >
                  <RefreshCwIcon
                    className="h-4 w-4 flex-shrink-0 text-white drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)]"
                  />
                </motion.div>
                <span className="whitespace-nowrap relative z-10">
                  {isSyncing ? "Syncing..." : "Sync from Airtable"}
                </span>
              </motion.button>
            </CardContent>
          </Card>
        </motion.div>

        {isLoading ? (
          <motion.div
            className="space-y-4 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex space-x-4 p-4 rounded-lg bg-white/5 border border-white/10"
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [0.95, 1.02, 0.95]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2
                  }}
                >
                  <Skeleton className="h-4 flex-1 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded" />
                </motion.div>
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [0.95, 1.02, 0.95]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2 + 0.3
                  }}
                >
                  <Skeleton className="h-4 flex-1 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded" />
                </motion.div>
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [0.95, 1.02, 0.95]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2 + 0.6
                  }}
                >
                  <Skeleton className="h-4 w-24 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded" />
                </motion.div>
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                    scale: [0.95, 1.02, 0.95]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2 + 0.9
                  }}
                >
                  <Skeleton className="h-4 w-20 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-full" />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <motion.div
              className="mb-4 border border-[#FFFFFF1A] rounded-xl overflow-hidden"
              variants={headerVariants}
            >
              <motion.div
                className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_0.8fr_80px] items-center gap-4 px-6 py-4 bg-[#FFFFFF05]"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: 0.2,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <motion.div
                  className="text-sm text-gray-400"
                  whileHover={{
                    color: "#ffffff",
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                >
                  Name
                </motion.div>
                <motion.div
                  className="text-sm text-gray-400"
                  whileHover={{
                    color: "#ffffff",
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                >
                  Email
                </motion.div>
                <motion.div
                  className="text-sm text-gray-400"
                  whileHover={{
                    color: "#ffffff",
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                >
                  Phone
                </motion.div>
                <motion.div
                  className="text-sm text-gray-400"
                  whileHover={{
                    color: "#ffffff",
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                >
                  Start Time
                </motion.div>
                <motion.div
                  className="text-sm text-gray-400"
                  whileHover={{
                    color: "#ffffff",
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                >
                  Status
                </motion.div>
                <motion.div
                  className="text-sm text-gray-400 text-center"
                  whileHover={{
                    color: "#ffffff",
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                >
                  Messages
                </motion.div>
                <motion.div
                  className="text-sm text-gray-400 text-center"
                  whileHover={{
                    color: "#ffffff",
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                >
                  Actions
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Table Body */}
            <motion.div
              className="rounded-2xl overflow-hidden bg-[#FFFFFF03]"
              variants={tableVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {data?.data.docs.map((query, index) => {
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
                    <motion.div
                      key={query._id}
                      custom={index}
                      variants={rowVariants}
                      layout
                      layoutId={query._id}
                      whileHover={{
                        backgroundColor: "rgba(255, 255, 255, 0.12)",
                        scale: 1.02,
                        y: -3,
                        rotateX: -2,
                        boxShadow: "0 15px 35px rgba(0, 0, 0, 0.25), 0 0 30px rgba(255, 255, 255, 0.1)",
                        filter: "brightness(1.05)",
                        transition: {
                          duration: 0.4,
                          ease: [0.25, 0.46, 0.45, 0.94],
                          backgroundColor: { duration: 0.3 },
                        },
                      }}
                      whileTap={{
                        scale: 0.97,
                        rotateX: 1,
                        transition: { duration: 0.15 },
                      }}
                      className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr_0.8fr_80px] items-center gap-4 px-6 py-4 border-b border-[#FFFFFF0D] last:border-b-0 cursor-pointer relative overflow-hidden group"
                    >
                      <motion.div
                        className="font-medium text-white truncate text-sm group-hover:text-white/90"
                        title={contactInfo?.name || "N/A"}
                        whileHover={{
                          scale: 1.05,
                          color: "#ffffff",
                          textShadow: "0 0 8px rgba(255, 255, 255, 0.5)",
                          transition: { duration: 0.25, ease: "easeOut" },
                        }}
                      >
                        {contactInfo?.name || "N/A"}
                      </motion.div>
                      <motion.div
                        className="text-gray-300 text-sm truncate group-hover:text-gray-200"
                        title={contactInfo?.email || "N/A"}
                        whileHover={{
                          scale: 1.03,
                          color: "#ffffff",
                          transition: { duration: 0.25, ease: "easeOut" },
                        }}
                      >
                        {contactInfo?.email || "N/A"}
                      </motion.div>
                      <motion.div
                        className="text-gray-300 text-sm truncate group-hover:text-gray-200"
                        title={contactInfo?.phone || "N/A"}
                        whileHover={{
                          scale: 1.03,
                          color: "#ffffff",
                          transition: { duration: 0.25, ease: "easeOut" },
                        }}
                      >
                        {contactInfo?.phone || "N/A"}
                      </motion.div>
                      <motion.div
                        className="text-gray-300 text-sm group-hover:text-gray-200"
                        whileHover={{
                          scale: 1.03,
                          color: "#ffffff",
                          transition: { duration: 0.25, ease: "easeOut" },
                        }}
                      >
                        {formatDate(query.startTime)}
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.08, rotate: 2 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <Badge
                          className={`${getStatusColor(
                            query.status
                          )} rounded-full px-3 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105`}
                        >
                          {query.status}
                        </Badge>
                      </motion.div>
                      <div className="text-gray-300 text-sm text-center">
                        {query.messagesTotal}
                      </div>
                      <div className="flex justify-center">
                        <TooltipProvider>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <motion.button
                                className="p-2 rounded-full text-gray-300 hover:text-white transition-colors duration-200"
                                whileHover={{
                                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                                  scale: 1.15,
                                  rotate: 180,
                                  boxShadow: "0 0 15px rgba(255, 255, 255, 0.3)",
                                  transition: {
                                    duration: 0.3,
                                    ease: [0.25, 0.46, 0.45, 0.94]
                                  },
                                }}
                                whileTap={{
                                  scale: 0.9,
                                  rotate: 90,
                                  transition: { duration: 0.1 }
                                }}
                              >
                                <motion.div
                                  animate={{ rotate: [0, 5, -5, 0] }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: index * 0.1
                                  }}
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </motion.div>
                              </motion.button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-200 shadow-lg rounded-lg w-40"
                            >
                              <motion.div
                                whileHover={{
                                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                                  scale: 1.02,
                                  transition: { duration: 0.15 },
                                }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <DropdownMenuItem
                                  onClick={() => handleViewDetails(query)}
                                  className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                                >
                                  <EyeIcon size={16} /> View Details
                                </DropdownMenuItem>
                              </motion.div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TooltipProvider>
                      </div>
                    </motion.div>
                  );
                })}
                {data && data.data.docs.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-center text-gray-400 py-8"
                  >
                    {debouncedSearch
                      ? `No queries found matching "${debouncedSearch}"`
                      : "No queries found"}
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
                    queries
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <motion.div
                      whileHover={!data.data.hasPrevPage ? {} : { scale: 1.05 }}
                      whileTap={!data.data.hasPrevPage ? {} : { scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={!data.data.hasPrevPage}
                        className="px-3 bg-[#FFFFFF1A] border-0 text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        style={{
                          boxShadow:
                            "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                        }}
                      >
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </Button>
                    </motion.div>

                    <div className="flex items-center space-x-1">
                      {Array.from(
                        { length: Math.min(5, data.data.totalPages) },
                        (_, i) => {
                          const pageNumber =
                            Math.max(
                              1,
                              Math.min(
                                data.data.totalPages - 4,
                                currentPage - 2
                              )
                            ) + i;

                          if (pageNumber > data.data.totalPages) return null;

                          return (
                            <motion.div
                              key={pageNumber}
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.9 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                              <Button
                                variant={
                                  pageNumber === currentPage
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(pageNumber)}
                                className={`w-9 h-9 p-0 transition-all duration-300 ${
                                  pageNumber === currentPage
                                    ? "bg-white/20 text-white shadow-lg scale-110"
                                    : "bg-[#FFFFFF1A] border-0 text-gray-300 hover:bg-white/10 hover:shadow-md"
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
                            </motion.div>
                          );
                        }
                      )}
                    </div>

                    <motion.div
                      whileHover={!data.data.hasNextPage ? {} : { scale: 1.05 }}
                      whileTap={!data.data.hasNextPage ? {} : { scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, data.data.totalPages)
                          )
                        }
                        disabled={!data.data.hasNextPage}
                        className="px-3 bg-[#FFFFFF1A] border-0 text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        style={{
                          boxShadow:
                            "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                        }}
                      >
                        Next
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Client Details Modal */}
      <ClientDetailsModal
        client={selectedQuery}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        viewType="queries"
      />
    </motion.div>
  );
};

export default CustomerSupportQueriesTable;
