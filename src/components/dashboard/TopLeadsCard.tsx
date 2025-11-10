import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, ArrowRight, BarChart3 } from 'lucide-react';

export default function TopLeadsCard() {
  const leads = [
    { name: 'Sarah Malik', score: 92 },
    { name: 'John Doe', score: 85 },
    { name: 'Emily Chen', score: 78 },
  ];

  return (
    <Card className="solid-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-foreground/50" />
          <h3 className="font-medium text-sm glass-card-header">Top Leads</h3>
        </div>
        <Button variant="link" className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80">
          View All <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      <div className="space-y-2 card-scroll scrollbar-hide">
        {leads.map((lead) => (
          <div key={lead.name} className="p-3 pl-4 leads-row transition-smooth">
            <div className="flex flex-col">
              <span className="text-sm font-normal text-foreground">{lead.name}</span>
              <div className="mt-1 flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-white/70" />
                <span className="text-xs text-white/70">Score: {lead.score}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

