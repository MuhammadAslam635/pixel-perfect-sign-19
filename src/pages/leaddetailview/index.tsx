import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LeadDetailCard from "./components/LeadDetailCard";
import LeadChat from "./components/LeadChat";
import Activity from "./components/Activity";
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
      <main className="relative mt-24 pt-5 flex w-full flex-1 min-h-0 max-h-[calc(100vh-6rem)] px-6 pb-6 sm:px-10 md:px-14 lg:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-transparent to-[#05060A] opacity-70 pointer-events-none"></div>

        <div className="relative z-10 flex w-full flex-1 min-h-0 flex-col gap-6">
          {/* Back Button */}
          <div>
            <Button
              onClick={() => navigate("/companies")}
              variant="ghost"
              className="text-white/70 text-sm hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Companies
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center flex-1 min-h-0">
              <Loader2 className="w-8 h-8 animate-spin text-white mb-3" />
              <p className="text-white/60 text-sm">Loading lead details...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center flex-1 min-h-0">
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
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 items-stretch">
              {/* Left: Lead Detail Card */}
              <div className="col-span-2 flex flex-col min-h-0">
                <LeadDetailCard lead={lead} />
              </div>
              {/* Middle: Lead Chat */}
              <div className="col-span-7 col-start-3 flex flex-col min-h-0">
                <LeadChat lead={lead} />
              </div>
              {/* Right: Activity Component */}
              <div
                className="col-span-3 col-start-10 flex flex-col min-h-0"
                // style={{
                //   borderRadius: "20px",
                //   background:
                //     "linear-gradient(173.83deg, rgba(255, 255, 255, 0.03) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
                // }}
              >
                <Activity lead={lead} />
              </div>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default LeadDetailView;
