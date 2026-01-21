import { FC, useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MessageCircle,
  CheckCircle,
  Loader2,
  Pencil,
  Save,
  X,
  Plus,
} from "lucide-react";
import { format, formatDistanceToNow, addDays } from "date-fns";
import {
  FollowupPlanWithSchedule,
  FollowupPlanScheduleDay,
  FollowupPlanTodo,
  FollowupPlanTemplateRef,
} from "@/services/followupPlans.service";
import { formatFollowupTaskTime } from "@/utils/followupTaskTime";
import { useUpdateFollowupPlan } from "@/hooks/useFollowupPlans";
import { useToast } from "@/hooks/use-toast";
import { convertLocalTimeToUTC, convertUTCToLocalTime } from "@/utils/timezone";

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

const formatTimeWithAMPM = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const FollowupPlanSchedule: FC<FollowupPlanScheduleProps> = ({
  plan,
  onClose,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const { mutate: updatePlan, isPending: isUpdating } = useUpdateFollowupPlan();
  const schedule = plan.schedule;
  const getPlanTemplateTimeUTC = () => {
    // Prefer plan-level snapshot override, fall back to template default
    if (plan.templateSnapshot && typeof plan.templateSnapshot === "object" && plan.templateSnapshot.timeOfDayToRun) {
      return plan.templateSnapshot.timeOfDayToRun;
    }
    if (plan.templateId && typeof plan.templateId === "object" && plan.templateId.timeOfDayToRun) {
      return plan.templateId.timeOfDayToRun;
    }
    return "09:00";
  };
  const getPlanTemplateTimeLocal = () => convertUTCToLocalTime(getPlanTemplateTimeUTC());
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayCounts, setDayCounts] = useState<Record<number, { emails: number; calls: number; whatsapp: number }>>({});
  const [dayNumbers, setDayNumbers] = useState<Record<number, number | "">>({});
  const [dayTimes, setDayTimes] = useState<Record<number, string>>({});
  const [dayTaskTimes, setDayTaskTimes] = useState<
    Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }>
  >({});
  const [dayTaskNotes, setDayTaskNotes] = useState<
    Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }>
  >({});
  const [localDays, setLocalDays] = useState<FollowupPlanScheduleDay[]>(schedule.days);
  const [hasChanges, setHasChanges] = useState(false);
  const [addedDays, setAddedDays] = useState<number[]>([]);
  const [scrollToDay, setScrollToDay] = useState<number | null>(null);
  const [dailyRunTime, setDailyRunTime] = useState(
    getPlanTemplateTimeLocal()
  );
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Update localDays when plan changes
  useEffect(() => {
    setLocalDays(schedule.days);
    setAddedDays([]);
  }, [schedule.days]);

  // Update dailyRunTime when template data becomes available
  useEffect(() => {
    setDailyRunTime(getPlanTemplateTimeLocal());
  }, [plan]);

  // Scroll to newly added day
  useEffect(() => {
    if (scrollToDay !== null) {
      const el = dayRefs.current[scrollToDay];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      setScrollToDay(null);
    }
  }, [scrollToDay, localDays]);

  // Initialize day counts, day numbers, and times from current tasks
  useEffect(() => {
    const counts: Record<number, { emails: number; calls: number; whatsapp: number }> = {};
    const numbers: Record<number, number> = {};
    const times: Record<number, string> = {};
    const taskTimes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }> = {};
    const taskNotes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }> = {};

    const defaultTime = getPlanTemplateTimeUTC();

    localDays.forEach((day) => {
      counts[day.day] = {
        emails: day.tasks.filter((t) => t.type === "email").length,
        calls: day.tasks.filter((t) => t.type === "call").length,
        whatsapp: day.tasks.filter((t) => t.type === "whatsapp_message").length,
      };
      numbers[day.day] = day.day;
      const firstTask = day.tasks.find((t) => t.scheduledFor);
      if (firstTask?.scheduledFor) {
        const dt = new Date(firstTask.scheduledFor);
        const hh = dt.getHours().toString().padStart(2, "0");
        const mm = dt.getMinutes().toString().padStart(2, "0");
        times[day.day] = `${hh}:${mm}`;
      } else {
        times[day.day] = defaultTime;
      }

      // collect per-task times per type
      const emailTimes = day.tasks
        .filter((t) => t.type === "email")
        .map((t) => {
          if (t.scheduledFor) {
            const dt = new Date(t.scheduledFor);
            return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
          }
          return defaultTime;
        });
      const callTimes = day.tasks
        .filter((t) => t.type === "call")
        .map((t) => {
          if (t.scheduledFor) {
            const dt = new Date(t.scheduledFor);
            return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
          }
          return defaultTime;
        });
      const whatsappTimes = day.tasks
        .filter((t) => t.type === "whatsapp_message")
        .map((t) => {
          if (t.scheduledFor) {
            const dt = new Date(t.scheduledFor);
            return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
          }
          return defaultTime;
        });
      taskTimes[day.day] = {
        email: emailTimes,
        call: callTimes,
        whatsapp_message: whatsappTimes,
      };

      // collect per-task notes per type
      const emailNotes = day.tasks
        .filter((t) => t.type === "email")
        .map((t) => t.notes || "");
      const callNotes = day.tasks
        .filter((t) => t.type === "call")
        .map((t) => t.notes || "");
      const whatsappNotes = day.tasks
        .filter((t) => t.type === "whatsapp_message")
        .map((t) => t.notes || "");
      taskNotes[day.day] = {
        email: emailNotes,
        call: callNotes,
        whatsapp_message: whatsappNotes,
      };
    });
    setDayCounts(counts);
    setDayNumbers(numbers);
    setDayTimes(times);
    setDayTaskTimes(taskTimes);
    setDayTaskNotes(taskNotes);
    setHasChanges(false);
  }, [localDays, plan]);

  const formatScheduledTime = (scheduledFor?: string, isComplete?: boolean) => {
    return formatFollowupTaskTime(scheduledFor, isComplete);
  };

  const getDayStatus = (day: FollowupPlanScheduleDay) => {
    const completedTasks = day.tasks.filter((task) => task.isComplete).length;
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

  const handleEditDay = (dayNumber: number) => {
    setEditingDay(dayNumber);
  };

  const handleCancelEdit = () => {
    setEditingDay(null);
    // Reset counts and day numbers to original
    const counts: Record<number, { emails: number; calls: number; whatsapp: number }> = {};
    const numbers: Record<number, number> = {};
    const times: Record<number, string> = {};
    const taskTimes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }> = {};
    const taskNotes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }> = {};
    const defaultTime = getPlanTemplateTimeUTC();
    localDays.forEach((day) => {
      counts[day.day] = {
        emails: day.tasks.filter((t) => t.type === "email").length,
        calls: day.tasks.filter((t) => t.type === "call").length,
        whatsapp: day.tasks.filter((t) => t.type === "whatsapp_message").length,
      };
      numbers[day.day] = day.day;
      const firstTask = day.tasks.find((t) => t.scheduledFor);
      if (firstTask?.scheduledFor) {
        const dt = new Date(firstTask.scheduledFor);
        const hh = dt.getHours().toString().padStart(2, "0");
        const mm = dt.getMinutes().toString().padStart(2, "0");
        times[day.day] = `${hh}:${mm}`;
      } else {
        times[day.day] = defaultTime;
      }
      const emailTimes = day.tasks
        .filter((t) => t.type === "email")
        .map((t) => {
          if (t.scheduledFor) {
            const dt = new Date(t.scheduledFor);
            return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
          }
          return defaultTime;
        });
      const callTimes = day.tasks
        .filter((t) => t.type === "call")
        .map((t) => {
          if (t.scheduledFor) {
            const dt = new Date(t.scheduledFor);
            return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
          }
          return defaultTime;
        });
      const whatsappTimes = day.tasks
        .filter((t) => t.type === "whatsapp_message")
        .map((t) => {
          if (t.scheduledFor) {
            const dt = new Date(t.scheduledFor);
            return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
          }
          return defaultTime;
        });
      taskTimes[day.day] = {
        email: emailTimes,
        call: callTimes,
        whatsapp_message: whatsappTimes,
      };

      // collect per-task notes per type
      const emailNotes = day.tasks
        .filter((t) => t.type === "email")
        .map((t) => t.notes || "");
      const callNotes = day.tasks
        .filter((t) => t.type === "call")
        .map((t) => t.notes || "");
      const whatsappNotes = day.tasks
        .filter((t) => t.type === "whatsapp_message")
        .map((t) => t.notes || "");
      taskNotes[day.day] = {
        email: emailNotes,
        call: callNotes,
        whatsapp_message: whatsappNotes,
      };
    });
    setDayCounts(counts);
    setDayNumbers(numbers);
    setDayTimes(times);
    setDayTaskTimes(taskTimes);
    setDayTaskNotes(taskNotes);
    setHasChanges(false);

    // Remove unsaved added days
    if (addedDays.length > 0) {
      setLocalDays((prev) => prev.filter((d) => !addedDays.includes(d.day)));
      setAddedDays([]);
    }
  };

  // Check if there are changes (counts, day numbers, times, per-task times)
  useEffect(() => {
    const defaultTime = getPlanTemplateTimeUTC();

    let changed = false;
    localDays.forEach((day) => {
      const originalCounts = {
        emails: day.tasks.filter((t) => t.type === "email").length,
        calls: day.tasks.filter((t) => t.type === "call").length,
        whatsapp: day.tasks.filter((t) => t.type === "whatsapp_message").length,
      };
      const currentCounts = dayCounts[day.day] || originalCounts;

      // Counts changed?
      if (
        currentCounts.emails !== originalCounts.emails ||
        currentCounts.calls !== originalCounts.calls ||
        currentCounts.whatsapp !== originalCounts.whatsapp
      ) {
        changed = true;
      }

      // Day number changed?
      const currentDayNumber = dayNumbers[day.day];
      if (
        currentDayNumber !== undefined &&
        currentDayNumber !== "" &&
        currentDayNumber !== day.day
      ) {
        changed = true;
      }

      // Day-level time changed?
      const firstTask = day.tasks.find((t) => t.scheduledFor);
      const originalTime = firstTask
        ? (() => {
          const dt = new Date(firstTask.scheduledFor as string);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
        })()
        : defaultTime;
      const currentTime = dayTimes[day.day] ?? originalTime;
      if (currentTime !== originalTime) {
        changed = true;
      }

      // Per-task times changed?
      const currentTaskTimes = dayTaskTimes[day.day] || {
        email: [],
        call: [],
        whatsapp_message: [],
      };

      const originalTaskTimes = {
        email: day.tasks
          .filter((t) => t.type === "email")
          .map((t) => {
            if (t.scheduledFor) {
              const dt = new Date(t.scheduledFor as string);
              return `${dt.getHours().toString().padStart(2, "0")}:${dt
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;
            }
            return defaultTime;
          }),
        call: day.tasks
          .filter((t) => t.type === "call")
          .map((t) => {
            if (t.scheduledFor) {
              const dt = new Date(t.scheduledFor as string);
              return `${dt.getHours().toString().padStart(2, "0")}:${dt
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;
            }
            return defaultTime;
          }),
        whatsapp_message: day.tasks
          .filter((t) => t.type === "whatsapp_message")
          .map((t) => {
            if (t.scheduledFor) {
              const dt = new Date(t.scheduledFor as string);
              return `${dt.getHours().toString().padStart(2, "0")}:${dt
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;
            }
            return defaultTime;
          }),
      };

      const compareTimes = (a: string[], b: string[]) => {
        if (a.length !== b.length) return true;
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) return true;
        }
        return false;
      };

      if (
        compareTimes(currentTaskTimes.email, originalTaskTimes.email) ||
        compareTimes(currentTaskTimes.call, originalTaskTimes.call) ||
        compareTimes(currentTaskTimes.whatsapp_message, originalTaskTimes.whatsapp_message)
      ) {
        changed = true;
      }
    });

    // If the global daily run time has been changed from the template default, mark as changed
    try {
      const templateDefaultLocal = getPlanTemplateTimeLocal();
      if (dailyRunTime !== templateDefaultLocal) changed = true;
    } catch (e) {
      // ignore conversion errors
    }

    setHasChanges(changed);

  }, [dayCounts, dayNumbers, dayTimes, dayTaskTimes, localDays, plan, dailyRunTime]);

  // Check if a specific day has changes
  const dayHasChanges = (dayNumber: number): boolean => {
    const day = localDays.find((d) => d.day === dayNumber);
    if (!day) return false;

    const defaultTime = getPlanTemplateTimeUTC();

    const originalCounts = {
      emails: day.tasks.filter((t) => t.type === "email").length,
      calls: day.tasks.filter((t) => t.type === "call").length,
      whatsapp: day.tasks.filter((t) => t.type === "whatsapp_message").length,
    };
    const currentCounts = dayCounts[dayNumber] || originalCounts;

    // Counts changed?
    if (
      currentCounts.emails !== originalCounts.emails ||
      currentCounts.calls !== originalCounts.calls ||
      currentCounts.whatsapp !== originalCounts.whatsapp
    ) {
      return true;
    }

    // Day number changed?
    const currentDayNumber = dayNumbers[dayNumber];
    if (
      currentDayNumber !== undefined &&
      currentDayNumber !== "" &&
      currentDayNumber !== dayNumber
    ) {
      return true;
    }

    // Day-level time changed?
    const firstTask = day.tasks.find((t) => t.scheduledFor);
    const originalTime = firstTask
      ? (() => {
        const dt = new Date(firstTask.scheduledFor as string);
        return `${dt.getHours().toString().padStart(2, "0")}:${dt
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      })()
      : defaultTime;
    const currentTime = dayTimes[dayNumber] ?? originalTime;
    if (currentTime !== originalTime) {
      return true;
    }

    // Per-task times changed?
    const currentTaskTimes = dayTaskTimes[dayNumber] || {
      email: [],
      call: [],
      whatsapp_message: [],
    };

    const originalTaskTimes = {
      email: day.tasks
        .filter((t) => t.type === "email")
        .map((t) => {
          if (t.scheduledFor) {
            const dt = new Date(t.scheduledFor as string);
            return `${dt.getHours().toString().padStart(2, "0")}:${dt
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
          }
          return defaultTime;
        }),
      call: day.tasks
        .filter((t) => t.type === "call")
        .map((t) => {
          if (t.scheduledFor) {
            const dt = new Date(t.scheduledFor as string);
            return `${dt.getHours().toString().padStart(2, "0")}:${dt
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
          }
          return defaultTime;
        }),
      whatsapp_message: day.tasks
        .filter((t) => t.type === "whatsapp_message")
        .map((t) => {
          if (t.scheduledFor) {
            const dt = new Date(t.scheduledFor as string);
            return `${dt.getHours().toString().padStart(2, "0")}:${dt
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
          }
          return defaultTime;
        }),
    };

    const compareTimes = (a: string[], b: string[]) => {
      if (a.length !== b.length) return true;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return true;
      }
      return false;
    };

    if (
      compareTimes(currentTaskTimes.email, originalTaskTimes.email) ||
      compareTimes(currentTaskTimes.call, originalTaskTimes.call) ||
      compareTimes(currentTaskTimes.whatsapp_message, originalTaskTimes.whatsapp_message)
    ) {
      return true;
    }

    // Per-task notes changed?
    const currentTaskNotes = dayTaskNotes[dayNumber] || {
      email: [],
      call: [],
      whatsapp_message: [],
    };

    const originalTaskNotes = {
      email: day.tasks
        .filter((t) => t.type === "email")
        .map((t) => t.notes || ""),
      call: day.tasks
        .filter((t) => t.type === "call")
        .map((t) => t.notes || ""),
      whatsapp_message: day.tasks
        .filter((t) => t.type === "whatsapp_message")
        .map((t) => t.notes || ""),
    };

    const compareNotes = (a: string[], b: string[]) => {
      if (a.length !== b.length) return true;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return true;
      }
      return false;
    };

    if (
      compareNotes(currentTaskNotes.email, originalTaskNotes.email) ||
      compareNotes(currentTaskNotes.call, originalTaskNotes.call) ||
      compareNotes(currentTaskNotes.whatsapp_message, originalTaskNotes.whatsapp_message)
    ) {
      return true;
    }

    return false;
  };

  // Save changes for a specific day
  const handleSaveDay = (dayNumber: number) => {
    if (!dayHasChanges(dayNumber)) {
      toast({
        title: "No changes",
        description: "No changes to save for this day.",
      });
      return;
    }

    // Get all persons from the plan
    const allPersons = new Set<string>();
    plan.todo.forEach((task) => {
      const personId = typeof task.personId === "string" ? task.personId : task.personId?._id;
      if (personId) allPersons.add(personId);
    });
    const personArray = Array.from(allPersons);
    if (personArray.length === 0) {
      toast({
        title: "No contacts available",
        description: "Cannot update plan without contacts.",
        variant: "destructive",
      });
      return;
    }

    const day = localDays.find((d) => d.day === dayNumber);
    if (!day) return;

    const templateDefaultTime = getPlanTemplateTimeUTC();

    const originalDayNumber = day.day;
    const targetDayRaw = dayNumbers[originalDayNumber];
    const finalDayNumber =
      targetDayRaw === undefined || targetDayRaw === ""
        ? originalDayNumber
        : targetDayRaw;

    const counts = dayCounts[originalDayNumber];
    const originalCounts = {
      emails: day.tasks.filter((t) => t.type === "email").length,
      calls: day.tasks.filter((t) => t.type === "call").length,
      whatsapp: day.tasks.filter((t) => t.type === "whatsapp_message").length,
    };

    const normalizedCounts = {
      emails: counts?.emails ?? originalCounts.emails,
      calls: counts?.calls ?? originalCounts.calls,
      whatsapp: counts?.whatsapp ?? originalCounts.whatsapp,
    };

    const timeValue =
      dayTimes[originalDayNumber] && dayTimes[originalDayNumber] !== ""
        ? dayTimes[originalDayNumber]
        : templateDefaultTime;

    const currentTaskTimes = dayTaskTimes[originalDayNumber] || {
      email: [],
      call: [],
      whatsapp_message: [],
    };
    const normalizeTaskTimes = (
      arr: string[],
      count: number
    ): string[] => {
      const result = [...arr];
      while (result.length < count) result.push(timeValue);
      if (result.length > count) result.length = count;
      return result;
    };
    const normalizedTaskTimes = {
      email: normalizeTaskTimes(currentTaskTimes.email || [], normalizedCounts.emails),
      call: normalizeTaskTimes(currentTaskTimes.call || [], normalizedCounts.calls),
      whatsapp_message: normalizeTaskTimes(
        currentTaskTimes.whatsapp_message || [],
        normalizedCounts.whatsapp
      ),
    };

    // Generate tasks for this day
    const tasksForDay: FollowupPlanTodo[] = [];
    let personIndex = 0;

    const timeArrays = normalizedTaskTimes;
    const currentTaskNotes = dayTaskNotes[originalDayNumber] || {
      email: [],
      call: [],
      whatsapp_message: [],
    };
    const normalizeTaskNotes = (
      arr: string[],
      count: number
    ): string[] => {
      const result = [...arr];
      while (result.length < count) result.push("");
      if (result.length > count) result.length = count;
      return result;
    };
    const normalizedTaskNotes = {
      email: normalizeTaskNotes(currentTaskNotes.email || [], normalizedCounts.emails),
      call: normalizeTaskNotes(currentTaskNotes.call || [], normalizedCounts.calls),
      whatsapp_message: normalizeTaskNotes(
        currentTaskNotes.whatsapp_message || [],
        normalizedCounts.whatsapp
      ),
    };
    const noteArrays = normalizedTaskNotes;

    const buildTasks = (
      type: "email" | "call" | "whatsapp_message",
      count: number,
      times: string[],
      notes: string[]
    ) => {
      for (let i = 0; i < count; i++) {
        const personId = personArray[personIndex % personArray.length];
        const dayDate = new Date(schedule.startDate);
        dayDate.setDate(dayDate.getDate() + finalDayNumber - 1);

        const t = times[i] || timeValue;
        const [hours, minutes] = t.split(":").map(Number);
        dayDate.setHours(hours || 9, minutes || 0, 0, 0);

        tasksForDay.push({
          _id: `temp-${finalDayNumber}-${type}-${i}-${Date.now()}`,
          type,
          personId,
          day: finalDayNumber,
          scheduledFor: dayDate.toISOString(),
          notes: notes[i] || "",
          isComplete: false,
        });
        personIndex++;
      }
    };

    buildTasks("email", normalizedCounts.emails, timeArrays.email || [], noteArrays.email || []);
    buildTasks("call", normalizedCounts.calls, timeArrays.call || [], noteArrays.call || []);
    buildTasks("whatsapp_message", normalizedCounts.whatsapp, timeArrays.whatsapp_message || [], noteArrays.whatsapp_message || []);

    // Get tasks from other days (keep original tasks for untouched days)
    const otherDaysTasks = plan.todo.filter((task) => {
      const taskDay = task.day;
      return taskDay && taskDay !== originalDayNumber && taskDay !== finalDayNumber;
    });

    // Combine all tasks
    const allNewTasks: FollowupPlanTodo[] = [...otherDaysTasks, ...tasksForDay];

    // Update plan
    updatePlan(
      {
        id: plan._id,
        payload: {
          todo: allNewTasks.map((task) => {
            const taskId = task._id;
            const isTempId = !taskId || taskId.startsWith("temp-");

            return {
              ...(isTempId ? {} : { _id: taskId }),
              type: task.type,
              personId: typeof task.personId === "string" ? task.personId : task.personId?._id || "",
              day: task.day,
              scheduledFor: task.scheduledFor || null,
              notes: task.notes || "",
              isComplete: task.isComplete,
            };
          }),
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Day updated",
            description: `Day ${finalDayNumber} has been saved successfully.`,
          });
          setEditingDay(null);
          setHasChanges(false);
          // Remove from addedDays if it was a newly added day
          if (addedDays.includes(originalDayNumber)) {
            setAddedDays((prev) => prev.filter((d) => d !== originalDayNumber));
          }
          // Refresh will happen via query invalidation
        },
        onError: (error: any) => {
          toast({
            title: "Failed to update day",
            description: error?.response?.data?.message || "Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleCountChange = (day: number, type: "emails" | "calls" | "whatsapp", value: string) => {
    // Allow empty string while typing so the user can erase
    if (value === "") {
      setDayCounts((prev) => ({
        ...prev,
        [day]: {
          ...prev[day] || { emails: 0, calls: 0, whatsapp: 0 },
          [type]: 0,
        },
      }));
      // also update per-task times array length to 0
      setDayTaskTimes((prev) => {
        const existing = prev[day] || { email: [], call: [], whatsapp_message: [] };
        const updated = { ...existing };
        if (type === "emails") updated.email = [];
        if (type === "calls") updated.call = [];
        if (type === "whatsapp") updated.whatsapp_message = [];
        return { ...prev, [day]: updated };
      });
      // also update per-task notes array length to 0
      setDayTaskNotes((prev) => {
        const existing = prev[day] || { email: [], call: [], whatsapp_message: [] };
        const updated = { ...existing };
        if (type === "emails") updated.email = [];
        if (type === "calls") updated.call = [];
        if (type === "whatsapp") updated.whatsapp_message = [];
        return { ...prev, [day]: updated };
      });
      return;
    }

    // Only allow digits
    if (!/^\d+$/.test(value)) {
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) {
      return;
    }

    setDayCounts((prev) => ({
      ...prev,
      [day]: {
        ...prev[day] || { emails: 0, calls: 0, whatsapp: 0 },
        [type]: numValue,
      },
    }));

    // adjust per-task times array lengths to match new count, filling with default time
    const defaultTime = getPlanTemplateTimeUTC();

    setDayTaskTimes((prev) => {
      const existing = prev[day] || { email: [], call: [], whatsapp_message: [] };
      const updated = { ...existing };
      const currentArray =
        type === "emails"
          ? [...(existing.email || [])]
          : type === "calls"
            ? [...(existing.call || [])]
            : [...(existing.whatsapp_message || [])];

      // ensure length == numValue
      if (currentArray.length < numValue) {
        while (currentArray.length < numValue) {
          currentArray.push(defaultTime);
        }
      } else if (currentArray.length > numValue) {
        currentArray.length = numValue;
      }

      if (type === "emails") updated.email = currentArray;
      if (type === "calls") updated.call = currentArray;
      if (type === "whatsapp") updated.whatsapp_message = currentArray;

      return { ...prev, [day]: updated };
    });

    // adjust per-task notes array lengths to match new count, filling with empty string
    setDayTaskNotes((prev) => {
      const existing = prev[day] || { email: [], call: [], whatsapp_message: [] };
      const updated = { ...existing };
      const currentArray =
        type === "emails"
          ? [...(existing.email || [])]
          : type === "calls"
            ? [...(existing.call || [])]
            : [...(existing.whatsapp_message || [])];

      // ensure length == numValue
      if (currentArray.length < numValue) {
        while (currentArray.length < numValue) {
          currentArray.push("");
        }
      } else if (currentArray.length > numValue) {
        currentArray.length = numValue;
      }

      if (type === "emails") updated.email = currentArray;
      if (type === "calls") updated.call = currentArray;
      if (type === "whatsapp") updated.whatsapp_message = currentArray;

      return { ...prev, [day]: updated };
    });
  };

  const handleDayNumberChange = (originalDay: number, value: string) => {
    // Allow empty string while typing so the user can erase
    if (value === "") {
      setDayNumbers((prev) => ({
        ...prev,
        [originalDay]: "",
      }));
      return;
    }

    // Only allow digits
    if (!/^\d+$/.test(value)) {
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) {
      return;
    }

    setDayNumbers((prev) => ({
      ...prev,
      [originalDay]: numValue,
    }));
  };

  const handleTaskTimeChange = (
    day: number,
    type: "email" | "call" | "whatsapp_message",
    index: number,
    value: string
  ) => {
    // basic HH:MM pattern check while typing
    if (value !== "" && !/^\d{0,2}:?\d{0,2}$/.test(value) && !/^\d{2}:\d{0,2}$/.test(value)) {
      return;
    }
    setDayTaskTimes((prev) => {
      const existing = prev[day] || { email: [], call: [], whatsapp_message: [] };
      const updated = { ...existing };
      const arr = [...(type === "email" ? existing.email : type === "call" ? existing.call : existing.whatsapp_message)];
      // pad up to index
      while (arr.length <= index) {
        arr.push(getPlanTemplateTimeLocal());
      }
      arr[index] = value;
      if (type === "email") updated.email = arr;
      if (type === "call") updated.call = arr;
      if (type === "whatsapp_message") updated.whatsapp_message = arr;
      return { ...prev, [day]: updated };
    });
  };

  const handleTaskNoteChange = (
    day: number,
    type: "email" | "call" | "whatsapp_message",
    index: number,
    value: string
  ) => {
    setDayTaskNotes((prev) => {
      const existing = prev[day] || { email: [], call: [], whatsapp_message: [] };
      const updated = { ...existing };
      const arr = [...(type === "email" ? existing.email : type === "call" ? existing.call : existing.whatsapp_message)];
      // pad up to index
      while (arr.length <= index) {
        arr.push("");
      }
      arr[index] = value;
      if (type === "email") updated.email = arr;
      if (type === "call") updated.call = arr;
      if (type === "whatsapp_message") updated.whatsapp_message = arr;
      return { ...prev, [day]: updated };
    });
  };

  const handleApplyGlobalTime = () => {
    // Update all task times to dailyRunTime
    setDayTaskTimes((prev) => {
      const next = { ...prev };

      // Iterate over all days in localDays (including added ones)
      localDays.forEach(day => {
        const dayNum = day.day;
        const existing = prev[dayNum] || { email: [], call: [], whatsapp_message: [] };

        // Get counts to know how many tasks we have
        const count = dayCounts[dayNum] || {
          emails: day.tasks.filter(t => t.type === "email").length,
          calls: day.tasks.filter(t => t.type === "call").length,
          whatsapp: day.tasks.filter(t => t.type === "whatsapp_message").length,
        };

        next[dayNum] = {
          email: Array(count.emails).fill(dailyRunTime),
          call: Array(count.calls).fill(dailyRunTime),
          whatsapp_message: Array(count.whatsapp).fill(dailyRunTime),
        };
      });

      // Also update the day-level time if we track that
      setDayTimes(prevTimes => {
        const nextTimes = { ...prevTimes };
        localDays.forEach(day => {
          nextTimes[day.day] = dailyRunTime;
        });
        return nextTimes;
      });

      return next;
    });

    toast({
      title: "Time Applied",
      description: `Applied ${dailyRunTime} to all active tasks. Click 'Save All Changes' to persist.`,
    });
  };

  const handleSaveAll = () => {
    // Get all persons from the plan
    const allPersons = new Set<string>();
    plan.todo.forEach((task) => {
      const personId = typeof task.personId === "string" ? task.personId : task.personId?._id;
      if (personId) allPersons.add(personId);
    });
    const personArray = Array.from(allPersons);
    if (personArray.length === 0) {
      toast({
        title: "No contacts available",
        description: "Cannot update plan without contacts.",
        variant: "destructive",
      });
      return;
    }

    // Determine edited days and build counts/times for merging
    const editedDays = new Set<number>();
    const incomingCounts: Record<number, { emails: number; calls: number; whatsapp: number }> = {};
    const incomingTimes: Record<number, string> = {};
    const incomingTaskTimes: Record<
      number,
      { email: string[]; call: string[]; whatsapp_message: string[] }
    > = {};
    const baseCounts: Record<number, { emails: number; calls: number; whatsapp: number }> = {};
    const baseTimes: Record<number, string> = {};
    const baseTaskTimes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }> =
      {};

    const templateDefaultTime = getPlanTemplateTimeLocal();

    localDays.forEach((day) => {
      const originalDayNumber = day.day;
      const targetDayRaw = dayNumbers[originalDayNumber];
      const finalDayNumber =
        targetDayRaw === undefined || targetDayRaw === ""
          ? originalDayNumber
          : targetDayRaw;

      const counts = dayCounts[originalDayNumber];
      const originalCounts = {
        emails: day.tasks.filter((t) => t.type === "email").length,
        calls: day.tasks.filter((t) => t.type === "call").length,
        whatsapp: day.tasks.filter((t) => t.type === "whatsapp_message").length,
      };

      const normalizedCounts = {
        emails: counts?.emails ?? originalCounts.emails,
        calls: counts?.calls ?? originalCounts.calls,
        whatsapp: counts?.whatsapp ?? originalCounts.whatsapp,
      };

      const timeValue =
        dayTimes[originalDayNumber] && dayTimes[originalDayNumber] !== ""
          ? dayTimes[originalDayNumber]
          : templateDefaultTime;

      // Original per-task times
      const originalTaskTimes = {
        email: day.tasks
          .filter((t) => t.type === "email")
          .map((t) => {
            if (t.scheduledFor) {
              const dt = new Date(t.scheduledFor as string);
              return `${dt.getHours().toString().padStart(2, "0")}:${dt
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;
            }
            return templateDefaultTime;
          }),
        call: day.tasks
          .filter((t) => t.type === "call")
          .map((t) => {
            if (t.scheduledFor) {
              const dt = new Date(t.scheduledFor as string);
              return `${dt.getHours().toString().padStart(2, "0")}:${dt
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;
            }
            return templateDefaultTime;
          }),
        whatsapp_message: day.tasks
          .filter((t) => t.type === "whatsapp_message")
          .map((t) => {
            if (t.scheduledFor) {
              const dt = new Date(t.scheduledFor as string);
              return `${dt.getHours().toString().padStart(2, "0")}:${dt
                .getMinutes()
                .toString()
                .padStart(2, "0")}`;
            }
            return templateDefaultTime;
          }),
      };

      // Current per-task times (from state), aligned to counts
      const currentTaskTimes = dayTaskTimes[originalDayNumber] || {
        email: [],
        call: [],
        whatsapp_message: [],
      };
      const normalizeTaskTimes = (
        arr: string[],
        count: number
      ): string[] => {
        const result = [...arr];
        while (result.length < count) result.push(timeValue);
        if (result.length > count) result.length = count;
        return result;
      };
      const normalizedTaskTimes = {
        email: normalizeTaskTimes(currentTaskTimes.email || [], normalizedCounts.emails),
        call: normalizeTaskTimes(currentTaskTimes.call || [], normalizedCounts.calls),
        whatsapp_message: normalizeTaskTimes(
          currentTaskTimes.whatsapp_message || [],
          normalizedCounts.whatsapp
        ),
      };

      const isCountsChanged =
        normalizedCounts.emails !== originalCounts.emails ||
        normalizedCounts.calls !== originalCounts.calls ||
        normalizedCounts.whatsapp !== originalCounts.whatsapp;
      const isDayChanged = finalDayNumber !== originalDayNumber;
      const isTimeChanged =
        dayTimes[originalDayNumber] !== undefined &&
        dayTimes[originalDayNumber] !== "" &&
        dayTimes[originalDayNumber] !== timeValue;

      const compareTimes = (a: string[], b: string[]) => {
        if (a.length !== b.length) return true;
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) return true;
        }
        return false;
      };

      const isPerTaskTimeChanged =
        compareTimes(normalizedTaskTimes.email, originalTaskTimes.email) ||
        compareTimes(normalizedTaskTimes.call, originalTaskTimes.call) ||
        compareTimes(normalizedTaskTimes.whatsapp_message, originalTaskTimes.whatsapp_message);

      if (isCountsChanged || isDayChanged || isTimeChanged || isPerTaskTimeChanged) {
        editedDays.add(originalDayNumber);
        if (!incomingCounts[finalDayNumber]) {
          incomingCounts[finalDayNumber] = { emails: 0, calls: 0, whatsapp: 0 };
        }
        if (!incomingTaskTimes[finalDayNumber]) {
          incomingTaskTimes[finalDayNumber] = { email: [], call: [], whatsapp_message: [] };
        }
        incomingCounts[finalDayNumber].emails += normalizedCounts.emails;
        incomingCounts[finalDayNumber].calls += normalizedCounts.calls;
        incomingCounts[finalDayNumber].whatsapp += normalizedCounts.whatsapp;
        incomingTimes[finalDayNumber] = timeValue;
        incomingTaskTimes[finalDayNumber].email.push(...normalizedTaskTimes.email);
        incomingTaskTimes[finalDayNumber].call.push(...normalizedTaskTimes.call);
        incomingTaskTimes[finalDayNumber].whatsapp_message.push(
          ...normalizedTaskTimes.whatsapp_message
        );
      } else {
        baseCounts[finalDayNumber] = {
          emails: originalCounts.emails,
          calls: originalCounts.calls,
          whatsapp: originalCounts.whatsapp,
        };
        const firstTask = day.tasks.find((t) => t.scheduledFor);
        if (firstTask?.scheduledFor) {
          const dt = new Date(firstTask.scheduledFor);
          const hh = dt.getHours().toString().padStart(2, "0");
          const mm = dt.getMinutes().toString().padStart(2, "0");
          baseTimes[finalDayNumber] = `${hh}:${mm}`;
        } else if (dayTimes[originalDayNumber]) {
          baseTimes[finalDayNumber] = dayTimes[originalDayNumber] as string;
        } else {
          baseTimes[finalDayNumber] = templateDefaultTime;
        }

        baseTaskTimes[finalDayNumber] = originalTaskTimes;
      }
    });

    const templateDefaultLocal = getPlanTemplateTimeLocal();

    const scheduleChanged = dailyRunTime !== templateDefaultLocal;

    if (editedDays.size === 0 && !scheduleChanged) {
      toast({
        title: "No changes",
        description: "No changes to save.",
      });
      return;
    }

    // If only schedule (time) changed, send schedule update only so backend recreates cron job
    if (editedDays.size === 0 && scheduleChanged) {
      updatePlan(
        {
          id: plan._id,
          payload: {
            schedule: {
              time: convertLocalTimeToUTC(dailyRunTime),
            },
          },
        },
        {
          onSuccess: () => {
            toast({
              title: "Plan updated",
              description: "Schedule time has been updated successfully.",
            });
            setHasChanges(false);
          },
          onError: (error: any) => {
            toast({
              title: "Failed to update plan",
              description: error?.response?.data?.message || "Please try again.",
              variant: "destructive",
            });
          },
        }
      );
      return;
    }

    // Track days to remove: all edited originals, plus any target day that receives incoming merges
    const daysToRemove = new Set<number>();
    editedDays.forEach((originalDay) => {
      daysToRemove.add(originalDay);
      const targetDayRaw = dayNumbers[originalDay];
      const finalDayNumber =
        targetDayRaw === undefined || targetDayRaw === ""
          ? originalDay
          : targetDayRaw;
      daysToRemove.add(finalDayNumber);
    });

    // Build combined counts for each target day (base + incoming) and times + per-task times
    const combinedCounts: Record<number, { emails: number; calls: number; whatsapp: number }> = {};
    const combinedTimes: Record<number, string> = {};
    const combinedTaskTimes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }> = {};

    Object.keys(incomingCounts).forEach((dayKey) => {
      const dayNum = parseInt(dayKey, 10);
      combinedCounts[dayNum] = {
        emails: incomingCounts[dayNum].emails + (baseCounts[dayNum]?.emails ?? 0),
        calls: incomingCounts[dayNum].calls + (baseCounts[dayNum]?.calls ?? 0),
        whatsapp: incomingCounts[dayNum].whatsapp + (baseCounts[dayNum]?.whatsapp ?? 0),
      };
      combinedTimes[dayNum] = incomingTimes[dayNum] || baseTimes[dayNum] || getPlanTemplateTimeLocal();
      combinedTaskTimes[dayNum] = {
        email: [
          ...(baseTaskTimes[dayNum]?.email || []),
          ...(incomingTaskTimes[dayNum]?.email || []),
        ],
        call: [
          ...(baseTaskTimes[dayNum]?.call || []),
          ...(incomingTaskTimes[dayNum]?.call || []),
        ],
        whatsapp_message: [
          ...(baseTaskTimes[dayNum]?.whatsapp_message || []),
          ...(incomingTaskTimes[dayNum]?.whatsapp_message || []),
        ],
      };
    });

    // If a target day has only base counts and was marked for removal due to merge, include base
    Object.keys(baseCounts).forEach((dayKey) => {
      const dayNum = parseInt(dayKey, 10);
      if (daysToRemove.has(dayNum) && !combinedCounts[dayNum]) {
        combinedCounts[dayNum] = { ...baseCounts[dayNum] };
        combinedTimes[dayNum] = baseTimes[dayNum] || getPlanTemplateTimeLocal();
        combinedTaskTimes[dayNum] = {
          email: [...(baseTaskTimes[dayNum]?.email || [])],
          call: [...(baseTaskTimes[dayNum]?.call || [])],
          whatsapp_message: [...(baseTaskTimes[dayNum]?.whatsapp_message || [])],
        };
      }
    });

    // Generate tasks for combined target days
    const tasksByNewDay: Record<number, FollowupPlanTodo[]> = {};
    let personIndex = 0;

    Object.entries(combinedCounts).forEach(([dayKey, counts]) => {
      const finalDayNumber = parseInt(dayKey, 10);

      if (!tasksByNewDay[finalDayNumber]) {
        tasksByNewDay[finalDayNumber] = [];
      }

      const timeForDay = combinedTimes[finalDayNumber] || getPlanTemplateTimeLocal();

      const timeArrays =
        combinedTaskTimes[finalDayNumber] || { email: [], call: [], whatsapp_message: [] };

      const buildTasks = (
        type: "email" | "call" | "whatsapp_message",
        count: number,
        times: string[]
      ) => {
        for (let i = 0; i < count; i++) {
          const personId = personArray[personIndex % personArray.length];
          const dayDate = new Date(schedule.startDate);
          dayDate.setDate(dayDate.getDate() + finalDayNumber - 1);

          const t = times[i] || timeForDay;
          const [hours, minutes] = t.split(":").map(Number);
          dayDate.setHours(hours || 9, minutes || 0, 0, 0);

          tasksByNewDay[finalDayNumber].push({
            _id: `temp-${finalDayNumber}-${type}-${i}-${Date.now()}`,
            type,
            personId,
            day: finalDayNumber,
            scheduledFor: dayDate.toISOString(),
            notes: "",
            isComplete: false,
          });
          personIndex++;
        }
      };

      buildTasks("email", counts.emails, timeArrays.email || []);
      buildTasks("call", counts.calls, timeArrays.call || []);
      buildTasks("whatsapp_message", counts.whatsapp, timeArrays.whatsapp_message || []);
    });

    // Get tasks from days not removed (keep original tasks for untouched days)
    const uneditedTasks = plan.todo.filter((task) => {
      const taskDay = task.day;
      return taskDay && !daysToRemove.has(taskDay);
    });

    // Combine all tasks
    const allNewTasks: FollowupPlanTodo[] = [...uneditedTasks];
    Object.values(tasksByNewDay).forEach((tasks) => {
      allNewTasks.push(...tasks);
    });

    // Update plan
    updatePlan(
      {
        id: plan._id,
        payload: {
          todo: allNewTasks.map((task) => {
            // Only include _id if it's a valid existing task ID (not a temp ID)
            const taskId = task._id;
            const isTempId = !taskId || taskId.startsWith("temp-");

            return {
              ...(isTempId ? {} : { _id: taskId }),
              type: task.type,
              personId: typeof task.personId === "string" ? task.personId : task.personId?._id || "",
              day: task.day,
              scheduledFor: task.scheduledFor || null,
              notes: task.notes || "",
              isComplete: task.isComplete,
            };
          }),
          schedule: {
            time: convertLocalTimeToUTC(dailyRunTime),
          },
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Plan updated",
            description: "All changes have been saved successfully.",
          });
          setEditingDay(null);
          setHasChanges(false);
          // Refresh will happen via query invalidation
        },
        onError: (error: any) => {
          toast({
            title: "Failed to update plan",
            description: error?.response?.data?.message || "Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleAddDay = (position: "top" | "bottom") => {
    const maxDay = Math.max(...localDays.map((d) => d.day), 0);
    const newDayNumber = maxDay + 1;

    const startDate = new Date(schedule.startDate);
    const newDayDate = addDays(startDate, newDayNumber - 1);

    const newDay: FollowupPlanScheduleDay = {
      day: newDayNumber,
      date: newDayDate.toISOString().split("T")[0],
      tasks: [],
    };

    setLocalDays([...localDays, newDay]);
    setAddedDays((prev) => [...prev, newDayNumber]);
    setDayCounts((prev) => ({
      ...prev,
      [newDayNumber]: { emails: 0, calls: 0, whatsapp: 0 },
    }));
    setDayTimes((prev) => ({
      ...prev,
      [newDayNumber]: getPlanTemplateTimeLocal(),
    }));
    setDayTaskTimes((prev) => ({
      ...prev,
      [newDayNumber]: { email: [], call: [], whatsapp_message: [] },
    }));
    setDayTaskNotes((prev) => ({
      ...prev,
      [newDayNumber]: { email: [], call: [], whatsapp_message: [] },
    }));
    setEditingDay(newDayNumber);
    setScrollToDay(newDayNumber);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading schedule...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-white/60" />
        <div>
          <h2 className="text-lg font-semibold text-white">
            {plan.templateId && typeof plan.templateId === "object"
              ? plan.templateId.title
              : "Follow-up Plan"}
          </h2>
          <p className="text-sm text-white/60">
            Started {formatDistanceToNow(new Date(plan.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      {/* Global Controls */}
      {/* <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">Time:</span>
            <div className="relative">
              <Input
                type="time"
                step="60"
                value={dailyRunTime}
                onChange={(e) => setDailyRunTime(e.target.value)}
                style={{ colorScheme: "dark" }}
                className="pl-10 bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all h-8 w-32"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
            </div>
            global apply removed - changing time now enables Save All Changes
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-amber-300 mr-2">Unsaved changes</span>
            )}
            <Button
              onClick={handleSaveAll}
              disabled={!hasChanges || isUpdating}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save All Changes
            </Button>
          </div>
        </div>
      </div> */}

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
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Day-by-Day Schedule</h3>
          <Button
            onClick={() => handleAddDay("bottom")}
            variant="outline"
            size="sm"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Day
          </Button>
        </div>

        {localDays.map((day) => {
          const dayStatus = getDayStatus(day);
          const dayDate = new Date(day.date + "T00:00:00");
          const isEditing = editingDay === day.day;
          const counts = dayCounts[day.day] || { emails: 0, calls: 0, whatsapp: 0 };

          return (
            <div
              key={day.day}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
              ref={(el) => {
                dayRefs.current[day.day] = el;
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white/60" />
                    <span className="text-white font-semibold">Day {day.day}</span>
                  </div>
                  <span className="text-white/60 text-sm">
                    {format(dayDate, "EEEE, MMM d")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {dayStatus && !isEditing && (
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

                  {!isEditing ? (
                    <Button
                      onClick={() => handleEditDay(day.day)}
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleSaveDay(day.day)}
                        disabled={!dayHasChanges(day.day) || isUpdating}
                        variant="outline"
                        size="sm"
                        className={`${dayHasChanges(day.day) && !isUpdating
                          ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                          : "text-white/40 border-white/10 bg-white/5 cursor-not-allowed"
                          }`}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isUpdating ? "Saving..." : "Save Day"}
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="ghost"
                        size="icon"
                        disabled={isUpdating}
                        className="h-8 w-8 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-white/60 hover:!bg-transparent hover:!text-white/60"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 p-4 bg-black/20 rounded-lg border border-white/10">
                  <div className="space-y-2">
                    <label className="text-sm text-white/60 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Day Number
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={dayNumbers[day.day] ?? day.day}
                      onChange={(e) => handleDayNumberChange(day.day, e.target.value)}
                      className="bg-white/5 border-white/20 text-white"
                      placeholder={day.day.toString()}
                    />
                  </div>
                  {/* Per-type counts and task tiles with time editing */}
                  <div className="space-y-4">
                    {[
                      { label: "Calls", type: "calls" as const, icon: <Phone className="w-4 h-4" />, key: "call" as const },
                      { label: "WhatsApp", type: "whatsapp" as const, icon: <MessageCircle className="w-4 h-4" />, key: "whatsapp_message" as const },
                      { label: "Emails", type: "emails" as const, icon: <Mail className="w-4 h-4" />, key: "email" as const },
                    ].map(({ label, type, icon, key }) => {
                      const timesArr =
                        dayTaskTimes[day.day]?.[key] || [];
                      const countValue =
                        type === "emails"
                          ? counts.emails
                          : type === "calls"
                            ? counts.calls
                            : counts.whatsapp;
                      return (
                        <div key={type} className="space-y-3">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-1">
                              <label className="text-sm text-white/60 flex items-center gap-2">
                                {icon}
                                {label}
                              </label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={
                                  countValue === 0 || countValue === undefined
                                    ? ""
                                    : countValue.toString()
                                }
                                onChange={(e) =>
                                  handleCountChange(day.day, type, e.target.value)
                                }
                                className="bg-white/5 border-white/20 text-white"
                                placeholder="0"
                              />
                            </div>
                          </div>

                          {/* Task tiles for this type */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {Array.from({
                              length:
                                type === "emails"
                                  ? counts.emails || 0
                                  : type === "calls"
                                    ? counts.calls || 0
                                    : counts.whatsapp || 0,
                            }).map((_, idx) => {
                              const notesArr = dayTaskNotes[day.day]?.[key] || [];
                              const existingNote = notesArr[idx] || "";
                              const timesArr = dayTaskTimes[day.day]?.[key] || [];
                              const defaultTime = getPlanTemplateTimeLocal();
                              const existingTime = timesArr[idx] || defaultTime;

                              return (
                                <div
                                  key={`${type}-${idx}`}
                                  className="p-3 rounded-lg border border-white/10 bg-black/30 space-y-2"
                                >
                                  {/* First row: Icon and label */}
                                  <div className="flex items-center gap-2 text-sm text-white/80">
                                    {icon}
                                    <span>
                                      {label} #{idx + 1}
                                    </span>
                                  </div>
                                  {/* Second row: Time input */}
                                  <div className="relative">
                                    <Input
                                      type="time"
                                      step="60"
                                      value={existingTime}
                                      onChange={(e) =>
                                        handleTaskTimeChange(
                                          day.day,
                                          key,
                                          idx,
                                          e.target.value
                                        )
                                      }
                                      style={{ colorScheme: "dark" }}
                                      className="pl-10 bg-white/5 backdrop-blur-sm border-white/20 text-white text-xs placeholder:text-gray-400 focus:bg-white/10 focus:border-white/30 transition-all h-8"
                                    />
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
                                  </div>
                                  {/* Third row: Notes input */}
                                  <Input
                                    type="text"
                                    value={existingNote}
                                    onChange={(e) =>
                                      handleTaskNoteChange(
                                        day.day,
                                        key,
                                        idx,
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Enter ${label.toLowerCase()} description...`}
                                    className="bg-white/5 border-white/20 text-white text-sm"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
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
                                  <span>{formatScheduledTime(task.scheduledFor, task.isComplete)}</span>
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
                </>
              )}
            </div>
          );
        })}

        <div className="flex justify-center pt-4">
          <Button
            onClick={() => handleAddDay("bottom")}
            variant="outline"
            size="sm"
            className="text-white border-white/20 hover:bg-white/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Day
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FollowupPlanSchedule;
