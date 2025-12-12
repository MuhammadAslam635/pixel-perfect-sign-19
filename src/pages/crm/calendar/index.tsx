import { FC, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { Loader2, RefreshCcw, Trash2, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  calendarService,
  LeadMeetingRecord,
  AvailableSlot,
} from "@/services/calendar.service";
import { format } from "date-fns";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { CrmNavigation } from "@/pages/crm/shared/components/CrmNavigation";

const formatDateTimeRange = (start?: string, end?: string) => {
  if (!start || !end) {
    return "Time not available";
  }
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return "Invalid date";
    }
    const startFormatted = format(startDate, "MMM d, h:mm a");
    const endFormatted = format(endDate, "h:mm a");
    return `${startFormatted} - ${endFormatted}`;
  } catch {
    return "Invalid date";
  }
};

const CalendarPage: FC = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [meetingPendingDelete, setMeetingPendingDelete] =
    useState<LeadMeetingRecord | null>(null);
  const { toast } = useToast();

  const todayRef = useMemo(() => new Date(), []);
  const nowTimestamp = useMemo(() => todayRef.getTime(), [todayRef]);

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

  // Fetch all meetings for the current month - COMMENTED FOR UI DEVELOPMENT
  const {
    data: leadMeetingsResponse,
    isLoading: isLeadMeetingsLoading,
    isFetching: isLeadMeetingsFetching,
    error: leadMeetingsError,
    refetch: refetchLeadMeetings,
  } = useQuery({
    queryKey: ["calendar-all-meetings", calendarMonthKey],
    queryFn: async () => {
      return calendarService.getLeadMeetings({
        startDate: calendarRangeStartIso,
        endDate: calendarRangeEndIso,
        sort: "asc",
        limit: 500,
      });
    },
    staleTime: 60 * 1000,
  });

  // Fetch available slots
  const {
    data: availableSlotsResponse,
    isLoading: isAvailabilityLoading,
    isFetching: isAvailabilityFetching,
    refetch: refetchAvailability,
  } = useQuery({
    queryKey: ["calendar-available-slots", calendarMonthKey, userTimeZone],
    queryFn: async () => {
      return calendarService.getAvailableSlots({
        startDate: calendarRangeStartIso,
        endDate: calendarRangeEndIso,
        durationMinutes: 30,
        intervalMinutes: 30,
        workingHours: "9,17",
        weekdaysOnly: "true",
        workingHoursTimeZone: userTimeZone,
      });
    },
    staleTime: 60 * 1000,
  });

  // Sync meetings mutation
  const syncMeetingsMutation = useMutation({
    mutationFn: async () => {
      return calendarService.syncMeetings();
    },
    onSuccess: (response) => {
      toast({
        title: "Calendar synced",
        description:
          response?.message ||
          "Your calendar has been synced with the latest meetings.",
      });
      refetchLeadMeetings();
      refetchAvailability();
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

  // Delete meeting mutation
  const deleteMeetingMutation = useMutation<
    { success: boolean; message: string },
    Error,
    string
  >({
    mutationFn: async (meetingId: string) => {
      return calendarService.deleteMeeting(meetingId);
    },
    onSuccess: (response) => {
      toast({
        title: "Meeting deleted",
        description:
          response.message ||
          "Meeting has been successfully deleted from your calendar.",
      });
      refetchLeadMeetings();
      setMeetingPendingDelete(null);
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
      const weekday = startDate.getDay();
      return weekday >= 1 && weekday <= 5;
    });
  }, [availableSlotsResponse]);

  const isLeadMeetingsBusy = isLeadMeetingsLoading || isLeadMeetingsFetching;
  const isAvailabilityBusy = isAvailabilityLoading || isAvailabilityFetching;
  const isCalendarDataBusy = isLeadMeetingsBusy || isAvailabilityBusy;

  // Group meetings and availability by day
  const meetingDayMap = useMemo(() => {
    const map = new Map<number, LeadMeetingRecord[]>();
    leadMeetings.forEach((meeting) => {
      const startDate = new Date(meeting.startDateTime);
      if (
        startDate.getMonth() === currentDate.getMonth() &&
        startDate.getFullYear() === currentDate.getFullYear()
      ) {
        const day = startDate.getDate();
        if (!map.has(day)) {
          map.set(day, []);
        }
        map.get(day)!.push(meeting);
      }
    });
    return map;
  }, [leadMeetings, currentDate]);

  const availabilityDayMap = useMemo(() => {
    const map = new Map<number, AvailableSlot[]>();
    availableSlots.forEach((slot) => {
      const startDate = new Date(slot.start);
      if (
        startDate.getMonth() === currentDate.getMonth() &&
        startDate.getFullYear() === currentDate.getFullYear()
      ) {
        const day = startDate.getDate();
        if (!map.has(day)) {
          map.set(day, []);
        }
        map.get(day)!.push(slot);
      }
    });
    return map;
  }, [availableSlots, currentDate]);

  // Sort and filter meetings based on selected date
  const sortedMeetings = useMemo(() => {
    let filtered = leadMeetings;

    // If a date is selected, filter to show only that date's meetings
    if (selectedDate !== null) {
      filtered = leadMeetings.filter((meeting) => {
        const meetingDate = new Date(meeting.startDateTime);
        return (
          meetingDate.getDate() === selectedDate &&
          meetingDate.getMonth() === currentDate.getMonth() &&
          meetingDate.getFullYear() === currentDate.getFullYear()
        );
      });
    } else {
      // Show only future meetings by default
      filtered = leadMeetings.filter((meeting) => {
        const meetingStart = new Date(meeting.startDateTime);
        return meetingStart.getTime() >= nowTimestamp;
      });
    }

    return filtered.sort((a, b) => {
      const aStart = new Date(a.startDateTime).getTime();
      const bStart = new Date(b.startDateTime).getTime();
      return aStart - bStart;
    });
  }, [leadMeetings, selectedDate, currentDate, nowTimestamp]);

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
    const sundayFirstIndex = firstDay.getDay();
    return (sundayFirstIndex + 6) % 7;
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

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleRefreshCalendarData = () => {
    if (syncMeetingsMutation.isPending) {
      return;
    }
    syncMeetingsMutation.mutate();
  };

  const handleConfirmDeleteMeeting = () => {
    if (!meetingPendingDelete?._id) {
      return;
    }
    deleteMeetingMutation.mutate(meetingPendingDelete._id);
  };

  const leadMeetingsErrorMessage = leadMeetingsError
    ? (leadMeetingsError as any)?.response?.data?.message ||
      (leadMeetingsError as Error)?.message ||
      "Failed to load meetings"
    : null;

  return (
    <DashboardLayout>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 flex flex-col gap-4 sm:gap-6 text-white flex-1 min-h-0 max-h-screen overflow-y-hidden overflow-x-hidden"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex-1 min-h-0 flex flex-col gap-4 sm:gap-6 max-w-[1600px] mx-auto w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            >
              <CrmNavigation />
            </motion.div>
          </div>

          {/* Calendar Content - Two Column Layout */}
          <Card
            className="rounded-2xl border border-white/10 p-6 flex-1 min-h-0 flex flex-col"
            style={{
              background:
                "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
              {/* Left Column - Calendar Widget */}
              <Card
                className="rounded-xl border border-white/10 p-4 flex flex-col min-h-0 max-h-full overflow-y-auto scrollbar-hide lg:col-span-2"
                style={{
                  background:
                    "linear-gradient(173.83deg, rgba(255, 255, 255, 0.05) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.01) 95.1%)",
                }}
              >
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePrevMonth}
                    className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
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
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-white/70" />
                    <h2 className="text-white font-semibold text-xs">
                      {monthNames[currentDate.getMonth()]}{" "}
                      {currentDate.getFullYear()}
                    </h2>
                  </div>
                  <button
                    onClick={handleNextMonth}
                    className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
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

                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[9px] text-white/70">
                  <span>
                    {leadMeetings.length > 0
                      ? `${leadMeetings.length} meeting${
                          leadMeetings.length === 1 ? "" : "s"
                        }`
                      : "No meetings"}
                  </span>
                  <ActiveNavButton
                    icon={
                      isCalendarDataBusy || syncMeetingsMutation.isPending
                        ? Loader2
                        : RefreshCcw
                    }
                    iconClassName={
                      isCalendarDataBusy || syncMeetingsMutation.isPending
                        ? "animate-spin"
                        : ""
                    }
                    text={
                      syncMeetingsMutation.isPending ? "Syncing..." : "Refresh"
                    }
                    onClick={handleRefreshCalendarData}
                    disabled={
                      isCalendarDataBusy || syncMeetingsMutation.isPending
                    }
                    className="h-6 text-[9px] px-2"
                  />
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
                    <div
                      key={idx}
                      className="text-center text-white/50 text-[10px] font-medium py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0.5 mb-3">
                  {getCalendarDays().map((day, index) => {
                    if (day === null) {
                      return <div key={index} className="aspect-square" />;
                    }

                    const dayMeetings = meetingDayMap.get(day) || [];
                    const dayAvailability = availabilityDayMap.get(day) || [];

                    // Check for different meeting statuses
                    const hasUpcomingMeeting = dayMeetings.some(
                      (meeting) =>
                        meeting.status === "scheduled" &&
                        new Date(meeting.startDateTime).getTime() >=
                          nowTimestamp
                    );
                    const hasCompletedMeeting = dayMeetings.some(
                      (meeting) => meeting.status === "completed"
                    );
                    const hasCancelledMeeting = dayMeetings.some(
                      (meeting) => meeting.status === "cancelled"
                    );
                    const hasAvailability = dayAvailability.length > 0;
                    const isToday =
                      day === todayRef.getDate() &&
                      currentDate.getMonth() === todayRef.getMonth() &&
                      currentDate.getFullYear() === todayRef.getFullYear();

                    // Priority order: Upcoming > Cancelled > Completed
                    const highlightClass = hasUpcomingMeeting
                      ? "bg-indigo-500/30 border border-indigo-400/70"
                      : hasCancelledMeeting
                      ? "bg-red-500/30 border border-red-400/70"
                      : hasCompletedMeeting
                      ? "bg-teal-500/25 border border-teal-400/60"
                      : "";

                    const textClass =
                      hasUpcomingMeeting ||
                      hasCompletedMeeting ||
                      hasCancelledMeeting
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

                    const isSelected = selectedDate === day;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-center py-0.5"
                      >
                        <button
                          onClick={() =>
                            setSelectedDate(selectedDate === day ? null : day)
                          }
                          className="w-7 h-7 flex items-center justify-center relative rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                          aria-label={ariaLabel}
                          title={ariaLabel}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 rounded-full bg-white" />
                          )}
                          {!isSelected && isToday && (
                            <div className="absolute inset-0 rounded-full border border-white/50" />
                          )}
                          {!isSelected &&
                            !isToday &&
                            (hasUpcomingMeeting ||
                              hasCompletedMeeting ||
                              hasCancelledMeeting) && (
                              <div
                                className={`absolute inset-0 rounded-full ${highlightClass}`}
                              />
                            )}
                          <span
                            className={`relative z-10 text-xs leading-none ${
                              isSelected ? "text-gray-900 font-bold" : textClass
                            }`}
                          >
                            {day}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Legend */}
                <div className="flex flex-wrap items-center gap-3 text-[9px] text-white/70 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm border border-indigo-400/70 bg-indigo-500/30" />
                    <span>Upcoming</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm border border-teal-400/60 bg-teal-500/25" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm border border-red-400/70 bg-red-500/30" />
                    <span>Cancelled</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm border border-blue-400/60 bg-blue-500/20" />
                    <span>Available</span>
                  </div>
                </div>
              </Card>

              {/* Right Column - Meetings List */}
              <Card
                className="rounded-xl border border-white/10 p-4 flex flex-col min-h-0 max-h-full overflow-y-auto scrollbar-hide lg:col-span-3"
                style={{
                  background:
                    "linear-gradient(173.83deg, rgba(255, 255, 255, 0.05) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.01) 95.1%)",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h3 className="text-white font-semibold text-base">
                    {selectedDate !== null
                      ? `Meetings on ${
                          monthNames[currentDate.getMonth()]
                        } ${selectedDate}, ${currentDate.getFullYear()}`
                      : "All Future Meetings"}
                  </h3>
                  {selectedDate !== null && (
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="text-xs text-white/60 hover:text-white transition-colors"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide max-h-[calc(100vh-20rem)]">
                  {isLeadMeetingsBusy ? (
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading meetings...
                    </div>
                  ) : sortedMeetings.length > 0 ? (
                    <div className="space-y-3 pr-2">
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
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm">
                                  {meeting.subject || "Meeting"}
                                </p>
                                <p className="text-xs text-white/60">
                                  {formatDateTimeRange(
                                    meeting.startDateTime,
                                    meeting.endDateTime
                                  )}
                                </p>
                                {/* {meeting.personId && (
                                  <p className="text-xs text-white/50 mt-1">
                                    Person ID: {meeting.personId}
                                  </p>
                                )} */}
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
                                        meeting.recall.status === "active"
                                          ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/50"
                                          : meeting.recall.status ===
                                              "starting" ||
                                            meeting.recall.status ===
                                              "scheduled"
                                          ? "bg-sky-500/15 text-sky-100 border border-sky-400/40"
                                          : meeting.recall.status === "failed"
                                          ? "bg-red-500/20 text-red-100 border border-red-400/40"
                                          : "bg-slate-500/20 text-slate-100 border border-slate-400/40"
                                      }
                                    >
                                      {meeting.recall.status === "active"
                                        ? "Recall active"
                                        : meeting.recall.status ===
                                            "starting" ||
                                          meeting.recall.status === "scheduled"
                                        ? "Recall pending"
                                        : meeting.recall.status === "failed"
                                        ? "Recall failed"
                                        : "Recall ended"}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-200 hover:text-red-100 hover:bg-red-500/10 h-8 w-8 p-0"
                                  onClick={() =>
                                    setMeetingPendingDelete(meeting)
                                  }
                                  disabled={deleteMeetingMutation.isPending}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
                            <div className="flex gap-2 mt-3">
                              {meeting.webLink && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 px-3 border-indigo-400/40 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10"
                                  onClick={() =>
                                    window.open(
                                      meeting.webLink,
                                      "_blank",
                                      "noopener,noreferrer"
                                    )
                                  }
                                >
                                  Calendar Event
                                </Button>
                              )}
                              {meeting.joinLink && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7 px-3 border-indigo-400/40 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10"
                                  onClick={() =>
                                    window.open(
                                      meeting.joinLink,
                                      "_blank",
                                      "noopener,noreferrer"
                                    )
                                  }
                                >
                                  Meeting Link
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-white/60">
                      No meetings scheduled for{" "}
                      {monthNames[currentDate.getMonth()]}.
                    </div>
                  )}
                  {leadMeetingsErrorMessage && (
                    <div className="text-sm text-red-300 mt-3">
                      {leadMeetingsErrorMessage}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </Card>
        </motion.div>
      </motion.main>

      {/* Delete Meeting Confirmation Dialog */}
      <ConfirmDialog
        open={!!meetingPendingDelete}
        title="Delete Meeting"
        description={`Are you sure you want to delete "${
          meetingPendingDelete?.subject || "this meeting"
        }"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteMeeting}
        onCancel={() => setMeetingPendingDelete(null)}
        confirmVariant="destructive"
        isPending={deleteMeetingMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default CalendarPage;
