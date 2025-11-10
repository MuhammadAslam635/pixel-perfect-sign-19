import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

export default function CampaignStatsCard() {
  return (
    <Card className="stats-card p-0 rounded-[36px] min-h-[284px] relative overflow-hidden">
      <div className="stats-overlay" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch relative">
        {/* Left section: label at top-left, number centered */}
        <div className="relative p-0 min-h-[220px] md:min-h-[284px]">
          <div className="absolute left-4 top-4 md:left-6 md:top-6 flex items-center gap-2">
            <p className="text-xs text-muted-foreground/70">Total Campaigns</p>
            <Badge variant="secondary" className="bg-[#4A4A4A]/40 text-foreground/80 border-0 text-xs px-2 py-0.5">
              <TrendingUp className="w-3 h-3 mr-1" />
              +3.4%
            </Badge>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground">220,342.76</h2>
          </div>
        </div>

        {/* Right section: graph */}
        <div className="relative min-h-[220px] md:min-h-[284px] h-full overflow-hidden stats-chart p-0">
          <div className="chart-line" />
          <div className="chart-dot" />
          <div className="chart-tooltip text-center">
            <div className="text-[11px] text-muted-foreground/80">Campaigns</div>
            <div className="text-[12px] font-medium">200</div>
          </div>
          <svg viewBox="0 0 400 160" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <path
              d="M0,120 L30,90 L60,110 L90,70 L120,100 L150,60 L180,90 L210,50 L240,80 L270,40 L300,70 L330,35 L360,65 L400,50"
              fill="none"
              stroke="hsl(183 50% 60%)"
              strokeWidth="4"
              style={{ filter: 'drop-shadow(0 4px 8px hsl(183 50% 60% / 0.35))' }}
            />
          </svg>
        </div>
      </div>
    </Card>
  );
}