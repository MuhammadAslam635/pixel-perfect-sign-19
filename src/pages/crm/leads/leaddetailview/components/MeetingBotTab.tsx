import { FC, useMemo, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Lead } from "@/services/leads.service";
import { calendarService } from "@/services/calendar.service";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, FileText, Calendar, Play, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LeadMeetingRecord } from "@/services/calendar.service";

type MeetingBotTabProps = {
  lead?: Lead;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday =
    date.toDateString() ===
    new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();

  if (isToday) {
    return `Today, ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  } else if (isYesterday) {
    return `Yesterday, ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
};

const formatDuration = (minutes?: number | null): string => {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const formatMeetingDate = (value?: string | null) => {
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

type MeetingRecordingData = {
  transcriptUrl?: string | null;
  transcriptText?: string | null;
  recordingUrl?: string | null;
  status?: string;
  sessionId?: string | null;
  transcriptStatus?: string;
  transcriptId?: string | null;
  transcriptProvider?: string;
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
    staleTime: 30 * 1000,
  });

  const meetings = meetingsResponse?.data || [];

  // Filter and sort meetings: show past meetings that have Recall integration
  // Show meetings as soon as they end, even if recording/transcript isn't ready yet
  const meetingsWithRecordings = useMemo(() => {
    const currentTime = Date.now(); // Always use current time, not stale timestamp
    
    const filtered = meetings
      .filter((m) => {
        if (!m.endDateTime) {
          return false;
        }
        
        const meetingEnd = new Date(m.endDateTime).getTime();
        const meetingStart = m.startDateTime ? new Date(m.startDateTime).getTime() : meetingEnd;
        const isPast = meetingEnd < currentTime;
        const hasStarted = meetingStart < currentTime;
        
        // Check recall status
        const recallStatus = m.recall?.status;
        const hasSessionId = Boolean(m.recall?.sessionId);
        
        // SIMPLE RULE: If recall status is "ended", SHOW IT. Period.
        if (recallStatus === "ended") {
          return true;
        }
        
        // If meeting has recall data (sessionId, recording, transcript, or status)
        const hasRecallData = Boolean(
          hasSessionId || 
          m.recall?.recordingUrl || 
          m.recall?.transcriptUrl || 
          (recallStatus !== null && recallStatus !== undefined)
        );
        
        // Show if: (meeting ended AND has recall data) OR (has active bot AND meeting has started)
        const shouldShow = (isPast && hasRecallData) || (hasSessionId && hasStarted);
        
        return shouldShow;
      })
      .sort((a, b) => {
        const aTime = new Date(a.endDateTime).getTime();
        const bTime = new Date(b.endDateTime).getTime();
        return bTime - aTime; // Most recent first
      });
    
    return filtered;
  }, [meetings]);

  const [recordingData, setRecordingData] = useState<
    Record<string, MeetingRecordingData>
  >({});
  const [loadingRecordings, setLoadingRecordings] = useState<
    Record<string, boolean>
  >({});
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [loadingTranscripts, setLoadingTranscripts] = useState<
    Record<string, boolean>
  >({});
  const [selectedMeeting, setSelectedMeeting] =
    useState<LeadMeetingRecord | null>(null);
  const [activeTab, setActiveTab] = useState<
    "recording" | "transcript" | "notes"
  >("recording");
  const [recordingAudioUrl, setRecordingAudioUrl] = useState<string | null>(
    null
  );
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  // Meeting notes state
  const [meetingNotes, setMeetingNotes] = useState<
    Record<
      string,
      import("@/services/calendar.service").EnhancedMeetingNotes | null
    >
  >({});
  const [loadingNotes, setLoadingNotes] = useState<Record<string, boolean>>(
    {}
  );
  const [notesErrors, setNotesErrors] = useState<
    Record<string, string | null>
  >({});
  const [showNotesDetailModal, setShowNotesDetailModal] = useState(false);

  const fetchRecordingData = async (meetingId: string) => {
    // Don't fetch if already loading
    if (loadingRecordings[meetingId]) {
      return recordingData[meetingId];
    }

    setLoadingRecordings((prev) => ({ ...prev, [meetingId]: true }));
    try {
      // ALWAYS fetch from API to get latest data from Recall
      const response = await calendarService.getMeetingRecording(meetingId);
      const data = response.data;
      setRecordingData((prev) => ({ ...prev, [meetingId]: data as MeetingRecordingData }));
      
      // If we have transcriptText, set it immediately
      if (data.transcriptText) {
        setTranscripts((prev) => ({ ...prev, [meetingId]: data.transcriptText! }));
      }
      
      return data;
    } catch (error) {
      console.error("Failed to fetch recording data:", error);
      return null;
    } finally {
      setLoadingRecordings((prev) => ({ ...prev, [meetingId]: false }));
    }
  };

  const fetchTranscript = useCallback(
    async (meetingId: string, transcriptUrl: string) => {
      if (transcripts[meetingId] || loadingTranscripts[meetingId]) {
        return;
      }

    setLoadingTranscripts((prev) => ({ ...prev, [meetingId]: true }));
    try {
      // Try to get transcript from backend API first (it should have downloaded it)
      const apiResponse = await calendarService.getMeetingRecording(meetingId);
      const recordingData = apiResponse.data;
      if (recordingData.transcriptText) {
        setTranscripts((prev) => ({ ...prev, [meetingId]: recordingData.transcriptText! }));
        return;
      }
      
      // Fallback: try to fetch directly from URL (may fail due to CORS)
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
  }, [transcripts, loadingTranscripts]);

  // Fetch meeting notes
  const fetchMeetingNotes = useCallback(
    async (meetingId: string) => {
      if (loadingNotes[meetingId]) return;

      setLoadingNotes((prev) => ({ ...prev, [meetingId]: true }));
      setNotesErrors((prev) => ({ ...prev, [meetingId]: null }));

      try {
        const response = await calendarService.getMeetingNotes(meetingId);
        if (response.data.enhancedNotes) {
          setMeetingNotes((prev) => ({
            ...prev,
            [meetingId]: response.data.enhancedNotes!,
          }));
        }
        if (response.data.error) {
          setNotesErrors((prev) => ({
            ...prev,
            [meetingId]: response.data.error,
          }));
        }
      } catch (error: any) {
        console.error("Failed to fetch meeting notes:", error);
        setNotesErrors((prev) => ({
          ...prev,
          [meetingId]:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to load notes",
        }));
      } finally {
        setLoadingNotes((prev) => ({ ...prev, [meetingId]: false }));
      }
    },
    [loadingNotes]
  );

  // Generate meeting notes
  const handleGenerateNotes = useCallback(
    async (meetingId: string) => {
      setLoadingNotes((prev) => ({ ...prev, [meetingId]: true }));
      setNotesErrors((prev) => ({ ...prev, [meetingId]: null }));

      try {
        await calendarService.generateMeetingNotes(meetingId);

        // Start polling for notes (check every 3 seconds for up to 30 seconds)
        let attempts = 0;
        const maxAttempts = 10;
        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const response = await calendarService.getMeetingNotes(meetingId);
            if (response.data.enhancedNotes) {
              setMeetingNotes((prev) => ({
                ...prev,
                [meetingId]: response.data.enhancedNotes!,
              }));
              setLoadingNotes((prev) => ({ ...prev, [meetingId]: false }));
              clearInterval(pollInterval);
            } else if (attempts >= maxAttempts) {
              // Stop polling after max attempts
              setLoadingNotes((prev) => ({ ...prev, [meetingId]: false }));
              clearInterval(pollInterval);
            }
          } catch (error) {
            console.error("Polling error:", error);
            if (attempts >= maxAttempts) {
              setLoadingNotes((prev) => ({ ...prev, [meetingId]: false }));
              clearInterval(pollInterval);
            }
          }
        }, 3000);
      } catch (error: any) {
        console.error("Failed to generate notes:", error);
        setNotesErrors((prev) => ({
          ...prev,
          [meetingId]:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to generate notes",
        }));
        setLoadingNotes((prev) => ({ ...prev, [meetingId]: false }));
      }
    },
    []
  );

  const handleOpenMeetingDetails = useCallback(
    async (meeting: LeadMeetingRecord) => {
      setSelectedMeeting(meeting);
      setActiveTab("recording");
      setRecordingAudioUrl(null);
      setRecordingError(null);
      setRecordingLoading(false);

      // Fetch recording data if not already loaded
      if (!recordingData[meeting._id]) {
        await fetchRecordingData(meeting._id);
      }

      // Fetch meeting notes if not already loaded
      if (!meetingNotes[meeting._id] && meeting.recall?.transcriptText) {
        await fetchMeetingNotes(meeting._id);
      }

      const storedData = recordingData[meeting._id];
      const recordingUrl =
        meeting.recall?.recordingUrl || storedData?.recordingUrl;

      // Load recording if available
      if (recordingUrl) {
        setRecordingLoading(true);
        try {
          // For Recall recordings, we can use the URL directly or fetch via backend
          // Using the URL directly for now since it's a pre-signed S3 URL
          setRecordingAudioUrl(recordingUrl);
        } catch (err: any) {
          console.error("Failed to load recording", err);
          setRecordingError(
            err?.response?.data?.error ||
              err?.message ||
              "Unable to load meeting recording."
          );
        } finally {
          setRecordingLoading(false);
        }
      }
    },
    [recordingData, meetingNotes, fetchMeetingNotes]
  );

  const handleCloseMeetingDetails = useCallback(() => {
    setSelectedMeeting(null);
    if (recordingAudioUrl) {
      URL.revokeObjectURL(recordingAudioUrl);
      setRecordingAudioUrl(null);
    }
    setRecordingError(null);
    setRecordingLoading(false);
  }, [recordingAudioUrl]);

  // Pre-fetch recording data for all meetings - ALWAYS fetch to get latest data from Recall API
  useEffect(() => {
    meetingsWithRecordings.forEach((meeting) => {
      // Always fetch to get latest data from Recall API, even if we have cached data
      // This ensures we get updates when data becomes available
      if (!loadingRecordings[meeting._id]) {
        fetchRecordingData(meeting._id);
      }
    });
  }, [meetingsWithRecordings]);

  // Periodically refresh recording data for meetings that are still processing
  // This includes meetings with processing transcripts or meetings that just ended
  useEffect(() => {
    const processingMeetings = meetingsWithRecordings.filter((meeting) => {
      const storedData = recordingData[meeting._id];
      const transcriptStatus = meeting.recall?.transcriptStatus || storedData?.transcriptStatus;
      const recallStatus = meeting.recall?.status;
      const hasRecording = meeting.recall?.recordingUrl || storedData?.recordingUrl;
      const hasTranscript = meeting.recall?.transcriptUrl || storedData?.transcriptUrl || transcripts[meeting._id];
      
      // Refresh if:
      // 1. Transcript is processing
      // 2. Meeting just ended (status is "ended" or "active") but doesn't have recording/transcript yet
      // 3. Meeting has recall status but missing data
      // 4. Status is "pending" - data might be available on Recall API
      return (
        transcriptStatus === "processing" ||
        transcriptStatus === "pending" ||
        (recallStatus === "ended" && (!hasRecording || !hasTranscript)) ||
        (recallStatus === "active" && (!hasRecording || !hasTranscript)) ||
        (recallStatus && !hasRecording && !hasTranscript) // Any recall status but no data yet
      );
    });

    if (processingMeetings.length === 0) return;

    const interval = setInterval(() => {
      processingMeetings.forEach((meeting) => {
        if (!loadingRecordings[meeting._id]) {
          fetchRecordingData(meeting._id);
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [meetingsWithRecordings, recordingData, loadingRecordings, transcripts]);

  // Poll for meeting notes generation
  useEffect(() => {
    const meetingsNeedingNotes = meetingsWithRecordings.filter((meeting) => {
      const storedData = recordingData[meeting._id];
      const hasTranscript = Boolean(
        meeting.recall?.transcriptText || storedData?.transcriptText
      );
      const hasNotes = Boolean(meetingNotes[meeting._id]);
      const isLoadingNotes = loadingNotes[meeting._id];

      // Poll if: has transcript but no notes and not currently loading
      return hasTranscript && !hasNotes && !isLoadingNotes;
    });

    if (meetingsNeedingNotes.length === 0) return;

    const interval = setInterval(() => {
      meetingsNeedingNotes.forEach((meeting) => {
        if (!loadingNotes[meeting._id]) {
          fetchMeetingNotes(meeting._id);
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [
    meetingsWithRecordings,
    recordingData,
    meetingNotes,
    loadingNotes,
    fetchMeetingNotes,
  ]);

  // Load transcript if we have URL but not text (moved from IIFE to fix hooks violation)
  useEffect(() => {
    if (!selectedMeeting) return;

    const storedData = recordingData[selectedMeeting._id];
    const transcriptUrl =
      selectedMeeting.recall?.transcriptUrl || storedData?.transcriptUrl;
    const transcriptText =
      selectedMeeting.recall?.transcriptText ||
      storedData?.transcriptText ||
      transcripts[selectedMeeting._id];
    const isLoading = loadingTranscripts[selectedMeeting._id];

    if (transcriptUrl && !transcriptText && !isLoading) {
      fetchTranscript(selectedMeeting._id, transcriptUrl);
    }
  }, [
    selectedMeeting,
    recordingData,
    transcripts,
    loadingTranscripts,
    fetchTranscript,
  ]);

  const isBusy = isLoading || isFetching;

  if (!lead) {
    return (
      <div className="text-xs text-white/60 p-4">
        Select a lead to view meeting recordings and transcripts.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 h-full min-h-0">
      {/* Left Side: Meeting List - 2/3 width */}
      <div className="col-span-2 flex flex-col gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white">
              Meeting Recordings
            </h3>
            <p className="text-xs text-white/60 mt-1">
              View recordings and transcripts from past meetings
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isBusy}
            className="h-8 w-8 p-0 flex items-center justify-center text-white/70 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCcw
              className={`w-3.5 h-3.5 ${isBusy ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg p-4 border border-red-500/20 bg-red-500/10">
            <div className="flex items-start gap-2 text-xs text-red-300">
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
              Recordings will appear here after meetings with Recall bots are
              completed.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3">
          {meetingsWithRecordings.map((meeting) => {
            const storedData = recordingData[meeting._id];
            const transcriptUrl = meeting.recall?.transcriptUrl || storedData?.transcriptUrl;
            const transcriptText = meeting.recall?.transcriptText || storedData?.transcriptText || transcripts[meeting._id];
            const recordingUrl = meeting.recall?.recordingUrl || storedData?.recordingUrl;
            const transcriptStatus = meeting.recall?.transcriptStatus || storedData?.transcriptStatus || ((transcriptUrl || transcriptText) ? "done" : "pending");
            const hasRecording = Boolean(recordingUrl);
            const hasTranscript = Boolean(transcriptUrl || transcriptText);
            const isTranscriptProcessing = transcriptStatus === "processing";
            const isTranscriptPending = transcriptStatus === "pending";
            const isLoadingRecording = loadingRecordings[meeting._id];
            const isLoadingTranscript = loadingTranscripts[meeting._id];
            const isSelected = selectedMeeting?._id === meeting._id;
            
            // Show loading if status is pending or we're actively loading
            const showRecordingLoading = (!hasRecording && (isLoadingRecording || isTranscriptPending)) || isLoadingRecording;
            const showTranscriptLoading = (!hasTranscript && (isLoadingTranscript || isTranscriptPending || isTranscriptProcessing)) || isLoadingTranscript;

              return (
                <div
                  key={meeting._id}
                  onClick={() => handleOpenMeetingDetails(meeting)}
                  className={`rounded-2xl border backdrop-blur-xl overflow-hidden transition-colors cursor-pointer ${
                    isSelected
                      ? "border-white/10 bg-white/20"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between px-4 py-3 gap-4">
                    {/* Left side: Icon + Meeting Info */}
                    <div className="flex items-center gap-3 flex-1">
                      {/* Calendar Icon */}
                      <div className="w-7 h-7 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                      </div>

                      {/* Meeting Title and Duration */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium text-white line-clamp-1">
                          {meeting.subject || "Meeting"}
                        </span>
                        <span className="text-xs text-white/60">
                          Duration: {formatDuration(meeting.durationMinutes)}
                        </span>
                      </div>
                    </div>

                    {/* Right side: Status Indicators + Date */}
                    <div className="flex items-center gap-3">
                      {/* Status Indicators */}
                      <div className="flex items-center gap-1.5">
                        {/* Recording Status */}
                        {hasRecording ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMeetingDetails(meeting);
                            }}
                            className="w-7 h-7 rounded-full border-2 border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer flex items-center justify-center flex-shrink-0 transition-colors"
                            title="Recording available"
                          >
                            <Play className="w-4 h-4 ml-0.5 text-emerald-400" />
                          </button>
                        ) : showRecordingLoading ? (
                          <div className="w-7 h-7 rounded-full border-2 border-amber-400/30 bg-amber-500/10 flex items-center justify-center flex-shrink-0" title="Loading recording...">
                            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                          </div>
                        ) : null}
                        
                        {/* Transcript Status */}
                        {hasTranscript ? (
                          <div className="w-7 h-7 rounded-full border-2 border-blue-400/30 bg-blue-500/10 flex items-center justify-center flex-shrink-0" title="Transcript available">
                            <FileText className="w-4 h-4 text-blue-400" />
                          </div>
                        ) : showTranscriptLoading ? (
                          <div className="w-7 h-7 rounded-full border-2 border-amber-400/30 bg-amber-500/10 flex items-center justify-center flex-shrink-0" title="Loading transcript...">
                            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                          </div>
                        ) : null}
                      </div>

                      {/* Date */}
                      <span className="text-xs text-white/60 whitespace-nowrap">
                        {formatMeetingDate(meeting.endDateTime)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Side: Meeting Details - 1/3 width */}
      <div className="col-span-1 flex flex-col text-white/80 text-center gap-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-semibold text-white leading-snug text-left">
            {selectedMeeting ? "Meeting Details" : "Meeting Recordings"}
          </h2>
          {selectedMeeting && (
            <button
              onClick={handleCloseMeetingDetails}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Close meeting details"
            >
              <X className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          )}
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-y-auto scrollbar-hide p-6 flex flex-col gap-6 flex-1">
          {selectedMeeting ? (
            <div className="flex flex-col gap-4 h-full">
              {/* Meeting Info Header */}
              <div className="flex flex-col gap-2 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-white line-clamp-1">
                      {selectedMeeting.subject || "Meeting"}
                    </span>
                    <span className="text-xs text-white/60">
                      {formatMeetingDate(selectedMeeting.endDateTime)} •{" "}
                      {formatDuration(selectedMeeting.durationMinutes)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-white/10">
                <button
                  onClick={() => setActiveTab("recording")}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === "recording"
                      ? "text-cyan-400"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  Recording
                  {activeTab === "recording" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("transcript")}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === "transcript"
                      ? "text-cyan-400"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  Transcript
                  {activeTab === "transcript" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === "notes"
                      ? "text-cyan-400"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  Notes
                  {activeTab === "notes" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {activeTab === "recording" ? (
                  <div className="flex flex-col gap-4">
                    {/* Audio Player */}
                    {(() => {
                      const storedData = recordingData[selectedMeeting._id];
                      const meetingEnded = new Date(selectedMeeting.endDateTime).getTime() < Date.now();
                      const recallStatus = selectedMeeting.recall?.status;
                      const hasRecordingUrl = selectedMeeting.recall?.recordingUrl || storedData?.recordingUrl;
                      const isStillProcessing = meetingEnded && (recallStatus === "ended" || recallStatus === "active") && !hasRecordingUrl;
                      
                      if (recordingLoading || isStillProcessing) {
                        return (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                            <span className="ml-2 text-sm text-white/60">
                              {isStillProcessing ? "Processing recording..." : "Loading recording..."}
                            </span>
                          </div>
                        );
                      } else if (recordingError) {
                        return (
                          <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <svg className="w-8 h-8 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-300 text-center">{recordingError}</p>
                          </div>
                        );
                      } else if (recordingAudioUrl) {
                        return (
                          <div className="flex flex-col gap-3">
                            <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                              <audio
                                controls
                                src={recordingAudioUrl}
                                className="w-full"
                                style={{
                                  filter: "invert(1) hue-rotate(180deg)",
                                }}
                              />
                            </div>
                            <p className="text-xs text-white/40 text-center">
                              Playback is streamed securely from Recall.ai.
                            </p>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg bg-white/5 border border-white/10">
                            <svg className="w-8 h-8 text-white/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <p className="text-sm text-white/60 text-center">No recording available</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                ) : activeTab === "transcript" ? (
                  <div className="flex flex-col gap-4">
                    {/* Transcript */}
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-semibold text-white/80">
                        Transcript
                      </h3>
                      {(() => {
                        const storedData = recordingData[selectedMeeting._id];
                        const transcriptUrl = selectedMeeting.recall?.transcriptUrl || storedData?.transcriptUrl;
                        const transcriptText = selectedMeeting.recall?.transcriptText || storedData?.transcriptText || transcripts[selectedMeeting._id];
                        const transcriptStatus = selectedMeeting.recall?.transcriptStatus || storedData?.transcriptStatus;
                        const meetingEnded = new Date(selectedMeeting.endDateTime).getTime() < Date.now();
                        const recallStatus = selectedMeeting.recall?.status;
                        const isProcessing = transcriptStatus === "processing";
                        const isLoading = loadingTranscripts[selectedMeeting._id];
                        const isStillProcessing = meetingEnded && (recallStatus === "ended" || recallStatus === "active") && !transcriptText && !transcriptUrl;

                        if (isProcessing || isStillProcessing) {
                          return (
                            <div className="flex items-center gap-2 py-4 px-4 rounded-lg bg-white/5 border border-white/10">
                              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                              <span className="text-sm text-white/60">
                                {isStillProcessing ? "Processing transcript..." : "Transcription in progress..."}
                              </span>
                            </div>
                          );
                        } else if (isLoading) {
                          return (
                            <div className="flex items-center gap-2 py-4 px-4 rounded-lg bg-white/5 border border-white/10">
                              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                              <span className="text-sm text-white/60">
                                Loading transcript...
                              </span>
                            </div>
                          );
                        } else if (transcriptText) {
                          return (
                            <div className="py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-left">
                              <pre className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-sans">
                                {transcriptText}
                              </pre>
                            </div>
                          );
                        } else {
                          return (
                            <div className="py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-center">
                              <p className="text-sm text-white/40">No transcript available</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Notes Preview */}
                    {(() => {
                      const notes = meetingNotes[selectedMeeting._id];
                      const isLoading = loadingNotes[selectedMeeting._id];
                      const error = notesErrors[selectedMeeting._id];
                      const storedData = recordingData[selectedMeeting._id];
                      const transcriptAvailable = Boolean(
                        selectedMeeting.recall?.transcriptText ||
                        storedData?.transcriptText
                      );

                      if (isLoading) {
                        return (
                          <div className="flex flex-col items-center gap-2 py-8">
                            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                            <span className="text-sm text-white/60">
                              Generating meeting notes...
                            </span>
                          </div>
                        );
                      } else if (!transcriptAvailable) {
                        return (
                          <div className="py-4 px-4 rounded-lg bg-white/5 border border-white/10 text-center">
                            <p className="text-sm text-white/40">
                              Transcript not available yet. Notes will be generated once the transcript is ready.
                            </p>
                          </div>
                        );
                      } else if (error) {
                        return (
                          <div className="flex flex-col items-center gap-4 py-8">
                            <div className="py-4 px-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                              <p className="text-sm text-red-300">{error}</p>
                            </div>
                            <Button
                              onClick={() => handleGenerateNotes(selectedMeeting._id)}
                              size="sm"
                              className="bg-cyan-500 hover:bg-cyan-600"
                            >
                              Retry
                            </Button>
                          </div>
                        );
                      } else if (!notes) {
                        return (
                          <div className="flex flex-col items-center gap-4 py-8">
                            <FileText className="w-12 h-12 text-white/30" />
                            <p className="text-sm text-white/60 text-center">
                              Enhanced meeting notes not generated yet
                            </p>
                            <Button
                              onClick={() => handleGenerateNotes(selectedMeeting._id)}
                              size="sm"
                              className="bg-cyan-500 hover:bg-cyan-600"
                            >
                              Generate Notes
                            </Button>
                          </div>
                        );
                      } else {
                        return (
                          <div
                            className="flex flex-col gap-4 text-left cursor-pointer hover:bg-white/5 p-4 rounded-lg transition-colors border border-white/10"
                            onClick={() => setShowNotesDetailModal(true)}
                          >
                            {/* Preview Summary */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-white/90">
                                  Meeting Notes Summary
                                </h4>
                                <FileText className="w-4 h-4 text-cyan-400" />
                              </div>
                              <p className="text-sm text-white/70 leading-relaxed line-clamp-3">
                                {notes.summary}
                              </p>
                            </div>

                            {/* Quick stats */}
                            <div className="flex gap-4 text-xs text-white/60 pt-2 border-t border-white/10">
                              {notes.keyPoints && notes.keyPoints.length > 0 && (
                                <span>{notes.keyPoints.length} Key Points</span>
                              )}
                              {notes.actionItems && notes.actionItems.length > 0 && (
                                <span>• {notes.actionItems.length} Action Items</span>
                              )}
                              {notes.decisions && notes.decisions.length > 0 && (
                                <span>• {notes.decisions.length} Decisions</span>
                              )}
                              {notes.sentiment && (
                                <span>• Sentiment: {notes.sentiment}</span>
                              )}
                            </div>

                            {/* Click to view indicator */}
                            <div className="flex items-center justify-center text-xs text-cyan-400 font-medium">
                              Click to view full details →
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Calendar className="w-12 h-12 text-white/30 mb-4" />
              <p className="text-sm text-white/60 text-center">
                Select a meeting from the list to view recording and transcript
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notes Detail Modal */}
      {showNotesDetailModal && selectedMeeting && typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowNotesDetailModal(false)}
          >
            <div
              className="bg-[#1a1d24] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Meeting Notes
                </h2>
                <p className="text-sm text-white/60 mt-1">
                  {selectedMeeting.subject} •{" "}
                  {formatDate(selectedMeeting.startDateTime)}
                </p>
              </div>
              <button
                onClick={() => setShowNotesDetailModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const notes = meetingNotes[selectedMeeting._id];
                if (!notes) return null;

                return (
                  <div className="flex flex-col gap-6 text-left">
                    {/* Summary */}
                    <div>
                      <h4 className="text-sm font-semibold text-white/90 mb-2">
                        Summary
                      </h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {notes.summary}
                      </p>
                    </div>

                    {/* Key Points */}
                    {notes.keyPoints && notes.keyPoints.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white/90 mb-2">
                          Key Points
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                          {notes.keyPoints.map((point, i) => (
                            <li key={i} className="text-sm text-white/70">
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Items */}
                    {notes.actionItems && notes.actionItems.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white/90 mb-2">
                          Action Items
                        </h4>
                        <div className="space-y-2">
                          {notes.actionItems.map((item, i) => (
                            <div
                              key={i}
                              className="p-3 rounded bg-white/5 border border-white/10"
                            >
                              <p className="text-sm text-white/80">
                                {item.description}
                              </p>
                              {item.assignee && (
                                <p className="text-xs text-white/50 mt-1">
                                  Assignee: {item.assignee}
                                </p>
                              )}
                              {item.dueDate && (
                                <p className="text-xs text-white/50">
                                  Due:{" "}
                                  {new Date(item.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Decisions */}
                    {notes.decisions && notes.decisions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white/90 mb-2">
                          Decisions Made
                        </h4>
                        <div className="space-y-2">
                          {notes.decisions.map((decision, i) => (
                            <div
                              key={i}
                              className="p-3 rounded bg-white/5 border border-white/10"
                            >
                              <p className="text-sm text-white/80">
                                {decision.description}
                              </p>
                              <p className="text-xs text-white/50 mt-1">
                                Impact: {decision.impact}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    {notes.nextSteps && notes.nextSteps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-white/90 mb-2">
                          Next Steps
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                          {notes.nextSteps.map((step, i) => (
                            <li key={i} className="text-sm text-white/70">
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Insights */}
                    {notes.insights && (
                      <div>
                        <h4 className="text-sm font-semibold text-white/90 mb-2">
                          AI Insights
                        </h4>
                        <p className="text-sm text-white/70 leading-relaxed">
                          {notes.insights}
                        </p>
                      </div>
                    )}

                    {/* Topics & Sentiment */}
                    <div className="flex gap-4 pt-2 border-t border-white/10">
                      {notes.sentiment && (
                        <div>
                          <h4 className="text-xs font-semibold text-white/60 mb-1">
                            Sentiment
                          </h4>
                          <Badge
                            variant={
                              notes.sentiment === "positive"
                                ? "default"
                                : notes.sentiment === "negative"
                                ? "destructive"
                                : "secondary"
                            }
                            className="capitalize"
                          >
                            {notes.sentiment}
                          </Badge>
                        </div>
                      )}
                      {notes.topics && notes.topics.length > 0 && (
                        <div className="flex-1">
                          <h4 className="text-xs font-semibold text-white/60 mb-1">
                            Topics
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {notes.topics.map((topic, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs"
                              >
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>,
          document.body
        )
      }
    </div>
  );
};

export default MeetingBotTab;
