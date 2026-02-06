import { FC, useMemo, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Lead } from "@/services/leads.service";
import { calendarService } from "@/services/calendar.service";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, FileText, Calendar, Play, X, Mail, MessageSquare, Send, RefreshCw, Copy, Video, Notebook, FileAudio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LeadMeetingRecord } from "@/services/calendar.service";
import { emailService } from "@/services/email.service";
import { twilioService } from "@/services/twilio.service";
import { whatsappService } from "@/services/whatsapp.service";
import { useToast } from "@/hooks/use-toast";
import { sanitizeErrorMessage } from "@/utils/errorMessages";
import { IoLogoWhatsapp } from "react-icons/io5";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [recordingVideoUrl, setRecordingVideoUrl] = useState<string | null>(
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

  // Follow-up functionality state
  const { toast } = useToast();
  const [followupTab, setFollowupTab] = useState<"email" | "sms" | "whatsapp">("email");
  const [followupDrafts, setFollowupDrafts] = useState<{
    email: string;
    sms: string;
    whatsapp: string;
  }>({ email: "", sms: "", whatsapp: "" });
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [regeneratingDrafts, setRegeneratingDrafts] = useState(false);
  const [sendingFollowup, setSendingFollowup] = useState(false);
  const [copiedState, setCopiedState] = useState<string | null>(null);

  // WhatsApp connection check removed - no longer needed with Wasender API

  const handleGenerateDrafts = async (meetingId: string, regenerate = false) => {
    if (regenerate) {
        setRegeneratingDrafts(true);
    } else {
        setLoadingDrafts(true);
    }

    try {
        const drafts = await calendarService.generateFollowupMessages(meetingId, regenerate);
        setFollowupDrafts({
            email: drafts.email || "",
            sms: drafts.sms || "",
            whatsapp: drafts.whatsapp || ""
        });
        
        // If we have drafts, update the local meeting status if needed (though drafts are separate)
    } catch (error: any) {
        console.error("Failed to generate drafts", error);
        const errorMessage = sanitizeErrorMessage(
          error,
          "Failed to generate follow-up drafts. Please try again."
        );

        toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive"
        });
    } finally {
        setLoadingDrafts(false);
        setRegeneratingDrafts(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(type);
    setTimeout(() => setCopiedState(null), 2000);
    toast({
        title: "Copied",
        description: "Message copied to clipboard",
    });
  };

  const handleSendFollowup = async () => {
    if (!selectedMeeting || !lead?._id) return;
    setSendingFollowup(true);

    try {
        const message = followupDrafts[followupTab];
        if (!message) return;

        if (followupTab === "email") {
            // Parse Subject and Body
            let subject = "Follow up";
            let body = message;
            
            // Simple parsing for "Subject: ..."
            const subjectMatch = message.match(/^Subject:\s*(.*?)(\n|$)/i);
            if (subjectMatch) {
                subject = subjectMatch[1].trim();
                body = message.replace(/^Subject:.*(\n|$)/i, "").trim();
            }

            // Convert newlines to simple HTML breaks for email body if it's plain text
            const htmlBody = body.replace(/\n/g, "<br/>");

            // Determine recipient email: try attendee first, then lead email
            const recipientEmail = selectedMeeting.attendees?.[0]?.email || lead.email || "";

            await emailService.sendEmail({
                to: [recipientEmail],
                subject,
                html: htmlBody,
                leadId: lead._id,
                // Attachments?
            } as any);
            toast({ title: "Email Sent", description: "Follow-up email sent successfully." });

        } else if (followupTab === "sms") {
            await twilioService.sendLeadMessage(lead._id, {
                body: message
            });
            toast({ title: "SMS Sent", description: "Follow-up SMS sent successfully." });

        } else if (followupTab === "whatsapp") {
            // Use WhatsApp-specific number, fallback to phone
            const whatsappNumber = lead.whatsapp || lead.phone;
            if (!whatsappNumber) throw new Error("Lead has no WhatsApp number available.");

            await whatsappService.sendTextMessage({
                to: whatsappNumber,
                text: message
            });
            toast({ title: "WhatsApp Sent", description: "Follow-up WhatsApp message sent successfully." });
        }
    } catch (error: any) {
        console.error("Failed to send message", error);
        toast({
            title: "Sending Failed",
            description: error.message || "Failed to send message.",
            variant: "destructive"
        });
    } finally {
        setSendingFollowup(false);
    }
  };

  // Effect to load drafts when tab is notes
  useEffect(() => {
    if (activeTab === "notes" && selectedMeeting) {
        // Check if we already have drafts in selectedMeeting?
        // The selectedMeeting object might be stale if we just updated drafts.
        // But generateFollowupMessages(..., false) handles fetching existing.
        // Only fetch if we haven't fetched for this meeting yet OR if it's empty
        if (!followupDrafts.email && !loadingDrafts) {
            handleGenerateDrafts(selectedMeeting._id, false);
        }
    }
  }, [activeTab, selectedMeeting]);

  // Reset drafts when meeting changes
  useEffect(() => {
      setFollowupDrafts({ email: "", sms: "", whatsapp: "" });
  }, [selectedMeeting?._id]);

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
    async (meetingId: string, transcriptUrl: string, sessionId?: string) => {
      if (transcripts[meetingId] || loadingTranscripts[meetingId]) {
        return;
      }

    setLoadingTranscripts((prev) => ({ ...prev, [meetingId]: true }));
    try {
      // Priority 1: Try local storage if we have sessionId (fastest)
      if (sessionId) {
        try {
          const text = await calendarService.getTranscriptTextLocal(sessionId);
          if (text && text.length > 0) {
            setTranscripts((prev) => ({ ...prev, [meetingId]: text }));
            return;
          }
        } catch (localError) {
          console.log("Local storage transcript not available, trying backend API:", localError);
        }
      }

      // Priority 2: Try to get transcript from backend API (it should have downloaded it and return local URL)
      const apiResponse = await calendarService.getMeetingRecording(meetingId);
      const recordingData = apiResponse.data;
      if (recordingData.transcriptText) {
        setTranscripts((prev) => ({ ...prev, [meetingId]: recordingData.transcriptText! }));
        return;
      }

      // Priority 3: If backend returns a local URL, try fetching from it
      if (recordingData.transcriptUrl && recordingData.transcriptUrl.includes('/api/recall/')) {
        try {
          const response = await fetch(recordingData.transcriptUrl);
          if (response.ok) {
            const text = await response.text();
            setTranscripts((prev) => ({ ...prev, [meetingId]: text }));
            return;
          }
        } catch (fetchError) {
          console.log("Failed to fetch from local backend URL:", fetchError);
        }
      }

      // If no transcript available through backend, show message
      throw new Error("Transcript not available");
    } catch (error) {
      console.error("Failed to fetch transcript:", error);
      setTranscripts((prev) => ({
        ...prev,
        [meetingId]: "Transcript not available. It may still be processing or failed to download.",
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
          [meetingId]: sanitizeErrorMessage(error, "Failed to load notes"),
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
          [meetingId]: sanitizeErrorMessage(error, "Failed to generate notes"),
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
      setRecordingVideoUrl(null);
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
      const sessionId = meeting.recall?.sessionId || storedData?.sessionId;

      // ALWAYS use backend endpoint when sessionId is available
      // Never use Recall URLs directly - always go through backend
      if (sessionId) {
        // Use backend endpoint for consistent access and caching
        // Use the same base URL logic as the API client
        const backendBaseUrl = import.meta.env.VITE_APP_BACKEND_URL || `${window.location.origin}/api`;
        const backendRecordingUrl = `${backendBaseUrl}/recall/recording/${sessionId}`;
        console.log('Using backend recording URL:', { backendBaseUrl, backendRecordingUrl, sessionId });
        setRecordingLoading(true);
        try {
          setRecordingVideoUrl(backendRecordingUrl);
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
      } else if (recordingUrl && recordingUrl.includes('/api/recall/')) {
        // Fallback: Only use backend URL format if no sessionId but URL is already a backend URL
        setRecordingLoading(true);
        try {
          setRecordingVideoUrl(recordingUrl);
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
      } else if (recordingUrl) {
        // If we have a Recall URL but no sessionId, log a warning
        console.warn('Meeting has recording URL but no sessionId - cannot use backend endpoint', {
          meetingId: meeting._id,
          recordingUrl: recordingUrl.substring(0, 100),
        });
        setRecordingError("Recording URL is not available through backend. Please wait for assets to be processed.");
      }
    },
    [recordingData, meetingNotes, fetchMeetingNotes]
  );

  const handleCloseMeetingDetails = useCallback(() => {
    setSelectedMeeting(null);
    // Note: No need to revoke URLs since we're using direct Recall CDN URLs now
    setRecordingVideoUrl(null);
    setRecordingError(null);
    setRecordingLoading(false);
  }, []);

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
    const sessionId = selectedMeeting.recall?.sessionId || storedData?.sessionId;

    if (transcriptUrl && !transcriptText && !isLoading) {
      fetchTranscript(selectedMeeting._id, transcriptUrl, sessionId);
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
    <div className="grid grid-cols-2 gap-4 h-full min-h-0">
      {/* Left Side: Meeting List - 1/2 width */}
      <div className="flex flex-col gap-4 overflow-hidden">
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
            const recallStatus = meeting.recall?.status || storedData?.status;
            const isFailed = recallStatus === "failed";
            const hasSessionId = Boolean(meeting.recall?.sessionId || storedData?.sessionId);
            
            const meetingEndTime = new Date(meeting.endDateTime).getTime();
            const meetingEnded = meetingEndTime < Date.now();
            const meetingEndedVeryRecently = meetingEnded && meetingEndTime > Date.now() - (15 * 60 * 1000); // within 15 mins
            const meetingEndedLongAgo = meetingEndTime < Date.now() - (15 * 60 * 1000); // 15 mins ago

            const hasRecording = Boolean(recordingUrl);
            const hasTranscript = Boolean(transcriptUrl || transcriptText);

            // It's unavailable if:
            // 1. Explicitly failed
            // 2. Ended long ago and still no data (regardless of sessionId)
            // 3. Ended long ago and no sessionId was ever created
            const isUnavailable = isFailed || 
                                (meetingEndedLongAgo && !hasRecording && !hasTranscript) ||
                                (meetingEndedLongAgo && !hasSessionId);

            const transcriptStatus = meeting.recall?.transcriptStatus || storedData?.transcriptStatus || ((hasTranscript) ? "done" : "pending");
            const isTranscriptProcessing = transcriptStatus === "processing";
            const isTranscriptPending = transcriptStatus === "pending";
            const isLoadingRecording = loadingRecordings[meeting._id];
            const isLoadingTranscript = loadingTranscripts[meeting._id];
            const isSelected = selectedMeeting?._id === meeting._id;
            
            // Show loading if:
            // 1. Actively fetching (isLoadingRecording)
            // 2. OR it's pending/processing AND bot exists AND it's recent (not long ago)
            const showRecordingLoading = !hasRecording && !isUnavailable && (isLoadingRecording || (hasSessionId && meetingEndedVeryRecently));
            const showTranscriptLoading = !hasTranscript && !isUnavailable && (isLoadingTranscript || (hasSessionId && (isTranscriptPending || isTranscriptProcessing) && meetingEndedVeryRecently));

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
                        ) : isUnavailable ? (
                          <div className="w-7 h-7 rounded-full border-2 border-white/5 bg-white/5 flex items-center justify-center flex-shrink-0 opacity-40" title="Recording not available">
                            <Play className="w-3.5 h-3.5 ml-0.5 text-white/40" />
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
                        ) : isUnavailable ? (
                          <div className="w-7 h-7 rounded-full border-2 border-white/5 bg-white/5 flex items-center justify-center flex-shrink-0 opacity-40" title="Transcript not available">
                            <FileText className="w-3.5 h-3.5 text-white/40" />
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

      {/* Right Side: Meeting Details - 1/2 width */}
      <div className="flex flex-col text-white/80 text-center gap-3 overflow-hidden">
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
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span 
                      className="text-sm font-medium text-white" 
                      title={selectedMeeting.subject}
                    >
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
              <div className="flex justify-between gap-2 border-b border-white/10 overflow-x-auto scrollbar-hide">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab("recording")}
                      className={`px-3 py-2 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 flex items-center justify-center gap-2 ${
                        activeTab === "recording"
                          ? "text-cyan-400"
                          : "text-white/60 hover:text-white/80"
                      }`}
                    >
                      <Video className="w-5 h-5" />
                      <span className="hidden 2xl:block">Recording</span>
                      {activeTab === "recording" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-medium text-xs">Recording</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab("transcript")}
                      className={`px-3 py-2 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 flex items-center justify-center gap-2 ${
                        activeTab === "transcript"
                          ? "text-cyan-400"
                          : "text-white/60 hover:text-white/80"
                      }`}
                    >
                      <FileAudio className="w-5 h-5" />
                      <span className="hidden 2xl:block">Transcript</span>
                      {activeTab === "transcript" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-medium text-xs">Transcript</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveTab("notes")}
                      className={`px-3 py-2 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 flex items-center justify-center gap-2 ${
                        activeTab === "notes"
                          ? "text-cyan-400"
                          : "text-white/60 hover:text-white/80"
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                      <span className="hidden 2xl:block">Notes</span>
                      {activeTab === "notes" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="font-medium text-xs">Notes</p>
                  </TooltipContent>
                </Tooltip>
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
                      const hasSessionIdDetail = Boolean(selectedMeeting.recall?.sessionId || storedData?.sessionId);
                      const meetingEndTimeDetail = new Date(selectedMeeting.endDateTime).getTime();
                      const meetingEndedLongAgoDetail = meetingEndTimeDetail < Date.now() - (15 * 60 * 1000);
                      const meetingEndedVeryRecentlyDetail = meetingEnded && meetingEndTimeDetail > Date.now() - (15 * 60 * 1000);
                      
                      const recallStatusDetail = selectedMeeting.recall?.status || storedData?.status;
                      const isFailedDetail = recallStatusDetail === "failed";

                      const isStillProcessing = meetingEnded && (recallStatus === "ended" || recallStatus === "active") && !hasRecordingUrl && meetingEndedVeryRecentlyDetail;
                      const isUnavailableDetail = isFailedDetail || (meetingEndedLongAgoDetail && !hasRecordingUrl);
                      
                      if (recordingLoading || (isStillProcessing && !isUnavailableDetail)) {
                        return (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                            <span className="ml-2 text-sm text-white/60">
                              {isStillProcessing ? "Processing recording..." : "Loading recording..."}
                            </span>
                          </div>
                        );
                      } else if (isUnavailableDetail) {
                        return (
                          <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg bg-white/5 border border-white/10">
                            <svg className="w-8 h-8 text-white/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-white/40 text-center">Recording not available</p>
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
                      } else if (recordingVideoUrl) {
                        return (
                          <div className="flex flex-col gap-3">
                            <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                              <video
                                controls
                                src={recordingVideoUrl}
                                className="w-full rounded"
                              />
                            </div>
                            <p className="text-xs text-white/40 text-center">
                              Playback served securely through our backend.
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
                      {/* <h3 className="text-xs font-semibold text-white/80">
                        Transcript
                      </h3> */}
                      {(() => {
                        const storedData = recordingData[selectedMeeting._id];
                        const transcriptUrl = selectedMeeting.recall?.transcriptUrl || storedData?.transcriptUrl;
                        const transcriptText = selectedMeeting.recall?.transcriptText || storedData?.transcriptText || transcripts[selectedMeeting._id];
                        const meetingEnded = new Date(selectedMeeting.endDateTime).getTime() < Date.now();
                        const recallStatus = selectedMeeting.recall?.status || storedData?.status;
                        
                        const transcriptStatus = selectedMeeting.recall?.transcriptStatus || storedData?.transcriptStatus;
                        const meetingEndTimeTrans = new Date(selectedMeeting.endDateTime).getTime();
                        const meetingEndedLongAgoTrans = meetingEndTimeTrans < Date.now() - (15 * 60 * 1000);
                        const meetingEndedVeryRecentlyTrans = meetingEnded && meetingEndTimeTrans > Date.now() - (15 * 60 * 1000);
                        
                        const isFailedTrans = recallStatus === "failed";

                        const isProcessing = transcriptStatus === "processing";
                        const isLoading = loadingTranscripts[selectedMeeting._id];
                        const isStillProcessing = meetingEnded && (recallStatus === "ended" || recallStatus === "active") && !transcriptText && !transcriptUrl && meetingEndedVeryRecentlyTrans;
                        const isUnavailableTrans = isFailedTrans || (meetingEndedLongAgoTrans && !transcriptText && !transcriptUrl);

                        if ((isProcessing || isStillProcessing) && !isUnavailableTrans) {
                          return (
                            <div className="flex items-center gap-2 py-4 px-4 rounded-lg bg-white/5 border border-white/10">
                              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                              <span className="text-sm text-white/60">
                                {isStillProcessing ? "Processing transcript..." : "Transcription in progress..."}
                              </span>
                            </div>
                          );
                        } else if (isUnavailableTrans) {
                          return (
                            <div className="py-4 px-4 rounded-lg bg-white/5 border border-white/10 text-center">
                              <p className="text-sm text-white/40">Transcript not available</p>
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
                            className="flex flex-col gap-4 text-left  cursor-pointer hover:bg-white/5 p-4 rounded-lg transition-colors border border-white/10"
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

                    {/* Follow-up Generator Section */}
                    {meetingNotes[selectedMeeting._id] && (
                        <div className="flex flex-col gap-4 pt-6 border-t border-white/10 mt-2">
                             <div className="text-center">
                                <h4 className="text-sm font-semibold text-white/90">
                                  AI Follow-up Drafts
                                </h4>
                             </div>

                             {loadingDrafts ? (
                                <div className="flex items-center justify-center py-12 rounded-2xl bg-white/[0.02] border border-white/10">
                                    <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                                    <span className="ml-2 text-sm text-white/60">Generating drafts...</span>
                                </div>
                             ) : (
                                <div className="flex flex-col gap-4">
                                    {/* Channel Tabs */}
                                    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                                        {[
                                            { id: "email", icon: Mail, label: "Email" },
                                            { id: "sms", icon: MessageSquare, label: "SMS" },
                                            { id: "whatsapp", icon: IoLogoWhatsapp, label: "WhatsApp" }
                                        ].map((channel) => (
                                            <button
                                                key={channel.id}
                                                // @ts-ignore
                                                onClick={() => setFollowupTab(channel.id)}
                                                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 ${
                                                    followupTab === channel.id
                                                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                                        : "text-white/40 hover:text-white/60 hover:bg-white/5"
                                                }`}
                                                title={channel.label}
                                            >
                                                <channel.icon className="w-5 h-5" />
                                                <span className="hidden 2xl:block text-xs font-medium">{channel.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Message Display/Edit */}
                                    <div className="relative group">
                                        <textarea
                                            value={followupDrafts[followupTab]}
                                            onChange={(e) => setFollowupDrafts(prev => ({ ...prev, [followupTab]: e.target.value }))}
                                            className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-5 text-sm text-white/80 resize-none focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 font-sans leading-relaxed transition-all placeholder:text-white/20 scrollbar-hide"
                                            placeholder={`Generated ${followupTab} message will appear here...`}
                                        />
                                        
                                        {/* Copy Button (Hidden as requested) */}
                                        {/* <Button ... /> */}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-3 mt-1">
                                         {/* Regenerate Button */}
                                         <Button
                                          variant="outline"
                                          size="icon"
                                          onClick={() => handleGenerateDrafts(selectedMeeting._id, true)}
                                          disabled={regeneratingDrafts || loadingDrafts}
                                          className="h-10 w-10 rounded-full border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20"
                                          title="Regenerate Drafts"
                                        >
                                          {regeneratingDrafts ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <RefreshCw className="w-4 h-4" />
                                          )}
                                        </Button>

                                        {/* Send Button */}
                                        <Button
                                            onClick={handleSendFollowup}
                                            disabled={sendingFollowup || !followupDrafts[followupTab]}
                                            className="relative overflow-hidden h-10 px-6 rounded-full border border-white/40 text-xs font-medium tracking-wide transition-all duration-400 ease-elastic text-white shadow-[0_16px_28px_rgba(0,0,0,0.35)] bg-gradient-to-r from-[#30cfd0] via-[#2a9cb3] to-[#1f6f86] z-10 before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-2/5 before:rounded-t-full before:bg-gradient-to-b before:from-white/15 before:to-transparent before:transition-all before:duration-300 before:ease-in-out hover:shadow-[0_0_20px_rgba(48,207,208,0.5)]"
                                            style={{
                                                boxShadow:
                                                    "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
                                            }}
                                        >
                                            <div
                                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[100px] h-[100px] rounded-full pointer-events-none"
                                                style={{
                                                    background: "linear-gradient(180deg, #67B0B7 0%, #4066B3 100%)",
                                                    filter: "blur(20px)",
                                                    WebkitFilter: "blur(20px)",
                                                }}
                                            ></div>
                                            {sendingFollowup ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin relative z-10" />
                                                    <span className="relative z-10">Sending...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2 relative z-10" />
                                                    <span className="relative z-10">Send Now</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                             )}
                        </div>
                    )}
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all duration-300"
            onClick={() => setShowNotesDetailModal(false)}
          >
            <div
              className="relative bg-[#0a0a0a] rounded-[32px] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.55)] animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradient overlay */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
                }}
              />

              <div className="relative z-10 flex flex-col h-full min-h-0">
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
                    className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
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
          </div>
        </div>,
          document.body
        )
      }
    </div>
  );
};

export default MeetingBotTab;
