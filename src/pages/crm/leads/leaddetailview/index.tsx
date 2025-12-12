import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LeadDetailCard from "./components/LeadDetailCard";
import LeadChat from "./components/LeadChat";
import Activity from "./components/Activity";
import { leadsService } from "@/services/leads.service";
import {
  leadSummaryService,
  LeadSummaryResponse,
} from "@/services/leadSummary.service";
import {
  Loader2,
  ArrowLeft,
  Check,
  Sparkles,
  Heart,
  RefreshCw,
  Calendar,
  FileText,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { LeadCallLog } from "@/services/twilio.service";
import { ActiveNavButton } from "@/components/ui/primary-btn";

const LEAD_STAGE_DEFINITIONS = [
  { label: "New", min: 0, max: 15 },
  { label: "Interested", min: 15, max: 30 },
  { label: "Follow-up", min: 30, max: 45 },
  { label: "Appointment Booked", min: 45, max: 60 },
  { label: "Proposal Sent", min: 60, max: 75 },
  { label: "Follow-up to Close", min: 75, max: 90 },
  { label: "Deal Closed", min: 90, max: 100 },
];

const STAGE_ICONS = [
  Sparkles,
  Heart,
  RefreshCw,
  Calendar,
  FileText,
  Target,
  Trophy,
];

const clampScore = (value: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
};

const getStageForScore = (score: number | null) => {
  if (score === null) {
    return null;
  }
  return LEAD_STAGE_DEFINITIONS.find((stage, index) => {
    const isLast = index === LEAD_STAGE_DEFINITIONS.length - 1;
    if (isLast) {
      return score >= stage.min;
    }
    return score >= stage.min && score < stage.max;
  });
};

const getStageState = (score: number | null, index: number) => {
  if (score === null) {
    return "pending";
  }
  const stage = LEAD_STAGE_DEFINITIONS[index];
  const nextStage = LEAD_STAGE_DEFINITIONS[index + 1];
  const stageMax = nextStage ? nextStage.min : 100;
  if (score >= stageMax) {
    return "completed";
  }
  if (score >= stage.min) {
    return "active";
  }
  return "upcoming";
};

export type SelectedCallLogView =
  | { type: "followup"; log: LeadCallLog }
  | { type: "transcription"; log: LeadCallLog }
  | { type: "recording"; log: LeadCallLog }
  | null;

const LeadDetailView = () => {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || undefined;
  const autoStartCall = searchParams.get("autoCall") === "1";
  const [selectedCallLogView, setSelectedCallLogView] =
    useState<SelectedCallLogView>(null);
  const [isClosingDeal, setIsClosingDeal] = useState(false);
  const queryClient = useQueryClient();

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

  const {
    data: leadSummaryResponse,
    isLoading: isLeadSummaryLoading,
    isFetching: isLeadSummaryFetching,
  } = useQuery<LeadSummaryResponse>({
    queryKey: ["lead-summary", leadId],
    queryFn: () => {
      if (!leadId) throw new Error("Lead ID is required");
      return leadSummaryService.getSummary(leadId);
    },
    enabled: !!leadId,
  });

  const summaryScoreValue = clampScore(
    leadSummaryResponse?.data?.momentumScore ?? null
  );
  const stage = getStageForScore(summaryScoreValue);
  const progressPercent = summaryScoreValue ?? 0;
  const isSummaryBusy = isLeadSummaryLoading || isLeadSummaryFetching;
  const summaryStatusText = (() => {
    if (isSummaryBusy) {
      return "Syncing summary...";
    }
    if (summaryScoreValue !== null) {
      return `${summaryScoreValue}% · ${stage?.label ?? "Calibrating"}`;
    }
    return "Awaiting AI summary";
  })();

  const handleCloseDeal = async () => {
    if (!leadId) {
      toast.error("Lead ID is required");
      return;
    }

    try {
      setIsClosingDeal(true);
      await leadSummaryService.closeDeal(leadId);
      toast.success("Deal closed successfully!");
      
      // Invalidate and refetch the lead summary to update the UI
      await queryClient.invalidateQueries({ queryKey: ["lead-summary", leadId] });
    } catch (error: any) {
      console.error("Failed to close deal:", error);
      toast.error(
        error?.response?.data?.message || "Failed to close deal. Please try again."
      );
    } finally {
      setIsClosingDeal(false);
    }
  };

  if (error) {
    toast.error("Failed to load lead details");
  }

  return (
    <DashboardLayout>
      <main className="relative mt-24 pt-5 flex w-full flex-1 min-h-0 max-h-[calc(100vh-6rem)] px-6 pb-6 sm:px-10 md:px-14 lg:px-6 overflow-y-hidden overflow-x-hidden scrollbar-hide bg-[#0F0F0F]">
        <div className="relative z-10 flex w-full flex-1 min-h-0 flex-col gap-6">
          {/* Back Button & Summary Progress */}
          {/* Back Button & Summary Progress */}
          <div className="grid grid-cols-12 gap-4 w-full items-center">
            {/* Left: Back Button */}
            <div className="col-span-2">
              <Button
                onClick={() => navigate("/leads")}
                variant="ghost"
                className="text-white/70 text-sm hover:text-white hover:bg-white/10 w-fit p-0 hover:bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leads
              </Button>
            </div>

            {/* Middle: Lead Stage Progress */}
            <div className="col-span-7 col-start-3 flex justify-center">
              <div className="flex items-center justify-center gap-1 w-fit">
                {LEAD_STAGE_DEFINITIONS.map((definition, index) => {
                  const state = getStageState(summaryScoreValue, index);
                  const isLast = index === LEAD_STAGE_DEFINITIONS.length - 1;
                  const isActive = state === "active";
                  const isCompleted = state === "completed";
                  
                  const baseButtonClasses =
                    "group relative overflow-hidden flex-none flex items-center justify-center rounded-full border text-xs font-medium tracking-wide transition-[width,background-color,box-shadow,padding,gap] duration-500 ease-out";
                  const baseConnectorClasses =
                    "h-[2px] w-8 sm:w-12 rounded-full transition-colors duration-300";
                  
                  const buttonClasses =
                    isActive
                      ? `${baseButtonClasses} h-8 px-3 gap-2 border-[#67B0B7] text-white shadow-[0_5px_18px_rgba(103,176,183,0.35)] bg-white/10`
                      : isCompleted
                      ? `${baseButtonClasses} w-8 h-8 bg-gradient-to-r from-[#67B0B7] to-[#4066B3] border-transparent text-white shadow-[0_5px_18px_rgba(103,176,183,0.35)]`
                      : `${baseButtonClasses} w-8 h-8 border-white/20 text-white/60 hover:border-white/40 hover:text-white/80`;
                  
                  const connectorClasses =
                    isCompleted
                      ? `${baseConnectorClasses} bg-gradient-to-r from-[#67B0B7] to-[#4066B3]`
                      : `${baseConnectorClasses} bg-white/15`;

                  const IconComponent = STAGE_ICONS[index];

                  return (
                    <div
                      key={definition.label}
                      className="flex items-center gap-1"
                    >
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <button
                            className={buttonClasses}
                            type="button"
                            aria-label={definition.label}
                          >
                            {isCompleted ? (
                              <Check className="w-3.5 h-3.5 flex-shrink-0" />
                            ) : (
                              <IconComponent className="w-3.5 h-3.5 flex-shrink-0" />
                            )}
                            {isActive && (
                              <span className="whitespace-nowrap transition-opacity duration-500 ease-out">
                                {definition.label}
                              </span>
                            )}
                          </button>
                        </TooltipTrigger>
                        {!isActive && (
                          <TooltipContent>
                            <p>{definition.label}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                      {!isLast && <div className={connectorClasses} />}
                    </div>
                  );
                })}
                {summaryScoreValue !== 100 && (
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
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 items-stretch w-full max-w-full">
              {/* Left: Lead Detail Card */}
              <div className="col-span-2 flex flex-col h-full">
                <LeadDetailCard lead={lead} />
              </div>
              {/* Middle: Lead Chat */}
              <div className="col-span-7 col-start-3 flex flex-col min-h-[200px]">
                <LeadChat
                  lead={lead}
                  initialTab={initialTab || undefined}
                  autoStartCall={autoStartCall}
                  selectedCallLogView={selectedCallLogView}
                  setSelectedCallLogView={setSelectedCallLogView}
                />
              </div>
              {/* Right: Activity Component (with internal Activity/Company toggle) */}
              <div className="col-span-3 col-start-10 flex flex-col h-full">
                <Activity
                  lead={lead}
                  selectedCallLogView={selectedCallLogView}
                  setSelectedCallLogView={setSelectedCallLogView}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
};

export default LeadDetailView;
