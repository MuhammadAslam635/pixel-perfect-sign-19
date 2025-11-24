import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, BarChart3 } from "lucide-react";

export default function TopLeadsCard() {
  const leads = [
    { name: "Sarah Malik", score: 92 },
    { name: "John Doe", score: 85 },
    { name: "Emily Chen", score: 78 },
  ];

  return (
    <Card className="solid-card p-3 lg:p-5">
      <div className="flex items-center justify-between mb-2 lg:mb-4">
        <div className="flex items-center gap-1.5 lg:gap-2">
          <Target className="w-3 h-3 lg:w-4 lg:h-4 text-foreground/50" />
          <h3 className="font-medium text-[10px] lg:text-sm glass-card-header leading-tight">
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
        {leads.map((lead) => (
          <div
            key={lead.name}
            className="p-2 pl-2.5 lg:p-3 lg:pl-4 leads-row transition-smooth"
          >
            <div className="flex flex-col">
              <span className="text-[10px] lg:text-sm font-normal text-foreground leading-tight">
                {lead.name}
              </span>
              <div className="mt-0.5 lg:mt-1 flex items-center gap-1.5 lg:gap-2">
                <BarChart3 className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white/70" />
                <span className="text-[9px] lg:text-xs text-white/70">
                  Score: {lead.score}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
