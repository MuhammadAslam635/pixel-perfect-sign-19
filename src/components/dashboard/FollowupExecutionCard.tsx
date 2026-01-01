import { useEffect, useState } from "react";
import { Mail, Phone, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  dashboardService,
  FollowupExecutionData,
} from "@/services/dashboard.service";

/**
 * Follow-up Execution Rate Card
 * Shows overall execution rate with breakdown by channel as pie chart
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

  const channelPalette: Record<string, string> = {
    email: "#68B1B8",
    call: "#3B82F6",
    whatsapp: "#2B6CB0",
  };

  const channelOptions = [
    { key: "email", label: "Email", color: channelPalette.email },
    { key: "call", label: "Call", color: channelPalette.call },
    { key: "whatsapp", label: "WhatsApp", color: channelPalette.whatsapp },
  ];

  const chartData = data
    ? channelOptions.map((opt) => ({
        key: opt.key,
        name: opt.label,
        value: data.byChannel[opt.key as keyof typeof data.byChannel]?.completed || 0,
        fill: opt.color,
      }))
    : [];

  const allValuesZero = chartData.every((d) => d.value === 0);
  const displayChartData = allValuesZero
    ? chartData.map((d) => ({ ...d, value: 1 }))
    : chartData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    const displayValue = allValuesZero ? 0 : data.value;

    return (
      <div className="rounded-lg bg-[#212121] px-4 py-2 text-center text-white shadow-lg border border-white/10">
        <p className="text-xs text-[#7A7A7A] font-medium mb-1">{data.name}</p>
        <p className="text-base font-normal">{displayValue.toLocaleString()}</p>
      </div>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-4 lg:p-5 h-[140px] lg:h-[170px] flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-4 h-4" stroke="url(#dashboard-icon-gradient)" />
        <h3 className="text-white text-sm font-medium">Follow-up Execution</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-4 h-4 animate-spin text-white/70" />
        </div>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : data ? (
        <div className="flex-1 flex items-center gap-3 min-h-0">
          <div className="w-[88px] h-[88px] lg:w-[104px] lg:h-[104px] shrink-0">
            <ChartContainer
              config={{
                email: { label: "Email", color: channelPalette.email },
                call: { label: "Call", color: channelPalette.call },
                whatsapp: { label: "WhatsApp", color: channelPalette.whatsapp },
              }}
              className="h-full w-full aspect-square"
            >
              <PieChart>
                <ChartTooltip cursor={false} content={<CustomTooltip />} />
                <Pie
                  data={displayChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={0}
                  outerRadius={44}
                  strokeWidth={0}
                >
                  {displayChartData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={entry.fill}
                      fillOpacity={allValuesZero ? 0.3 : 0.9}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>

          <div className="flex-1 min-w-0">
            <div className="space-y-1.5">
              {channelOptions.map((opt) => {
                const stats = data.byChannel[opt.key as keyof typeof data.byChannel];
                return (
                  <div key={opt.key} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="h-2 w-2 rounded-[2px] shrink-0"
                        style={{ backgroundColor: opt.color }}
                      />
                      <span className="text-[10px] text-white/70 truncate">{opt.label}</span>
                    </div>
                    <span className="text-[10px] font-mono tabular-nums text-white/90">
                      {stats?.rate.toFixed(0) || 0}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
