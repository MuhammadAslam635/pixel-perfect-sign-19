import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckSquare, ArrowRight, Loader2, Mail, Phone, MessageCircle } from "lucide-react";
import { dashboardService, FollowupTask } from "@/services/dashboard.service";

const getTaskIcon = (type: string) => {
  switch (type) {
    case 'email':
      return <Mail className="w-3 h-3 lg:w-4 lg:h-4" />;
    case 'call':
      return <Phone className="w-3 h-3 lg:w-4 lg:h-4" />;
    case 'whatsapp_message':
      return <MessageCircle className="w-3 h-3 lg:w-4 lg:h-4" />;
    default:
      return <CheckSquare className="w-3 h-3 lg:w-4 lg:h-4" />;
  }
};

export default function FollowupTasksCard() {
  const [tasks, setTasks] = useState<FollowupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFollowupTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardService.getRecentFollowupTasks();
        setTasks(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load followup tasks");
        console.error("Error fetching followup tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowupTasks();
  }, []);

  const formatTime = (dateString: string) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24 && diffInHours > 0) {
      return `Due in ${diffInHours}h`;
    } else if (diffInHours <= 0) {
      return "Overdue";
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  return (
    <Card className="solid-card p-3 lg:p-5 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.02]">
      <div className="flex items-center justify-between mb-2 lg:mb-4">
        <div className="flex items-center gap-1.5 lg:gap-2">
          <CheckSquare className="w-3 h-3 lg:w-4 lg:h-4 text-foreground/50" />
          <h3 className="font-medium text-[10px] lg:text-sm glass-card-header leading-tight">
            Followup Tasks
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
            <span className="text-[10px] lg:text-xs text-muted-foreground">{error}</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-3 text-center">
            <span className="text-[10px] lg:text-xs text-muted-foreground">No pending tasks</span>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="p-2 pl-2.5 lg:p-3 lg:pl-4 leads-row transition-smooth"
            >
              <div className="flex items-start gap-2 lg:gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getTaskIcon(task.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] lg:text-sm font-normal text-foreground leading-tight">
                      {task.leadName}
                    </span>
                    <Avatar className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0">
                      <AvatarFallback className="bg-primary/20 text-primary text-[8px] lg:text-[10px]">
                        {task.leadName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] lg:text-xs text-muted-foreground/70 capitalize">
                      {task.type.replace('_', ' ')}
                    </span>
                    <span className={`text-[8px] lg:text-[10px] ${
                      task.scheduledFor && new Date(task.scheduledFor) < new Date()
                        ? 'text-red-400'
                        : 'text-muted-foreground/60'
                    }`}>
                      {formatTime(task.scheduledFor)}
                    </span>
                  </div>
                  {task.notes && (
                    <p className="text-[9px] lg:text-xs text-muted-foreground/60 mt-1 truncate">
                      {task.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
