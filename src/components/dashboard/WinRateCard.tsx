import { useEffect, useState, useRef } from "react";
import { ChevronDown, Trophy, Loader2, Check } from "lucide-react";
import {
  dashboardService,
  WinRateData,
} from "@/services/dashboard.service";

type Period = "30d" | "90d" | "all";

/**
 * Win Rate Card
 * Shows percentage of closed deals with period selector
 */
export const WinRateCard = () => {
  const [data, setData] = useState<WinRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchData = async (selectedPeriod: Period) => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getWinRate({
        period: selectedPeriod,
      });
      setData(response.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load win rate");
      console.error("Error fetching win rate:", err);
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
    <div className={`relative rounded-[20px] border border-white/10 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-3 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.01] ${showDropdown ? "z-50" : "hover:z-50"}`}>
      <div className="flex items-center gap-3">
        {/* Left Icon */}
        <div>
          <Trophy className="w-10 h-10" stroke="url(#dashboard-icon-gradient)"/>
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-0.5">
            <h3 className="text-white text-sm font-medium truncate pr-2">Win Rate</h3>
            
            {/* Period Selector Dropdown */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
              >
                <span className="text-[9px] text-white/80">
                  {periodOptions.find((opt) => opt.value === period)?.label || "30d"}
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
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-white/70" />
            </div>
          ) : error ? (
            <p className="text-xs text-red-400">{error}</p>
          ) : data ? (
            <div className="flex flex-col">
              {/* Win Rate Percentage */}
              <div className="text-xl font-semibold text-white">
                {data.winRate.toFixed(1)}
                <span className="text-xs text-white/60 ml-1">%</span>
              </div>

              {/* Ratio */}
              <div className="flex items-baseline gap-1 text-[10px] text-white/50">
                <span>{data.closedLeads.toLocaleString()} closed</span>
                <span>/</span>
                <span>{data.totalLeads.toLocaleString()} total</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
