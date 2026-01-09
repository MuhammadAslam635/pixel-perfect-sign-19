import { FC, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Mail,
  Phone,
  MessageCircle,
  Play,
  Loader2,
  Pencil,
  Save,
  X,
  Clock,
  Plus,
} from "lucide-react";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { format } from "date-fns";
import { ScheduleDay, transformTouchpointsToSchedule } from "@/utils/followupSuggestionTransform";
import { convertUTCToLocalTime } from "@/utils/timezone";
import { useToast } from "@/hooks/use-toast";

type EditableFollowupSuggestionProps = {
  touchpoints: Array<{
    offset_hours?: number;
    channel?: string;
    message?: string;
  }>;
  summary?: string;
  callEndTime: string;
  leadId: string;
  onExecute: (todo: Array<{
    type: "email" | "call" | "whatsapp_message";
    personId: string;
    day: number;
    scheduledFor: string;
    notes: string;
  }>, startDate: string, executedPlanId?: string) => Promise<{ planId?: string } | void>;
  isExecuting?: boolean;
  executedPlanId?: string;
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

const EditableFollowupSuggestion: FC<EditableFollowupSuggestionProps> = ({
  touchpoints,
  summary,
  callEndTime,
  leadId,
  onExecute,
  isExecuting = false,
  executedPlanId: initialExecutedPlanId,
}) => {
  const { toast } = useToast();
  const [localDays, setLocalDays] = useState<ScheduleDay[]>([]);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayCounts, setDayCounts] = useState<Record<number, { emails: number; calls: number; whatsapp: number }>>({});
  const [dayNumbers, setDayNumbers] = useState<Record<number, number | "">>({});
  const [dayTaskTimes, setDayTaskTimes] = useState<
    Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }>
  >({});
  const [dayTaskNotes, setDayTaskNotes] = useState<
    Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }>
  >({});
  const [executedPlanId, setExecutedPlanId] = useState<string | undefined>(initialExecutedPlanId);
  const [lastExecutedState, setLastExecutedState] = useState<{
    days: ScheduleDay[];
    counts: Record<number, { emails: number; calls: number; whatsapp: number }>;
    numbers: Record<number, number | "">;
    times: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }>;
    notes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }>;
  } | null>(null);

  // Initialize from touchpoints
  useEffect(() => {
    const scheduleDays = transformTouchpointsToSchedule(touchpoints, callEndTime);
    setLocalDays(scheduleDays);

    const counts: Record<number, { emails: number; calls: number; whatsapp: number }> = {};
    const numbers: Record<number, number> = {};
    const taskTimes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }> = {};
    const taskNotes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }> = {};

    scheduleDays.forEach((day) => {
      counts[day.day] = {
        emails: day.tasks.filter((t) => t.type === "email").length,
        calls: day.tasks.filter((t) => t.type === "call").length,
        whatsapp: day.tasks.filter((t) => t.type === "whatsapp_message").length,
      };
      numbers[day.day] = day.day;

      const emailTimes = day.tasks
        .filter((t) => t.type === "email")
        .map((t) => {
          const dt = new Date(t.scheduledFor);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
        });
      const callTimes = day.tasks
        .filter((t) => t.type === "call")
        .map((t) => {
          const dt = new Date(t.scheduledFor);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
        });
      const whatsappTimes = day.tasks
        .filter((t) => t.type === "whatsapp_message")
        .map((t) => {
          const dt = new Date(t.scheduledFor);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
        });
      taskTimes[day.day] = {
        email: emailTimes,
        call: callTimes,
        whatsapp_message: whatsappTimes,
      };

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
    setDayTaskTimes(taskTimes);
    setDayTaskNotes(taskNotes);
  }, [touchpoints, callEndTime]);

  const handleCountChange = (day: number, type: "emails" | "calls" | "whatsapp", value: string) => {
    if (value === "") {
      setDayCounts((prev) => ({
        ...prev,
        [day]: {
          ...prev[day] || { emails: 0, calls: 0, whatsapp: 0 },
          [type]: 0,
        },
      }));
      setDayTaskTimes((prev) => {
        const existing = prev[day] || { email: [], call: [], whatsapp_message: [] };
        const updated = { ...existing };
        if (type === "emails") updated.email = [];
        if (type === "calls") updated.call = [];
        if (type === "whatsapp") updated.whatsapp_message = [];
        return { ...prev, [day]: updated };
      });
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

    const defaultTime = "09:00";
    setDayTaskTimes((prev) => {
      const existing = prev[day] || { email: [], call: [], whatsapp_message: [] };
      const updated = { ...existing };
      const currentArray =
        type === "emails"
          ? [...(existing.email || [])]
          : type === "calls"
          ? [...(existing.call || [])]
          : [...(existing.whatsapp_message || [])];

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

    setDayTaskNotes((prev) => {
      const existing = prev[day] || { email: [], call: [], whatsapp_message: [] };
      const updated = { ...existing };
      const currentArray =
        type === "emails"
          ? [...(existing.email || [])]
          : type === "calls"
          ? [...(existing.call || [])]
          : [...(existing.whatsapp_message || [])];

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
    if (value === "") {
      setDayNumbers((prev) => ({
        ...prev,
        [originalDay]: "",
      }));
      return;
    }

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
    if (value !== "" && !/^\d{0,2}:?\d{0,2}$/.test(value) && !/^\d{2}:\d{0,2}$/.test(value)) {
      return;
    }
    setDayTaskTimes((prev) => {
      const existing = prev[day] || { email: [], call: [], whatsapp_message: [] };
      const updated = { ...existing };
      const arr = [...(type === "email" ? existing.email : type === "call" ? existing.call : existing.whatsapp_message)];
      while (arr.length <= index) {
        arr.push("09:00");
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

  const handleEditDay = (dayNumber: number) => {
    setEditingDay(dayNumber);
  };

  // Check if a specific day has changes
  const dayHasChanges = (dayNumber: number): boolean => {
    const day = localDays.find((d) => d.day === dayNumber);
    if (!day) return false;

    const defaultTime = "09:00";

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
          const dt = new Date(t.scheduledFor);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
        }),
      call: day.tasks
        .filter((t) => t.type === "call")
        .map((t) => {
          const dt = new Date(t.scheduledFor);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
        }),
      whatsapp_message: day.tasks
        .filter((t) => t.type === "whatsapp_message")
        .map((t) => {
          const dt = new Date(t.scheduledFor);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
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

    const day = localDays.find((d) => d.day === dayNumber);
    if (!day) return;

    const callEnd = new Date(callEndTime);
    const defaultTime = "09:00";

    const originalDayNumber = day.day;
    const targetDayRaw = dayNumbers[originalDayNumber];
    const finalDayNumber =
      targetDayRaw === undefined || targetDayRaw === ""
        ? originalDayNumber
        : targetDayRaw;

    const counts = dayCounts[originalDayNumber] || { emails: 0, calls: 0, whatsapp: 0 };
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

    const currentTaskTimes = dayTaskTimes[originalDayNumber] || {
      email: [],
      call: [],
      whatsapp_message: [],
    };
    const normalizeTaskTimes = (arr: string[], count: number): string[] => {
      const result = [...arr];
      while (result.length < count) result.push(defaultTime);
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

    const currentTaskNotes = dayTaskNotes[originalDayNumber] || {
      email: [],
      call: [],
      whatsapp_message: [],
    };
    const normalizeTaskNotes = (arr: string[], count: number): string[] => {
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

    // Generate new tasks for this day
    const newTasks: Array<{
      type: "email" | "call" | "whatsapp_message";
      scheduledFor: string;
      notes: string;
    }> = [];

    const dayDate = new Date(callEnd);
    dayDate.setDate(dayDate.getDate() + finalDayNumber - 1);
    dayDate.setHours(0, 0, 0, 0);

    ["email", "call", "whatsapp_message"].forEach((type) => {
      const typeKey = type === "email" ? "emails" : type === "call" ? "calls" : "whatsapp";
      const count = normalizedCounts[typeKey];
      const times = normalizedTaskTimes[type as "email" | "call" | "whatsapp_message"] || [];
      const notes = normalizedTaskNotes[type as "email" | "call" | "whatsapp_message"] || [];

      for (let i = 0; i < count; i++) {
        const timeStr = times[i] || defaultTime;
        const [hours, minutes] = timeStr.split(":").map(Number);
        const scheduledTime = new Date(dayDate);
        scheduledTime.setHours(hours || 9, minutes || 0, 0, 0);

        newTasks.push({
          type: type as "email" | "call" | "whatsapp_message",
          scheduledFor: scheduledTime.toISOString(),
          notes: notes[i] || "",
        });
      }
    });

    // Update localDays - handle merging if day number changed to existing day
    const updatedDays = localDays.filter(
      (d) => d.day !== originalDayNumber && d.day !== finalDayNumber
    );

    // Check if target day already exists
    const existingTargetDay = localDays.find((d) => d.day === finalDayNumber);
    
    let finalDay: ScheduleDay;
    if (existingTargetDay && finalDayNumber !== originalDayNumber) {
      // Merge: combine tasks from both days
      const mergedTasks = [...existingTargetDay.tasks, ...newTasks].sort(
        (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
      );
      finalDay = {
        day: finalDayNumber,
        date: existingTargetDay.date,
        tasks: mergedTasks,
      };
    } else {
      // New day or same day number
      finalDay = {
        day: finalDayNumber,
        date: dayDate.toISOString().split("T")[0],
        tasks: newTasks,
      };
    }

    const newLocalDays = [...updatedDays, finalDay].sort((a, b) => a.day - b.day);
    setLocalDays(newLocalDays);

    // Update state to reflect saved changes
    const updatedCounts: Record<number, { emails: number; calls: number; whatsapp: number }> = {};
    const updatedNumbers: Record<number, number> = {};
    const updatedTaskTimes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }> = {};
    const updatedTaskNotes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }> = {};

    newLocalDays.forEach((d) => {
      updatedCounts[d.day] = {
        emails: d.tasks.filter((t) => t.type === "email").length,
        calls: d.tasks.filter((t) => t.type === "call").length,
        whatsapp: d.tasks.filter((t) => t.type === "whatsapp_message").length,
      };
      updatedNumbers[d.day] = d.day;

      const emailTimes = d.tasks
        .filter((t) => t.type === "email")
        .map((t) => {
          const dt = new Date(t.scheduledFor);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
        });
      const callTimes = d.tasks
        .filter((t) => t.type === "call")
        .map((t) => {
          const dt = new Date(t.scheduledFor);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
        });
      const whatsappTimes = d.tasks
        .filter((t) => t.type === "whatsapp_message")
        .map((t) => {
          const dt = new Date(t.scheduledFor);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
        });
      updatedTaskTimes[d.day] = {
        email: emailTimes,
        call: callTimes,
        whatsapp_message: whatsappTimes,
      };

      const emailNotes = d.tasks
        .filter((t) => t.type === "email")
        .map((t) => t.notes || "");
      const callNotes = d.tasks
        .filter((t) => t.type === "call")
        .map((t) => t.notes || "");
      const whatsappNotes = d.tasks
        .filter((t) => t.type === "whatsapp_message")
        .map((t) => t.notes || "");
      updatedTaskNotes[d.day] = {
        email: emailNotes,
        call: callNotes,
        whatsapp_message: whatsappNotes,
      };
    });

    setDayCounts(updatedCounts);
    setDayNumbers(updatedNumbers);
    setDayTaskTimes(updatedTaskTimes);
    setDayTaskNotes(updatedTaskNotes);

    toast({
      title: "Day saved",
      description: `Day ${finalDayNumber} has been saved successfully.`,
    });

    setEditingDay(null);
  };

  const handleCancelEdit = () => {
    setEditingDay(null);
    // Reset to original values from localDays
    const counts: Record<number, { emails: number; calls: number; whatsapp: number }> = {};
    const numbers: Record<number, number> = {};
    const taskTimes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }> = {};
    const taskNotes: Record<number, { email: string[]; call: string[]; whatsapp_message: string[] }> = {};

    localDays.forEach((day) => {
      counts[day.day] = {
        emails: day.tasks.filter((t) => t.type === "email").length,
        calls: day.tasks.filter((t) => t.type === "call").length,
        whatsapp: day.tasks.filter((t) => t.type === "whatsapp_message").length,
      };
      numbers[day.day] = day.day;

      const emailTimes = day.tasks
        .filter((t) => t.type === "email")
        .map((t) => {
          const dt = new Date(t.scheduledFor);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
        });
      const callTimes = day.tasks
        .filter((t) => t.type === "call")
        .map((t) => {
          const dt = new Date(t.scheduledFor);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
        });
      const whatsappTimes = day.tasks
        .filter((t) => t.type === "whatsapp_message")
        .map((t) => {
          const dt = new Date(t.scheduledFor);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`;
        });
      taskTimes[day.day] = {
        email: emailTimes,
        call: callTimes,
        whatsapp_message: whatsappTimes,
      };

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
    setDayTaskTimes(taskTimes);
    setDayTaskNotes(taskNotes);
  };

  // Build tasks for display from current state
  const buildTasksForDay = (day: ScheduleDay) => {
    const counts = dayCounts[day.day] || { emails: 0, calls: 0, whatsapp: 0 };
    const taskTimes = dayTaskTimes[day.day] || { email: [], call: [], whatsapp_message: [] };
    const taskNotes = dayTaskNotes[day.day] || { email: [], call: [], whatsapp_message: [] };
    const dayDate = new Date(day.date + "T00:00:00");
    const defaultTime = "09:00";

    const tasks: Array<{
      type: "email" | "call" | "whatsapp_message";
      scheduledFor: string;
      notes: string;
    }> = [];

    ["email", "call", "whatsapp_message"].forEach((type) => {
      const typeKey = type === "email" ? "emails" : type === "call" ? "calls" : "whatsapp";
      const count = counts[typeKey];
      const times = taskTimes[type as "email" | "call" | "whatsapp_message"] || [];
      const notes = taskNotes[type as "email" | "call" | "whatsapp_message"] || [];

      for (let i = 0; i < count; i++) {
        const timeStr = times[i] || defaultTime;
        const [hours, minutes] = timeStr.split(":").map(Number);
        const scheduledTime = new Date(dayDate);
        scheduledTime.setHours(hours || 9, minutes || 0, 0, 0);

        tasks.push({
          type: type as "email" | "call" | "whatsapp_message",
          scheduledFor: scheduledTime.toISOString(),
          notes: notes[i] || "",
        });
      }
    });

    return tasks.sort((a, b) => 
      new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    );
  };

  const formatScheduledTime = (scheduledFor: string) => {
    const date = new Date(scheduledFor);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const time24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return formatTimeWithAMPM(time24);
  };

  const handleAddDay = () => {
    const maxDay = Math.max(...localDays.map((d) => d.day), 0);
    const newDayNumber = maxDay + 1;

    const callEnd = new Date(callEndTime);
    const newDayDate = new Date(callEnd);
    newDayDate.setDate(callEnd.getDate() + newDayNumber - 1);
    newDayDate.setHours(0, 0, 0, 0);

    const newDay: ScheduleDay = {
      day: newDayNumber,
      date: newDayDate.toISOString().split("T")[0],
      tasks: [],
    };

    setLocalDays([...localDays, newDay]);
    setDayCounts((prev) => ({
      ...prev,
      [newDayNumber]: { emails: 0, calls: 0, whatsapp: 0 },
    }));
    setDayNumbers((prev) => ({
      ...prev,
      [newDayNumber]: newDayNumber,
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
  };

  // Check if there are changes since last execution
  const hasChangesSinceExecution = (): boolean => {
    if (!executedPlanId || !lastExecutedState) return false;

    // Compare current state with last executed state
    const currentStateStr = JSON.stringify({
      days: localDays.map(d => ({ day: d.day, tasks: d.tasks })),
      counts: dayCounts,
      numbers: dayNumbers,
      times: dayTaskTimes,
      notes: dayTaskNotes,
    });
    const lastStateStr = JSON.stringify({
      days: lastExecutedState.days.map(d => ({ day: d.day, tasks: d.tasks })),
      counts: lastExecutedState.counts,
      numbers: lastExecutedState.numbers,
      times: lastExecutedState.times,
      notes: lastExecutedState.notes,
    });

    return currentStateStr !== lastStateStr;
  };

  const handleExecute = async () => {
    const callEnd = new Date(callEndTime);
    const startDate = new Date(callEnd);
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);

    const todo: Array<{
      type: "email" | "call" | "whatsapp_message";
      personId: string;
      day: number;
      scheduledFor: string;
      notes: string;
    }> = [];

    localDays.forEach((day) => {
      const originalDayNumber = day.day;
      const targetDayRaw = dayNumbers[originalDayNumber];
      const finalDayNumber =
        targetDayRaw === undefined || targetDayRaw === ""
          ? originalDayNumber
          : targetDayRaw;

      const counts = dayCounts[originalDayNumber] || { emails: 0, calls: 0, whatsapp: 0 };
      const taskTimes = dayTaskTimes[originalDayNumber] || {
        email: [],
        call: [],
        whatsapp_message: [],
      };
      const taskNotes = dayTaskNotes[originalDayNumber] || {
        email: [],
        call: [],
        whatsapp_message: [],
      };

      const defaultTime = "09:00";

      // Generate tasks for each type
      ["email", "call", "whatsapp_message"].forEach((type) => {
        const typeKey = type === "email" ? "emails" : type === "call" ? "calls" : "whatsapp";
        const count = counts[typeKey];
        const times = taskTimes[type as "email" | "call" | "whatsapp_message"] || [];
        const notes = taskNotes[type as "email" | "call" | "whatsapp_message"] || [];

        for (let i = 0; i < count; i++) {
          const dayDate = new Date(startDate);
          dayDate.setDate(startDate.getDate() + finalDayNumber - 1);

          const timeStr = times[i] || defaultTime;
          const [hours, minutes] = timeStr.split(":").map(Number);
          dayDate.setHours(hours || 9, minutes || 0, 0, 0);

          todo.push({
            type: type as "email" | "call" | "whatsapp_message",
            personId: leadId,
            day: finalDayNumber,
            scheduledFor: dayDate.toISOString(),
            notes: notes[i] || "",
          });
        }
      });
    });

    if (todo.length === 0) {
      toast({
        title: "No tasks",
        description: "Please add at least one task before executing.",
        variant: "destructive",
      });
      return;
    }

    const result = await onExecute(todo, startDate.toISOString(), executedPlanId || undefined);
    
    // Store execution state
    if (result && typeof result === 'object' && 'planId' in result && result.planId) {
      setExecutedPlanId(result.planId);
    } else if (!executedPlanId) {
      // Assume execution was successful even if no planId returned (for new plans)
      setExecutedPlanId("executed");
    }
    
    // Store current state as last executed state
    setLastExecutedState({
      days: JSON.parse(JSON.stringify(localDays)),
      counts: JSON.parse(JSON.stringify(dayCounts)),
      numbers: JSON.parse(JSON.stringify(dayNumbers)),
      times: JSON.parse(JSON.stringify(dayTaskTimes)),
      notes: JSON.parse(JSON.stringify(dayTaskNotes)),
    });
  };

  const totalTasks = Object.values(dayCounts).reduce(
    (sum, counts) => sum + counts.emails + counts.calls + counts.whatsapp,
    0
  );

  return (
    <div className="space-y-4">
      {summary && (
        <div className="rounded-lg p-3 bg-white/5 border border-white/10">
          <p className="text-xs font-medium uppercase text-white/50 mb-1">
            Summary
          </p>
          <p className="text-xs text-white/80">{summary}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Day-by-Day Schedule</h3>
          {executedPlanId && (
            <Badge className="bg-green-500/15 text-green-300 border border-green-400/30 text-xs">
              Active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAddDay}
            variant="outline"
            size="sm"
            className="text-white border-white/20 hover:bg-white/10 h-8 text-xs px-2.5"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Day
          </Button>
          <ActiveNavButton
            icon={isExecuting ? Loader2 : Play}
            text={isExecuting ? "Executing..." : executedPlanId && !hasChangesSinceExecution() ? "Active" : "Execute"}
            onClick={handleExecute}
            disabled={(totalTasks === 0 || isExecuting) || (executedPlanId && !hasChangesSinceExecution())}
            className={`h-8 text-xs px-2.5 flex-shrink-0 ${
              executedPlanId && !hasChangesSinceExecution() 
                ? "opacity-50 cursor-not-allowed" 
                : ""
            }`}
            iconClassName={isExecuting ? "animate-spin" : ""}
          />
        </div>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-hide pr-1">
        {localDays
          .filter((day) => {
            const counts = dayCounts[day.day] || { emails: 0, calls: 0, whatsapp: 0 };
            const isEditing = editingDay === day.day;
            // Show days that have at least one task, or if they're currently being edited
            return (counts.emails > 0 || counts.calls > 0 || counts.whatsapp > 0) || isEditing;
          })
          .map((day) => {
          const dayDate = new Date(day.date + "T00:00:00");
          const counts = dayCounts[day.day] || { emails: 0, calls: 0, whatsapp: 0 };
          const isEditing = editingDay === day.day;
          const displayTasks = buildTasksForDay(day);

          return (
            <div
              key={day.day}
              className="rounded-lg border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/60" />
                  <span className="text-sm font-semibold text-white">
                    Day {dayNumbers[day.day] ?? day.day}
                  </span>
                  <span className="text-xs text-white/60">
                    {format(dayDate, "MMM d")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
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
                        disabled={!dayHasChanges(day.day)}
                        variant="outline"
                        size="sm"
                        className={`${
                          dayHasChanges(day.day)
                            ? "text-white border-white/20 hover:bg-white/10"
                            : "text-white/40 border-white/10 bg-white/5 cursor-not-allowed"
                        }`}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Day
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none text-white/60 hover:!bg-transparent hover:!text-white/60"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4 p-3 bg-black/20 rounded-lg border border-white/10">
                  <div className="space-y-2">
                    <label className="text-xs text-white/60 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      Day Number
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={dayNumbers[day.day] ?? day.day}
                      onChange={(e) => handleDayNumberChange(day.day, e.target.value)}
                      className="bg-white/5 border-white/20 text-white h-8 text-sm"
                      placeholder={day.day.toString()}
                    />
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Emails", type: "emails" as const, icon: <Mail className="w-3.5 h-3.5" />, key: "email" as const },
                      { label: "Calls", type: "calls" as const, icon: <Phone className="w-3.5 h-3.5" />, key: "call" as const },
                      { label: "WhatsApp", type: "whatsapp" as const, icon: <MessageCircle className="w-3.5 h-3.5" />, key: "whatsapp_message" as const },
                    ].map(({ label, type, icon, key }) => {
                      const timesArr = dayTaskTimes[day.day]?.[key] || [];
                      const countValue =
                        type === "emails"
                          ? counts.emails
                          : type === "calls"
                          ? counts.calls
                          : counts.whatsapp;

                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center gap-2">
                            {icon}
                            <span className="text-xs text-white/60">{label}</span>
                            <Input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={
                                countValue === 0 || countValue === undefined
                                  ? ""
                                  : countValue.toString()
                              }
                              onChange={(e) => handleCountChange(day.day, type, e.target.value)}
                              className="bg-white/5 border-white/20 text-white h-7 w-16 text-xs"
                              placeholder="0"
                            />
                          </div>

                          {countValue > 0 && (
                            <div className="grid grid-cols-1 gap-2 ml-6">
                              {Array.from({ length: countValue }).map((_, idx) => {
                                const notesArr = dayTaskNotes[day.day]?.[key] || [];
                                const existingNote = notesArr[idx] || "";

                                return (
                                  <div
                                    key={`${type}-${idx}`}
                                    className="p-2 rounded border border-white/10 bg-black/30 space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs text-white/80">
                                        {label} #{idx + 1}
                                      </span>
                                      <Input
                                        type="time"
                                        value={timesArr[idx] || "09:00"}
                                        onChange={(e) =>
                                          handleTaskTimeChange(day.day, key, idx, e.target.value)
                                        }
                                        className="bg-white/5 border-white/20 text-white h-7 w-24 text-xs"
                                      />
                                    </div>
                                    <Input
                                      type="text"
                                      value={existingNote}
                                      onChange={(e) =>
                                        handleTaskNoteChange(day.day, key, idx, e.target.value)
                                      }
                                      placeholder={`${label.toLowerCase()} message...`}
                                      className="bg-white/5 border-white/20 text-white text-xs h-7"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  {displayTasks.length > 0 ? (
                    <div className="space-y-2">
                      {displayTasks.map((task, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-2 rounded-lg bg-black/20 border border-white/5"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div
                              className={`w-4 h-4 rounded-full border-2 ${getTaskColor(
                                task.type
                              ).replace("bg-", "border-").replace("/10", "/30")}`}
                            />
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

                            {task.notes && (
                              <p className="text-white/80 text-xs mt-1">{task.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/60 text-xs italic">No tasks scheduled for this day</p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center pt-2">
        <Button
          onClick={handleAddDay}
          variant="outline"
          size="sm"
          className="text-white border-white/20 hover:bg-white/10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Day
        </Button>
      </div>
    </div>
  );
};

export default EditableFollowupSuggestion;

