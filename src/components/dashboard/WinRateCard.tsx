import { useEffect, useState } from "react";
import {
  MetricCard,
  CardLoadingState,
  CardErrorState,
  MetricHeader,
} from "./index";
import {
  dashboardService,
  WinRateData,
} from "@/services/dashboard.service";

type Period = "30d" | "90d" | "all";

/**
 * Win Rate Card
 * Shows percentage of closed deals with period selector
 */
export const WinRateCard = () => {
  const [data, setData] = useState<WinRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");

  const fetchData = async (selectedPeriod: Period) => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getWinRate({
        period: selectedPeriod,
      });
      setData(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load win rate");
      console.error("Error fetching win rate:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const getPeriodLabel = (p: Period) => {
    switch (p) {
      case "30d":
        return "30 Days";
      case "90d":
        return "90 Days";
      case "all":
        return "All Time";
    }
  };

  return (
    <MetricCard>
      <div className="flex justify-between items-start mb-2">
        <MetricHeader title="Win Rate" />

        {/* Period Selector */}
        <div className="flex gap-0.5 bg-[#FFFFFF0A] rounded-full p-0.5">
          {(["30d", "90d", "all"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`
                px-2 py-0.5 text-[10px] font-medium rounded-full transition-all duration-200
                ${
                  period === p
                    ? "bg-white/20 text-white"
                    : "text-white/50 hover:text-white/80"
                }
              `}
            >
              {getPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <CardLoadingState />
      ) : error ? (
        <CardErrorState message={error} onRetry={() => fetchData(period)} />
      ) : data ? (
        <div className="flex flex-col gap-1 mt-2">
          {/* Win Rate Percentage */}
          <div className="text-3xl sm:text-4xl font-normal text-white">
            {data.winRate.toFixed(1)}
            <span className="text-xl sm:text-2xl text-white/60">%</span>
          </div>

          {/* Ratio */}
          <div className="flex items-baseline gap-1 text-xs text-white/60">
            <span>{data.closedLeads.toLocaleString()} closed</span>
            <span>/</span>
            <span>{data.totalLeads.toLocaleString()} total</span>
          </div>
        </div>
      ) : null}
    </MetricCard>
  );
};
