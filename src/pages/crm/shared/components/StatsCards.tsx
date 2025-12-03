import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface StatCard {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
}

interface StatsCardsProps {
  stats: StatCard[];
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
      {stats.map((stat) => (
        <div key={stat.title} className="relative flex-1 w-full">
          {/* Gradient glow behind card */}
          <div className="absolute -inset-3 lg:-inset-5 bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-transparent blur-2xl opacity-50" />
          <Card
            className="relative rounded-3xl border bg-card text-card-foreground border-[#FFFFFF33] shadow-xl w-full"
            style={{
              borderWidth: "1px",
              background:
                "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
          >
            <CardContent className="p-2 sm:p-3 lg:p-4 h-full flex flex-col justify-between min-h-[80px] gap-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] sm:text-[11px] text-gray-300 font-medium tracking-tight">
                  {stat.title}
                </p>
                {/* View All link - Hidden */}
                {/* <Button
                  variant="link"
                  className="h-auto p-0 text-[10px] text-gray-400 hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  <span className="hidden sm:inline">{stat.link}</span>
                  <ArrowRight className="w-2.5 h-2.5 sm:ml-1" />
                </Button> */}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                  <stat.icon className="w-full h-full text-[#66AFB7]" />
                </div>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
};
