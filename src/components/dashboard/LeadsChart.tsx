import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { format, parseISO, startOfDay, subDays, eachDayOfInterval } from "date-fns";
import { Loader2 } from "lucide-react";
import { leadsService, Lead } from "@/services/leads.service";

interface ChartDataPoint {
  date: string;
  count: number;
  displayDate: string;
}

export const LeadsChart = () => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeadsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range for last 30 days
        const endDate = new Date();
        const startDate = subDays(endDate, 30);

        // Format dates for API
        const createdFrom = format(startDate, "yyyy-MM-dd");
        const createdTo = format(endDate, "yyyy-MM-dd");

        // Fetch leads with date range
        // We'll need to fetch all pages if pagination exists
        let allLeads: Lead[] = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await leadsService.getLeads({
            page: currentPage,
            limit: 100, // Fetch larger batches
            createdFrom,
            createdTo,
          });

          if (response.success && response.data) {
            allLeads = [...allLeads, ...response.data];

            // Check if there are more pages
            if (response.pagination) {
              hasMore = response.pagination.hasNextPage;
              currentPage++;
            } else {
              hasMore = false;
            }
          } else {
            hasMore = false;
          }
        }

        // Process leads data: group by day
        const leadsByDay = new Map<string, number>();

        // Initialize all days in range with 0
        const dateRange = eachDayOfInterval({
          start: startOfDay(startDate),
          end: startOfDay(endDate),
        });

        dateRange.forEach((date) => {
          const dateKey = format(date, "yyyy-MM-dd");
          leadsByDay.set(dateKey, 0);
        });

        // Count leads per day
        allLeads.forEach((lead) => {
          if (lead.createdAt) {
            const leadDate = startOfDay(parseISO(lead.createdAt));
            const dateKey = format(leadDate, "yyyy-MM-dd");
            const currentCount = leadsByDay.get(dateKey) || 0;
            leadsByDay.set(dateKey, currentCount + 1);
          }
        });

        // Convert to chart data format
        const processedData: ChartDataPoint[] = Array.from(leadsByDay.entries())
          .map(([dateKey, count]) => {
            const date = parseISO(dateKey);
            return {
              date: dateKey,
              count,
              displayDate: format(date, "MMM d"), // Format like "Jan 13"
            };
          })
          .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date

        setChartData(processedData);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Failed to load leads data"
        );
        console.error("Error fetching leads data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadsData();
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
            {payload[0].value} {payload[0].value === 1 ? "lead" : "leads"}
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
        <p className="text-sm text-white/50">No leads data available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full" style={{ height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="leadsAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#385AB4" stopOpacity={0.4} />
              <stop offset="36.8%" stopColor="#68B1B8" stopOpacity={0.01} />
              <stop offset="57.4%" stopColor="#68B1B8" stopOpacity={0.01} />
              <stop offset="100%" stopColor="#68B1B8" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="leadsStrokeGradient" x1="0" y1="0" x2="1" y2="0">
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
            stroke="url(#leadsStrokeGradient)"
            strokeWidth={4}
            strokeOpacity={0.6}
            fill="url(#leadsAreaGradient)"
            fillOpacity={0.7}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
