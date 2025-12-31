import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import {
  MetricCard,
  CardLoadingState,
  CardErrorState,
  MetricHeader,
  MetricBadge,
} from "./index";
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

  const getStatusVariant = (count: number) => {
    if (count === 0) return "success";
    if (count <= 5) return "warning";
    return "danger";
  };

  return (
    <MetricCard>
      <MetricHeader
        title="Revenue at Risk"
        badge={
          !loading && !error && data ? (
            <MetricBadge variant={getStatusVariant(data.leadsAtRisk)}>
              {data.leadsAtRisk === 0 ? "On Track" : `${data.leadsAtRisk} at risk`}
            </MetricBadge>
          ) : undefined
        }
      />

      {loading ? (
        <CardLoadingState />
      ) : error ? (
        <CardErrorState message={error} onRetry={fetchData} />
      ) : data ? (
        <div className="flex flex-col gap-1 mt-2">
          {/* Main metric */}
          <div className="flex items-center gap-2">
            {data.leadsAtRisk > 0 && (
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-normal text-white">
                {data.leadsAtRisk}
              </span>
              <span className="text-sm text-white/60">at risk</span>
            </div>
          </div>

          {/* Expandable list */}
          {data.leadsAtRisk > 0 && data.leadsDetails.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors mt-1"
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
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {data.leadsDetails.map((lead) => (
                <div
                  key={lead._id}
                  className="p-2 bg-white/5 rounded-lg border border-white/10 text-xs"
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
    </MetricCard>
  );
};
