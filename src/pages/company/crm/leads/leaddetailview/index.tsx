import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LeadDetailCard from "./components/LeadDetailCard";
import LeadChat from "./components/LeadChat";
import Activity from "./components/Activity";
import { leadsService } from "@/services/leads.service";
import { useLeadStageWebSocket } from "@/hooks/useLeadStageWebSocket";
import { leadSummaryService, LeadSummaryResponse } from "@/services/leadSummary.service";
import { Loader2, ArrowLeft, Check, Sparkles, Heart, RefreshCw, Calendar, FileText, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { LeadCallLog } from "@/services/twilio.service";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LEAD_STAGE_DEFINITIONS } from "@/mocks/dropdownMock";

const STAGE_ICONS = [Sparkles, Heart, RefreshCw, Calendar, FileText, Target, Trophy];

export type SelectedCallLogView = { type: "followup"; log: LeadCallLog } | { type: "transcription"; log: LeadCallLog } | { type: "recording"; log: LeadCallLog } | null;

const LeadDetailView = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || undefined;
  const autoStartCall = searchParams.get("autoCall") === "1";
  const [selectedCallLogView, setSelectedCallLogView] = useState<SelectedCallLogView>(null);
  // State for manual actions
  const [isClosingDeal, setIsClosingDeal] = useState(false);
  const [isSendingProposal, setIsSendingProposal] = useState(false);
  const [showCloseDealDialog, setShowCloseDealDialog] = useState(false);
  const queryClient = useQueryClient();

  // Initialize WebSocket for real-time lead stage updates
  useLeadStageWebSocket(leadId);

  const mapStageToLabel = (stage: string | null | undefined): string => {
    switch (stage) {
      case "new":
        return "New";
      case "interested":
        return "Interested";
      case "followup":
        return "Follow-up";
      case "appointment_booked":
        return "Appointment Booked";
      case "proposal_sent":
        return "Proposal Sent";
      case "followup_close":
        return "Follow-up to Close";
      case "closed":
        return "Deal Closed";
      default:
        return "New";
    }
  };

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => {
      if (!leadId) throw new Error("Lead ID is required");
      return leadsService.getLeadById(leadId);
    },
    enabled: !!leadId,
  });

  const { data: leadSummaryResponse, isLoading: isLeadSummaryLoading, isFetching: isLeadSummaryFetching } = useQuery<LeadSummaryResponse>({
    queryKey: ["lead-summary", leadId],
    queryFn: () => {
      if (!leadId) throw new Error("Lead ID is required");
      return leadSummaryService.getSummary(leadId);
    },
    enabled: !!leadId,
  });
  const currentStageLabel = mapStageToLabel(lead?.stage);
  const currentStageIndex = LEAD_STAGE_DEFINITIONS.findIndex((s) => s.label === currentStageLabel);

  const handleSetStage = async (stageValue: string) => {
    if (!leadId) {
      toast.error("Lead ID is required");
      return;
    }
    try {
      setIsClosingDeal(stageValue === "closed");
      setIsSendingProposal(stageValue === "proposal_sent");
      await leadsService.updateLead(leadId, {
        stage: stageValue,
      });
      await queryClient.refetchQueries({ queryKey: ["lead", leadId] });
      const stageLabels: Record<string, string> = {
        proposal_sent: "Proposal Sent",
        followup_close: "Follow-up to Close",
        closed: "Deal Closed",
      };
      toast.success(
        `Stage updated to "${stageLabels[stageValue] || stageValue}"!`
      );
    } catch (error: any) {
      console.error("Failed to update stage:", error);
      toast.error(
        error?.response?.data?.message ||
        "Failed to update stage. Please try again."
      );
    } finally {
      setIsClosingDeal(false);
      setIsSendingProposal(false);
    }
  };

  const handleCloseDeal = () => {
    setShowCloseDealDialog(true);
  };
  const confirmCloseDeal = async () => {
    setShowCloseDealDialog(false);
    await handleSetStage("closed");
  };

  const handleMessageUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
    queryClient.invalidateQueries({ queryKey: ["lead-summary", leadId] });
  }, [queryClient, leadId]);

  if (error) { toast.error("Failed to load lead details"); }

  const baseButtonClasses = "group relative overflow-hidden flex-none flex items-center justify-center rounded-full border text-xs font-medium tracking-wide transition-[width,background-color,box-shadow,padding,gap] duration-500 ease-out";
  const baseConnectorClasses = "h-[2px] w-8 sm:w-12 rounded-full transition-colors duration-300";

  return (
    <DashboardLayout>
      <main className="relative mt-24 pt-5 flex w-full flex-1 min-h-0 max-h-[calc(100vh-6rem)] px-6 pb-6 sm:px-10 md:px-14 lg:px-6 overflow-y-hidden overflow-x-hidden scrollbar-hide bg-[#0F0F0F]">
        <div className="relative z-10 flex w-full flex-1 min-h-0 flex-col gap-6">
          {/* Back Button & Summary Progress */}
          <div className="grid grid-cols-12 gap-4 w-full items-center">
            {/* Left: Back Button */}
            <div className="col-span-2">
              <Button onClick={() => navigate("/leads")} variant="ghost" className="text-white/70 text-sm hover:text-white hover:bg-white/10 w-fit p-0 hover:bg-transparent">
                <ArrowLeft className="w-4 h-4 mr-2" />Back to Leads
              </Button>
            </div>
            {/* Middle: Lead Stage Progress */}
            <div className="col-span-7 col-start-3 flex justify-center">
              <div className="flex items-center justify-center gap-1 w-fit">
                {LEAD_STAGE_DEFINITIONS.map((definition, index) => {
                  const isActive = definition.label === currentStageLabel;
                  const isCompleted = index < currentStageIndex;
                  const isLast = index === LEAD_STAGE_DEFINITIONS.length - 1;
                  const buttonClasses = isActive ? `${baseButtonClasses} h-8 px-3 gap-2 border-[#67B0B7] text-white shadow-[0_5px_18px_rgba(103,176,183,0.35)] bg-white/10 hover:bg-white/15` : isCompleted ? `${baseButtonClasses} w-8 h-8 bg-gradient-to-r from-[#67B0B7] to-[#4066B3] border-transparent text-white shadow-[0_5px_18px_rgba(103,176,183,0.35)] hover:opacity-90` : `${baseButtonClasses} w-8 h-8 border-white/20 text-white/60 hover:border-white/40 hover:text-white/80`;
                  const connectorClasses = isCompleted ? `${baseConnectorClasses} bg-gradient-to-r from-[#67B0B7] to-[#4066B3]` : `${baseConnectorClasses} bg-white/15`;
                  const IconComponent = STAGE_ICONS[index];
                  return (
                    <div key={definition.label} className="flex items-center gap-1">
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <div className={buttonClasses} aria-label={definition.label}>
                            {isCompleted ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />}
                            {isActive && <span className="whitespace-nowrap transition-opacity duration-500 ease-out">{definition.label}</span>}
                          </div>
                        </TooltipTrigger>
                        {!isActive && <TooltipContent><p>{definition.label}</p></TooltipContent>}
                      </Tooltip>
                      {!isLast && <div className={connectorClasses} />}
                    </div>
                  );
                })}
                {currentStageLabel !== "Deal Closed" && (
                  <div className="ml-4">
                    <ActiveNavButton
                      text={isClosingDeal ? "Closing..." : "Deal Closed"}
                      onClick={handleCloseDeal}
                      disabled={isClosingDeal}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
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
              <p className="text-red-400 text-lg mb-2">Failed to load lead details</p>
              <p className="text-white/60 text-sm">Please try again later</p>
              <Button onClick={() => navigate("/companies")} className="mt-4">Go Back</Button>
            </div>
          )}
          {/* Grid Layout for Lead Detail Components */}
          {lead && !isLoading && (
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 items-stretch w-full max-w-full">
              <div className="col-span-2 flex flex-col h-full">
                <LeadDetailCard lead={lead} />
              </div>
              <div className="col-span-7 col-start-3 flex flex-col min-h-[200px]">
                <LeadChat
                  lead={lead}
                  initialTab={initialTab || undefined}
                  autoStartCall={autoStartCall}
                  selectedCallLogView={selectedCallLogView}
                  setSelectedCallLogView={setSelectedCallLogView}
                  onMessageUpdate={handleMessageUpdate}
                />
              </div>
              <div className="col-span-3 col-start-10 flex flex-col h-full">
                <Activity lead={lead} selectedCallLogView={selectedCallLogView} setSelectedCallLogView={setSelectedCallLogView} />
              </div>
            </div>
          )}
        </div>
      </main>
      <ConfirmDialog
        open={showCloseDealDialog}
        title="Close Deal"
        description="Are you sure you want to mark this deal as closed? This action will update the lead status to 'Deal Closed'."
        confirmText="Yes, Close Deal"
        cancelText="Cancel"
        isPending={isClosingDeal}
        confirmVariant="default"
        onConfirm={confirmCloseDeal}
        onCancel={() => setShowCloseDealDialog(false)}
      />
    </DashboardLayout>
  );
};

export default LeadDetailView;