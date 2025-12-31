import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import {
  dashboardService,
  RevenueAtRiskData,
} from "@/services/dashboard.service";

/**
 * Revenue at Risk Card
 * Shows leads not contacted in 7+ days with expandable list
 */
export const RevenueAtRiskCard = () => {
  const [data, setData] = useState<RevenueAtRiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getRevenueAtRisk();
      setData(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load revenue at risk");
      console.error("Error fetching revenue at risk:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-4 lg:p-5 h-[140px] lg:h-[170px] flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-white/70" />
        <h3 className="text-white text-sm font-medium">Revenue at Risk</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-4 h-4 animate-spin text-white/70" />
        </div>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : data ? (
        <div className="flex-1 flex flex-col justify-center gap-1">
          {/* Main metric */}
          <div className="flex items-center gap-2">
            {data.leadsAtRisk > 0 && (
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-normal text-white">
                {data.leadsAtRisk}
              </span>
              <span className="text-[10px] text-white/60">at risk</span>
            </div>
          </div>

          {/* Expandable list */}
          {data.leadsAtRisk > 0 && data.leadsDetails.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-[10px] text-white/60 hover:text-white transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  View details
                </>
              )}
            </button>
          )}

          {expanded && data.leadsDetails.length > 0 && (
            <div className="mt-1 space-y-1 max-h-24 overflow-y-auto scrollbar-hide">
              {data.leadsDetails.map((lead) => (
                <div
                  key={lead._id}
                  className="p-1.5 bg-white/5 rounded-lg border border-white/10 text-[10px]"
                >
                  <div className="flex justify-between">
                    <span className="text-white font-medium">{lead.name}</span>
                    <span className="text-yellow-400">
                      {Math.floor(lead.daysSinceContact)}d
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
