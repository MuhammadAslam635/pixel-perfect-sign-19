import { useEffect, useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import {
  dashboardService,
  SpeedToLeadData,
} from "@/services/dashboard.service";

/**
 * Speed to Lead Card
 * Shows count of active leads (simple stat display)
 */
export const SpeedToLeadCard = () => {
  const [data, setData] = useState<SpeedToLeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getSpeedToLead();
      setData(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load speed to lead");
      console.error("Error fetching speed to lead:", err);
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
        <Zap className="w-4 h-4 text-white/70" />
        <h3 className="text-white text-sm font-medium">Active Leads</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-4 h-4 animate-spin text-white/70" />
        </div>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : data ? (
        <div className="flex-1 flex items-center">
          <div className="flex flex-col gap-1">
            {/* Main metric */}
            <div className="text-3xl sm:text-4xl font-semibold text-white">
              {data.activeLeads.toLocaleString()}
            </div>
            <p className="text-[10px] text-white/50">in progress</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
