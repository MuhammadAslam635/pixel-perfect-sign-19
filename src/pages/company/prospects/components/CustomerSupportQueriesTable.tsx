import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EyeIcon, RefreshCwIcon, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useCustomerSupportQueries, } from "@/hooks/useProspects";
import type { Client } from "@/services/clients.service";
import ClientDetailsModal from "./ClientDetailsModal";
import { useToast } from "@/hooks/use-toast";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import { containerVariantsClients, headerVariants, rowVariants, tableVariants } from "@/helpers/customerSupport";
import CustomerSupportTable from "./CustomerSupportTable";

const CustomerSupportQueriesTable: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedQuery, setSelectedQuery] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const queryParams = useMemo(() => ({ page: currentPage, limit: 10, search: debouncedSearch || undefined, }), [currentPage, debouncedSearch]);
  const { data, isLoading, error, refetch, isRefetching } = useCustomerSupportQueries(queryParams);

  const handleViewDetails = (query: Client) => {
    setSelectedQuery(query);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedQuery(null);
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({ title: "Refreshed", description: "Customer support data has been refreshed", });
    } catch (error: any) {
      toast({
        title: "Refresh Failed", description: sanitizeErrorMessage(error, "Failed to refresh data"), variant: "destructive",
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <Card className="border-[#FFFFFF0D]" style={{
        background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
      }}
      >
        <CardContent className="p-6">
          <div className="text-center text-red-400">
            {sanitizeErrorMessage(error, "Error loading queries")}
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <motion.div
      className="w-full"
      variants={containerVariantsClients}
      initial="hidden"
      animate="visible"
    >
      <div
        className="border border-[#FFFFFF0D] p-6 rounded-xl" style={{
          background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
        }}
      >
        <Card className="mb-6 bg-transparent border-[#FFFFFF1A]">
          <CardContent className="flex flex-col md:flex-row md:items-center gap-4 p-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <Input
                placeholder="Search by name, email, phone, or status..."
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
              onClick={handleRefresh}
              disabled={isRefetching || isLoading}
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
                className={`h-4 w-4 flex-shrink-0 transition-[color,filter] duration-250 ease-in-out text-white drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)] ${isRefetching || isLoading ? "animate-spin" : ""
                  }`}
              />
              <span className="whitespace-nowrap relative z-10">
                {isRefetching || isLoading ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </CardContent>
        </Card>

        <CustomerSupportTable
          data={data?.data}
          isLoading={isLoading}
          searchQuery={debouncedSearch}
          currentPage={currentPage}
          onViewDetails={handleViewDetails}
          onPageChange={handlePageChange}
          viewType="queries"
        />
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