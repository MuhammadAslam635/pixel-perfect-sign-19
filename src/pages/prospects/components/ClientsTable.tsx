import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import { EyeIcon, RefreshCwIcon, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients, useSyncFromAirtableTable } from "@/hooks/useProspects";
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

interface ClientsTableProps {
  viewType?: "sessions" | "prospects" | "queries";
}

const containerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.98,
    filter: "blur(5px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const tableVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.06,
      delayChildren: 0.3,
    },
  },
};

const headerVariants = {
  hidden: {
    opacity: 0,
    y: -15,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const rowVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
    scale: 0.98,
    filter: "blur(2px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    filter: "blur(2px)",
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const ClientsTable: React.FC<ClientsTableProps> = ({
  viewType = "sessions",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
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

  const { data, isLoading, error } = useClients(queryParams);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
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

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
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
            Error loading sessions: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

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
        <Card className="mb-6 bg-transparent border-[#FFFFFF1A]">
          <CardContent className="flex flex-col md:flex-row md:items-center gap-4 p-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <Input
                placeholder="Search by session ID, transcript, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full rounded-full bg-[#FFFFFF1A] border border-white/40 text-gray-300 placeholder:text-gray-500 focus:ring-0"
                style={{
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                  borderRadius: "9999px",
                }}
              />
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="group relative overflow-hidden flex items-center justify-center h-10 rounded-full border border-white/40 px-3.5 gap-2 text-xs font-medium tracking-wide transition-all duration-400 ease-elastic text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5 before:rounded-t-full before:bg-gradient-to-b before:from-white/15 before:to-transparent before:transition-all before:duration-300 before:ease-in-out hover:before:from-white/25 hover:before:duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "#FFFFFF1A",
                boxShadow:
                  "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
              }}
            >
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[100px] h-[100px] rounded-full pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                  filter: "blur(20px)",
                  WebkitFilter: "blur(20px)",
                }}
              ></div>
              <RefreshCwIcon
                className={`h-4 w-4 flex-shrink-0 transition-[color,filter] duration-250 ease-in-out text-white drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)] ${
                  isSyncing ? "animate-spin" : ""
                }`}
              />
              <span className="whitespace-nowrap relative z-10">
                {isSyncing ? "Syncing..." : "Sync from Airtable"}
              </span>
            </button>
          </CardContent>
        </Card>

        {isLoading ? (
          <motion.div
            className="space-y-3 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex space-x-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
              >
                <Skeleton className="h-4 flex-1 bg-white/10" />
                <Skeleton className="h-4 flex-1 bg-white/10" />
                <Skeleton className="h-4 w-24 bg-white/10" />
                <Skeleton className="h-4 w-24 bg-white/10" />
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
                className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr_80px] items-center gap-4 px-6 py-4 bg-[#FFFFFF05]"
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
                  Session ID
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
                  Duration
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
                  className="text-sm text-gray-400"
                  whileHover={{
                    color: "#ffffff",
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }}
                >
                  Avg Response
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
                {data?.data.docs.map((client, index) => (
                  <motion.div
                    key={client._id}
                    variants={rowVariants}
                    layout
                    layoutId={client._id}
                    whileHover={{
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      scale: 1.01,
                      y: -2,
                      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
                      transition: {
                        duration: 0.3,
                        ease: [0.25, 0.46, 0.45, 0.94],
                        backgroundColor: { duration: 0.2 },
                      },
                    }}
                    whileTap={{
                      scale: 0.98,
                      transition: { duration: 0.1 },
                    }}
                    className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.8fr_0.6fr_80px] items-center gap-4 px-6 py-4 border-b border-[#FFFFFF0D] last:border-b-0 cursor-pointer relative overflow-hidden"
                  >
                  <motion.div
                    className="font-medium text-white truncate font-mono text-sm"
                    title={client.sessionId}
                    whileHover={{
                      scale: 1.02,
                      color: "#ffffff",
                      transition: { duration: 0.2 },
                    }}
                  >
                    {client.sessionId}
                  </motion.div>
                  <motion.div
                    className="text-gray-300 text-sm"
                    whileHover={{
                      scale: 1.02,
                      color: "#ffffff",
                      transition: { duration: 0.2 },
                    }}
                  >
                    {formatDate(client.startTime)}
                  </motion.div>
                  <motion.div
                    className="text-gray-300 text-sm"
                    whileHover={{
                      scale: 1.02,
                      color: "#ffffff",
                      transition: { duration: 0.2 },
                    }}
                  >
                    {formatDuration(client.duration)}
                  </motion.div>
                  <div>
                    <Badge
                      className={`${getStatusColor(
                        client.status
                      )} rounded-full px-3`}
                    >
                      {client.status}
                    </Badge>
                  </div>
                  <motion.div
                    className="text-gray-300 text-sm text-center"
                    whileHover={{
                      scale: 1.02,
                      color: "#ffffff",
                      transition: { duration: 0.2 },
                    }}
                  >
                    {client.messagesTotal}
                  </motion.div>
                  <motion.div
                    className="text-gray-300 text-sm"
                    whileHover={{
                      scale: 1.02,
                      color: "#ffffff",
                      transition: { duration: 0.2 },
                    }}
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
                                  scale: 1.1,
                                  rotate: 90,
                                  transition: { duration: 0.2 },
                                }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <MoreVertical className="h-5 w-5" />
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
                                  onClick={() => handleViewDetails(client)}
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
                ))}
                {data && data.data.docs.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-center text-gray-400 py-8"
                  >
                    {debouncedSearch
                      ? `No sessions found matching "${debouncedSearch}"`
                      : "No sessions found"}
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={!data.data.hasPrevPage}
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
                            <Button
                              key={pageNumber}
                              variant={
                                pageNumber === currentPage
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`w-9 h-9 p-0 ${
                                pageNumber === currentPage
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
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, data.data.totalPages)
                        )
                      }
                      disabled={!data.data.hasNextPage}
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
          </>
        )}
      </div>

      {/* Client Details Modal */}
      <ClientDetailsModal
        client={selectedClient}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        viewType={viewType}
      />
    </motion.div>
  );
};

export default ClientsTable;
