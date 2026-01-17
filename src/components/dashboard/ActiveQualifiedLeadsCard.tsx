import { useEffect, useState } from "react";
import { Target, Loader2, CheckCircle2 } from "lucide-react";
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
    <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-3 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
      <div className="flex items-center gap-3">
        {/* left */}
        <div>
          <CheckCircle2 className="w-10 h-10" stroke="url(#dashboard-icon-gradient)"/>
        </div>

        {/* right */}
        <div>
          {/* upper */}
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-white text-sm font-medium">
              Active Qualified Leads
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="w-4 h-4 animate-spin text-white/70" />
            </div>
          ) : error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : data ? (
            <div className="flex-1 flex items-center">
              <div className="flex flex-col">
                {/* Percentage */}
                <div className="text-xl font-semibold text-white">
                  {data.percentage.toFixed(1)}
                  <span className="text-xs text-white/60 ml-1">%</span>
                </div>

                {/* Ratio display */}
                <div className="flex items-baseline gap-1 text-[10px] text-white/50">
                  <span>{data.activeLeads.toLocaleString()}</span>
                  <span>/</span>
                  <span>{data.totalLeads.toLocaleString()}</span>
                  <span>leads</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
