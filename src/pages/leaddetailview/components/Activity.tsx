import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  ChevronRight,
  Check,
  Info,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { useFollowupTemplates } from "@/hooks/useFollowupTemplates";
import {
  useCreateFollowupPlan,
  useDeleteFollowupPlan,
  useFollowupPlans,
} from "@/hooks/useFollowupPlans";
import { useLeadsData } from "@/pages/companies/hooks";
import { Lead } from "@/services/leads.service";
import { FollowupPlan } from "@/services/followupPlans.service";
import { useToast } from "@/hooks/use-toast";
import {
  leadSummaryService,
  LeadSummaryResponse,
} from "@/services/leadSummary.service";
import { format, formatDistanceToNow } from "date-fns";
import { formatFollowupTaskTime, getNextUpMessage } from "@/utils/followupTaskTime";
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
}) => {
  const [topLevelTab, setTopLevelTab] = useState<"activity" | "company">(
    "activity"
  );
  const [activeTab, setActiveTab] = useState("summary");
  const [recordingAudioUrl, setRecordingAudioUrl] = useState<string | null>(
    null
  );
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
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
  const { toast } = useToast();
  const leadId = lead?._id;
  const isCalendarTabActive = activeTab === "calendar";
  const userTimeZone = useMemo(() => {
    if (typeof Intl === "undefined" || typeof Intl.DateTimeFormat !== "function") {
      return "UTC";
    }
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const calendarMonthRange = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
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
    onSuccess: (response, meetingId) => {
      toast({
        title: "Meeting deleted",
        description: response.message || "Meeting has been successfully deleted from your calendar.",
      });
      refetchLeadMeetings();
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
  const isLeadMeetingsBusy =
    isLeadMeetingsLoading || isLeadMeetingsFetching;
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

  // Switch to summary tab when a view is selected
  useEffect(() => {
    if (selectedCallLogView) {
      setActiveTab("summary");
    }
  }, [selectedCallLogView]);

  // Load recording audio URL when recording view is selected
  const loadRecordingAudio = useCallback(
    async (logId: string) => {
      setRecordingAudioUrl(null);
      setRecordingError(null);
      try {
        setRecordingLoading(true);
        const response = await API.get(`/twilio/calls/${logId}/recording`, {
          responseType: "blob",
        });
        const blob = response.data as Blob;
        const url = URL.createObjectURL(blob);
        setRecordingAudioUrl(url);
      } catch (err: any) {
        console.error("Failed to load call recording", err);
        setRecordingError(
          err?.response?.data?.error ||
            err?.message ||
            "Unable to load call recording."
        );
      } finally {
        setRecordingLoading(false);
      }
    },
    []
  );

  // Load recording when a recording view is selected
  useEffect(() => {
    if (
      selectedCallLogView?.type === "recording" &&
      selectedCallLogView.log._id
    ) {
      loadRecordingAudio(selectedCallLogView.log._id);
    }
  }, [selectedCallLogView, loadRecordingAudio]);

  // Clean up recording URL and state when recording view is cleared
  useEffect(() => {
    if (!selectedCallLogView || selectedCallLogView.type !== "recording") {
      if (recordingAudioUrl) {
        URL.revokeObjectURL(recordingAudioUrl);
        setRecordingAudioUrl(null);
      }
      setRecordingError(null);
      setRecordingLoading(false);
    }
  }, [selectedCallLogView, recordingAudioUrl]);

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

  const leadsQueryParams = useMemo(
    () => ({
      limit: 100,
      search: leadsSearch || undefined,
    }),
    [leadsSearch]
  );
  const { query: leadsQuery, leads: fetchedLeads } = useLeadsData(
    leadsQueryParams,
    { enabled: leadSelectorOpen }
  );
  const isLeadsLoading = leadsQuery.isLoading || leadsQuery.isFetching;
  const leadsError = leadsQuery.error as Error | null;

  const { mutate: createFollowupPlan, isPending: isCreatingFollowupPlan } =
    useCreateFollowupPlan();
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
    return [...leadMeetings].sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() -
        new Date(b.startDateTime).getTime()
    );
  }, [leadMeetings]);

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

  const syncMeetingsMutation = useMutation<
    SyncMeetingsResponse,
    Error,
    void
  >({
    mutationFn: async () => {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
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
        description: response.message || `Synced ${response.data.syncedMeetings} meetings from Outlook calendar.`,
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
        className="w-full h-full flex-1 min-h-0 flex flex-col rounded-3xl"
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
                  className="px-0 py-2 text-xl font-bold text-white/60 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-white"
                >
                  Activity
                </TabsTrigger>
                <TabsTrigger
                  value="company"
                  className="px-0 py-2 text-xl font-bold text-white/60 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-white"
                >
                  Company
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
                    className="px-0 py-2 text-white/40 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-white font-medium"
                  >
                    Summary
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendar"
                    className="px-0 py-2 text-white/40 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-white font-medium"
                  >
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger
                    value="campaigns"
                    className="px-0 py-2 text-white/40 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:shadow-none border-none rounded-none data-[state=active]:border-b-2 data-[state=active]:border-white font-medium"
                  >
                    Followup Campaigns
                  </TabsTrigger>
                </TabsList>

                {/* Summary Tab Content */}
                <TabsContent value="summary" className="mt-6">
              {selectedCallLogView ? (
                // Selected Call Log View Content
                <div className="flex flex-col items-center space-y-6">
                  {/* Circular Progress Indicator with Score */}
                  {(() => {
                    // Calculate the score for the selected view
                    let viewScore: number | null = null;
                    if (
                      selectedCallLogView.type === "followup" ||
                      selectedCallLogView.type === "transcription" ||
                      selectedCallLogView.type === "recording"
                    ) {
                      const rawScore = selectedCallLogView.log.leadSuccessScore;
                      if (
                        typeof rawScore === "number" &&
                        !Number.isNaN(rawScore)
                      ) {
                        viewScore = Math.max(0, Math.min(100, Math.round(rawScore)));
                      }
                    }
                    // Use view score if available, otherwise fall back to summary score
                    const displayScore = viewScore !== null ? viewScore : summaryScoreValue;
                    const displayProgress = (displayScore ?? 0) / 100;
                    const displayDashoffset =
                      summaryCircumference * (1 - Math.min(1, Math.max(0, displayProgress)));

                    return (
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
                            stroke="url(#gradient-view)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${summaryCircumference}`}
                            strokeDashoffset={`${displayDashoffset}`}
                          />
                          {/* Gradient definition */}
                          <defs>
                            <linearGradient
                              id="gradient-view"
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
                            {displayScore !== null ? `${displayScore}%` : "--"}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* View-specific content */}
                  {selectedCallLogView.type === "followup" && (
                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Follow-up suggestions
                          </h3>
                          <p className="text-xs text-white/60 mt-1">
                            Based on the last call with{" "}
                            <span className="font-medium">
                              {selectedCallLogView.log.leadName || "this lead"}
                            </span>{" "}
                            on {formatCallDate(selectedCallLogView.log.startedAt)}
                            .
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-white/60 hover:text-white"
                          onClick={() => setSelectedCallLogView(null)}
                        >
                          ✕
                        </Button>
                      </div>

                      <div className="space-y-4 max-h-[calc(100vh-500px)] overflow-y-auto pr-1">
                        <div
                          className="rounded-lg p-4"
                          style={{
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            background: "rgba(255, 255, 255, 0.02)",
                          }}
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 mb-1">
                            Summary
                          </p>
                          <p className="text-sm text-white/80">
                            {selectedCallLogView.log.followupSuggestionSummary ||
                              "No summary available for this call."}
                          </p>
                        </div>

                        {Array.isArray(
                          (selectedCallLogView.log.followupSuggestionMetadata as any)
                            ?.raw?.touchpoints
                        ) &&
                          (selectedCallLogView.log.followupSuggestionMetadata as any)
                            .raw.touchpoints.length > 0 && (
                            <div
                              className="rounded-lg p-4 space-y-3"
                              style={{
                                border: "1px solid rgba(255, 255, 255, 0.2)",
                                background: "rgba(255, 255, 255, 0.02)",
                              }}
                            >
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                                Recommended touchpoints
                              </p>
                              <div className="space-y-3">
                                {(
                                  selectedCallLogView.log
                                    .followupSuggestionMetadata as any
                                ).raw.touchpoints.map(
                                  (
                                    tp: {
                                      offset_hours?: number;
                                      channel?: string;
                                      message?: string;
                                    },
                                    index: number
                                  ) => (
                                    <div
                                      key={index}
                                      className="rounded-xl bg-black/40 border border-white/10 p-3"
                                    >
                                      <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="text-xs font-semibold text-white/80">
                                          Step {index + 1}
                                        </span>
                                        <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-white/10 text-white/80 uppercase tracking-[0.18em]">
                                          {tp.channel || "unspecified"}
                                        </span>
                                      </div>
                                      {typeof tp.offset_hours === "number" && (
                                        <p className="text-[0.7rem] text-white/60 mb-1">
                                          In approximately{" "}
                                          <span className="font-medium text-white/80">
                                            {tp.offset_hours} hours
                                          </span>{" "}
                                          from the end of the call.
                                        </p>
                                      )}
                                      {tp.message && (
                                        <p className="text-xs text-white/80 whitespace-pre-line">
                                          {tp.message}
                                        </p>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {selectedCallLogView.type === "transcription" && (
                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Call transcription
                          </h3>
                          <p className="text-xs text-white/60 mt-1">
                            {selectedCallLogView.log.leadName || "This lead"} —{" "}
                            {formatCallDate(selectedCallLogView.log.startedAt)} •{" "}
                            {formatDuration(
                              selectedCallLogView.log.durationSeconds
                            )}
                          </p>
                          {selectedCallLogView.log.transcriptionProvider && (
                            <p className="mt-1 text-[0.7rem] text-white/50">
                              Provider:{" "}
                              <span className="font-medium text-white/70">
                                {selectedCallLogView.log.transcriptionProvider}
                              </span>
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-white/60 hover:text-white"
                          onClick={() => setSelectedCallLogView(null)}
                        >
                          ✕
                        </Button>
                      </div>

                      <div
                        className="rounded-lg p-4 max-h-[calc(100vh-500px)] overflow-y-auto"
                        style={{
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          background: "rgba(255, 255, 255, 0.02)",
                        }}
                      >
                        {selectedCallLogView.log.transcriptionText ? (
                          <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                            {selectedCallLogView.log.transcriptionText}
                          </p>
                        ) : (
                          <p className="text-sm text-white/60">
                            No transcription available for this call.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedCallLogView.type === "recording" && (
                    <div className="w-full space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Call recording
                          </h3>
                          <p className="text-xs text-white/60 mt-1">
                            {selectedCallLogView.log.leadName || "This lead"} —{" "}
                            {formatCallDate(selectedCallLogView.log.startedAt)} •{" "}
                            {formatDuration(
                              selectedCallLogView.log.durationSeconds
                            )}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-white/60 hover:text-white"
                          onClick={() => setSelectedCallLogView(null)}
                        >
                          ✕
                        </Button>
                      </div>

                      <div
                        className="rounded-lg p-4"
                        style={{
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          background: "rgba(255, 255, 255, 0.02)",
                        }}
                      >
                        {recordingLoading && (
                          <p className="text-sm text-white/70">
                            Loading recording...
                          </p>
                        )}
                        {!recordingLoading && recordingError && (
                          <p className="text-sm text-red-300">
                            {recordingError}
                          </p>
                        )}
                        {!recordingLoading &&
                          !recordingError &&
                          recordingAudioUrl && (
                            <audio
                              controls
                              className="w-full"
                              src={recordingAudioUrl}
                            />
                          )}
                        {!recordingLoading &&
                          !recordingError &&
                          !recordingAudioUrl && (
                            <p className="text-sm text-white/60">
                              Recording not available for this call.
                            </p>
                          )}
                        <p className="mt-2 text-[0.7rem] text-white/40">
                          Playback is streamed securely from EmpaTech servers.
                          Seeking is supported by your browser's audio player.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Default Summary Content
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
                  <p className="text-white text-center mb-8 text-sm text-white/70">
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
                      <h3 className="text-white font-bold">AI Summary</h3>
                      <ActiveNavButton
                        icon={RefreshCcw}
                        text={
                          refreshLeadSummaryMutation.isPending
                            ? "Updating..."
                            : "Refresh"
                        }
                        onClick={handleRefreshLeadSummary}
                        disabled={!leadId || refreshLeadSummaryMutation.isPending}
                        className="h-8 text-xs"
                      />
                    </div>
                  <p className="text-[11px] leading-tight text-white/50 mb-3 whitespace-nowrap overflow-hidden text-ellipsis">
                      {summaryStatusLabel}
                    </p>
                    <div className="text-white/80 text-sm space-y-3 leading-relaxed min-h-[140px]">
                      {isSummaryBusy ? (
                        <div className="flex items-center text-white/60 text-sm">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating the latest insights...
                        </div>
                      ) : summaryParagraphs.length > 0 ? (
                        summaryParagraphs.map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))
                      ) : (
                        <div className="text-white/60 text-sm">
                          No WhatsApp, SMS, email, or call activity recorded for{" "}
                          {lead?.name || "this lead"} in the last 30 day(s).
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
                </TabsContent>

                {/* Calendar Tab Content */}
                <TabsContent value="calendar" className="mt-6">
              {!leadId ? (
                <div
                  className="rounded-lg p-6 text-white/70 text-sm"
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
                    className="rounded-lg p-6"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                      <button
                        onClick={handlePrevMonth}
                        className="text-white/70 hover:text-white transition-colors p-1"
                        aria-label="Previous month"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12.5 15L7.5 10L12.5 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <h3 className="text-white font-semibold text-lg">
                        {monthNames[currentDate.getMonth()]}{" "}
                        {currentDate.getFullYear()}
                      </h3>
                      <button
                        onClick={handleNextMonth}
                        className="text-white/70 hover:text-white transition-colors p-1"
                        aria-label="Next month"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.5 15L12.5 10L7.5 5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs text-white/70">
                      <span>
                        {leadMeetings.length > 0
                          ? `${leadMeetings.length} meeting${
                              leadMeetings.length === 1 ? "" : "s"
                            } scheduled this month`
                          : "No meetings scheduled this month"}
                      </span>
                      <div className="flex items-center gap-2">
                        {(isCalendarDataBusy || syncMeetingsMutation.isPending) && (
                          <Loader2 className="w-4 h-4 animate-spin text-white/70" />
                        )}
                        <ActiveNavButton
                          icon={RefreshCcw}
                          text={
                            syncMeetingsMutation.isPending ? "Syncing..." : "Refresh"
                          }
                          onClick={handleRefreshCalendarData}
                          disabled={
                            isCalendarDataBusy || syncMeetingsMutation.isPending
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    {/* Days of Week */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map(
                        (day) => (
                          <div
                            key={day}
                            className="text-center text-white/50 text-xs font-medium py-2"
                          >
                            {day}
                          </div>
                        )
                      )}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {getCalendarDays().map((day, index) => {
                        if (day === null) {
                          return <div key={index} className="aspect-square" />;
                        }

                        const dayMeetings = meetingDayMap.get(day) || [];
                        const dayAvailability = availabilityDayMap.get(day) || [];
                        const hasUpcomingMeeting = dayMeetings.some(
                          (meeting) =>
                            new Date(meeting.startDateTime).getTime() >=
                            nowTimestamp
                        );
                        const hasCompletedMeeting = dayMeetings.some(
                          (meeting) =>
                            new Date(meeting.endDateTime).getTime() < nowTimestamp
                        );
                        const hasAvailability = dayAvailability.length > 0;
                        const isToday =
                          day === todayRef.getDate() &&
                          currentDate.getMonth() === todayRef.getMonth() &&
                          currentDate.getFullYear() === todayRef.getFullYear();
                        const highlightClass = hasUpcomingMeeting
                          ? "bg-indigo-500/30 border border-indigo-400/70"
                          : hasCompletedMeeting
                          ? "bg-teal-500/25 border border-teal-400/60"
                          : hasAvailability
                          ? "bg-blue-500/20 border border-blue-400/60"
                          : "";
                        const textClass =
                          hasUpcomingMeeting || hasCompletedMeeting || hasAvailability
                            ? "text-white font-medium"
                            : "text-white/70";
                        const labelParts = [];
                        if (dayMeetings.length) {
                          labelParts.push(
                            `${dayMeetings.length} meeting${
                              dayMeetings.length === 1 ? "" : "s"
                            }`
                          );
                        }
                        if (dayAvailability.length) {
                          labelParts.push(
                            `${dayAvailability.length} slot${
                              dayAvailability.length === 1 ? "" : "s"
                            } available`
                          );
                        }
                        const ariaLabel =
                          labelParts.length > 0
                            ? `Day ${day}: ${labelParts.join(", ")}`
                            : `Day ${day}`;

                        return (
                          <div
                            key={index}
                            className="aspect-square flex items-center justify-center relative"
                            aria-label={ariaLabel}
                            title={ariaLabel}
                          >
                            {(hasUpcomingMeeting ||
                              hasCompletedMeeting ||
                              hasAvailability) && (
                              <div
                                className={`absolute inset-0 rounded-full ${highlightClass}`}
                              />
                            )}
                            {isToday && (
                              <div className="absolute inset-0 rounded-full border border-white/40 pointer-events-none" />
                            )}
                            <span className={`relative z-10 ${textClass}`}>
                              {day}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Calendar Legend */}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-white/70">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-indigo-400/70 bg-indigo-500/30" />
                      <span>Upcoming meeting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-teal-400/60 bg-teal-500/25" />
                      <span>Completed meeting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-blue-400/60 bg-blue-500/20" />
                      <span>Available slot</span>
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
                        <h3 className="text-white font-bold">Scheduled Meetings</h3>
                        <ActiveNavButton
                          icon={RefreshCcw}
                          text={
                            syncMeetingsMutation.isPending ? "Syncing..." : "Refresh"
                          }
                          onClick={handleRefreshCalendarData}
                          disabled={
                            isLeadMeetingsBusy || syncMeetingsMutation.isPending
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      {isLeadMeetingsBusy ? (
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading meetings...
                        </div>
                      ) : sortedMeetings.length > 0 ? (
                        <div className="space-y-3">
                          {sortedMeetings.map((meeting) => {
                            const meetingEnd = new Date(meeting.endDateTime);
                            const meetingCompleted =
                              meetingEnd.getTime() < nowTimestamp;
                            return (
                              <div
                                key={meeting._id}
                                className="rounded-lg p-4 border border-white/10 bg-white/5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-white font-semibold text-sm">
                                      {meeting.subject || "Meeting"}
                                    </p>
                                    <p className="text-xs text-white/60">
                                      {formatDateTimeRange(
                                        meeting.startDateTime,
                                        meeting.endDateTime
                                      )}
                                    </p>
                                  </div>
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
                                      {meeting.status === "completed" ? "Completed" :
                                       meeting.status === "cancelled" ? "Cancelled" : "Scheduled"}
                                    </Badge>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-200 hover:text-red-100 hover:bg-red-500/10 h-6 w-6 p-0"
                                      onClick={() => setMeetingPendingDelete(meeting)}
                                      disabled={deleteMeetingMutation.isPending}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                {meeting.body && (
                                  <p className="text-xs text-white/70 mt-2">
                                    {meeting.body.length > 200
                                      ? `${meeting.body.substring(0, 200)}...`
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
                        <div className="text-sm text-white/60">
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
                    <div
                      className="rounded-lg p-6"
                      style={{
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h3 className="text-white font-bold">Available Slots</h3>
                        <ActiveNavButton
                          icon={RefreshCcw}
                          text={
                            syncMeetingsMutation.isPending ? "Syncing..." : "Refresh"
                          }
                          onClick={handleRefreshCalendarData}
                          disabled={
                            isAvailabilityBusy || syncMeetingsMutation.isPending
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      {isAvailabilityBusy ? (
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Calculating availability...
                        </div>
                      ) : nextAvailableSlots.length > 0 ? (
                        <div className="space-y-3">
                          {nextAvailableSlots.map((slot) => (
                            <div
                              key={slot.start}
                              className="rounded-lg p-4 border border-white/10 bg-white/5"
                            >
                              <p className="text-white text-sm font-semibold">
                                {format(slot.startDate, "EEE, MMM d")}
                              </p>
                              <p className="text-xs text-white/70">
                                {format(slot.startDate, "h:mm a")} –{" "}
                                {format(slot.endDate, "h:mm a")} ·{" "}
                                {slot.durationMinutes} min
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-white/60">
                          No availability detected for this range. Try selecting a
                          different month or adjust your Microsoft calendar working
                          hours.
                        </div>
                      )}
                      {availabilityErrorMessage && (
                        <div className="text-xs text-red-300 mt-3">
                          {availabilityErrorMessage}
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
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white font-semibold">
                      Existing followups
                    </p>
                    <p className="text-sm text-white/60">
                      Plans that already include this lead will show here so you
                      can track status.
                    </p>
                  </div>
                <ActiveNavButton
                  icon={RefreshCcw}
                  text={isFollowupPlansFetching ? "Refreshing..." : "Refresh"}
                  onClick={() => refetchFollowupPlans()}
                  disabled={isFollowupPlansFetching}
                  className="h-8 text-xs"
                />
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
                        plan.todo?.filter((task) => task.isComplete).length ??
                        0;
                      const nextTask = plan.todo?.find(
                        (task) => !task.isComplete
                      );
                      const canDeletePlan = [
                        "scheduled",
                        "in_progress",
                      ].includes(plan.status);
                      const isPlanDeletePending =
                        planPendingDelete?._id === plan._id && isDeletingPlan;
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
                                className={getPlanStatusBadgeClass(plan.status)}
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
                                  ? ` ${getDisplayTime(nextTask.scheduledFor, false)}`
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
                  <div className="text-sm text-white/60">
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
                <div className="flex items-center gap-3 text-white">
                  <div className="p-2 rounded-full bg-white/10">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">
                      Automate followups
                    </p>
                    <p className="text-sm text-white/70">
                      Choose a followup template and select leads to immediately
                      create a personalized followup plan.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-sm text-white/70">
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
                          <SelectItem key={template._id} value={template._id}>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium">
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
                    <span className="text-sm text-white/70">Leads</span>
                    <Popover
                      open={leadSelectorOpen}
                      onOpenChange={setLeadSelectorOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-between bg-white/5 text-white border-white/10 hover:bg-white/10"
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
                                  {fetchedLeads.map((leadItem) => {
                                    const leadId =
                                      leadItem?._id || (leadItem as any)?.id;
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
                                          handleToggleLeadSelection(leadItem)
                                        }
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          onCheckedChange={() =>
                                            handleToggleLeadSelection(leadItem)
                                          }
                                          className="border-white/40 data-[state=checked]:bg-white/90"
                                        />
                                        <div className="flex flex-col">
                                          <span className="text-sm text-white">
                                            {leadItem.name || "Unnamed lead"}
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
                          const leadId = leadItem?._id || (leadItem as any)?.id;
                          if (!leadId) {
                            return null;
                          }
                          return (
                            <Badge
                              key={leadId}
                              variant="secondary"
                              className="bg-white/10 text-white border border-white/20 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span className="text-xs">
                                {leadItem.name || "Lead"} ·{" "}
                                {leadItem.companyName ||
                                  leadItem.position ||
                                  "Unknown"}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleLeadSelection(leadItem)
                                }
                                className="ml-1"
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
                    <div className="text-sm text-white/60">
                      Each selected lead will get a personalized followup plan
                      using the template above.
                    </div>
                    <Button
                      onClick={handleRunFollowupPlan}
                      disabled={isCreatingFollowupPlan}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/30"
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
            ? `This will permanently delete "${meetingPendingDelete.subject || "this meeting"}" from your Microsoft calendar and remove it from the lead's record.`
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
