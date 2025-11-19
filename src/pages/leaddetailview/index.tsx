import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LeadDetailCard from "./components/LeadDetailCard";
import { leadsService } from "@/services/leads.service";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const LeadDetailView = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();

  const {
    data: lead,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => {
      if (!leadId) throw new Error("Lead ID is required");
      return leadsService.getLeadById(leadId);
    },
    enabled: !!leadId,
  });

  if (error) {
    toast.error("Failed to load lead details");
  }

  return (
    <DashboardLayout>
      <main className="relative flex-1 px-6 pb-12 pt-28 sm:px-10 md:px-14 lg:px-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-transparent to-[#05060A] opacity-70 pointer-events-none"></div>

        {/* Back Button */}
        <div className="mb-6 relative z-10">
          <Button
            onClick={() => navigate("/companies")}
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 relative z-10">
            <Loader2 className="w-8 h-8 animate-spin text-white mb-3" />
            <p className="text-white/60 text-sm">Loading lead details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 relative z-10">
            <p className="text-red-400 text-lg mb-2">
              Failed to load lead details
            </p>
            <p className="text-white/60 text-sm">Please try again later</p>
            <Button onClick={() => navigate("/companies")} className="mt-4">
              Go Back
            </Button>
          </div>
        )}

        {/* Grid Layout for Lead Detail Components */}
        {lead && !isLoading && (
          <div className="relative z-10 grid grid-cols-12 gap-1">
            {/* Left: Lead Detail Card */}
            <div className="col-span-2">
              <LeadDetailCard lead={lead} />
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default LeadDetailView;
