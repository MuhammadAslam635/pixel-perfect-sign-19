import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, BarChart3, Loader2 } from "lucide-react";
import { dashboardService, TopLead } from "@/services/dashboard.service";

export default function TopLeadsCard() {
  const [leads, setLeads] = useState<TopLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopLeads = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardService.getTopLeads();
        setLeads(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load top leads");
        console.error("Error fetching top leads:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopLeads();
  }, []);

  return (
    <Card className="solid-card p-3 lg:p-5 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-2 lg:mb-4">
        <div className="flex items-center gap-1.5 lg:gap-2">
          <Target className="w-3 h-3 lg:w-4 lg:h-4" stroke="url(#dashboard-icon-gradient)" />
          <h3 className="text-white text-sm font-medium leading-tight">
            Top Leads
          </h3>
        </div>
        <Button
          variant="link"
          className="h-auto p-0 text-[9px] lg:text-xs text-foreground/60 hover:text-foreground/80"
        >
          View All{" "}
          <ArrowRight className="w-2.5 h-2.5 lg:w-3 lg:h-3 ml-0.5 lg:ml-1" />
        </Button>
      </div>

      <div className="space-y-2 mt-6 lg:space-y-2 card-scroll scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-3 text-center">
            <span className="text-[10px] lg:text-xs text-muted-foreground">
              {error}
            </span>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-3 text-center">
            <span className="text-[10px] lg:text-xs text-muted-foreground">
              No top leads found
            </span>
          </div>
        ) : (
          leads.map((lead) => (
            <div
              key={lead.id}
              className="p-2 pl-2.5 lg:p-3 lg:pl-4 leads-row transition-smooth"
            >
              <div className="flex flex-col">
                <span className="text-[10px] lg:text-sm font-normal text-foreground leading-tight">
                  {lead.name}
                </span>
                <div className="mt-0.5 lg:mt-1 flex items-center gap-1.5 lg:gap-2">
                  <BarChart3 className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white/70" />
                  <span className="text-[9px] lg:text-xs text-white/70">
                    Score: {lead.momentumScore}%{" "}
                    {lead.scoreType && `(${lead.scoreType})`}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
