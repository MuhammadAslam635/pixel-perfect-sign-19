import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MoreVertical,
  Mail,
  Phone,
  MessageSquare,
  MessageCircle,
} from "lucide-react";
import { useFollowupPlans } from "@/hooks/useFollowupPlans";
import { FollowupPlan } from "@/services/followupPlans.service";

// Transform API plan data to component format
const transformPlanData = (plan: FollowupPlan) => {
  // Get plan name from template
  const planName =
    typeof plan.templateId === "object" && plan.templateId?.title
      ? plan.templateId.title
      : "Follow up campaign";

  // Format date as "03 - Dec - 2025"
  const startDate = new Date(plan.startDate);
  const day = startDate.getDate().toString().padStart(2, "0");
  const month = startDate.toLocaleDateString("en-GB", { month: "short" });
  const year = startDate.getFullYear();
  const formattedDate = `${day} - ${month} - ${year}`;

  // Calculate total days from todo items or template
  const maxDay = Math.max(
    ...plan.todo.map((task) => task.day || 0),
    1
  );
  const totalDays =
    (typeof plan.templateId === "object" &&
      plan.templateId?.numberOfDaysToRun
      ? parseInt(plan.templateId.numberOfDaysToRun)
      : null) || maxDay || 7;

  // Calculate current progress day based on completed tasks
  const today = new Date();
  const daysSinceStart = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const currentDay = Math.min(daysSinceStart + 1, totalDays);

  // Calculate completed tasks up to current day
  const completedTasksUpToCurrentDay = plan.todo.filter(
    (task) => task.day && task.day <= currentDay && task.isComplete
  );

  // Calculate cumulative counts by type
  const cumulativeCounts = {
    email: completedTasksUpToCurrentDay.filter(
      (task) => task.type === "email"
    ).length,
    sms: 0, // SMS is not in the todo types, using whatsapp_message instead
    whatsapp: completedTasksUpToCurrentDay.filter(
      (task) => task.type === "whatsapp_message"
    ).length,
    call: completedTasksUpToCurrentDay.filter(
      (task) => task.type === "call"
    ).length,
  };

  // Map status
  let statusLabel: "Scheduled" | "In Progress" | "Completed";
  if (plan.status === "scheduled") {
    statusLabel = "Scheduled";
  } else if (plan.status === "in_progress") {
    statusLabel = "In Progress";
  } else if (plan.status === "completed") {
    statusLabel = "Completed";
  } else {
    statusLabel = "Scheduled";
  }

  return {
    id: plan._id,
    name: planName,
    date: formattedDate,
    status: statusLabel,
    progress: Math.max(1, currentDay),
    totalDays,
    cumulativeCounts,
  };
};

