import { FC } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  RefreshCcw,
  Briefcase,
  TrendingUp,
  Newspaper,
  AlertCircle,
  Lightbulb,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Lead } from "@/services/leads.service";
import {
  leadResearchService,
  LeadResearchResponse,
} from "@/services/leadResearch.service";
import { toast } from "sonner";
import { format } from "date-fns";

type AgentResearchTabProps = {
  lead?: Lead;
};

const AgentResearchTab: FC<AgentResearchTabProps> = ({ lead }) => {
  const leadId = lead?._id;

  // Fetch research data
  const {
    data: researchResponse,
    isLoading: isLoadingResearch,
    isFetching: isFetchingResearch,
    refetch: refetchResearch,
  } = useQuery<LeadResearchResponse>({
    queryKey: ["lead-research", leadId],
    queryFn: () => {
      if (!leadId) {
        throw new Error("Lead ID is required");
      }
      return leadResearchService.getResearch(leadId);
    },
    enabled: Boolean(leadId),
    staleTime: 60 * 1000, // 1 minute
  });

  // Trigger research mutation
  const triggerResearchMutation = useMutation({
    mutationFn: async () => {
      if (!leadId) {
        throw new Error("Lead ID is required");
      }
      return leadResearchService.triggerResearch(leadId);
    },
    onSuccess: (response) => {
      toast.success(
        response.message || "Research queued successfully. Results will appear shortly."
      );
      // Refetch after a short delay
      setTimeout(() => {
        refetchResearch();
      }, 3000);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to trigger research"
      );
    },
  });

  const handleTriggerResearch = () => {
    if (triggerResearchMutation.isPending) return;
    triggerResearchMutation.mutate();
  };

  const researchData = researchResponse?.data?.researchData;
  const isResearched = researchResponse?.data?.isResearched || false;
  const status = researchData?.status || researchResponse?.data?.status || "not_started";

  const isLoading = isLoadingResearch || isFetchingResearch;
  const isPending = status === "pending" || triggerResearchMutation.isPending;

  // Format date
  const formatResearchDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  // Markdown function 
  const parseMarkdownWithCitations = (text: string): string => {
    return text
      .replace(/\.(.*?)((?:\[\d+\])+)/g, '.$1<br/>$2<br/>')
      .replace(/\[(\d+)\]/g, '<sup class="text-blue-400">[$1]</sup>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };
  
  if (!leadId) {
    return (
      <div
        className="rounded-lg p-6 text-white/70 text-xs"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        Select a lead to view AI-powered research insights.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-white/60">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
        <span className="text-sm">Loading research data...</span>
      </div>
    );
  }

  // Not researched yet
  if (!isResearched || status === "not_started") {
    return (
      <div
        className="rounded-lg p-8 text-center"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-white/10">
            <Sparkles className="w-8 h-8 text-white/70" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-2">
              No Research Data Available
            </h3>
            <p className="text-white/60 text-xs mb-4">
              Start AI-powered research to gather professional insights, recent
              activities, news, and opportunities for {lead.name}.
            </p>
          </div>
          <Button
            onClick={handleTriggerResearch}
            disabled={triggerResearchMutation.isPending}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs"
          >
            {triggerResearchMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Queuing Research...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Start Research
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Research is pending
  if (isPending) {
    return (
      <div
        className="rounded-lg p-8 text-center"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
          <div>
            <h3 className="text-white font-semibold text-sm mb-2">
              Research in Progress
            </h3>
            <p className="text-white/60 text-xs">
              Our AI agent is gathering comprehensive insights about {lead.name}.
              This may take a minute or two.
            </p>
          </div>
          <Button
            onClick={() => refetchResearch()}
            variant="ghost"
            className="text-white/70 hover:text-white text-xs"
          >
            <RefreshCcw className="w-3.5 h-3.5 mr-2" />
            Check Status
          </Button>
        </div>
      </div>
    );
  }

  // Research failed
  if (status === "failed") {
    return (
      <div
        className="rounded-lg p-8 text-center"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-red-500/10">
            <AlertCircle className="w-8 h-8 text-red-300" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm mb-2">
              Research Failed
            </h3>
            <p className="text-white/60 text-xs mb-1">
              {researchData?.error || "Unable to complete research for this lead."}
            </p>
            <p className="text-white/50 text-xs">
              You can try running the research again.
            </p>
          </div>
          <Button
            onClick={handleTriggerResearch}
            disabled={triggerResearchMutation.isPending}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs"
          >
            {triggerResearchMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retry Research
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Research completed - show results
  return (
    <div className="space-y-4">
      {/* Header with status and refresh */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col items-center gap-3">
          <Badge className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">
            Research Completed
          </Badge>
          {researchData?.researchedAt && (
            <span className="text-xs text-white/50">
              <Calendar className="w-3 h-3 inline mr-1" />
              {formatResearchDate(researchData.researchedAt)}
            </span>
          )}
        </div>
        <Button
          onClick={handleTriggerResearch}
          disabled={triggerResearchMutation.isPending}
          size="sm"
          variant="ghost"
          className="text-white/70 hover:text-white text-xs h-8"
        >
          {triggerResearchMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <RefreshCcw className="w-3.5 h-3.5 mr-1" />
          )}
          Refresh
        </Button>
      </div>

      {/* Professional Background */}
      {researchData?.professionalBackground && (
        <Card
          className="p-4 h-44 overflow-auto scrollbar-hide"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Briefcase className="w-4 h-4 text-blue-300" />
            </div>
            <h3 className="text-white font-semibold text-sm">
              Professional Background
            </h3>
          </div>
          <div
            className="text-white/80 text-xs leading-relaxed prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: parseMarkdownWithCitations(researchData.professionalBackground)
            }}
          />
        </Card>
      )}

      {/* Recent Activities */}
      {researchData?.recentActivities &&
        researchData.recentActivities.length > 0 && (
          <Card
            className="p-4"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="w-4 h-4 text-purple-300" />
              </div>
              <h3 className="text-white font-semibold text-sm">
                Recent Activities
              </h3>
            </div>
            <ul className="space-y-2">
              {researchData.recentActivities.map((activity, index) => (
                <li
                  key={index}
                  className="text-white/80 text-xs leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-purple-300"
                >
                  {activity}
                </li>
              ))}
            </ul>
          </Card>
        )}

      {/* News Mentions */}
      {researchData?.news && researchData.news.length > 0 && (
        <Card
          className="p-4"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Newspaper className="w-4 h-4 text-cyan-300" />
            </div>
            <h3 className="text-white font-semibold text-sm">News & Mentions</h3>
          </div>
          <div className="space-y-3">
            {researchData.news.map((item, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <h4 className="text-white font-medium text-xs mb-1">
                  {item.title}
                </h4>
                <p className="text-white/70 text-xs mb-2">{item.summary}</p>
                {item.date && (
                  <span className="text-white/50 text-[10px]">{item.date}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pain Points */}
      {researchData?.painPoints && researchData.painPoints.length > 0 && (
        <Card
          className="p-4 h-44 overflow-auto scrollbar-hide"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <AlertCircle className="w-4 h-4 text-orange-300" />
            </div>
            <h3 className="text-white font-semibold text-sm">
              Potential Pain Points
            </h3>
          </div>
          <ul className="space-y-2">
            {researchData.painPoints.map((point, index) => (
              <li
                key={index}
                className="text-white/80 text-xs leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-orange-300"
              >
                {point}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Opportunities */}
      {researchData?.opportunities && researchData.opportunities.length > 0 && (
        <Card
          className="p-4 h-44 overflow-auto scrollbar-hide"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Lightbulb className="w-4 h-4 text-emerald-300" />
            </div>
            <h3 className="text-white font-semibold text-sm">
              Business Opportunities
            </h3>
          </div>
          <ul className="space-y-2">
            {researchData.opportunities.map((opportunity, index) => (
              <li
                key={index}
                className="text-white/80 text-xs leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-300"
              >
                {opportunity}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default AgentResearchTab;

