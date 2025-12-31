import { useEffect, useState } from "react";
import { AlertCircle, TrendingDown, Clock, Mail, Loader2 } from "lucide-react";
import {
  dashboardService,
  DealsAtRiskData,
  DealAtRisk,
} from "@/services/dashboard.service";

/**
 * Deals at Risk Card
 * Shows list of deals with no activity in 2+ days
 * Displays risk reason and recommended action for each deal
 */
export const DealsAtRiskCard = () => {
  const [data, setData] = useState<DealsAtRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getDealsAtRisk();
      setData(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load deals at risk");
      console.error("Error fetching deals at risk:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRiskIcon = (reason: string) => {
    switch (reason) {
      case "proposal_stalled":
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case "no_followup":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "no_response":
        return <Mail className="w-4 h-4 text-orange-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-white/60" />;
    }
  };

  const getRiskLabel = (reason: string) => {
    switch (reason) {
      case "proposal_stalled":
        return "Proposal Stalled";
      case "no_followup":
        return "No Follow-up";
      case "no_response":
        return "No Response";
      default:
        return reason;
    }
  };

  const getRiskColor = (reason: string) => {
    switch (reason) {
      case "proposal_stalled":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "no_followup":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "no_response":
        return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      default:
        return "text-white/60 bg-white/5 border-white/10";
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-4 lg:p-5 h-[200px] lg:h-[240px] flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle className="w-4 h-4 text-white/70" />
        <h3 className="text-white text-sm font-medium">Deals at Risk</h3>
        {!loading && !error && data && data.dealsAtRisk.length > 0 && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-red-400/10 text-red-400 border border-red-400/20">
            {data.dealsAtRisk.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-4 h-4 animate-spin text-white/70" />
        </div>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : data ? (
        <>
          {data.dealsAtRisk.length === 0 ? (
            <div className="flex items-center justify-center flex-1 text-center">
              <p className="text-sm text-green-400">All deals on track</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1.5">
              {data.dealsAtRisk.map((deal: DealAtRisk) => (
                <div
                  key={deal._id}
                  className="p-1.5 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-[10px] font-medium text-white truncate pr-2">
                      {deal.name}
                    </h4>
                    <span className="text-[9px] text-white/40 shrink-0">
                      {Math.floor(deal.daysSinceContact)}d
                    </span>
                  </div>

                  {/* Risk badge */}
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-medium border ${getRiskColor(
                        deal.riskReason
                      )}`}
                    >
                      {getRiskIcon(deal.riskReason)}
                      {getRiskLabel(deal.riskReason)}
                    </span>
                  </div>

                  {/* Recommended action */}
                  <p className="text-[9px] text-blue-400 mt-1 truncate">
                    {deal.recommendedAction}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
