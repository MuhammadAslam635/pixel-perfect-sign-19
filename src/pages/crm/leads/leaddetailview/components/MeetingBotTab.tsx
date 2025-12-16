import { FC, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lead } from "@/services/leads.service";
import { calendarService } from "@/services/calendar.service";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCcw,
  FileText,
  Headphones,
  Calendar,
  Download,
  Play,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type MeetingBotTabProps = {
  lead?: Lead;
};

const formatDateTimeRange = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const now = new Date();

  // Format date
  const isToday = startDate.toDateString() === now.toDateString();
  const isTomorrow =
    startDate.toDateString() ===
    new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

  let dateStr = "";
  if (isToday) {
    dateStr = "Today";
  } else if (isTomorrow) {
    dateStr = "Tomorrow";
  } else {
    dateStr = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: startDate.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }

  // Format time
  const startTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const endTime = endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateStr} at ${startTime} - ${endTime}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

type MeetingRecordingData = {
  transcriptUrl?: string | null;
  recordingUrl?: string | null;
  status?: string;
  sessionId?: string | null;
};

const MeetingBotTab: FC<MeetingBotTabProps> = ({ lead }) => {
  // Fetch meetings for this lead
  const {
    data: meetingsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lead-meetings", lead?._id],
    queryFn: async () => {
      if (!lead?._id) {
        throw new Error("Lead ID is required");
      }
      return calendarService.getLeadMeetings({
        personId: lead._id,
      });
    },
    enabled: Boolean(lead?._id),
    staleTime: 30 * 1000, // Cache for 30 seconds
  });

  const meetings = meetingsResponse?.data || [];
  const nowTimestamp = Date.now();

  // Filter and sort meetings: only show past meetings that have Recall recordings
  const meetingsWithRecordings = useMemo(() => {
    return meetings
      .filter((m) => {
        const meetingEnd = new Date(m.endDateTime).getTime();
        const isPast = meetingEnd < nowTimestamp;
        const hasRecall = m.recall?.status === "ended" || m.recall?.sessionId;
        return isPast && hasRecall;
      })
      .sort((a, b) => {
        const aTime = new Date(a.endDateTime).getTime();
        const bTime = new Date(b.endDateTime).getTime();
        return bTime - aTime; // Most recent first
      });
  }, [meetings, nowTimestamp]);

  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [loadingTranscripts, setLoadingTranscripts] = useState<Record<string, boolean>>({});
  const [recordingData, setRecordingData] = useState<Record<string, MeetingRecordingData>>({});
  const [loadingRecordings, setLoadingRecordings] = useState<Record<string, boolean>>({});

  const fetchRecordingData = async (meetingId: string) => {
    if (recordingData[meetingId] || loadingRecordings[meetingId]) {
      return recordingData[meetingId];
    }

    setLoadingRecordings((prev) => ({ ...prev, [meetingId]: true }));
    try {
      const data = await calendarService.getMeetingRecording(meetingId);
      setRecordingData((prev) => ({ ...prev, [meetingId]: data.data }));
      return data.data;
    } catch (error) {
      console.error("Failed to fetch recording data:", error);
      return null;
    } finally {
      setLoadingRecordings((prev) => ({ ...prev, [meetingId]: false }));
    }
  };

  const fetchTranscript = async (meetingId: string, transcriptUrl: string) => {
    if (transcripts[meetingId] || loadingTranscripts[meetingId]) return;

    setLoadingTranscripts((prev) => ({ ...prev, [meetingId]: true }));
    try {
      const response = await fetch(transcriptUrl);
      if (response.ok) {
        const text = await response.text();
        setTranscripts((prev) => ({ ...prev, [meetingId]: text }));
      } else {
        throw new Error("Failed to fetch transcript");
      }
    } catch (error) {
      console.error("Failed to fetch transcript:", error);
      setTranscripts((prev) => ({
        ...prev,
        [meetingId]: "Failed to load transcript",
      }));
    } finally {
      setLoadingTranscripts((prev) => ({ ...prev, [meetingId]: false }));
    }
  };

  const handleExpandMeeting = async (meetingId: string) => {
    if (expandedMeeting === meetingId) {
      setExpandedMeeting(null);
      return;
    }

    setExpandedMeeting(meetingId);
    const meeting = meetingsWithRecordings.find((m) => m._id === meetingId);
    if (!meeting) return;

    // Fetch recording data (this will get transcript/recording URLs from Recall API if not stored)
    const data = await fetchRecordingData(meetingId);
    
    // Use stored URLs or fetched URLs
    const transcriptUrl = meeting.recall?.transcriptUrl || data?.transcriptUrl;
    const recordingUrl = meeting.recall?.recordingUrl || data?.recordingUrl;

    // Fetch transcript if URL is available
    if (transcriptUrl && !transcripts[meetingId]) {
      await fetchTranscript(meetingId, transcriptUrl);
    }
  };

  const isBusy = isLoading || isFetching;

  if (!lead) {
    return (
      <div className="text-xs text-white/60 p-4">
        Select a lead to view meeting recordings and transcripts.
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-white">
            Meeting Recordings & Transcripts
          </h3>
          <p className="text-xs text-white/60 mt-1">
            View transcripts and audio recordings from past meetings
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isBusy}
          className="h-8 w-8 p-0 flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isBusy ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg p-4 border border-red-500/20 bg-red-500/10">
          <div className="flex items-start gap-2 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              {(error as any)?.response?.data?.message ||
                (error as any)?.message ||
                "Failed to load meetings"}
            </span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isBusy && meetings.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-sm text-white/60">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading meetings...
        </div>
      ) : meetingsWithRecordings.length === 0 ? (
        <div className="rounded-lg p-6 border border-white/10 bg-white/5 text-center">
          <Calendar className="w-8 h-8 text-white/30 mx-auto mb-2" />
          <p className="text-xs text-white/60">
            No meeting recordings available yet.
          </p>
          <p className="text-xs text-white/40 mt-2">
            Recordings will appear here after meetings with Recall bots are completed.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          {meetingsWithRecordings.map((meeting) => {
            const isExpanded = expandedMeeting === meeting._id;
            const storedData = recordingData[meeting._id];
            const transcriptUrl = meeting.recall?.transcriptUrl || storedData?.transcriptUrl;
            const recordingUrl = meeting.recall?.recordingUrl || storedData?.recordingUrl;
            const hasRecording = Boolean(recordingUrl);
            const hasTranscript = Boolean(transcriptUrl);
            const transcript = transcripts[meeting._id];
            const isLoadingTranscript = loadingTranscripts[meeting._id];
            const isLoadingRecording = loadingRecordings[meeting._id];

            return (
              <div
                key={meeting._id}
                className="rounded-lg border border-white/10 bg-white/5 overflow-hidden"
              >
                {/* Meeting Header */}
                <button
                  onClick={() => handleExpandMeeting(meeting._id)}
                  className="w-full p-4 flex items-start justify-between gap-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                      <p className="text-white font-semibold text-xs sm:text-sm truncate">
                        {meeting.subject || "Meeting"}
                      </p>
                    </div>
                    <p className="text-xs text-white/60 mb-2">
                      {formatDate(meeting.endDateTime)}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {hasTranscript && (
                        <Badge className="bg-emerald-500/20 text-emerald-100 border border-emerald-400/40 text-xs">
                          <FileText className="w-3 h-3 mr-1" />
                          Transcript
                        </Badge>
                      )}
                      {hasRecording && (
                        <Badge className="bg-blue-500/20 text-blue-100 border border-blue-400/40 text-xs">
                          <Headphones className="w-3 h-3 mr-1" />
                          Audio
                        </Badge>
                      )}
                      {!hasTranscript && !hasRecording && (
                        <Badge className="bg-slate-500/20 text-slate-100 border border-slate-400/40 text-xs">
                          Processing...
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <span className="text-white/60 text-xs">▼</span>
                    ) : (
                      <span className="text-white/60 text-xs">▶</span>
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    {/* Meeting Details */}
                    <div className="text-xs text-white/60">
                      <p>
                        <span className="text-white/80 font-medium">Duration: </span>
                        {formatDateTimeRange(meeting.startDateTime, meeting.endDateTime)}
                      </p>
                      {meeting.body && (
                        <p className="mt-2">
                          <span className="text-white/80 font-medium">Notes: </span>
                          {meeting.body}
                        </p>
                      )}
                    </div>

                    {/* Audio Recording */}
                    {hasRecording && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                            <Headphones className="w-4 h-4 text-primary" />
                            Audio Recording
                          </h4>
                          <a
                            href={recordingUrl!}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        </div>
                        <div className="rounded-lg bg-white/5 p-3">
                          <audio
                            controls
                            className="w-full h-8"
                            src={recordingUrl!}
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      </div>
                    )}

                    {/* Transcript */}
                    {hasTranscript && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Transcript
                          </h4>
                          {transcriptUrl && (
                            <a
                              href={transcriptUrl}
                              target="_blank"
                              rel="noreferrer"
                              download
                              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </a>
                          )}
                        </div>
                        <div className="rounded-lg bg-white/5 p-4 max-h-96 overflow-y-auto scrollbar-hide">
                          {isLoadingTranscript ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-4 h-4 animate-spin text-white/60" />
                              <span className="ml-2 text-xs text-white/60">
                                Loading transcript...
                              </span>
                            </div>
                          ) : transcript ? (
                            <pre className="text-xs text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
                              {transcript}
                            </pre>
                          ) : (
                            <p className="text-xs text-white/60">
                              Transcript not available
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {!hasRecording && !hasTranscript && (
                      <div className="text-center py-4 text-xs text-white/60">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                        <p>Recording and transcript are being processed...</p>
                        <p className="text-white/40 mt-1">
                          This may take a few minutes after the meeting ends.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MeetingBotTab;
