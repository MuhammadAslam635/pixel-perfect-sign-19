import { useMemo, useState, useRef, useEffect, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFollowupPlans, useFollowupPlanSchedule, useDeleteFollowupPlan } from "@/hooks/useFollowupPlans";
import { FollowupPlan } from "@/services/followupPlans.service";
import FollowupPlanSchedule from "@/components/dashboard/FollowupPlanSchedule";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatTimeWithAMPM, getErrorMessage, getStatusBadgeStyle } from "@/utils/commonFunctions";
import CommunicationIcons from "./CommunicationIcons";
import Timeline from "./Timeline";

// Transform API plan data to component format
const transformPlanData = (plan: FollowupPlan) => {
  const templateSource = (plan as any).templateSnapshot && typeof (plan as any).templateSnapshot === "object" ? (plan as any).templateSnapshot : typeof plan.templateId === "object" ? plan.templateId : null;

  const planName = templateSource?.title ?? "Follow up campaign";
  const startDate = new Date(plan.startDate);
  const day = startDate.getDate().toString().padStart(2, "0");
  const month = startDate.toLocaleDateString("en-GB", { month: "short" });
  const year = startDate.getFullYear();
  const formattedDate = `${day} - ${month} - ${year}`;
  const timezone = (plan.metadata?.timezone as string) || "UTC";
  let timeOfDayToRun = "09:00";
  if (plan.todo && plan.todo.length > 0 && plan.todo[0].scheduledFor) {
    try {
      const scheduledDate = new Date(plan.todo[0].scheduledFor);
      timeOfDayToRun = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: timezone, hour12: false }).format(scheduledDate);
    } catch (e) {
      console.warn("Error parsing scheduled time:", e);
      timeOfDayToRun = typeof plan.templateId === "object" && plan.templateId?.timeOfDayToRun ? plan.templateId.timeOfDayToRun : "09:00";
    }
  } else {
    timeOfDayToRun = typeof plan.templateId === "object" && plan.templateId?.timeOfDayToRun ? plan.templateId.timeOfDayToRun : "09:00";
  }

  const maxDay = Math.max(...plan.todo.map((task) => task.day || 0), 1);
  const totalDays = (templateSource && templateSource.numberOfDaysToRun ? parseInt(templateSource.numberOfDaysToRun as any) : null) || maxDay || 7;
  const today = new Date();
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentDay = Math.min(daysSinceStart + 1, totalDays);
  const completedTasksUpToCurrentDay = plan.todo.filter((task) => task.day && task.day <= currentDay && task.isComplete);
  const cumulativeCounts = {
    email: completedTasksUpToCurrentDay.filter((task) => task.type === "email").length,
    sms: 0,
    whatsapp: completedTasksUpToCurrentDay.filter((task) => task.type === "whatsapp_message").length,
    call: completedTasksUpToCurrentDay.filter((task) => task.type === "call").length,
  };

  let statusLabel: "Scheduled" | "In Progress" | "Completed";
  if (plan.status === "scheduled") statusLabel = "Scheduled";
  else if (plan.status === "in_progress") statusLabel = "In Progress";
  else if (plan.status === "completed") statusLabel = "Completed";
  else statusLabel = "Scheduled";

  return {
    id: plan._id,
    name: planName,
    date: formattedDate,
    timeOfDayToRun,
    timezone,
    status: statusLabel,
    progress: Math.max(1, currentDay),
    totalDays,
    cumulativeCounts,
    originalPlan: plan,
  };
};

const ActiveFollowUpPlans = () => {
  const [selectedPlanForSchedule, setSelectedPlanForSchedule] =
    useState<FollowupPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<FollowupPlan | null>(null);
  const { toast } = useToast();

  // Fetch followup plans from API
  const { data: plansData, isLoading, isError, refetch: refetchPlans } = useFollowupPlans({ limit: 100 });

  useEffect(() => {
    console.debug("[ActiveFollowUpPlans] plansData changed", { plansData });
  }, [plansData]);

  // Fetch schedule data for selected plan
  const { data: planScheduleData, isLoading: isPlanScheduleLoading } = useFollowupPlanSchedule(selectedPlanForSchedule?._id || "");
  const { mutate: deleteFollowupPlan, isPending: isDeletingPlan } = useDeleteFollowupPlan();

  // Transform API data
  const activePlans = useMemo(() => {
    const plansResponse = plansData as | { data?: { docs?: FollowupPlan[] } } | undefined;
    if (!plansResponse?.data?.docs) return [];
    // Filter for active plans (scheduled or in_progress)
    const activePlansList = plansResponse.data.docs.filter((plan: FollowupPlan) => plan.status === "scheduled" || plan.status === "in_progress");
    return activePlansList.map(transformPlanData);
  }, [plansData]);

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <span className="text-white/60">Loading followup plans...</span>
    </div>
  );

  if (isError) return (
    <div className="flex items-center justify-center py-12">
      <span className="text-red-400">Error loading followup plans</span>
    </div>
  );

  if (activePlans.length === 0) return (
    <div className="flex items-center justify-center py-12">
      <span className="text-white/60">No active followup plans</span>
    </div>
  );

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
        toast({ title: "Followup plan deleted", description: response?.message || "Followup plan has been deleted successfully.", });
        setPlanToDelete(null);
        refetchPlans();
      },
      onError: (mutationError) => {
        toast({ title: "Unable to delete followup plan", description: getErrorMessage(mutationError, "Please try again."), variant: "destructive", });
      },
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activePlans.map((plan) => (
          <Card key={plan.id} onClick={() => handleViewPlanSchedule(plan.originalPlan)} className="group bg-white/5 border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-white/5 rounded-3xl cursor-pointer">
            <CardContent className="p-4 space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-white font-medium text-sm">{plan.name}</h4>
                <div className="flex items-center gap-2">
                  <Badge className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-all duration-300 ${getStatusBadgeStyle(plan.status)}`}>{plan.status}</Badge>
                  <button onClick={(e) => { e.stopPropagation(); setPlanToDelete(plan.originalPlan); }} className="text-red-500 hover:text-red-600 transition-colors h-7 w-7 flex items-center justify-center rounded-full hover:bg-white/10"><Trash className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Date Row with Communication Icons */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/70">{plan.date}</span>
                    <span className="text-white/50 text-[10px]">{formatTimeWithAMPM(plan.timeOfDayToRun)} ({plan.timezone})</span>
                  </div>
                </div>

                {/* Communication Icons and Counts - Far Right */}
                <CommunicationIcons cumulativeCounts={plan.cumulativeCounts} />
              </div>

              {/* 7-Day Timeline */}
              <Timeline progress={plan.progress} totalDays={plan.totalDays} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule View Modal */}
      <Dialog open={!!selectedPlanForSchedule} onOpenChange={(open) => !open && handleCloseScheduleView()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-hide">
          <DialogHeader>
            <DialogTitle>Follow-up Plan Schedule</DialogTitle>
          </DialogHeader>
          {selectedPlanForSchedule && planScheduleData?.data && (
            <FollowupPlanSchedule plan={planScheduleData.data} onClose={handleCloseScheduleView} isLoading={isPlanScheduleLoading} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!planToDelete} title="Delete Follow-up Plan" description="Are you sure you want to delete this follow-up plan? This action cannot be undone." confirmText="Delete" cancelText="Cancel" confirmVariant="destructive" isPending={isDeletingPlan} onConfirm={handleDeletePlan} onCancel={() => setPlanToDelete(null)} />
    </>
  );
};

ActiveFollowUpPlans.displayName = "ActiveFollowUpPlans";

export default memo(ActiveFollowUpPlans);