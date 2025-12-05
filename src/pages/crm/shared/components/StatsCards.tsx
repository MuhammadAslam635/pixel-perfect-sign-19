import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  Users,
  Send,
  MessageSquare,
  UserCheck,
  MessageCircle,
} from "lucide-react";

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
            <CardContent className="p-2 sm:p-3 lg:p-4 h-full flex flex-col justify-center min-h-[80px] sm:min-h-[85px] gap-1.5">
              {/* First row: Icon and Title (left-aligned) */}
              <div className="flex items-center gap-2 justify-start">
                <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0">
                  <stat.icon className="w-full h-full text-[#66AFB7]" />
                </div>
                <p className="text-xs sm:text-sm text-gray-300 font-medium tracking-tight leading-tight">
                  {stat.title}
                </p>
              </div>

              {/* Second row: Value (centered) */}
              <div className="flex items-center justify-center">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-none">
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
