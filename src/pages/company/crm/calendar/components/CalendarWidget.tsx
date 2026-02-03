import { FC, useMemo } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { Loader2, RefreshCcw, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { LeadMeetingRecord, AvailableSlot } from "@/services/calendar.service";
import { getDaysInMonth, getFirstDayOfMonth, getMonthNames } from "@/utils/commonFunctions";

interface CalendarWidgetProps {
    currentDate: Date;
    selectedDate: number | null;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onRefreshCalendarData: () => void;
    onSelectDate: (day: number | null) => void;
    leadMeetings: LeadMeetingRecord[];
    availableSlots: AvailableSlot[];
    isCalendarDataBusy: boolean;
    syncMeetingsMutation: UseMutationResult<any, Error, void, unknown>;
    todayRef: Date;
    nowTimestamp: number;
}

const CalendarWidget: FC<CalendarWidgetProps> = ({
    currentDate,
    selectedDate,
    onPrevMonth,
    onNextMonth,
    onRefreshCalendarData,
    onSelectDate,
    leadMeetings,
    availableSlots,
    isCalendarDataBusy,
    syncMeetingsMutation,
    todayRef,
    nowTimestamp,
}) => {

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

    return (
        <Card
            className="rounded-xl border border-white/10 p-4 flex flex-col min-h-0 max-h-full overflow-y-auto scrollbar-hide lg:col-span-2"
            style={{
                background:
                    "linear-gradient(173.83deg, rgba(255, 255, 255, 0.05) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.01) 95.1%)",
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <button onClick={onPrevMonth} className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10" aria-label="Previous month">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-white/70" />
                    <h2 className="text-white font-semibold text-xs">
                        {getMonthNames()[currentDate.getMonth()]}{" "}
                        {currentDate.getFullYear()}
                    </h2>
                </div>
                <button onClick={onNextMonth} className="text-white/70 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10" aria-label="Next month">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[9px] text-white/70">
                <span>
                    {leadMeetings.length > 0 ? `${leadMeetings.length} meeting${leadMeetings.length === 1 ? "" : "s"}` : "No meetings"}
                </span>
                <ActiveNavButton
                    icon={isCalendarDataBusy || syncMeetingsMutation.isPending ? Loader2 : RefreshCcw}
                    iconClassName={isCalendarDataBusy || syncMeetingsMutation.isPending ? "animate-spin" : ""}
                    text={syncMeetingsMutation.isPending ? "Syncing..." : "Refresh"}
                    onClick={onRefreshCalendarData}
                    disabled={isCalendarDataBusy || syncMeetingsMutation.isPending}
                    className="h-6 text-[9px] px-2"
                />
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((day, idx) => (
                    <div key={idx} className="text-center text-white/50 text-[10px] font-medium py-1">{day}</div>
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
                    const hasUpcomingMeeting = dayMeetings.some((meeting) => meeting.status === "scheduled" && new Date(meeting.startDateTime).getTime() >= nowTimestamp);
                    const hasCompletedMeeting = dayMeetings.some((meeting) => meeting.status === "completed");
                    const hasCancelledMeeting = dayMeetings.some((meeting) => meeting.status === "cancelled");
                    const hasAvailability = dayAvailability.length > 0;
                    const isToday = day === todayRef.getDate() && currentDate.getMonth() === todayRef.getMonth() && currentDate.getFullYear() === todayRef.getFullYear();
                    // Priority order: Upcoming > Cancelled > Completed
                    const highlightClass = hasUpcomingMeeting ? "bg-indigo-500/30 border border-indigo-400/70" : hasCancelledMeeting ? "bg-red-500/30 border border-red-400/70" : hasCompletedMeeting ? "bg-teal-500/25 border border-teal-400/60" : "";
                    const textClass = hasUpcomingMeeting || hasCompletedMeeting || hasCancelledMeeting ? "text-white font-medium" : "text-white/70";
                    const labelParts = [];
                    if (dayMeetings.length) {
                        labelParts.push(`${dayMeetings.length} meeting${dayMeetings.length === 1 ? "" : "s"}`);
                    }
                    if (dayAvailability.length) {
                        labelParts.push(`${dayAvailability.length} slot${dayAvailability.length === 1 ? "" : "s"} available`);
                    }
                    const ariaLabel = labelParts.length > 0 ? `Day ${day}: ${labelParts.join(", ")}` : `Day ${day}`;
                    const isSelected = selectedDate === day;

                    return (
                        <div key={index} className="flex items-center justify-center py-0.5">
                            <button onClick={() => onSelectDate(selectedDate === day ? null : day)} className="w-7 h-7 flex items-center justify-center relative rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                                aria-label={ariaLabel}
                                title={ariaLabel}
                            >
                                {isSelected && <div className="absolute inset-0 rounded-full bg-white" />}
                                {!isSelected && isToday && <div className="absolute inset-0 rounded-full border border-white/50" />}
                                {!isSelected && !isToday && (hasUpcomingMeeting || hasCompletedMeeting || hasCancelledMeeting) && <div className={`absolute inset-0 rounded-full ${highlightClass}`} />}
                                <span className={`relative z-10 text-xs leading-none ${isSelected ? "text-gray-900 font-bold" : textClass}`}>{day}</span>
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
    );
};

export default CalendarWidget;