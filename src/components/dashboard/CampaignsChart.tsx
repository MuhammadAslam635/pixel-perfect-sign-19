import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  dashboardService,
  CampaignsStatistics,
} from "@/services/dashboard.service";

interface ChartDataPoint {
  date: string;
  count: number;
  displayDate: string;
}

export const CampaignsChart = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaignsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await dashboardService.getCampaignsStatistics();

        if (response.success && response.data) {
          const campaignsStats: CampaignsStatistics = response.data;

          // Process campaigns data: format dates for chart
          const processedData: ChartDataPoint[] = campaignsStats.dailyCounts
            .map((dayData) => {
              const date = parseISO(dayData.date);
              return {
                date: dayData.date,
                count: dayData.count,
                displayDate: format(date, "MMM d"), // Format like "Jan 13"
              };
            })
            .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date

          setChartData(processedData);
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to load campaigns data"
        );
        console.error("Error fetching campaigns data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignsData();
  }, []);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-[#212121] px-4 py-2 text-center text-white shadow-lg border border-white/10">
          <p className="text-xs text-[#7A7A7A] font-medium mb-1">
            {payload[0].payload.displayDate}
          </p>
          <p className="text-base font-normal">
            {payload[0].value} {payload[0].value === 1 ? "campaign" : "campaigns"}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="relative sm:flex-1 h-full hidden sm:flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/70" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative sm:flex-1 h-full hidden sm:flex items-center justify-center">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="relative sm:flex-1 h-full hidden sm:flex items-center justify-center">
        <p className="text-sm text-white/50">No campaigns data available</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full animate-in fade-in duration-700"
      style={{ height: "100%" }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="campaignsAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#385AB4" stopOpacity={0.4} />
              <stop offset="36.8%" stopColor="#68B1B8" stopOpacity={0.01} />
              <stop offset="57.4%" stopColor="#68B1B8" stopOpacity={0.01} />
              <stop offset="100%" stopColor="#68B1B8" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient
              id="campaignsStrokeGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop offset="0%" stopColor="#68B3B7" />
              <stop offset="100%" stopColor="#3E65B4" />
            </linearGradient>
          </defs>
          <XAxis hide />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="url(#campaignsStrokeGradient)"
            strokeWidth={4}
            strokeOpacity={0.6}
            fill="url(#campaignsAreaGradient)"
            fillOpacity={0.7}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
