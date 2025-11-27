import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
import { Loader2, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LeadCallLog } from "@/services/twilio.service";

const LEAD_STAGE_DEFINITIONS = [
  { label: "New", min: 0, max: 10 },
  { label: "Immature", min: 10, max: 50 },
  { label: "Mature", min: 50, max: 90 },
  { label: "Ready to go", min: 90, max: 100 },
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
  const [selectedCallLogView, setSelectedCallLogView] =
    useState<SelectedCallLogView>(null);

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

  if (error) {
    toast.error("Failed to load lead details");
  }

  return (
    <DashboardLayout>
      <main className="relative mt-24 pt-5 flex w-full flex-1 min-h-0 max-h-[calc(100vh-6rem)] px-6 pb-6 sm:px-10 md:px-14 lg:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A] via-transparent to-[#05060A] opacity-70 pointer-events-none"></div>

        <div className="relative z-10 flex w-full flex-1 min-h-0 flex-col gap-6">
          {/* Back Button & Summary Progress */}
          <div className="flex flex-row items-center gap-4">
            <Button
              onClick={() => navigate("/companies")}
              variant="ghost"
              className="text-white/70 text-sm hover:text-white hover:bg-white/10 w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Companies
            </Button>
            <div className="w-full flex flex-col justify-left ml-10">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-white/50 mb-2 w-full max-w-4xl">
                <span>Momentum status</span>
                <span className="text-white/80">{summaryStatusText}</span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-4 w-full max-w-5xl">
                {LEAD_STAGE_DEFINITIONS.map((definition, index) => {
                  const state = getStageState(summaryScoreValue, index);
                  const isLast = index === LEAD_STAGE_DEFINITIONS.length - 1;
                  const baseCircleClasses =
                    "w-7 h-7 rounded-full flex items-center justify-center border text-xs font-semibold transition-colors duration-300";
                  const baseConnectorClasses =
                    "flex-1 h-[2px] transition-colors duration-300";
                  const circleClasses =
                    state === "completed"
                      ? `${baseCircleClasses} bg-gradient-to-r from-[#67B0B7] to-[#4066B3] border-transparent text-white shadow-[0_5px_18px_rgba(103,176,183,0.35)]`
                      : state === "active"
                      ? `${baseCircleClasses} border-[#67B0B7] text-white`
                      : `${baseCircleClasses} border-white/20 text-white/60`;
                  const connectorClasses =
                    state === "completed"
                      ? `${baseConnectorClasses} bg-gradient-to-r from-[#67B0B7] to-[#4066B3]`
                      : `${baseConnectorClasses} bg-white/15`;
                  const labelClasses =
                    state === "completed" || state === "active"
                      ? "text-white text-xs font-semibold uppercase tracking-wide"
                      : "text-white/50 text-xs uppercase tracking-wide";

                  return (
                    <div
                      key={definition.label}
                      className="flex items-center flex-1 gap-2"
                    >
                      <div className="flex flex-col items-center gap-2 min-w-[70px]">
                        <span className={labelClasses}>{definition.label}</span>
                        <div className={circleClasses}>
                          {state === "completed" ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            index + 1
                          )}
                        </div>
                      </div>
                      {!isLast && <div className={connectorClasses} />}
                    </div>
                  );
                })}
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
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 items-stretch">
              {/* Left: Lead Detail Card */}
              <div className="col-span-2 flex flex-col min-h-0">
                <LeadDetailCard lead={lead} />
              </div>
              {/* Middle: Lead Chat */}
              <div className="col-span-7 col-start-3 flex flex-col min-h-0">
                <LeadChat
                  lead={lead}
                  selectedCallLogView={selectedCallLogView}
                  setSelectedCallLogView={setSelectedCallLogView}
                />
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
