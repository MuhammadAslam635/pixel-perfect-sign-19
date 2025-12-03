import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { dashboardService } from "@/services/dashboard.service";

interface ScoreDistributionData {
  scoreRange: string;
  leadCount: number;
  percentage: number;
}

const LeadsScoreDistributionCard = () => {
  const [chartData, setChartData] = useState<ScoreDistributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScoreDistribution = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardService.getLeadsScoreDistribution();
        setChartData(response.chartData || []);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to load score distribution"
        );
        console.error("Error fetching score distribution:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScoreDistribution();
  }, []);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg bg-[#212121] px-4 py-2 text-white shadow-lg border border-white/10">
          <p className="text-xs text-[#7A7A7A] font-medium mb-1">
            Score: {payload[0].payload.scoreRange}
          </p>
          <p className="text-base font-normal">
            {payload[0].value} {payload[0].value === 1 ? "lead" : "leads"}
          </p>
        </div>
      );
    }
    return null;
  };

  // Color gradient for bars based on score range
  const getBarColor = (scoreRange: string) => {
    const minScore = parseInt(scoreRange.split("-")[0]);

    if (minScore >= 81) return "#4CAF50"; // Green for high scores
    if (minScore >= 61) return "#8BC34A"; // Light green
    if (minScore >= 41) return "#FFC107"; // Yellow
    if (minScore >= 21) return "#FF9800"; // Orange
    return "#F44336"; // Red for low scores
  };

  const totalLeads = chartData.reduce((sum, item) => sum + item.leadCount, 0);

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-4 lg:p-5 min-h-[240px] lg:min-h-[280px] flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.02]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 lg:mb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-white text-sm lg:text-base font-medium">
            Lead Score Distribution
          </h3>
          {!loading && !error && (
            <p className="text-[#7A7A7A] text-xs">Total: {totalLeads} leads</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 lg:w-8 lg:h-8 animate-spin text-white/70" />
          </div>
        ) : error ? (
          <p className="text-xs lg:text-sm text-red-400 text-center">{error}</p>
        ) : chartData.length === 0 || totalLeads === 0 ? (
          <p className="text-xs lg:text-sm text-white/50 text-center">
            No score data available
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <XAxis
                dataKey="scoreRange"
                tick={{ fill: "#7A7A7A", fontSize: 10 }}
                axisLine={{ stroke: "#333" }}
                tickLine={{ stroke: "#333" }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fill: "#7A7A7A", fontSize: 10 }}
                axisLine={{ stroke: "#333" }}
                tickLine={{ stroke: "#333" }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              <Bar dataKey="leadCount" radius={[4, 4, 0, 0]} maxBarSize={40}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.scoreRange)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      {!loading && !error && chartData.length > 0 && totalLeads > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1 text-xs">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "#F44336" }}
            ></div>
            <span className="text-[#7A7A7A]">Low</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "#FF9800" }}
            ></div>
            <span className="text-[#7A7A7A]">Med-Low</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "#FFC107" }}
            ></div>
            <span className="text-[#7A7A7A]">Medium</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "#8BC34A" }}
            ></div>
            <span className="text-[#7A7A7A]">Med-High</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: "#4CAF50" }}
            ></div>
            <span className="text-[#7A7A7A]">High</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsScoreDistributionCard;
