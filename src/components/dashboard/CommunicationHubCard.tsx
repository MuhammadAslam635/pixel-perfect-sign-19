import { useEffect, useState } from "react";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Target, Loader2, Mail, Phone, MessageSquare, PhoneCall } from 'lucide-react';
import { dashboardService, CommunicationEvent } from "@/services/dashboard.service";

export default function CommunicationHubCard() {
  const [communications, setCommunications] = useState<CommunicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardService.getRecentCommunications();
        setCommunications(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load communications");
        console.error("Error fetching communications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunications();
  }, []);
  return (
    <Card id="comm-hub-card" className="solid-card p-3 lg:p-5">
      <div className="flex items-center justify-between mb-2 lg:mb-4">
        <div className="flex items-center gap-1.5 lg:gap-2">
          <Target className="w-3 h-3 lg:w-4 lg:h-4 text-foreground/50" />
          <h3 className="font-medium text-[10px] lg:text-sm glass-card-header leading-tight">Communication Hub</h3>
        </div>
        <Button size="icon" variant="ghost" className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-[#4A4A4A]/30 hover:bg-[#5A5A5A]/40">
          <Bell className="w-3 h-3 lg:w-4 lg:h-4 text-foreground/60" />
        </Button>
      </div>

      <div className="space-y-1 mb-2 lg:mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] lg:text-xs text-muted-foreground/70">Recents</span>
          <Button variant="link" className="h-auto p-0 text-[9px] lg:text-xs text-foreground/60 hover:text-foreground/80">View All</Button>
        </div>
      </div>

      <div className="space-y-1.5 lg:space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-3 text-center">
            <span className="text-[10px] lg:text-xs text-muted-foreground">{error}</span>
          </div>
        ) : communications.length === 0 ? (
          <div className="p-3 text-center">
            <span className="text-[10px] lg:text-xs text-muted-foreground">No recent communications</span>
          </div>
        ) : (
          communications.slice(0, 2).map((comm) => {
            const getIcon = () => {
              switch (comm.type) {
                case 'email':
                  return <Mail className="w-3 h-3 lg:w-4 lg:h-4" />;
                case 'call':
                  return <PhoneCall className="w-3 h-3 lg:w-4 lg:h-4" />;
                case 'sms':
                  return <MessageSquare className="w-3 h-3 lg:w-4 lg:h-4" />;
                case 'whatsapp':
                  return <MessageSquare className="w-3 h-3 lg:w-4 lg:h-4" />;
                default:
                  return <MessageSquare className="w-3 h-3 lg:w-4 lg:h-4" />;
              }
            };

            const getTitle = () => {
              const direction = comm.direction === 'inbound' ? 'from' : 'to';
              switch (comm.type) {
                case 'email':
                  return `${comm.direction === 'inbound' ? 'Email from' : 'Email to'} ${comm.leadName}`;
                case 'call':
                  return `${comm.direction === 'inbound' ? 'Call from' : 'Call to'} ${comm.leadName}`;
                case 'sms':
                  return `${comm.direction === 'inbound' ? 'SMS from' : 'SMS to'} ${comm.leadName}`;
                case 'whatsapp':
                  return `${comm.direction === 'inbound' ? 'WhatsApp from' : 'WhatsApp to'} ${comm.leadName}`;
                default:
                  return `Communication with ${comm.leadName}`;
              }
            };

            const getSubtitle = () => {
              const date = new Date(comm.createdAt);
              const now = new Date();
              const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

              let timeString;
              if (diffInMinutes < 60) {
                timeString = `${diffInMinutes}m ago`;
              } else if (diffInMinutes < 1440) { // 24 hours
                timeString = `${Math.floor(diffInMinutes / 60)}h ago`;
              } else {
                timeString = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                });
              }

              if (comm.type === 'call' && comm.duration) {
                const duration = Math.floor(comm.duration / 60);
                return `${duration}m ${comm.duration % 60}s • ${timeString}`;
              }

              return timeString;
            };

            return (
              <div key={comm.id} className="flex items-center gap-2 lg:gap-3 p-2 lg:p-3 teal-row transition-smooth">
                <div className="flex-shrink-0 text-muted-foreground/60">
                  {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] lg:text-sm font-normal text-foreground truncate leading-tight">
                    {getTitle()}
                  </p>
                  <p className="text-[9px] lg:text-xs text-muted-foreground/60">
                    {getSubtitle()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

