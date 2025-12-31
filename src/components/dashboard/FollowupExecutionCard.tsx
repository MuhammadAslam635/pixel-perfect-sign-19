import { useEffect, useState } from "react";
import { Mail, Phone, MessageCircle } from "lucide-react";
import {
  MetricCard,
  CardLoadingState,
  CardErrorState,
  MetricHeader,
  MetricBadge,
} from "./index";
import {
  dashboardService,
  FollowupExecutionData,
} from "@/services/dashboard.service";

/**
 * Follow-up Execution Rate Card
 * Shows overall execution rate with breakdown by channel
 */
export const FollowupExecutionCard = () => {
  const [data, setData] = useState<FollowupExecutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getFollowupExecutionRate();
      setData(response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load follow-up execution rate"
      );
      console.error("Error fetching follow-up execution rate:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "call":
        return <Phone className="w-4 h-4" />;
      case "whatsapp":
        return <MessageCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case "email":
        return "Email";
      case "call":
        return "Call";
      case "whatsapp":
        return "WhatsApp";
      default:
        return channel;
    }
  };

  const getRateVariant = (rate: number) => {
    if (rate >= 80) return "success";
    if (rate >= 60) return "warning";
    return "danger";
  };

  return (
    <MetricCard>
      <MetricHeader
        title="Follow-up Execution Rate"
        badge={
          !loading && !error && data ? (
            <MetricBadge variant={getRateVariant(data.overall.rate)}>
              {data.overall.rate.toFixed(0)}%
            </MetricBadge>
          ) : undefined
        }
      />

      {loading ? (
        <CardLoadingState />
      ) : error ? (
        <CardErrorState message={error} onRetry={fetchData} />
      ) : data ? (
        <div className="flex flex-col gap-2 mt-2">
          {/* Overall rate */}
          <div className="text-3xl sm:text-4xl font-normal text-white">
            {data.overall.rate.toFixed(0)}
            <span className="text-xl sm:text-2xl text-white/60">%</span>
          </div>

          {/* Overall stats */}
          <div className="text-xs text-white/60">
            {data.overall.completed} / {data.overall.total} tasks
          </div>

          {/* Channel breakdown */}
          <div className="space-y-1.5 mt-2">
            {Object.entries(data.byChannel).map(([channel, stats]) => (
              <div key={channel} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/60">{getChannelIcon(channel)}</span>
                    <span className="text-white/70">{getChannelLabel(channel)}</span>
                  </div>
                  <span className="text-white font-medium">
                    {stats.rate.toFixed(0)}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#68B3B7] to-[#3E65B4] transition-all duration-300"
                    style={{ width: `${stats.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </MetricCard>
  );
};
