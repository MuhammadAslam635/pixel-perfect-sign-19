import { useEffect, useState } from "react";
import {
  MetricCard,
  CardLoadingState,
  CardErrorState,
  MetricHeader,
} from "./index";
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
    <MetricCard>
      <MetricHeader title="Active Leads" />

      {loading ? (
        <CardLoadingState />
      ) : error ? (
        <CardErrorState message={error} onRetry={fetchData} />
      ) : data ? (
        <div className="flex flex-col gap-1 mt-2">
          {/* Main metric */}
          <div className="text-3xl sm:text-4xl font-normal text-white">
            {data.activeLeads.toLocaleString()}
          </div>
          <p className="text-xs text-white/60">in progress</p>
        </div>
      ) : null}
    </MetricCard>
  );
};
