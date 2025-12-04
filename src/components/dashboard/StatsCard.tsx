import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
    <section className="stats-card relative w-full overflow-hidden rounded-[36px] border border-white/10 px-6 py-6 sm:px-8 sm:py-8 min-h-[200px] sm:min-h-[250px] transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
      <div className="relative z-10 flex h-full flex-col sm:flex-row sm:items-start gap-6">
        {/* Left Section - Text Metrics - Takes less width on desktop to give more space to chart */}
        <div className="flex flex-col gap-3 sm:gap-4 sm:w-2/5 sm:flex-shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-[#7A7A7A] text-sm sm:text-base font-medium">
              Total Campaigns
            </span>
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
            <div className="flex items-center justify-center mt-8">
              <Loader2 className="w-8 h-8 animate-spin text-white/70" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-400 mt-4">{error}</p>
          ) : (
            <p className="text-[15px] sm:text-4xl md:text-5xl font-normal tracking-tight text-white mt-2 sm:mt-6 md:mt-12">
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
  );
};

export default StatsCard;
