import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export default function ProposalsCard() {
  return (
    <Card className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm glass-card-header">Proposals To Send</h3>
        <Button variant="link" className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80">
          View All <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="p-3 glass-item transition-smooth">
          <p className="text-sm font-normal text-foreground mb-1">Send Proposal to ABC Corp</p>
          <p className="text-xs text-muted-foreground/60 mb-2">Website Redesign</p>
          <Badge className="bg-success/20 text-success hover:bg-success/30 text-xs border-0 font-normal">Sent ✓</Badge>
        </div>

        <div className="p-3 glass-item transition-smooth">
          <p className="text-sm font-normal text-foreground mb-1">Prepare Deck for Delta Group</p>
          <p className="text-xs text-muted-foreground/60 mb-2">Branding Presentation</p>
          <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30 text-xs border-0 font-normal">Pending</Badge>
        </div>
      </div>
    </Card>
  );
}