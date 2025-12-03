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
  score: number;
  leadCount: number;
  scoreLabel: string;
}

interface ScoreRangeData {
  scoreRange: string;
  leadCount: number;
}

const LeadsScoreDistributionCard = () => {
  const [chartData, setChartData] = useState<ScoreRangeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScoreDistribution = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardService.getLeadsScoreDistribution();

        // Validate the response data
        if (
          response &&
          response.chartData &&
          Array.isArray(response.chartData)
        ) {
          // Transform individual scores into score ranges
          const scoreRanges = [
            { min: 0, max: 20, label: "0-20" },
            { min: 20, max: 40, label: "20-40" },
            { min: 40, max: 60, label: "40-60" },
            { min: 60, max: 80, label: "60-80" },
            { min: 80, max: 101, label: "80-100" },
          ];

          const rangeCounts = new Map<string, number>();

          // Count leads in each range
          response.chartData.forEach((item) => {
            if (
              item &&
              typeof item.score === "number" &&
              typeof item.leadCount === "number"
            ) {
              const score = item.score;

              for (const range of scoreRanges) {
                if (score >= range.min && score < range.max) {
                  rangeCounts.set(
                    range.label,
                    (rangeCounts.get(range.label) || 0) + item.leadCount
                  );
                  break;
                }
              }
            }
          });

          // Convert to chart data format
          const transformedData = scoreRanges.map((range) => ({
            scoreRange: range.label,
            leadCount: rangeCounts.get(range.label) || 0,
          }));

          setChartData(transformedData);
        } else {
          setChartData([]);
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to load score distribution"
        );
        console.error("Error fetching score distribution:", err);
        setChartData([]);
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
        <div className="rounded-xl bg-[#1a1a1a]/95 backdrop-blur-sm px-4 py-3 text-white shadow-xl border border-[#69B3B7]/30">
          <p className="text-xs text-[#69B3B7] font-medium mb-1">
            Score Range: {payload[0].payload.scoreRange}
          </p>
          <p className="text-base font-semibold">
            {payload[0].value} {payload[0].value === 1 ? "lead" : "leads"}
          </p>
        </div>
      );
    }
    return null;
  };

  // Color gradient for bars - matching Total Campaigns chart gradient
  const getBarColor = (scoreRange: string | undefined) => {
    if (!scoreRange || typeof scoreRange !== "string") return "#7A7A7A"; // Default gray

    const parts = scoreRange.split("-");
    if (parts.length === 0) return "#7A7A7A";

    const minScore = parseInt(parts[0]);
    if (isNaN(minScore)) return "#7A7A7A";

    // Gradient from teal (#68B3B7) to blue (#3E65B4)
    if (minScore >= 80) return "#3E65B4"; // Deep blue for high scores
    if (minScore >= 60) return "#4A7DB5"; // Blue-teal mix
    if (minScore >= 40) return "#5695B6"; // Mid gradient
    if (minScore >= 20) return "#62A4B6"; // Lighter teal
    return "#68B3B7"; // Primary teal for low scores
  };

  const totalLeads = chartData.reduce((sum, item) => sum + item.leadCount, 0);

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-5 lg:p-6 min-h-[320px] lg:min-h-[380px] flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01] col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 lg:mb-5">
        <div className="flex flex-col gap-2">
          <h3 className="text-white text-base lg:text-lg font-medium">
            Lead Score Distribution
          </h3>
          {!loading && !error && (
            <p className="text-[#7A7A7A] text-sm">Total: {totalLeads} leads</p>
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
              margin={{ top: 0, right: 10, left: -10, bottom: 5 }}
            >
              <XAxis
                dataKey="scoreRange"
                tick={{ fill: "#7A7A7A", fontSize: 12 }}
                axisLine={{ stroke: "#333" }}
                tickLine={{ stroke: "#333" }}
                angle={0}
                textAnchor="middle"
                height={40}
              />
              <YAxis
                tick={{ fill: "#7A7A7A", fontSize: 12 }}
                axisLine={{ stroke: "#333" }}
                tickLine={{ stroke: "#333" }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(105, 179, 183, 0.1)" }}
              />
              <Bar dataKey="leadCount" radius={[8, 8, 0, 0]} maxBarSize={80}>
                {chartData.map((entry, index) => {
                  if (!entry || !entry.scoreRange) return null;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={getBarColor(entry.scoreRange)}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      {!loading && !error && chartData.length > 0 && totalLeads > 0 && (
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: "#68B3B7" }}
            ></div>
            <span className="text-[#7A7A7A]">0-20</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: "#62A4B6" }}
            ></div>
            <span className="text-[#7A7A7A]">20-40</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: "#5695B6" }}
            ></div>
            <span className="text-[#7A7A7A]">40-60</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: "#4A7DB5" }}
            ></div>
            <span className="text-[#7A7A7A]">60-80</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: "#3E65B4" }}
            ></div>
            <span className="text-[#7A7A7A]">80-100</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsScoreDistributionCard;
