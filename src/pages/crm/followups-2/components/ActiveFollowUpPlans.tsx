import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MessageCircle,
  Trash,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useFollowupPlans,
  useFollowupPlanSchedule,
  useDeleteFollowupPlan,
} from "@/hooks/useFollowupPlans";
import { FollowupPlan } from "@/services/followupPlans.service";
import FollowupPlanSchedule from "@/components/dashboard/FollowupPlanSchedule";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { isAxiosError } from "axios";

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
  const maxDay = Math.max(...plan.todo.map((task) => task.day || 0), 1);
  const totalDays =
    (typeof plan.templateId === "object" && plan.templateId?.numberOfDaysToRun
      ? parseInt(plan.templateId.numberOfDaysToRun)
      : null) ||
    maxDay ||
    7;

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
    email: completedTasksUpToCurrentDay.filter((task) => task.type === "email")
      .length,
    sms: 0, // SMS is not in the todo types, using whatsapp_message instead
    whatsapp: completedTasksUpToCurrentDay.filter(
      (task) => task.type === "whatsapp_message"
    ).length,
    call: completedTasksUpToCurrentDay.filter((task) => task.type === "call")
      .length,
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
    originalPlan: plan, // Keep reference to original plan for modal
  };
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

const ActiveFollowUpPlans = () => {
  const [selectedPlanForSchedule, setSelectedPlanForSchedule] =
    useState<FollowupPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<FollowupPlan | null>(null);
  const { toast } = useToast();

  // Fetch followup plans from API
  const {
    data: plansData,
    isLoading,
    isError,
    refetch: refetchPlans,
  } = useFollowupPlans({
    limit: 100, // Get all active plans
  });

  // Fetch schedule data for selected plan
  const { data: planScheduleData, isLoading: isPlanScheduleLoading } =
    useFollowupPlanSchedule(selectedPlanForSchedule?._id || "");

  const { mutate: deleteFollowupPlan, isPending: isDeletingPlan } =
    useDeleteFollowupPlan();

  // Transform API data
  const activePlans = useMemo(() => {
    const plansResponse = plansData as
      | { data?: { docs?: FollowupPlan[] } }
      | undefined;
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
        return "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-transparent";
      case "In Progress":
        return "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-transparent";
      case "Completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-transparent";
      default:
        return "bg-white/10 text-white/60 border-white/20 hover:bg-transparent";
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

  const handleViewPlanSchedule = (plan: FollowupPlan) => {
    setSelectedPlanForSchedule(plan);
  };

  const handleCloseScheduleView = () => {
    setSelectedPlanForSchedule(null);
  };

  const handleDeletePlan = () => {
    if (!planToDelete) return;

    deleteFollowupPlan(planToDelete._id, {
      onSuccess: (response) => {
        toast({
          title: "Followup plan deleted",
          description:
            response?.message || "Followup plan has been deleted successfully.",
        });
        setPlanToDelete(null);
        refetchPlans();
      },
      onError: (mutationError) => {
        toast({
          title: "Unable to delete followup plan",
          description: getErrorMessage(mutationError, "Please try again."),
          variant: "destructive",
        });
      },
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activePlans.map((plan) => (
          <Card
            key={plan.id}
            onClick={() => handleViewPlanSchedule(plan.originalPlan)}
            className="group bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-white/5 rounded-3xl cursor-pointer"
          >
            <CardContent className="p-4 space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-white font-medium text-sm">{plan.name}</h4>

                <div className="flex items-center gap-2">
                  <Badge
                    className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-300 ${getStatusBadgeStyle(
                      plan.status
                    )}`}
                  >
                    {plan.status}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlanToDelete(plan.originalPlan);
                    }}
                    className="text-red-500 hover:text-red-600 transition-colors h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10"
                  >
                    <Trash className="w-4 h-4" />
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
                    <div
                      className="flex flex-col items-center gap-0.5"
                      title={`${plan.cumulativeCounts.email} Emails`}
                    >
                      <Mail className="w-3.5 h-3.5 text-cyan-300/80" />
                      <span className="text-xs text-cyan-300/70 font-medium">
                        {plan.cumulativeCounts.email}
                      </span>
                    </div>
                  )}

                  {/* SMS */}
                  {plan.cumulativeCounts.sms > 0 && (
                    <div
                      className="flex flex-col items-center gap-0.5"
                      title={`${plan.cumulativeCounts.sms} SMS`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-300/80" />
                      <span className="text-xs text-cyan-300/70 font-medium">
                        {plan.cumulativeCounts.sms}
                      </span>
                    </div>
                  )}

                  {/* WhatsApp */}
                  {plan.cumulativeCounts.whatsapp > 0 && (
                    <div
                      className="flex flex-col items-center gap-0.5"
                      title={`${plan.cumulativeCounts.whatsapp} WhatsApp`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-cyan-300/80" />
                      <span className="text-xs text-cyan-300/70 font-medium">
                        {plan.cumulativeCounts.whatsapp}
                      </span>
                    </div>
                  )}

                  {/* Call */}
                  {plan.cumulativeCounts.call > 0 && (
                    <div
                      className="flex flex-col items-center gap-0.5"
                      title={`${plan.cumulativeCounts.call} Calls`}
                    >
                      <Phone className="w-3.5 h-3.5 text-cyan-300/80" />
                      <span className="text-xs text-cyan-300/70 font-medium">
                        {plan.cumulativeCounts.call}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 7-Day Timeline */}
              <div className="relative py-12 px-4">
                {/* Status Bar */}
                <div className="w-full h-2 bg-white/10 rounded-full" />

                {/* Circular Markers */}
                {Array.from({ length: plan.totalDays }, (_, dayIndex) => {
                  const dayNumber = dayIndex + 1;
                  const isCompleted = dayNumber <= plan.progress;
                  const isFuture = dayNumber > plan.progress;

                  // Calculate position (evenly spaced within the padded area)
                  // First circle at 1rem, last circle at calc(100% - 1rem)
                  const positionRatio =
                    plan.totalDays > 1 ? dayIndex / (plan.totalDays - 1) : 0;

                  return (
                    <Tooltip key={dayNumber}>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute z-10 flex flex-col items-center cursor-pointer"
                          style={{
                            left: `calc(1rem + ${positionRatio * 100}% - ${
                              positionRatio * 2
                            }rem)`,
                            top: "52px", // top-12 (48px) + half of h-2 (4px) = 52px (center of status bar)
                            transform: "translateX(-50%)",
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
                          <span
                            className={`text-[10px] mt-2 whitespace-nowrap ${
                              isCompleted ? "text-cyan-300" : "text-white/40"
                            }`}
                          >
                            Day {dayNumber}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {plan.progress}/
                          {plan.totalDays.toString().padStart(2, "0")}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* Progress Bar - Snaps to last completed circle */}
                {plan.progress > 0 && (
                  <div
                    className="absolute top-12 left-4 h-2 bg-cyan-400/50 rounded-full transition-all"
                    style={{
                      width:
                        plan.totalDays > 1
                          ? `calc(${
                              ((plan.progress - 1) / (plan.totalDays - 1)) * 100
                            }% - ${
                              ((plan.progress - 1) / (plan.totalDays - 1)) * 2
                            }rem)`
                          : "0",
                    }}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule View Modal */}
      <Dialog
        open={!!selectedPlanForSchedule}
        onOpenChange={(open) => !open && handleCloseScheduleView()}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle>Follow-up Plan Schedule</DialogTitle>
          </DialogHeader>
          {selectedPlanForSchedule && planScheduleData?.data && (
            <FollowupPlanSchedule
              plan={planScheduleData.data}
              onClose={handleCloseScheduleView}
              isLoading={isPlanScheduleLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!planToDelete}
        title="Delete Follow-up Plan"
        description="Are you sure you want to delete this follow-up plan? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="destructive"
        isPending={isDeletingPlan}
        onConfirm={handleDeletePlan}
        onCancel={() => setPlanToDelete(null)}
      />
    </>
  );
};

export default ActiveFollowUpPlans;
