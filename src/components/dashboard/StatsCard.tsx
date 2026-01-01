import { useEffect, useState } from "react";
import { Loader2, Megaphone } from "lucide-react";
import {
  dashboardService,
  CampaignsStatistics,
} from "@/services/dashboard.service";
import { CampaignsChart } from "./CampaignsChart";

const StatsCard = () => {
  const [campaignsStats, setCampaignsStats] =
    useState<CampaignsStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaignsStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardService.getCampaignsStatistics();
        setCampaignsStats(response.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to load campaigns stats"
        );
        console.error("Error fetching campaigns stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignsStats();
  }, []);
  return (
    <div className="p-2">
      <section className="stats-card relative w-full overflow-hidden rounded-[36px] border border-white/10 p-3 lg:p-4 max-h-[200px] min-h-[100px] lg:min-h-[130px] transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
        <div className="relative z-10 flex h-full flex-col sm:flex-row sm:items-start gap-4">
        {/* Left Section - Text Metrics - Takes less width on desktop to give more space to chart */}
        <div className="flex flex-col gap-2 sm:w-2/5 sm:flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" stroke="url(#dashboard-icon-gradient)" />
              <h3 className="text-white text-sm font-medium">Total Campaigns</h3>
            </div>
            {!loading && !error && (
              <span
                className="rounded-full bg-[#FFFFFF1A] px-3 py-1 text-xs font-medium text-white"
                style={{
                  boxShadow:
                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                }}
              >
                {campaignsStats && campaignsStats.dailyCounts.length > 1
                  ? (() => {
                      const recent = campaignsStats.dailyCounts
                        .slice(-7)
                        .reduce((sum, day) => sum + day.count, 0);
                      const previous = campaignsStats.dailyCounts
                        .slice(-14, -7)
                        .reduce((sum, day) => sum + day.count, 0);
                      const changeValue =
                        previous > 0
                          ? ((recent - previous) / previous) * 100
                          : 0;
                      const change = changeValue.toFixed(1);
                      return `${changeValue > 0 ? "+" : ""}${change}%`;
                    })()
                  : "+0%"}
              </span>
            )}
          </div>
          {loading ? (
            <div className="flex items-center justify-center mt-4">
              <Loader2 className="w-6 h-6 animate-spin text-white/70" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-400 mt-2">{error}</p>
          ) : (
            <p className="text-3xl lg:text-4xl font-normal tracking-tight text-white mt-1">
              {campaignsStats?.totalCampaigns.toLocaleString() || "0"}
            </p>
          )}
        </div>
      </div>

        {/* Chart - Absolutely positioned to touch bottom and right borders */}
        <div className="absolute bottom-0 right-0 sm:left-[40%] left-0 h-full hidden sm:block z-0">
          <CampaignsChart />
        </div>
      </section>
    </div>
  );
};

export default StatsCard;
