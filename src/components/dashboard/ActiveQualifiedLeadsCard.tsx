import { useEffect, useState } from "react";
import {
  MetricCard,
  CardLoadingState,
  CardErrorState,
  MetricHeader,
} from "./index";
import {
  dashboardService,
  ActiveQualifiedLeadsData,
} from "@/services/dashboard.service";

/**
 * Active Qualified Leads Card
 * Shows count and percentage of leads in active stages
 */
export const ActiveQualifiedLeadsCard = () => {
  const [data, setData] = useState<ActiveQualifiedLeadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getActiveQualifiedLeads();
      setData(response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load active qualified leads"
      );
      console.error("Error fetching active qualified leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <MetricCard>
      <MetricHeader title="Active Qualified Leads" />

      {loading ? (
        <CardLoadingState />
      ) : error ? (
        <CardErrorState message={error} onRetry={fetchData} />
      ) : data ? (
        <div className="flex flex-col gap-1 mt-2">
          {/* Percentage */}
          <div className="text-3xl sm:text-4xl font-normal text-white">
            {data.percentage.toFixed(1)}
            <span className="text-xl sm:text-2xl text-white/60">%</span>
          </div>

          {/* Ratio display */}
          <div className="flex items-baseline gap-1 text-xs text-white/60">
            <span>{data.activeLeads.toLocaleString()}</span>
            <span>/</span>
            <span>{data.totalLeads.toLocaleString()}</span>
            <span>leads</span>
          </div>
        </div>
      ) : null}
    </MetricCard>
  );
};
