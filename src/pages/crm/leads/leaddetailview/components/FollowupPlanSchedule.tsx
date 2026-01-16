import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MessageCircle,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import {
  FollowupPlanWithSchedule,
  FollowupPlanScheduleDay,
} from "@/services/followupPlans.service";

type FollowupPlanScheduleProps = {
  plan: FollowupPlanWithSchedule;
  onClose: () => void;
  isLoading?: boolean;
};

const getTaskIcon = (type: string) => {
  switch (type) {
    case "email":
      return <Mail className="w-4 h-4" />;
    case "call":
      return <Phone className="w-4 h-4" />;
    case "whatsapp_message":
      return <MessageCircle className="w-4 h-4" />;
    default:
      return <MessageCircle className="w-4 h-4" />;
  }
};

const getTaskColor = (type: string) => {
  switch (type) {
    case "email":
      return "bg-blue-500/10 text-blue-300 border-blue-400/30";
    case "call":
      return "bg-green-500/10 text-green-300 border-green-400/30";
    case "whatsapp_message":
      return "bg-purple-500/10 text-purple-300 border-purple-400/30";
    default:
      return "bg-gray-500/10 text-gray-300 border-gray-400/30";
  }
};

const FollowupPlanSchedule: FC<FollowupPlanScheduleProps> = ({
  plan,
  onClose,
  isLoading = false,
}) => {
  const schedule = plan.schedule;

  const formatScheduledTime = (scheduledFor?: string) => {
    if (!scheduledFor) return "Not scheduled";

    const date = new Date(scheduledFor);
    if (Number.isNaN(date.getTime())) return "Invalid date";

    const now = new Date();
    const isPast = date < now;

    if (isPast) {
      return `Completed ${formatDistanceToNow(date, { addSuffix: true })}`;
    } else {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  };

  const getDayStatus = (day: FollowupPlanScheduleDay) => {
    const completedTasks = day.tasks.filter(task => task.isComplete).length;
    const totalTasks = day.tasks.length;

    if (totalTasks === 0) return null;

    if (completedTasks === totalTasks) {
      return { status: "completed", label: "All done" };
    } else if (completedTasks > 0) {
      return { status: "in_progress", label: `${completedTasks}/${totalTasks} done` };
    } else {
      return { status: "pending", label: "Pending" };
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading schedule...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Follow-up Plan Schedule
            </CardTitle>
            <p className="text-sm text-white/60 mt-1">
              {plan.templateSnapshot?.title || (plan.templateId && typeof plan.templateId === "object"
                ? plan.templateId.title
                : "Follow-up Plan")}{" "}
              • Started {formatDistanceToNow(new Date(plan.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Plan Overview */}
        <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Plan Overview</h3>
            <Badge
              className={`${plan.status === "completed"
                ? "bg-green-500/15 text-green-300 border border-green-400/30"
                : plan.status === "in_progress"
                  ? "bg-blue-500/15 text-blue-200 border border-blue-400/30"
                  : plan.status === "failed"
                    ? "bg-red-500/15 text-red-300 border border-red-400/30"
                    : "bg-white/10 text-white border border-white/20"
                }`}
            >
              {plan.status.replace("_", " ")}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-white/60">Total Days</p>
              <p className="text-white font-semibold">{schedule.totalDays}</p>
            </div>
            <div>
              <p className="text-white/60">Total Tasks</p>
              <p className="text-white font-semibold">{schedule.summary.totalTasks}</p>
            </div>
            <div>
              <p className="text-white/60">Completed</p>
              <p className="text-white font-semibold">{schedule.summary.completedTasks}</p>
            </div>
            <div>
              <p className="text-white/60">Pending</p>
              <p className="text-white font-semibold">{schedule.summary.pendingTasks}</p>
            </div>
          </div>

          {plan.summary && (
            <div className="mt-3">
              <p className="text-white/60 text-sm">Summary</p>
              <p className="text-white text-sm">{plan.summary}</p>
            </div>
          )}
        </div>

        {/* Day-by-Day Schedule */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Day-by-Day Schedule</h3>

          {schedule.days.map((day) => {
            const dayStatus = getDayStatus(day);
            const dayDate = new Date(day.date + "T00:00:00");

            return (
              <div
                key={day.day}
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/60" />
                      <span className="text-white font-semibold">Day {day.day}</span>
                    </div>
                    <span className="text-white/60 text-sm">
                      {/* {format(dayDate, "EEEE, MMM d")} */}
                    </span>
                  </div>

                  {dayStatus && (
                    <Badge
                      className={`${dayStatus.status === "completed"
                        ? "bg-green-500/15 text-green-300 border border-green-400/30"
                        : dayStatus.status === "in_progress"
                          ? "bg-blue-500/15 text-blue-200 border border-blue-400/30"
                          : "bg-white/10 text-white border border-white/20"
                        }`}
                    >
                      {dayStatus.label}
                    </Badge>
                  )}
                </div>

                {day.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {day.tasks.map((task, index) => (
                      <div
                        key={`${task._id || index}`}
                        className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-white/5"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {task.isComplete ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${getTaskColor(
                                task.type
                              ).replace("bg-", "border-").replace("/10", "/30")}`}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${getTaskColor(task.type)}`}>
                              <div className="flex items-center gap-1">
                                {getTaskIcon(task.type)}
                                <span className="capitalize">
                                  {task.type.replace("_", " ")}
                                </span>
                              </div>
                            </Badge>

                            {task.scheduledFor && (
                              <div className="flex items-center gap-1 text-xs text-white/60">
                                <Clock className="w-3 h-3" />
                                <span>{formatScheduledTime(task.scheduledFor)}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-start gap-2">
                            <User className="w-3 h-3 text-white/60 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-white text-sm">
                                {typeof task.personId === "object" && task.personId
                                  ? task.personId.name || "Unknown contact"
                                  : "Unknown contact"}
                              </p>
                              {typeof task.personId === "object" &&
                                task.personId &&
                                (task.personId.position || task.personId.companyName) && (
                                  <p className="text-white/60 text-xs">
                                    {[task.personId.position, task.personId.companyName]
                                      .filter(Boolean)
                                      .join(" at ")}
                                  </p>
                                )}
                            </div>
                          </div>

                          {task.notes && (
                            <p className="text-white/80 text-sm mt-2">{task.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 text-sm italic">No tasks scheduled for this day</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FollowupPlanSchedule;