const ActiveFollowUpPlans = () => {
  // Fetch followup plans from API
  const { data: plansData, isLoading, isError } = useFollowupPlans({
    limit: 100, // Get all active plans
  });

  // Transform API data
  const activePlans = useMemo(() => {
    const plansResponse = plansData as { data?: { docs?: FollowupPlan[] } } | undefined;
    if (!plansResponse?.data?.docs) return [];
    
    // Filter for active plans (scheduled or in_progress)
    const activePlansList = plansResponse.data.docs.filter(
      (plan: FollowupPlan) =>
        plan.status === "scheduled" || plan.status === "in_progress"
    );
    
    return activePlansList.map(transformPlanData);
  }, [plansData]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-green-500/20 text-green-400 border-green-500/40";
      case "In Progress":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "Completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      default:
        return "bg-white/10 text-white/60 border-white/20";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-white/60">Loading followup plans...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-red-400">Error loading followup plans</span>
      </div>
    );
  }

  if (activePlans.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-white/60">No active followup plans</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activePlans.map((plan) => (
        <Card
          key={plan.id}
          className="bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-white/5 rounded-3xl"
        >
          <CardContent className="p-4 space-y-4">
            {/* Card Header */}
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-white font-medium text-sm">
                {plan.name}
              </h4>
              
              <div className="flex items-center gap-2">
                <Badge
                  className={`rounded-full px-2.5 py-1 text-xs font-medium border ${getStatusBadgeStyle(
                    plan.status
                  )}`}
                >
                  {plan.status}
                </Badge>
                <button className="text-white/40 hover:text-white/60 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Date Row with Communication Icons */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span className="text-white/70">{plan.date}</span>
              </div>
              
              {/* Communication Icons and Counts - Far Right */}
              <div className="flex items-center gap-3">
                {/* Email */}
                {plan.cumulativeCounts.email > 0 && (
                  <div className="flex flex-col items-center gap-0.5" title={`${plan.cumulativeCounts.email} Emails`}>
                    <Mail className="w-3.5 h-3.5 text-cyan-300/80" />
                    <span className="text-xs text-cyan-300/70 font-medium">
                      {plan.cumulativeCounts.email}
                    </span>
                  </div>
                )}
                
                {/* SMS */}
                {plan.cumulativeCounts.sms > 0 && (
                  <div className="flex flex-col items-center gap-0.5" title={`${plan.cumulativeCounts.sms} SMS`}>
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-300/80" />
                    <span className="text-xs text-cyan-300/70 font-medium">
                      {plan.cumulativeCounts.sms}
                    </span>
                  </div>
                )}
                
                {/* WhatsApp */}
                {plan.cumulativeCounts.whatsapp > 0 && (
                  <div className="flex flex-col items-center gap-0.5" title={`${plan.cumulativeCounts.whatsapp} WhatsApp`}>
                    <MessageCircle className="w-3.5 h-3.5 text-cyan-300/80" />
                    <span className="text-xs text-cyan-300/70 font-medium">
                      {plan.cumulativeCounts.whatsapp}
                    </span>
                  </div>
                )}
                
                {/* Call */}
                {plan.cumulativeCounts.call > 0 && (
                  <div className="flex flex-col items-center gap-0.5" title={`${plan.cumulativeCounts.call} Calls`}>
                    <Phone className="w-3.5 h-3.5 text-cyan-300/80" />
                    <span className="text-xs text-cyan-300/70 font-medium">
                      {plan.cumulativeCounts.call}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 7-Day Timeline */}
            <div className="relative py-12">
              {/* Status Bar */}
              <div className="w-full h-2 bg-white/10 rounded-full" />
              
              {/* Circular Markers */}
              {Array.from({ length: plan.totalDays }, (_, dayIndex) => {
                const dayNumber = dayIndex + 1;
                const isCompleted = dayNumber <= plan.progress;
                const isFuture = dayNumber > plan.progress;
                
                // Calculate position (evenly spaced)
                const positionPercent = (dayIndex / (plan.totalDays - 1)) * 100;
                
                return (
                  <div
                    key={dayNumber}
                    className="absolute group z-10 flex flex-col items-center"
                    style={{
                      left: `${positionPercent}%`,
                      top: '52px', // top-12 (48px) + half of h-2 (4px) = 52px (center of status bar)
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {/* Circular Marker */}
                    <div
                      className={`w-4 h-4 rounded-full transition-all -mt-2 ${
                        isCompleted
                          ? "bg-cyan-400 border-2 border-cyan-400"
                          : "bg-white border-2 border-white/20"
                      }`}
                    />
                    
                    {/* Day Label */}
                    <span className={`text-[10px] mt-2 whitespace-nowrap ${
                      isCompleted ? "text-cyan-300" : "text-white/40"
                    }`}>
                      Day {dayNumber}
                    </span>
                    
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      <div className="bg-white/90 text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                        {plan.progress}/{plan.totalDays.toString().padStart(2, "0")}
                      </div>
                      {/* Tooltip Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/90" />
                    </div>
                  </div>
                );
              })}
              
              {/* Progress Bar - Snaps to last completed circle */}
              {plan.progress > 0 && (
                <div
                  className="absolute top-12 left-0 h-2 bg-cyan-400/50 rounded-full transition-all"
                  style={{
                    width: `${((plan.progress - 1) / (plan.totalDays - 1)) * 100}%`,
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ActiveFollowUpPlans;



