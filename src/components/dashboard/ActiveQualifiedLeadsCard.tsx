import { useEffect, useState } from "react";
import { Target, Loader2 } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-4 lg:p-5 min-h-[140px] lg:min-h-[170px] flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-white/70" />
        <h3 className="text-white text-sm font-medium">Active Qualified Leads</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-4 h-4 animate-spin text-white/70" />
        </div>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : data ? (
        <div className="flex flex-col gap-2 flex-1 justify-center">
          {/* Percentage */}
          <div className="text-4xl sm:text-5xl font-semibold text-white">
            {data.percentage.toFixed(1)}
            <span className="text-2xl sm:text-3xl text-white/60">%</span>
          </div>

          {/* Ratio display */}
          <div className="flex items-baseline gap-1 text-xs text-white/50">
            <span>{data.activeLeads.toLocaleString()}</span>
            <span>/</span>
            <span>{data.totalLeads.toLocaleString()}</span>
            <span>leads</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
