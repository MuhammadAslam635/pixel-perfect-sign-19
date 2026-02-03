import { FC, useMemo } from "react";
import { UseMutationResult } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { LeadMeetingRecord } from "@/services/calendar.service";
import { formatDateTimeRanges, getMonthNames } from "@/utils/commonFunctions";

interface MeetingsListProps {
    selectedDate: number | null;
    currentDate: Date;
    leadMeetings: LeadMeetingRecord[];
    isLeadMeetingsBusy: boolean;
    leadMeetingsError: any;
    nowTimestamp: number;
    onClearDateFilter: () => void;
    onDeleteMeeting: (meeting: LeadMeetingRecord) => void;
    deleteMeetingMutation: UseMutationResult<{ success: boolean; message: string }, Error, string, unknown>;
}

const MeetingsList: FC<MeetingsListProps> = ({
    selectedDate,
    currentDate,
    leadMeetings,
    isLeadMeetingsBusy,
    leadMeetingsError,
    nowTimestamp,
    onClearDateFilter,
    onDeleteMeeting,
    deleteMeetingMutation,
}) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

    const leadMeetingsErrorMessage = leadMeetingsError
        ? (leadMeetingsError as any)?.response?.data?.message ||
        (leadMeetingsError as Error)?.message ||
        "Failed to load meetings"
        : null;

    return (
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
                        ? `Meetings on ${getMonthNames()[currentDate.getMonth()]
                        } ${selectedDate}, ${currentDate.getFullYear()}`
                        : "All Future Meetings"}
                </h3>
                {selectedDate !== null && (
                    <button
                        onClick={onClearDateFilter}
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
                                                {formatDateTimeRanges(
                                                    meeting.startDateTime,
                                                    meeting.endDateTime,
                                                    meeting.timezone
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
                                                            ? "Note Taker Agent"
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
                                                    onDeleteMeeting(meeting)
                                                }
                                                disabled={deleteMeetingMutation.isPending}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    {meeting.body && (
                                        <div className="text-xs text-white/70 mt-2 line-clamp-3 prose prose-invert prose-p:my-0 prose-pre:my-0 prose-ul:my-0 prose-li:my-0 max-w-none">
                                            <ReactMarkdown
                                                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                                components={{
                                                    p: ({ node, ...props }) => (
                                                        <span {...props} />
                                                    ),
                                                    a: ({ node, ...props }) => (
                                                        <a
                                                            {...props}
                                                            className="text-indigo-300 hover:text-indigo-200 underline"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        />
                                                    ),
                                                }}
                                            >
                                                {meeting.body}
                                            </ReactMarkdown>
                                        </div>
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
                                            <>
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
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs h-7 px-3 border-indigo-400/40 text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/10"
                                                    onClick={async () => {
                                                        try {
                                                            await navigator.clipboard.writeText(
                                                                meeting.joinLink
                                                            );
                                                            // Note: toast would be handled in parent component
                                                            // This is just copied from original code
                                                        } catch (err) {
                                                            // Error handling would be in parent
                                                        }
                                                    }}
                                                >
                                                    Copy Link
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-sm text-white/60">
                        No meetings scheduled for{" "}
                        {getMonthNames()[currentDate.getMonth()]}.
                    </div>
                )}
                {leadMeetingsErrorMessage && (
                    <div className="text-sm text-red-300 mt-3">
                        {leadMeetingsErrorMessage}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default MeetingsList;