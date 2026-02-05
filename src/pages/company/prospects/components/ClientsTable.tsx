import React, { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { EyeIcon, RefreshCwIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useClients, useSyncFromAirtableTable } from "@/hooks/useProspects";
import type { Client } from "@/services/clients.service";
import ClientDetailsModal from "./ClientDetailsModal";
import { useToast } from "@/hooks/use-toast";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import ClientSessionTable from "./ClientSessionTable";

interface ClientsTableProps {
  viewType?: "sessions" | "prospects" | "queries";
}

const ClientsTable: React.FC<ClientsTableProps> = ({ viewType = "sessions" }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const { mutate: syncFromAirtable, isPending: isSyncing } = useSyncFromAirtableTable();
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const queryParams = useMemo(() => ({ page: currentPage, limit: 10, search: debouncedSearch || undefined }), [currentPage, debouncedSearch]);
  const { data, isLoading, error } = useClients(queryParams);

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const handleSync = () => {
    syncFromAirtable({},
      {
        onSuccess: (response) => {
          toast({ title: "Sync Successful", description: response.message, });
        },
        onError: (error: any) => {
          toast({ title: "Sync Failed", description: sanitizeErrorMessage(error, "Failed to sync"), variant: "destructive", });
        },
      }
    );
  };

  if (error) {
    return (
      <Card className="border-[#FFFFFF0D]" style={{ background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0.00002) 38.08%, rgba(255, 255, 255, 0.00002) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)", }}>
        <CardContent className="p-6">
          <div className="text-center text-red-400">
            {sanitizeErrorMessage(error, "Error loading sessions")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
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
              disabled={isSyncing || isLoading}
              className="group relative overflow-hidden flex items-center justify-center h-10 rounded-full border border-white/40 px-3.5 gap-2 text-xs font-medium tracking-wide text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5 before:rounded-t-full before:bg-gradient-to-b before:from-white/15 before:to-transparent !transition-none hover:before:from-white/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className={`h-4 w-4 flex-shrink-0 text-white drop-shadow-[0_8px_18px_rgba(62,100,180,0.45)] !transition-none ${isSyncing || isLoading ? "animate-spin" : ""
                  }`}
              />
              <span className="whitespace-nowrap relative z-10">
                {isSyncing || isLoading ? "Syncing..." : "Sync"}
              </span>
            </button>
          </CardContent>
        </Card>

        <ClientSessionTable
          data={data}
          isLoading={isLoading}
          searchQuery={debouncedSearch}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onViewDetails={handleViewDetails}
        />
      </div>

      {/* Client Details Modal */}
      <ClientDetailsModal
        client={selectedClient}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        viewType={viewType}
      />
    </div>
  );
};

export default ClientsTable;