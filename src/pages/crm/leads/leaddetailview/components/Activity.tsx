import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MoveRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFollowupTemplates } from "@/hooks/useFollowupTemplates";
import {
  useCreateFollowupPlan,
  useCreateFollowupPlanFromCall,
  useUpdateFollowupPlan,
  useDeleteFollowupPlan,
  useFollowupPlans,
} from "@/hooks/useFollowupPlans";
import EditableFollowupSuggestion from "@/components/followups/EditableFollowupSuggestion";
import { useLeadsData } from "@/pages/crm/shared/hooks";
import { Lead } from "@/services/leads.service";
import { FollowupPlan } from "@/services/followupPlans.service";
import { useToast } from "@/hooks/use-toast";
import {
  leadSummaryService,
  LeadSummaryResponse,
} from "@/services/leadSummary.service";
import { format, formatDistanceToNow } from "date-fns";
import {
  formatFollowupTaskTime,
  getNextUpMessage,
} from "@/utils/followupTaskTime";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  calendarService,
  LeadMeetingRecord,
  AvailableSlot,
  SyncMeetingsResponse,
} from "@/services/calendar.service";
import { SelectedCallLogView } from "../index";
import CompanyTab from "./CompanyTab";
import API from "@/utils/api";

type ActivityProps = {
  lead?: Lead;
  selectedCallLogView: SelectedCallLogView;
  setSelectedCallLogView: (view: SelectedCallLogView) => void;
  onActivityUpdate?: (stats: { hasBookedAppointment: boolean }) => void;
};

type HydratedSlot = AvailableSlot & {
  startDate: Date;
  endDate: Date;
};

