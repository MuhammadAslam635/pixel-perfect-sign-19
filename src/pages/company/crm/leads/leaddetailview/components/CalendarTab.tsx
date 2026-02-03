import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, ChevronLeft, ChevronRight, RefreshCcw, Trash2, Copy, Calendar as CalendarIcon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ActiveNavButton } from '@/components/ui/primary-btn';
import { Lead } from "@/services/leads.service";
import { useToast } from "@/hooks/use-toast";
import { calendarService, LeadMeetingRecord, AvailableSlot, SyncMeetingsResponse } from "@/services/calendar.service";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { formatDateTimeRange, getMonthNames, resolveErrorMessage } from "@/utils/commonFunctions";
import { useUserTimeZone } from '@/hooks/useUserTimeZone';

interface CalendarTabProps {
    lead?: Lead;
}

const CalendarTab: React.FC<CalendarTabProps> = ({ lead }) => {
    const [currentDate, setCurrentDate] = useState(() => new Date());
    const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(new Date());
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const today = new Date();
        const currentDay = today.getDay();
        const monday = new Date(today);
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
        monday.setDate(today.getDate() - daysFromMonday);
        monday.setHours(0, 0, 0, 0);
        return monday;
    });
    const [meetingPendingDelete, setMeetingPendingDelete] = useState<LeadMeetingRecord | null>(null);
    const [weekDates, setWeekDates] = useState<Date[]>([]);

    const { toast } = useToast();
    const queryClient = useQueryClient();
    const leadId = lead?._id;
    const userTimeZone = useUserTimeZone();

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

    // Query for calendar month meetings
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
        enabled: Boolean(leadId),
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
            // Invalidate and refetch all queries to update lead stage in UI
            await Promise.all([
                refetchLeadMeetings(),
                queryClient.invalidateQueries({ queryKey: ["lead", leadId] }),
                queryClient.invalidateQueries({ queryKey: ["lead-summary", leadId] }),
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
                weekdaysOnly: "false",
            }),
        enabled: Boolean(leadId),
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
            return !Number.isNaN(startDate.getTime());
        });
    }, [availableSlotsResponse]);

    const isLeadMeetingsBusy = isLeadMeetingsLoading || isLeadMeetingsFetching;

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

    // the query fetches data for that new month.
    useEffect(() => {
        if (selectedWeekDate.getMonth() !== currentDate.getMonth() || selectedWeekDate.getFullYear() !== currentDate.getFullYear()) {
            const newDate = new Date(selectedWeekDate);
            // Set to 1st of month to avoid edge cases with varying days in months
            newDate.setDate(1);
            setCurrentDate(newDate);
        }
    }, [selectedWeekDate, currentDate]);

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

    const leadMeetingsErrorMessage = resolveErrorMessage(leadMeetingsError);
    const isCalendarDataBusy = isLeadMeetingsLoading || isLeadMeetingsFetching || isAvailabilityLoading || isAvailabilityFetching;
    const todayRef = new Date();
    const nowTimestamp = todayRef.getTime();

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

    return (
        <>
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
                            {getMonthNames()[currentWeekStart.getMonth()]}{" "}
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
                                    className={`flex flex-col items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 relative overflow-hidden ${isSelected
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
                                        className={`text-[8px] font-medium ${isSelected
                                            ? "text-primary"
                                            : "text-white/50"
                                            }`}
                                    >
                                        {dayName}
                                    </span>
                                    <span
                                        className={`text-xs font-semibold ${isSelected
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
                                ? `${sortedMeetings.length} meeting${sortedMeetings.length === 1 ? "" : "s"
                                } on ${getMonthNames()[selectedWeekDate.getMonth()]
                                } ${selectedWeekDate.getDate()}`
                                : `No meetings on ${getMonthNames()[selectedWeekDate.getMonth()]
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
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-1.5 justify-between">
                                                        <div className="flex items-center gap-1.5 shrink-0">
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
                                                                        ? "Note Taker Agent"
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
                                                            className="text-red-200 hover:text-red-100 hover:bg-red-500/10 h-6 w-6 p-0 shrink-0"
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
                                                    {meeting.joinLink && (
                                                        <div className="flex items-center gap-1.5">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-xs h-7 px-2.5 border-indigo-400/40 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10"
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
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10"
                                                                onClick={async () => {
                                                                    try {
                                                                        await navigator.clipboard.writeText(
                                                                            meeting.joinLink
                                                                        );
                                                                        toast({
                                                                            title: "Copied!",
                                                                            description: "Meeting link copied to clipboard",
                                                                        });
                                                                    } catch (err) {
                                                                        toast({
                                                                            title: "Failed to copy",
                                                                            description: "Could not copy meeting link",
                                                                            variant: "destructive",
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <Copy className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

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
                                {getMonthNames()[currentDate.getMonth()]}.
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

            {/* Confirm Dialog for Meeting Deletion */}
            <ConfirmDialog
                open={Boolean(meetingPendingDelete)}
                title="Delete meeting?"
                description={
                    meetingPendingDelete
                        ? `This will permanently delete "${meetingPendingDelete.subject || "this meeting"
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

export default CalendarTab;