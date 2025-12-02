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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
      {stats.map((stat) => (
        <div key={stat.title} className="relative flex-1 w-full">
          {/* Gradient glow behind card */}
          <div className="absolute -inset-3 lg:-inset-5 bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-transparent blur-2xl opacity-50" />
          <Card
            className="relative border-[#FFFFFF33] shadow-xl w-full"
            style={{
              borderRadius: "22px",
              opacity: 1,
              borderWidth: "1px",
              background:
                "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0)_38.08%, rgba(255, 255, 255, 0)_56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
          >
            <CardContent className="p-3 sm:p-4 lg:p-5 h-full flex flex-col justify-between min-h-[120px] gap-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] sm:text-xs text-gray-300 font-medium tracking-tight">
                  {stat.title}
                </p>
                <Button
                  variant="link"
                  className="h-auto p-0 text-[11px] text-gray-400 hover:text-white transition-colors underline-offset-4 hover:underline"
                >
                  <span className="hidden sm:inline">{stat.link}</span>
                  <ArrowRight className="w-3 h-3 sm:ml-1" />
                </Button>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0">
                  <stat.icon className="w-full h-full text-white" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">
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