const resolveErrorMessage = (error: unknown) => {
  if (!error) {
    return null;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return null;
};

const formatDateTimeRange = (start?: string, end?: string) => {
  if (!start || !end) {
    return "Time not available";
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "Time not available";
  }
  const sameDay =
    startDate.getFullYear() === endDate.getFullYear() &&
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getDate() === endDate.getDate();
  if (sameDay) {
    return `${format(startDate, "EEE, MMM d · h:mm a")} – ${format(
      endDate,
      "h:mm a"
    )}`;
  }
  return `${format(startDate, "EEE, MMM d · h:mm a")} → ${format(
    endDate,
    "EEE, MMM d · h:mm a"
  )}`;
};

const slotComparator = (a: Date, b: Date) => a.getTime() - b.getTime();

const formatCallDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const formatDuration = (seconds?: number | null) => {
  if (seconds === null || seconds === undefined) {
    return "—";
  }
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

const Activity: FC<ActivityProps> = ({
  lead,
  selectedCallLogView,
  setSelectedCallLogView,
  onActivityUpdate,
}) => {
  const [topLevelTab, setTopLevelTab] = useState<"activity" | "company">(
    "activity"
  );
  const [activeTab, setActiveTab] = useState("summary");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedLeadsMap, setSelectedLeadsMap] = useState<
    Record<string, Lead>
  >({});
  const [leadsSearch, setLeadsSearch] = useState("");
  const [leadSelectorOpen, setLeadSelectorOpen] = useState(false);
  const [planPendingDelete, setPlanPendingDelete] =
    useState<FollowupPlan | null>(null);
  const [meetingPendingDelete, setMeetingPendingDelete] =
    useState<LeadMeetingRecord | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
    monday.setDate(today.getDate() - daysFromMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const leadId = lead?._id;
  const isCalendarTabActive = activeTab === "calendar";
  const userTimeZone = useMemo(() => {
    if (
      typeof Intl === "undefined" ||
      typeof Intl.DateTimeFormat !== "function"
    ) {
      return "UTC";
    }
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const calendarMonthRange = useMemo(() => {
    const start = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const end = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    return { start, end };
  }, [currentDate]);
  const calendarMonthKey = useMemo(
    () => `${currentDate.getFullYear()}-${currentDate.getMonth()}`,
    [currentDate]
  );
  const calendarRangeStartIso = calendarMonthRange.start.toISOString();
  const calendarRangeEndIso = calendarMonthRange.end.toISOString();

  const {
    data: leadSummaryResponse,
    isLoading: isLeadSummaryLoading,
    isFetching: isLeadSummaryFetching,
    refetch: refetchLeadSummary,
  } = useQuery<LeadSummaryResponse>({
    queryKey: ["lead-summary", leadId],
    queryFn: () => {
      if (!leadId) {
        throw new Error("Lead ID is required");
      }
      return leadSummaryService.getSummary(leadId);
    },
    enabled: Boolean(leadId),
  });

  const leadSummary = leadSummaryResponse?.data ?? null;

  // Query for ALL meetings (for stage detection) - always enabled, no date restrictions
  const {
    data: allLeadMeetingsResponse,
    isLoading: isAllLeadMeetingsLoading,
    isFetching: isAllLeadMeetingsFetching,
    refetch: refetchAllLeadMeetings,
  } = useQuery({
    queryKey: ["lead-all-meetings", leadId],
    queryFn: () => {
      if (!leadId) {
        throw new Error("Lead ID is required");
      }
      return calendarService.getLeadMeetings({
        personId: leadId,
        // No date restrictions - get all meetings for stage detection
        sort: "asc",
        limit: 500,
      });
    },
    enabled: Boolean(leadId), // Always enabled for stage detection
    staleTime: 30 * 1000, // Shorter stale time for stage detection
  });

  // Query for calendar month meetings (for calendar view) - only when calendar tab is active
  const {
    data: leadMeetingsResponse,
    isLoading: isLeadMeetingsLoading,
    isFetching: isLeadMeetingsFetching,
    error: leadMeetingsError,
    refetch: refetchLeadMeetings,
  } = useQuery({
    queryKey: ["lead-calendar-meetings", leadId, calendarMonthKey],
    queryFn: () => {
      if (!leadId) {
        throw new Error("Lead ID is required");
      }
      return calendarService.getLeadMeetings({
        personId: leadId,
        startDate: calendarRangeStartIso,
        endDate: calendarRangeEndIso,
        sort: "asc",
        limit: 500,
      });
    },
    enabled: Boolean(leadId && isCalendarTabActive),
    staleTime: 60 * 1000,
  });

  const deleteMeetingMutation = useMutation<
    { success: boolean; message: string },
    Error,
    string
  >({
    mutationFn: async (meetingId: string) => {
      return calendarService.deleteMeeting(meetingId);
    },
    onSuccess: async (response, meetingId) => {
      toast({
        title: "Meeting deleted",
        description:
          response.message ||
          "Meeting has been successfully deleted from your calendar.",
      });
      // Invalidate and refetch all queries
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["lead-all-meetings", leadId],
        }),
        refetchLeadMeetings(),
      ]);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete meeting",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
        variant: "destructive",
      });
    },
  });

  const {
    data: availableSlotsResponse,
    isLoading: isAvailabilityLoading,
    isFetching: isAvailabilityFetching,
    error: availabilityError,
    refetch: refetchAvailability,
  } = useQuery({
    queryKey: ["calendar-available-slots", calendarMonthKey, userTimeZone],
    queryFn: () =>
      calendarService.getAvailableSlots({
        startDate: calendarRangeStartIso,
        endDate: calendarRangeEndIso,
        durationMinutes: 30,
        intervalMinutes: 30,
        workingHours: "9,17",
        weekdaysOnly: "true",
        workingHoursTimeZone: userTimeZone,
      }),
    enabled: isCalendarTabActive,
    staleTime: 60 * 1000,
  });

  // Calendar month meetings (for calendar view display)
  const leadMeetings = useMemo<LeadMeetingRecord[]>(
    () => leadMeetingsResponse?.data ?? [],
    [leadMeetingsResponse]
  );
  const availableSlots = useMemo<AvailableSlot[]>(() => {
    const slots = availableSlotsResponse?.data ?? [];
    return slots.filter((slot) => {
      const startDate = new Date(slot.start);
      if (Number.isNaN(startDate.getTime())) {
        return false;
      }
      const weekday = startDate.getDay(); // 0 = Sun, 6 = Sat
      return weekday >= 1 && weekday <= 5;
    });
  }, [availableSlotsResponse]);

  // Use ALL meetings for stage detection (not just current month)
  const allLeadMeetings = useMemo<LeadMeetingRecord[]>(
    () => allLeadMeetingsResponse?.data ?? [],
    [allLeadMeetingsResponse]
  );

  // Notify parent component about meeting/activity stats (for stage determination)
  const prevHasAppointmentRef = useRef<boolean>(false);
  useEffect(() => {
    if (!onActivityUpdate) return;

    // Use ALL meetings for stage detection, not just current month
    const hasBookedAppointment = allLeadMeetings.length > 0;
    
    // Only call callback if the value actually changed
    if (prevHasAppointmentRef.current !== hasBookedAppointment) {
      prevHasAppointmentRef.current = hasBookedAppointment;
      onActivityUpdate({ hasBookedAppointment });
    }
  }, [allLeadMeetings, onActivityUpdate]);

  const isLeadMeetingsBusy = isLeadMeetingsLoading || isLeadMeetingsFetching;
  const isAvailabilityBusy = isAvailabilityLoading || isAvailabilityFetching;

  const refreshLeadSummaryMutation = useMutation<
    LeadSummaryResponse,
    Error,
    void
  >({
    mutationFn: async () => {
      if (!leadId) {
        throw new Error("Lead ID is required");
      }
      return leadSummaryService.refreshSummary(leadId);
    },
    onSuccess: (response) => {
      toast({
        title: "Summary refreshed",
        description:
          response?.message ||
          "AI summary updated with the latest WhatsApp, SMS, call, and email activity.",
      });
      refetchLeadSummary();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to refresh summary",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRefreshLeadSummary = () => {
    if (!leadId || refreshLeadSummaryMutation.isPending) {
      return;
    }
    refreshLeadSummaryMutation.mutate();
  };

  const isSummaryBusy =
    isLeadSummaryLoading ||
    isLeadSummaryFetching ||
    refreshLeadSummaryMutation.isPending;

  // Initialize week dates based on currentWeekStart
  useEffect(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      dates.push(date);
    }
    setWeekDates(dates);
  }, [currentWeekStart]);

  const handlePrevWeek = () => {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeekStart(prevWeek);

    // Update selected date to same day previous week
    const newSelected = new Date(selectedWeekDate);
    newSelected.setDate(newSelected.getDate() - 7);
    setSelectedWeekDate(newSelected);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeekStart(nextWeek);

    // Update selected date to same day next week
    const newSelected = new Date(selectedWeekDate);
    newSelected.setDate(newSelected.getDate() + 7);
    setSelectedWeekDate(newSelected);
  };

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const sundayFirstIndex = firstDay.getDay(); // 0 (Sun) -> 6 (Sat)
    return (sundayFirstIndex + 6) % 7; // convert to Monday-first index
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const getCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const followupTemplatesParams = useMemo(() => ({ limit: 50 }), []);
  const { data: followupTemplatesData, isLoading: isFollowupTemplatesLoading } =
    useFollowupTemplates(followupTemplatesParams);
  const followupTemplates = useMemo<Array<Record<string, any>>>(() => {
    const docs = (
      followupTemplatesData as
        | { data?: { docs?: Array<Record<string, any>> } }
        | undefined
    )?.data?.docs;
    return docs ?? [];
  }, [followupTemplatesData]);

  const leadsQueryParams = useMemo(() => {
    const params = {
      limit: 100,
      search: leadsSearch || undefined,
      companyId: lead?.companyId || undefined, // Filter by the current lead's company
    };
    console.log("🔍 Leads Query Params:", params);
    console.log("📋 Current Lead:", {
      id: lead?._id,
      name: lead?.name,
      companyId: lead?.companyId,
      companyName: lead?.companyName,
    });
    return params;
  }, [leadsSearch, lead?.companyId, lead?._id, lead?.name, lead?.companyName]);
  const { query: leadsQuery, leads: fetchedLeads } = useLeadsData(
    leadsQueryParams,
    { enabled: leadSelectorOpen }
  );
  const isLeadsLoading = leadsQuery.isLoading || leadsQuery.isFetching;
  const leadsError = leadsQuery.error as Error | null;

  // Filter leads by exact company name match (since multiple companies can share the same companyId)
  const filteredLeads = useMemo(() => {
    if (!lead?.companyName || !fetchedLeads || fetchedLeads.length === 0) {
      return fetchedLeads || [];
    }
    // Filter to only include leads with the exact same company name
    return fetchedLeads.filter((l) => l.companyName === lead.companyName);
  }, [fetchedLeads, lead?.companyName]);

  // Debug logging for fetched leads
  useEffect(() => {
    if (fetchedLeads && fetchedLeads.length > 0) {
      console.log(
        "📦 Fetched Leads:",
        fetchedLeads.map((l) => ({
          id: l._id,
          name: l.name,
          companyId: l.companyId,
          companyName: l.companyName,
        }))
      );
      console.log(
        "✅ Filtered Leads:",
        filteredLeads.map((l) => ({
          id: l._id,
          name: l.name,
          companyName: l.companyName,
        }))
      );
    }
  }, [fetchedLeads, filteredLeads]);

  const { mutate: createFollowupPlan, isPending: isCreatingFollowupPlan } =
    useCreateFollowupPlan();
  const createPlanFromCallMutation = useCreateFollowupPlanFromCall();
  const updatePlanMutation = useUpdateFollowupPlan();
  const { mutate: deleteFollowupPlan, isPending: isDeletingPlan } =
    useDeleteFollowupPlan();

  const followupPlansParams = useMemo(() => ({ limit: 100 }), []);
  const {
    data: followupPlansData,
    isLoading: isFollowupPlansLoading,
    isFetching: isFollowupPlansFetching,
    refetch: refetchFollowupPlans,
  } = useFollowupPlans(followupPlansParams);
  const followupPlans = useMemo<FollowupPlan[]>(() => {
    const docs = (
      followupPlansData as { data?: { docs?: FollowupPlan[] } } | undefined
    )?.data?.docs;
    return docs ?? [];
  }, [followupPlansData]);

  useEffect(() => {
    if (lead?._id) {
      setSelectedLeadsMap((prev) => {
        if (prev[lead._id]) {
          return prev;
        }
        return { ...prev, [lead._id]: lead };
      });
    }
  }, [lead]);

  const selectedLeadIds = useMemo(
    () => Object.keys(selectedLeadsMap),
    [selectedLeadsMap]
  );

  const selectedLeads = useMemo(
    () => Object.values(selectedLeadsMap),
    [selectedLeadsMap]
  );

  const leadFollowupPlans = useMemo(() => {
    if (!lead?._id) {
      return [];
    }
    return followupPlans.filter((plan) =>
      plan.todo?.some((todo) => {
        const personId =
          typeof todo.personId === "string"
            ? todo.personId
            : todo.personId?._id;
        return personId === lead._id;
      })
    );
  }, [followupPlans, lead?._id]);

  const sortedLeadFollowupPlans = useMemo(
    () =>
      [...leadFollowupPlans].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      ),
    [leadFollowupPlans]
  );

  function formatRelativeTime(value?: string) {
    if (!value) {
      return "Unknown";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return formatDistanceToNow(date, { addSuffix: true });
  }

  const summaryParagraphs = useMemo(() => {
    if (!leadSummary?.summary) {
      return [];
    }
    return leadSummary.summary
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, [leadSummary?.summary]);

  const summaryStatusLabel = useMemo(() => {
    if (!leadSummary?.status) {
      return "Summary will generate automatically within 24h.";
    }
    if (leadSummary.status === "completed") {
      return leadSummary.lastGeneratedAt
        ? `Updated ${formatRelativeTime(leadSummary.lastGeneratedAt)}`
        : "Summary ready";
    }
    if (leadSummary.status === "failed") {
      return leadSummary.failureReason
        ? `Last run failed: ${leadSummary.failureReason}`
        : "Unable to generate summary.";
    }
    return "Generating the latest summary...";
  }, [
    leadSummary?.status,
    leadSummary?.lastGeneratedAt,
    leadSummary?.failureReason,
  ]);

  const summaryScoreValue =
    typeof leadSummary?.momentumScore === "number"
      ? Math.max(0, Math.min(100, Math.round(leadSummary.momentumScore)))
      : null;
  const summaryProgress = (summaryScoreValue ?? 0) / 100;
  const summaryCircleRadius = 45;
  const summaryCircumference = 2 * Math.PI * summaryCircleRadius;
  const summaryDashoffset =
    summaryCircumference * (1 - Math.min(1, Math.max(0, summaryProgress)));

  const meetingDayMap = useMemo(() => {
    const map = new Map<number, LeadMeetingRecord[]>();
    leadMeetings.forEach((meeting) => {
      const startDate = new Date(meeting.startDateTime);
      if (
        Number.isNaN(startDate.getTime()) ||
        startDate.getMonth() !== currentDate.getMonth() ||
        startDate.getFullYear() !== currentDate.getFullYear()
      ) {
        return;
      }
      const day = startDate.getDate();
      const existing = map.get(day) ?? [];
      existing.push(meeting);
      map.set(day, existing);
    });
    return map;
  }, [leadMeetings, currentDate]);

  const availabilityDayMap = useMemo(() => {
    const map = new Map<number, AvailableSlot[]>();
    availableSlots.forEach((slot) => {
      const startDate = new Date(slot.start);
      if (
        Number.isNaN(startDate.getTime()) ||
        startDate.getMonth() !== currentDate.getMonth() ||
        startDate.getFullYear() !== currentDate.getFullYear()
      ) {
        return;
      }
      const day = startDate.getDate();
      const existing = map.get(day) ?? [];
      existing.push(slot);
      map.set(day, existing);
    });
    return map;
  }, [availableSlots, currentDate]);

  const sortedMeetings = useMemo(() => {
    if (!leadMeetings.length) {
      return [];
    }
    // Filter meetings for the selected week date
    const filtered = leadMeetings.filter((meeting) => {
      const meetingDate = new Date(meeting.startDateTime);
      return (
        meetingDate.getDate() === selectedWeekDate.getDate() &&
        meetingDate.getMonth() === selectedWeekDate.getMonth() &&
        meetingDate.getFullYear() === selectedWeekDate.getFullYear()
      );
    });
    return filtered.sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime()
    );
  }, [leadMeetings, selectedWeekDate]);

  const nextAvailableSlots = useMemo<HydratedSlot[]>(() => {
    if (!availableSlots.length) {
      return [];
    }
    return availableSlots
      .map((slot) => ({
        ...slot,
        startDate: new Date(slot.start),
        endDate: new Date(slot.end),
      }))
      .filter(
        (slot) =>
          !Number.isNaN(slot.startDate.getTime()) &&
          slot.endDate.getTime() > Date.now()
      )
      .sort((a, b) => slotComparator(a.startDate, b.startDate))
      .slice(0, 5);
  }, [availableSlots]);

  const leadMeetingsErrorMessage = resolveErrorMessage(leadMeetingsError);
  const availabilityErrorMessage = resolveErrorMessage(availabilityError);
  const isCalendarDataBusy =
    isLeadMeetingsLoading ||
    isLeadMeetingsFetching ||
    isAvailabilityLoading ||
    isAvailabilityFetching;
  const todayRef = new Date();
  const nowTimestamp = todayRef.getTime();

  const getTemplateTitle = (plan: FollowupPlan) => {
    if (typeof plan.templateId === "string") {
      return "Followup Plan";
    }
    return plan.templateId?.title || "Followup Plan";
  };

  const getDisplayTime = (scheduledFor?: string, isComplete?: boolean) => {
    return formatFollowupTaskTime(scheduledFor, isComplete);
  };

  const getPlanStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/15 text-green-300 border border-green-400/30";
      case "in_progress":
        return "bg-blue-500/15 text-blue-200 border border-blue-400/30";
      case "failed":
        return "bg-red-500/15 text-red-300 border border-red-400/30";
      default:
        return "bg-white/10 text-white border border-white/20";
    }
  };

  const syncMeetingsMutation = useMutation<SyncMeetingsResponse, Error, void>({
    mutationFn: async () => {
      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      return calendarService.syncMeetings({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Calendar synced",
        description:
          response.message ||
          `Synced ${response.data.syncedMeetings} meetings from Outlook calendar.`,
      });
      // Refresh the meetings data after sync
      void refetchLeadMeetings();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to sync calendar",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRefreshCalendarData = () => {
    // First sync with Outlook calendar
    syncMeetingsMutation.mutate();
    // Then refresh availability slots
    void refetchAvailability();
  };

  const handleToggleLeadSelection = (leadItem: Lead) => {
    const leadId = leadItem?._id || (leadItem as any)?.id;
    if (!leadId) {
      return;
    }
    setSelectedLeadsMap((prev) => {
      const next = { ...prev };
      if (next[leadId]) {
        delete next[leadId];
      } else {
        next[leadId] = leadItem;
      }
      return next;
    });
  };

  const resetFollowupForm = () => {
    setSelectedTemplateId("");
    setLeadsSearch("");
    if (lead?._id) {
      setSelectedLeadsMap({ [lead._id]: lead });
    } else {
      setSelectedLeadsMap({});
    }
  };

  const handleRequestPlanDeletion = (plan: FollowupPlan) => {
    setPlanPendingDelete(plan);
  };

  const handleCancelPlanDeletion = () => {
    if (isDeletingPlan) {
      return;
    }
    setPlanPendingDelete(null);
  };

  const handleConfirmPlanDeletion = () => {
    if (!planPendingDelete) {
      return;
    }

    deleteFollowupPlan(planPendingDelete._id, {
      onSuccess: (response) => {
        toast({
          title: "Followup plan deleted",
          description:
            response?.message ||
            `Removed plan "${getTemplateTitle(planPendingDelete)}".`,
        });
        setPlanPendingDelete(null);
      },
      onError: (error: any) => {
        toast({
          title: "Failed to delete followup plan",
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const handleRunFollowupPlan = () => {
    if (!selectedTemplateId) {
      toast({
        title: "Select a followup template",
        description: "Choose which template to use before starting a plan.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLeadIds.length) {
      toast({
        title: "Select at least one lead",
        description: "Pick one or more leads to include in the followup plan.",
        variant: "destructive",
      });
      return;
    }

    createFollowupPlan(
      {
        templateId: selectedTemplateId,
        personIds: selectedLeadIds,
      },
      {
        onSuccess: (response) => {
          toast({
            title: "Followup plan started",
            description:
              response.message ||
              "We'll keep this lead updated with the followup plan status.",
          });
          resetFollowupForm();
        },
        onError: (error: any) => {
          toast({
            title: "Failed to start followup plan",
            description:
              error?.response?.data?.message ||
              error?.message ||
              "Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <>
      <Card
        className="w-full flex flex-col rounded-3xl h-[calc(100vh-200px)] min-h-0"
        style={{
          background:
            "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
          border: "1px solid #FFFFFF0D",
        }}
      >
        <CardContent className="p-6 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <Tabs
            value={topLevelTab}
            onValueChange={(value) =>
              setTopLevelTab(value as "activity" | "company")
            }
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Top-level Activity / Company toggle (replaces static heading) */}
            <div className="mb-4">
              <TabsList className="bg-transparent p-0 h-auto gap-4 border-none">
                <TabsTrigger
                  value="activity"
                  className="px-0 py-2 text-xs font-medium sm:text-sm text-white/60 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                >
                  Activity
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                </TabsTrigger>
                <TabsTrigger
                  value="company"
                  className="px-0 py-2 text-xs font-medium sm:text-sm text-white/60 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                >
                  Company
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Activity content (existing inner tabs) */}
            <TabsContent
              value="activity"
              className="mt-2 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mb-6"
              >
                <TabsList className="bg-transparent p-0 h-auto gap-4 border-none">
                  <TabsTrigger
                    value="summary"
                    className="px-0 py-2 text-xs font-medium sm:text-sm text-white/40 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                  >
                    Summary
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendar"
                    className="px-0 py-2 text-xs font-medium sm:text-sm text-white/40 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                  >
                    Calendar
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="campaigns"
                    className="px-0 py-2 text-xs font-medium sm:text-sm text-white/40 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none relative group"
                  >
                    Follow-up
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white hidden group-data-[state=active]:block" />
                  </TabsTrigger>
                </TabsList>

                {/* Summary Tab Content */}
                <TabsContent value="summary" className="mt-6">
                  {/* Default Summary Content */}
                  <div className="flex flex-col items-center">
                    {/* Circular Progress Indicator */}
                    <div className="relative w-48 h-48 mb-4">
                      <svg
                        className="w-full h-full transform -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="#1a1a1a"
                          strokeWidth="8"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="url(#gradient)"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${summaryCircumference}`}
                          strokeDashoffset={`${summaryDashoffset}`}
                        />
                        {/* Gradient definition */}
                        <defs>
                          <linearGradient
                            id="gradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                          >
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Percentage text */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">
                          {summaryScoreValue !== null
                            ? `${summaryScoreValue}%`
                            : "--"}
                        </span>
                      </div>
                    </div>

                    {/* Text below circle */}
                    <p className="text-white text-center mb-8 text-xs text-white/70">
                      {summaryScoreValue !== null
                        ? "Based on recent WhatsApp, SMS, email, and call activity."
                        : "Run the AI summary to compute the engagement score."}
                    </p>

                    {/* AI Summary Section */}
                    <div
                      className="w-full rounded-lg p-4"
                      style={{
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        background: "rgba(255, 255, 255, 0.02)",
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <h3 className="text-white text-xs sm:text-sm font-semibold">
                          AI Summary
                        </h3>
                        <button
                          onClick={handleRefreshLeadSummary}
                          disabled={
                            !leadId || refreshLeadSummaryMutation.isPending
                          }
                          className="h-8 w-8 p-0 flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] leading-tight text-white/50 mb-3 whitespace-nowrap overflow-hidden text-ellipsis">
                        {summaryStatusLabel}
                      </p>
                      <div className="text-white/80 text-xs  space-y-3 leading-relaxed min-h-[140px]">
                        {isSummaryBusy ? (
                          <div className="flex items-center text-white/60 text-xs">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating the latest insights...
                          </div>
                        ) : summaryParagraphs.length > 0 ? (
                          summaryParagraphs.map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                          ))
                        ) : (
                          <div className="text-white/60 text-xs">
                            No WhatsApp, SMS, email, or call activity recorded
                            for {lead?.name || "this lead"} in the last 30
                            day(s).
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Calendar Tab Content */}
                <TabsContent value="calendar" className="mt-6">
                  {!leadId ? (
                    <div
                      className="rounded-lg p-6 text-white/70 text-xs"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      Select a lead to view scheduled meetings and availability.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Calendar Widget */}
                      <div
                        className="rounded-lg p-4"
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        {/* Week Navigation Header */}
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={handlePrevWeek}
                            className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            aria-label="Previous week"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <div className="text-xs font-medium text-white">
                            {monthNames[currentWeekStart.getMonth()]}{" "}
                            {currentWeekStart.getFullYear()}
                          </div>

                          <button
                            onClick={handleNextWeek}
                            className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            aria-label="Next week"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Week dates selector */}
                        <div className="flex items-center justify-center gap-1.5 mb-4">
                          {weekDates.map((date, index) => {
                            const isSelected =
                              date.toDateString() ===
                              selectedWeekDate.toDateString();
                            const isToday =
                              date.toDateString() === new Date().toDateString();
                            // Map day index (0=Sunday, 1=Monday, etc.) to our week array (0=Monday, 6=Sunday)
                            const dayIndex = date.getDay();
                            const weekDayIndex =
                              dayIndex === 0 ? 6 : dayIndex - 1;
                            const dayNames = [
                              "Mo",
                              "Tu",
                              "We",
                              "Th",
                              "Fr",
                              "Sa",
                              "Su",
                            ];
                            const dayName = dayNames[weekDayIndex];
                            const dayNumber = date.getDate();

                            return (
                              <button
                                key={index}
                                onClick={() => setSelectedWeekDate(date)}
                                className={`flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 relative overflow-hidden ${
                                  isSelected
                                    ? "border-2 border-primary"
                                    : "border border-white/10 hover:border-white/20"
                                }`}
                                style={{
                                  background: isSelected
                                    ? `linear-gradient(180deg, rgba(104, 177, 184, 0.25) 0%, rgba(104, 177, 184, 0.1) 100%)`
                                    : `linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)`,
                                }}
                              >
                                <span
                                  className={`text-[8px] font-medium ${
                                    isSelected
                                      ? "text-primary"
                                      : "text-white/50"
                                  }`}
                                >
                                  {dayName}
                                </span>
                                <span
                                  className={`text-xs font-semibold ${
                                    isSelected
                                      ? "text-white"
                                      : isToday
                                      ? "text-primary"
                                      : "text-white/80"
                                  }`}
                                >
                                  {dayNumber}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs text-white/70">
                          <span>
                            {sortedMeetings.length > 0
                              ? `${sortedMeetings.length} meeting${
                                  sortedMeetings.length === 1 ? "" : "s"
                                } on ${
                                  monthNames[selectedWeekDate.getMonth()]
                                } ${selectedWeekDate.getDate()}`
                              : `No meetings on ${
                                  monthNames[selectedWeekDate.getMonth()]
                                } ${selectedWeekDate.getDate()}`}
                          </span>
                          <div className="flex items-center justify-center gap-2">
                            <ActiveNavButton
                              icon={
                                isCalendarDataBusy ||
                                syncMeetingsMutation.isPending
                                  ? Loader2
                                  : RefreshCcw
                              }
                              iconClassName={
                                isCalendarDataBusy ||
                                syncMeetingsMutation.isPending
                                  ? "animate-spin"
                                  : ""
                              }
                              text={
                                syncMeetingsMutation.isPending
                                  ? "Syncing..."
                                  : "Refresh"
                              }
                              onClick={handleRefreshCalendarData}
                              disabled={
                                isCalendarDataBusy ||
                                syncMeetingsMutation.isPending
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Data Sections */}
                      <div className="space-y-6">
                        <div
                          className="rounded-lg p-6"
                          style={{
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <h3 className="text-white font-semibold text-xs sm:text-sm">
                              Scheduled Meetings
                            </h3>
                            <button
                              onClick={handleRefreshCalendarData}
                              disabled={
                                isLeadMeetingsBusy ||
                                syncMeetingsMutation.isPending
                              }
                              className="h-8 w-8 p-0 flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <RefreshCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {isLeadMeetingsBusy ? (
                            <div className="flex items-center gap-2 text-white/60 text-xs">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading meetings...
                            </div>
                          ) : sortedMeetings.length > 0 ? (
                            <div className="space-y-3">
                              {sortedMeetings.map((meeting) => {
                                const meetingEnd = new Date(
                                  meeting.endDateTime
                                );
                                const meetingCompleted =
                                  meetingEnd.getTime() < nowTimestamp;
                                return (
                                  <div
                                    key={meeting._id}
                                    className="rounded-lg p-4 border border-white/10 bg-white/5"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <div>
                                        <p className="text-white font-semibold text-xs sm:text-sm">
                                          {meeting.subject || "Meeting"}
                                        </p>
                                        <p className="text-xs text-white/60">
                                          {formatDateTimeRange(
                                            meeting.startDateTime,
                                            meeting.endDateTime
                                          )}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap justify-end">
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            className={
                                              meeting.status === "completed"
                                                ? "bg-teal-500/20 text-teal-200 border border-teal-400/40"
                                                : meeting.status === "cancelled"
                                                ? "bg-red-500/20 text-red-200 border border-red-400/40"
                                                : "bg-indigo-500/20 text-indigo-200 border border-indigo-400/40"
                                            }
                                          >
                                            {meeting.status === "completed"
                                              ? "Completed"
                                              : meeting.status === "cancelled"
                                              ? "Cancelled"
                                              : "Scheduled"}
                                          </Badge>
                                          {meeting.recall?.status && (
                                            <Badge
                                              className={
                                                meeting.recall.status ===
                                                "active"
                                                  ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/50"
                                                  : meeting.recall.status ===
                                                      "starting" ||
                                                    meeting.recall.status ===
                                                      "scheduled"
                                                  ? "bg-sky-500/15 text-sky-100 border border-sky-400/40"
                                                  : meeting.recall.status ===
                                                    "failed"
                                                  ? "bg-red-500/20 text-red-100 border border-red-400/40"
                                                  : "bg-slate-500/20 text-slate-100 border border-slate-400/40"
                                              }
                                            >
                                              {meeting.recall.status ===
                                              "active"
                                                ? "Recall active"
                                                : meeting.recall.status ===
                                                    "starting" ||
                                                  meeting.recall.status ===
                                                    "scheduled"
                                                ? "Recall pending"
                                                : meeting.recall.status ===
                                                  "failed"
                                                ? "Recall failed"
                                                : "Recall ended"}
                                            </Badge>
                                          )}
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-200 hover:text-red-100 hover:bg-red-500/10 h-6 w-6 p-0"
                                          onClick={() =>
                                            setMeetingPendingDelete(meeting)
                                          }
                                          disabled={
                                            deleteMeetingMutation.isPending
                                          }
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    {meeting.body && (
                                      <p className="text-xs text-white/70 mt-2">
                                        {meeting.body.length > 200
                                          ? `${meeting.body.substring(
                                              0,
                                              200
                                            )}...`
                                          : meeting.body}
                                      </p>
                                    )}
                                    {meeting.webLink && (
                                      <a
                                        href={meeting.webLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-sky-300 hover:text-sky-200 mt-2 inline-block"
                                      >
                                        Open calendar event →
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-white/60">
                              No meetings scheduled for this lead in{" "}
                              {monthNames[currentDate.getMonth()]}.
                            </div>
                          )}
                          {leadMeetingsErrorMessage && (
                            <div className="text-xs text-red-300 mt-3">
                              {leadMeetingsErrorMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Followup Campaigns Tab Content */}
                <TabsContent value="campaigns" className="mt-6 space-y-5">
                  <div
                    className="rounded-2xl p-6 space-y-4"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="flex flex-col items-start justify-between gap-4">
                      <div className="flex justify-between gap-4 items-center w-full">
                        <p className="text-xs font-semibold sm:text-sm">
                          Existing followups
                        </p>
                        <button
                          onClick={() => refetchFollowupPlans()}
                          disabled={isFollowupPlansFetching}
                          className="h-8 w-8 p-0 flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-white/60">
                        Plans that already include this lead will show here so
                        you can track status.
                      </p>
                    </div>

                    {isFollowupPlansLoading ? (
                      <div className="flex items-center justify-center py-6 text-sm text-white/60">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading followup plans...
                      </div>
                    ) : sortedLeadFollowupPlans.length > 0 ? (
                      <div className="space-y-3">
                        {sortedLeadFollowupPlans.map((plan) => {
                          const totalTasks = plan.todo?.length ?? 0;
                          const completedTasks =
                            plan.todo?.filter((task) => task.isComplete)
                              .length ?? 0;
                          const nextTask = plan.todo?.find(
                            (task) => !task.isComplete
                          );
                          const canDeletePlan = [
                            "scheduled",
                            "in_progress",
                          ].includes(plan.status);
                          const isPlanDeletePending =
                            planPendingDelete?._id === plan._id &&
                            isDeletingPlan;
                          return (
                            <div
                              key={plan._id}
                              className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="text-white font-semibold">
                                    {getTemplateTitle(plan)}
                                  </p>
                                  <p className="text-xs text-white/60">
                                    Started {formatRelativeTime(plan.createdAt)}
                                    {plan.updatedAt &&
                                      plan.updatedAt !== plan.createdAt && (
                                        <>
                                          {" "}
                                          · Updated{" "}
                                          {formatRelativeTime(plan.updatedAt)}
                                        </>
                                      )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    className={getPlanStatusBadgeClass(
                                      plan.status
                                    )}
                                  >
                                    {plan.status.replace("_", " ")}
                                  </Badge>
                                  {canDeletePlan && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-200 hover:text-red-100 hover:bg-red-500/10"
                                      onClick={() =>
                                        handleRequestPlanDeletion(plan)
                                      }
                                      disabled={isPlanDeletePending}
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-white/70 flex flex-wrap gap-4">
                                <span>
                                  Tasks: {completedTasks}/{totalTasks}
                                </span>
                                {nextTask && (
                                  <span>
                                    Next up: {nextTask.type.replace("_", " ")}
                                    {nextTask.scheduledFor
                                      ? ` ${getDisplayTime(
                                          nextTask.scheduledFor,
                                          false
                                        )}`
                                      : ""}
                                  </span>
                                )}
                                <span>ID: {plan._id.slice(-6)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-white/60">
                        No followup plans include this lead yet.
                      </div>
                    )}
                  </div>

                  <div
                    className="rounded-2xl p-6 space-y-4"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div className="flex items-start gap-3 text-white">
                      <div className="p-2 rounded-full bg-white/10">
                        <Info className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold">
                          Automate followups
                        </p>
                        <p className="text-xs text-white/60">
                          Choose a followup template and select leads to
                          immediately create a personalized followup plan.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs text-white/60">
                          Followup template
                        </span>
                        <Select
                          value={selectedTemplateId}
                          onValueChange={setSelectedTemplateId}
                          disabled={
                            isFollowupTemplatesLoading ||
                            followupTemplates.length === 0
                          }
                        >
                          <SelectTrigger className="bg-white/5 text-white border-white/10">
                            <SelectValue
                              placeholder={
                                isFollowupTemplatesLoading
                                  ? "Loading templates..."
                                  : followupTemplates.length
                                  ? "Select a template"
                                  : "No templates available"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0b0f20] text-white border-white/10 max-h-72">
                            {followupTemplates.map((template) => (
                              <SelectItem
                                key={template._id}
                                value={template._id}
                              >
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs font-medium">
                                    {template.title}
                                  </span>
                                  <span className="text-[11px] text-white/60">
                                    {template.numberOfDaysToRun} days ·{" "}
                                    {template.numberOfEmails} emails ·{" "}
                                    {template.numberOfCalls} calls
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs text-white/60">Leads</span>
                        <Popover
                          open={leadSelectorOpen}
                          onOpenChange={setLeadSelectorOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full text-xs justify-between bg-white/5 text-white border-white/10 hover:bg-white/10"
                            >
                              <span>
                                {selectedLeadIds.length > 0
                                  ? `${selectedLeadIds.length} ${
                                      selectedLeadIds.length === 1
                                        ? "lead"
                                        : "leads"
                                    } selected`
                                  : "Select leads"}
                              </span>
                              <ChevronRight className="w-4 h-4 opacity-70" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[360px] p-0 bg-[#101426] border-white/10">
                            <Command>
                              <CommandInput
                                placeholder="Search leads"
                                value={leadsSearch}
                                onValueChange={setLeadsSearch}
                                className="text-white placeholder:text-white/40"
                              />
                              <CommandList>
                                {isLeadsLoading ? (
                                  <div className="flex items-center justify-center py-4 text-xs text-white/60">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Loading leads...
                                  </div>
                                ) : (
                                  <>
                                    <CommandEmpty className="p-4 text-xs text-white/60">
                                      No leads found.
                                    </CommandEmpty>
                                    <CommandGroup className="max-h-64 overflow-y-auto">
                                      {filteredLeads.map((leadItem) => {
                                        const leadId =
                                          leadItem?._id ||
                                          (leadItem as any)?.id;
                                        if (!leadId) {
                                          return null;
                                        }
                                        const isSelected = Boolean(
                                          selectedLeadsMap[leadId]
                                        );
                                        return (
                                          <CommandItem
                                            key={leadId}
                                            className="flex items-center gap-3 cursor-pointer"
                                            onSelect={() =>
                                              handleToggleLeadSelection(
                                                leadItem
                                              )
                                            }
                                          >
                                            <Checkbox
                                              checked={isSelected}
                                              onCheckedChange={() =>
                                                handleToggleLeadSelection(
                                                  leadItem
                                                )
                                              }
                                              className="border-white/40 data-[state=checked]:bg-white/90"
                                            />
                                            <div className="flex flex-col">
                                              <span className="text-xs text-white">
                                                {leadItem.name ||
                                                  "Unnamed lead"}
                                              </span>
                                              <span className="text-xs text-white/60">
                                                {leadItem.companyName ||
                                                  leadItem.position ||
                                                  "Unknown organization"}
                                              </span>
                                            </div>
                                          </CommandItem>
                                        );
                                      })}
                                    </CommandGroup>
                                    {leadsError && (
                                      <div className="px-4 py-3 text-xs text-red-300">
                                        {leadsError.message}
                                      </div>
                                    )}
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                        {selectedLeads.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {selectedLeads.map((leadItem) => {
                              const leadId =
                                leadItem?._id || (leadItem as any)?.id;
                              if (!leadId) {
                                return null;
                              }
                              return (
                                <Badge
                                  key={leadId}
                                  variant="secondary"
                                  className="bg-white/10 text-white border border-white/20 text-xs flex items-center gap-1 w-full justify-between hover:bg-white/20"
                                >
                                  {(() => {
                                    const text = `${
                                      leadItem.name || "Lead"
                                    } · ${
                                      leadItem.companyName ||
                                      leadItem.position ||
                                      "Unknown"
                                    }`;
                                    return (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-[10px] font-medium cursor-default">
                                            {text.length > 20
                                              ? `${text.slice(0, 30)}...`
                                              : text}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{text}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  })()}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleLeadSelection(leadItem)
                                    }
                                    className="ml-1 text-blue-400 hover:text-blue-300 transition-colors"
                                    aria-label="Remove lead"
                                  >
                                    x
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-white/10">
                        <div className="text-xs text-white/60">
                          Each selected lead will get a personalized followup
                          plan using the template above.
                        </div>
                        <Button
                          onClick={handleRunFollowupPlan}
                          disabled={isCreatingFollowupPlan}
                          className="bg-white/10 hover:bg-white/20 text-white border border-white/30 text-xs"
                        >
                          {isCreatingFollowupPlan ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <MoveRight className="w-4 h-4 mr-2" />
                              Run Followup
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Company content */}
            <TabsContent
              value="company"
              className="mt-2 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <CompanyTab lead={lead} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(planPendingDelete)}
        title="Delete followup plan?"
        description={
          planPendingDelete
            ? `This will immediately delete "${getTemplateTitle(
                planPendingDelete
              )}" and its scheduled tasks for all included leads.`
            : undefined
        }
        confirmText="Delete plan"
        confirmVariant="destructive"
        isPending={isDeletingPlan}
        onConfirm={handleConfirmPlanDeletion}
        onCancel={handleCancelPlanDeletion}
      />

      <ConfirmDialog
        open={Boolean(meetingPendingDelete)}
        title="Delete meeting?"
        description={
          meetingPendingDelete
            ? `This will permanently delete "${
                meetingPendingDelete.subject || "this meeting"
              }" from your Microsoft calendar and remove it from the lead's record.`
            : undefined
        }
        confirmText="Delete meeting"
        confirmVariant="destructive"
        isPending={deleteMeetingMutation.isPending}
        onConfirm={() => {
          if (!meetingPendingDelete) return;
          deleteMeetingMutation.mutate(meetingPendingDelete._id);
          setMeetingPendingDelete(null);
        }}
        onCancel={() => setMeetingPendingDelete(null)}
      />
    </>
  );
};

export default Activity;
