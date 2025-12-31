import { useEffect, useState } from "react";
import { FileText, Send, Clock } from "lucide-react";
import {
  MetricCard,
  CardLoadingState,
  CardErrorState,
  MetricHeader,
} from "./index";
import {
  dashboardService,
  ProposalThroughputData,
} from "@/services/dashboard.service";

type Period = "30d" | "90d" | "all";

/**
 * Proposal Throughput Card
 * Shows RFPs, proposals submitted, avg cycle time with period selector
 */
export const ProposalThroughputCard = () => {
  const [data, setData] = useState<ProposalThroughputData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");

  const fetchData = async (selectedPeriod: Period) => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getProposalThroughput({
        period: selectedPeriod,
      });
      setData(response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load proposal throughput"
      );
      console.error("Error fetching proposal throughput:", err);
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
        <MetricHeader title="Proposal Throughput" />

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
        <div className="grid grid-cols-2 gap-2 mt-2">
          {/* RFPs Received */}
          <div className="flex flex-col gap-0.5 p-2 bg-white/5 rounded-lg border border-white/10">
            <span className="text-[10px] text-white/60">RFPs</span>
            <span className="text-xl sm:text-2xl font-normal text-white">
              {data.rfpsReceived.toLocaleString()}
            </span>
          </div>

          {/* Proposals Submitted */}
          <div className="flex flex-col gap-0.5 p-2 bg-white/5 rounded-lg border border-white/10">
            <span className="text-[10px] text-white/60">Sent</span>
            <span className="text-xl sm:text-2xl font-normal text-white">
              {data.proposalsSubmitted.toLocaleString()}
            </span>
          </div>

          {/* Avg Cycle Time */}
          <div className="flex flex-col gap-0.5 p-2 bg-white/5 rounded-lg border border-white/10 col-span-2">
            <span className="text-[10px] text-white/60">Avg Cycle Time</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-normal text-white">
                {data.avgCycleTimeDays > 0
                  ? data.avgCycleTimeDays.toFixed(1)
                  : "—"}
              </span>
              {data.avgCycleTimeDays > 0 && (
                <span className="text-sm text-white/60">days</span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </MetricCard>
  );
};
