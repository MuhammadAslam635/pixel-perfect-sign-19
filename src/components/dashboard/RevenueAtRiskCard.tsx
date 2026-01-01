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
    <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-3 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
      <div className="flex items-start gap-3">
        {/* Left Icon */}
        <div className="mt-1">
          <AlertTriangle className="w-10 h-10" stroke="url(#dashboard-icon-gradient)" />
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-0.5">
            <h3 className="text-white text-sm font-medium truncate">Revenue at Risk</h3>
            
            {/* Expand Toggle */}
            {data && data.leadsAtRisk > 0 && data.leadsDetails.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[9px] text-white/60 hover:text-white transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-2.5 h-2.5" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-2.5 h-2.5" />
                    View
                  </>
                )}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-white/70" />
            </div>
          ) : error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : data ? (
            <div className="flex flex-col gap-1.5">
              {/* Main metric */}
              <div className="flex flex-col">
                {/* Main metric */}
                <div className="flex items-center gap-2">
                  <div className="text-xl font-semibold text-white">
                    {data.leadsAtRisk}
                  </div>
                  {data.leadsAtRisk > 0 && (
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                  )}
                </div>
                <span className="text-[10px] text-white/50">leads at risk</span>
              </div>

              {/* Expandable list */}
              {expanded && data.leadsDetails.length > 0 && (
                <div className="mt-1 space-y-1 max-h-32 overflow-y-auto scrollbar-hide w-full">
                  {data.leadsDetails.map((lead) => (
                    <div
                      key={lead._id}
                      className="p-1 bg-white/5 rounded-md border border-white/10 text-[9px]"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium truncate max-w-[60%]">{lead.name}</span>
                        <span className="text-yellow-400 whitespace-nowrap">
                          {Math.floor(lead.daysSinceContact)}d ago
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
