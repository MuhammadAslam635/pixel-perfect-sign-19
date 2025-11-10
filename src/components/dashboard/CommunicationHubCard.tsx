import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Target } from 'lucide-react';

export default function CommunicationHubCard() {
  return (
    <Card id="comm-hub-card" className="solid-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-foreground/50" />
          <h3 className="font-medium text-sm glass-card-header">Communication Hub</h3>
        </div>
        <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full bg-[#4A4A4A]/30 hover:bg-[#5A5A5A]/40">
          <Bell className="w-4 h-4 text-foreground/60" />
        </Button>
      </div>

      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground/70">Recents</span>
          <Button variant="link" className="h-auto p-0 text-xs text-foreground/60 hover:text-foreground/80">View All</Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 teal-row transition-smooth">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs" style={{
              background: 'linear-gradient(180deg, rgba(103,178,183,0.20) 0%, rgba(103,178,183,0.14) 100%)',
              color: '#67B2B7'
            }}>SJ</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-normal text-foreground truncate">Call with Sarah Johnson</p>
            <p className="text-xs text-muted-foreground/60">3m 45s</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 teal-row transition-smooth">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs" style={{
              background: 'linear-gradient(180deg, rgba(103,178,183,0.20) 0%, rgba(103,178,183,0.14) 100%)',
              color: '#67B2B7'
            }}>ME</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-normal text-foreground truncate">Email from Mark Evans</p>
            <p className="text-xs text-muted-foreground/60">9:12 AM</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

