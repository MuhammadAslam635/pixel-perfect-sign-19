import { useEffect, useState, useRef } from "react";
import { FileText, Send, Clock, ChevronDown, Loader2 } from "lucide-react";
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const periodOptions = [
    { value: "30d" as Period, label: "Last 30 days" },
    { value: "90d" as Period, label: "Last 90 days" },
    { value: "all" as Period, label: "All time" },
  ];

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-4 lg:p-5 flex flex-col transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01]">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText className="w-4 h-4 shrink-0" stroke="url(#dashboard-icon-gradient)" />
          <h3 className="text-white text-sm font-medium whitespace-nowrap truncate">Proposal Throughput</h3>
        </div>

        {/* Period Selector Dropdown */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
          >
            <span className="text-[9px] text-white/80 whitespace-nowrap">
              {periodOptions.find((opt) => opt.value === period)?.label || "Last 30 days"}
            </span>
            <ChevronDown
              className={`w-2.5 h-2.5 text-white/60 transition-transform ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          </button>
          {showDropdown && (
            <div className="absolute top-full right-0 mt-1 rounded-lg bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/20 shadow-xl z-50 max-h-40 overflow-y-auto scrollbar-hide min-w-[100px]">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setPeriod(option.value);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[10px] transition-colors ${
                    period === option.value
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

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-4 h-4 animate-spin text-white/70" />
        </div>
      ) : error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : data ? (
        <div className="grid grid-cols-2 gap-1.5 flex-1">
          {/* RFPs Received */}
          <div className="flex items-center justify-between gap-0 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <span className="text-[9px] text-white/60">RFPs</span>
            <span className="text-base sm:text-lg font-medium text-white">
              {data.rfpsReceived.toLocaleString()}
            </span>
          </div>

          {/* Proposals Submitted */}
          <div className="flex items-center justify-between gap-0 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <span className="text-[9px] text-white/60">Sent</span>
            <span className="text-base sm:text-lg font-medium text-white">
              {data.proposalsSubmitted.toLocaleString()}
            </span>
          </div>

          {/* Avg Cycle Time */}
          <div className="flex items-center justify-between gap-0 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 col-span-2">
            <span className="text-[9px] text-white/60">Avg Cycle Time</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-medium text-white">
                {data.avgCycleTimeDays > 0
                  ? data.avgCycleTimeDays.toFixed(1)
                  : "—"}
              </span>
              {data.avgCycleTimeDays > 0 && (
                <span className="text-[9px] text-white/60">days</span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
