import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Target, Calendar, Filter, Users, ChevronDown, Clock } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import { dashboardService, DashboardPeriod, TopLead } from "@/services/dashboard.service";
import { calendarService, LeadMeetingRecord } from "@/services/calendar.service";
import { useActivityBreakdown } from "@/hooks/useDashboard";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type ActivityFilter =
  | "all"
  | "message_sent"
  | "email_sent"
  | "outbound_calls"
  | "inbound_calls"
  | "whatsapp_sent"
  | "sms_sent";

type ActivityBreakdownKey = Exclude<ActivityFilter, "all">;

const LeadsScoreDistributionCard = () => {
  const navigate = useNavigate();
  const [topLeads, setTopLeads] = useState<TopLead[]>([]);
  const [topLeadsLoading, setTopLeadsLoading] = useState(true);
  const [totalLeads, setTotalLeads] = useState<number | null>(null);
  const [totalLeadsLoading, setTotalLeadsLoading] = useState(true);
  const [totalLeadsPeriod, setTotalLeadsPeriod] = useState<DashboardPeriod>("all");
  const [showTotalLeadsPeriodDropdown, setShowTotalLeadsPeriodDropdown] = useState(false);
  // Activity Breakdown Query
  const { data: activityBreakdownData, isLoading: activityBreakdownLoading } = useActivityBreakdown();

  const activityBreakdown: Record<ActivityBreakdownKey, number> = activityBreakdownData || {
    message_sent: 0,
    email_sent: 0,
    outbound_calls: 0,
    inbound_calls: 0,
    whatsapp_sent: 0,
    sms_sent: 0,
  };
  const totalLeadsPeriodDropdownRef = useRef<HTMLDivElement>(null);

  // Meetings state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [meetings, setMeetings] = useState<LeadMeetingRecord[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [weekDates, setWeekDates] = useState<Date[]>([]);

  // Initialize week dates (current week, Monday to Sunday)
  useEffect(() => {
    const today = new Date();
    const currentDay = today.getDay();
    // Calculate Monday of current week (0 = Sunday, 1 = Monday, etc.)
    const monday = new Date(today);
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // If Sunday, go back 6 days
    monday.setDate(today.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    setWeekDates(dates);
    // Set selected date to today on initial load
    setSelectedDate(today);
  }, []);

  // Fetch meetings for selected date
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setMeetingsLoading(true);
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const response = await calendarService.getLeadMeetings({
          startDate: startOfDay.toISOString(),
          endDate: endOfDay.toISOString(),
          status: "scheduled,confirmed",
          sort: "asc",
        });

        setMeetings(response.data || []);
      } catch (err: any) {
        console.error("Error fetching meetings:", err);
        setMeetings([]);
      } finally {
        setMeetingsLoading(false);
      }
    };

    fetchMeetings();
  }, [selectedDate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsidePeriod = totalLeadsPeriodDropdownRef.current?.contains(target);

      if (!clickedInsidePeriod) setShowTotalLeadsPeriodDropdown(false);
    };

    if (showTotalLeadsPeriodDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTotalLeadsPeriodDropdown]);

  // Fetch top 3 leads
  useEffect(() => {
    const fetchTopLeads = async () => {
      try {
        setTopLeadsLoading(true);
        const response = await dashboardService.getTopLeads();
        setTopLeads(response.data.slice(0, 3)); // Get top 3
      } catch (err: any) {
        console.error("Error fetching top leads:", err);
        setTopLeads([]);
      } finally {
        setTopLeadsLoading(false);
      }
    };

    fetchTopLeads();
  }, []);

  // Fetch total leads count
  useEffect(() => {
    const fetchTotalLeads = async () => {
      try {
        setTotalLeadsLoading(true);
        const response = await dashboardService.getTotalLeadsCount({
          period: totalLeadsPeriod,
        });
        setTotalLeads(response.data.count || 0);
      } catch (err: any) {
        console.error("Error fetching total leads:", err);
        setTotalLeads(0);
      } finally {
        setTotalLeadsLoading(false);
      }
    };

    fetchTotalLeads();
  }, [totalLeadsPeriod]);



  const totalLeadsPeriodOptions: { value: DashboardPeriod; label: string }[] = [
    { value: "all", label: "All time" },
    { value: "7d", label: "Last week" },
    { value: "30d", label: "Last month" },
    { value: "90d", label: "Last 3 months" },
    { value: "1y", label: "Last year" },
  ];

  const handleLeadClick = (leadId: string) => {
    navigate(`/leads/${leadId}`);
  };

  // Muted palette to match the app's dark/professional theme (avoid overly saturated "cartoon" colors)
  const activityPalette: Record<ActivityBreakdownKey, string> = {
    // Dark + cyan personality: one hero cyan, plus slate/gray and deep blue accents.
    // Avoid yellow/green hues.
    message_sent: "#68B1B8", // hero cyan
    email_sent: "#3B82F6", // deep blue
    sms_sent: "#2B6CB0", // darker blue
    whatsapp_sent: "#334155", // slate/gray
    outbound_calls: "#1F2A37", // near-black gray
    inbound_calls: "#0B3A57", // deep navy-cyan (not green)
  };

  const activityOptions: Array<{
    key: ActivityBreakdownKey;
    label: string;
    color: string;
  }> = [
      { key: "message_sent", label: "Messages", color: activityPalette.message_sent },
      { key: "email_sent", label: "Email", color: activityPalette.email_sent },
      { key: "sms_sent", label: "SMS", color: activityPalette.sms_sent },
      { key: "whatsapp_sent", label: "WhatsApp", color: activityPalette.whatsapp_sent },
      { key: "outbound_calls", label: "Out Calls", color: activityPalette.outbound_calls },
      { key: "inbound_calls", label: "In Calls", color: activityPalette.inbound_calls },
    ];

  const donutData = activityOptions.map((opt) => ({
    key: opt.key,
    name: opt.label,
    value: activityBreakdown[opt.key] ?? 0,
    fill: opt.color,
  }));

  // Check if all values are zero
  const allValuesZero = donutData.every((d) => d.value === 0);

  // If all values are zero, use equal values (1) to ensure chart renders as equal segments
  const chartData = allValuesZero
    ? donutData.map((d) => ({ ...d, value: 1 }))
    : donutData;

  // Custom tooltip that shows 0 when all values are zero
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
    <div className="col-span-2 grid grid-cols-2 gap-4">
      {/* Tile 1: Top Leads */}
      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-4 lg:p-5 h-[140px] lg:h-[170px] flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4" stroke="url(#dashboard-icon-gradient)" />
          <h3 className="text-white text-sm font-medium">Top Leads</h3>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {topLeadsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-4 h-4 animate-spin text-white/70" />
            </div>
          ) : topLeads.length === 0 ? (
            <p className="text-xs text-white/50 text-center">No leads found</p>
          ) : (
            <div className="space-y-2">
              {topLeads.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => handleLeadClick(lead.id)}
                  className="relative p-2 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.3)] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-[3px] before:rounded-full before:bg-primary border-0"
                  style={{
                    background: `linear-gradient(180deg, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0.08) 100%), radial-gradient(50% 100% at 50% 0%, rgba(104, 177, 184, 0.1) 0%, rgba(104, 177, 184, 0) 100%)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {lead.name}
                      </p>
                      <p className="text-[10px] text-white/60 mt-0.5">
                        Score: {lead.momentumScore}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tile 2: Upcoming Meetings */}
      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-4 lg:p-5 h-[140px] lg:h-[170px] flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4" stroke="url(#dashboard-icon-gradient)" />
          <h3 className="text-white text-sm font-medium">Upcoming Meetings</h3>
        </div>

        {/* Week dates selector */}
        <div className="flex items-center justify-center gap-1.5 mb-2">
          {weekDates.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            // Map day index (0=Sunday, 1=Monday, etc.) to our week array (0=Monday, 6=Sunday)
            const dayIndex = date.getDay();
            const weekDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            const dayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
            const dayName = dayNames[weekDayIndex];
            const dayNumber = date.getDate();

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 relative overflow-hidden ${isSelected
                  ? "border-2 border-primary"
                  : "border border-white/10 hover:border-white/20"
                  }`}
                style={{
                  background: isSelected
                    ? `linear-gradient(180deg, rgba(104, 177, 184, 0.25) 0%, rgba(104, 177, 184, 0.1) 100%)`
                    : `linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)`,
                }}
              >
                <span className={`text-[8px] font-medium ${isSelected ? "text-primary" : "text-white/50"}`}>
                  {dayName}
                </span>
                <span
                  className={`text-xs font-semibold ${isSelected ? "text-white" : isToday ? "text-primary" : "text-white/80"
                    }`}
                >
                  {dayNumber}
                </span>
              </button>
            );
          })}
        </div>

        {/* Meetings list */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {meetingsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-3 h-3 animate-spin text-white/70" />
            </div>
          ) : meetings.length === 0 ? (
            <p className="text-[10px] text-white/50 text-center">No meetings</p>
          ) : (
            <div className="space-y-1.5">
              {meetings.slice(0, 3).map((meeting) => {
                const startTime = new Date(meeting.startDateTime);
                const endTime = new Date(meeting.endDateTime);
                const timeStr = `${startTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })} - ${endTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}`;

                return (
                  <div
                    key={meeting._id}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                  >
                    <p className="text-[10px] font-medium text-white truncate mb-0.5">
                      {meeting.subject}
                    </p>
                    <div className="flex items-center gap-1 text-[9px] text-white/60">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{timeStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tile 3: Activity Breakdown */}
      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-4 lg:p-5 h-[140px] lg:h-[170px] flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
        <div className="flex items-center gap-2 mb-2">

          <Filter className="w-4 h-4" stroke="url(#dashboard-icon-gradient)" />
          <h3 className="text-white text-sm font-medium">Activity Breakdown</h3>
        </div>

        <div className="flex-1 flex items-center gap-3 min-h-0">
          {activityBreakdownLoading ? (
            <div className="flex items-center justify-center w-full">
              <Loader2 className="w-4 h-4 animate-spin text-white/70" />
            </div>
          ) : (
            <>
              <div className="w-[88px] h-[88px] lg:w-[104px] lg:h-[104px] shrink-0">
                <ChartContainer
                  config={{
                    message_sent: { label: "Messages", color: activityPalette.message_sent },
                    email_sent: { label: "Email", color: activityPalette.email_sent },
                    sms_sent: { label: "SMS", color: activityPalette.sms_sent },
                    whatsapp_sent: { label: "WhatsApp", color: activityPalette.whatsapp_sent },
                    outbound_calls: { label: "Out Calls", color: activityPalette.outbound_calls },
                    inbound_calls: { label: "In Calls", color: activityPalette.inbound_calls },
                  }}
                  className="h-full w-full aspect-square"
                >
                  <PieChart>
                    <ChartTooltip cursor={false} content={<CustomTooltip />} />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      // Filled pie (no donut hole) per design request
                      innerRadius={0}
                      outerRadius={44}
                      strokeWidth={0}
                    >
                      {chartData.map((entry) => (
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
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {activityOptions.map((opt) => (
                    <div key={opt.key} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="h-2 w-2 rounded-[2px] shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                        <span className="text-[10px] text-white/70 truncate">{opt.label}</span>
                      </div>
                      <span className="text-[10px] font-mono tabular-nums text-white/90">
                        {(activityBreakdown[opt.key] ?? 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tile 4: Total Leads */}
      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-4 lg:p-5 h-[140px] lg:h-[170px] flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" stroke="url(#dashboard-icon-gradient)" />
            <h3 className="text-white text-sm font-medium">Total Leads</h3>
          </div>
          <div className="relative" ref={totalLeadsPeriodDropdownRef}>
            <button
              onClick={() =>
                setShowTotalLeadsPeriodDropdown(!showTotalLeadsPeriodDropdown)
              }
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
            >
              <span className="text-[9px] text-white/80 whitespace-nowrap">
                {totalLeadsPeriodOptions.find((opt) => opt.value === totalLeadsPeriod)
                  ?.label || "All time"}
              </span>
              <ChevronDown
                className={`w-2.5 h-2.5 text-white/60 transition-transform ${showTotalLeadsPeriodDropdown ? "rotate-180" : ""
                  }`}
              />
            </button>
            {showTotalLeadsPeriodDropdown && (
              <div className="absolute top-full right-0 mt-1 rounded-lg bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/20 shadow-xl z-50 max-h-40 overflow-y-auto scrollbar-hide min-w-[100px]">
                {totalLeadsPeriodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTotalLeadsPeriod(option.value);
                      setShowTotalLeadsPeriodDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[10px] transition-colors ${totalLeadsPeriod === option.value
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/5"
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 flex items-center ">
          {totalLeadsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white/70" />
          ) : (
            <p className="text-4xl font-semibold text-white">
              {totalLeads?.toLocaleString() || 0}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadsScoreDistributionCard;
