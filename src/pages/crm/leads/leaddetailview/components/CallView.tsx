import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Lead } from "@/services/leads.service";
import { Button } from "@/components/ui/button";
import { Device } from "@twilio/voice-sdk";
import {
  twilioService,
  LeadCallLog,
  LeadCallStatus,
  CreateLeadCallLogPayload,
  elevenlabsService,
} from "@/services/twilio.service";
import API from "@/utils/api";
import { SelectedCallLogView } from "../index";
import { ActiveNavButton } from "@/components/ui/primary-btn";
import { RefreshCcw, Loader2, Sparkles } from "lucide-react";
import EditableFollowupSuggestion from "@/components/followups/EditableFollowupSuggestion";
import {
  useCreateFollowupPlanFromCall,
  useUpdateFollowupPlan,
} from "@/hooks/useFollowupPlans";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CallViewProps = {
  lead?: Lead;
  twilioReady: boolean;
  twilioStatusMessage: string;
  twilioStatusLoading: boolean;
  autoStart?: boolean;
  selectedCallLogView: SelectedCallLogView;
  setSelectedCallLogView: (view: SelectedCallLogView) => void;
  mode?: "call" | "ai";
};

export const CallView = ({
  lead,
  twilioReady,
  twilioStatusMessage,
  twilioStatusLoading,
  autoStart = false,
  selectedCallLogView,
  setSelectedCallLogView,
  mode = "call",
}: CallViewProps) => {
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState(
    twilioStatusLoading
      ? "Checking calling availability..."
      : twilioReady
      ? "Ready to call"
      : twilioStatusMessage || "Twilio calling is unavailable."
  );
  const [callPhase, setCallPhase] = useState<
    "idle" | "ringing" | "incoming" | "connected"
  >("idle");
  const [aiCallLoading, setAiCallLoading] = useState(false);
  const [callLogs, setCallLogs] = useState<LeadCallLog[]>([]);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [callLogsError, setCallLogsError] = useState<string | null>(null);
  const [isRefreshingCallLogs, setIsRefreshingCallLogs] = useState(false);
  const [recordingAudioUrl, setRecordingAudioUrl] = useState<string | null>(
    null
  );
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const { toast } = useToast();
  const createPlanFromCallMutation = useCreateFollowupPlanFromCall();
  const updatePlanMutation = useUpdateFollowupPlan();
  
  // New state for call details view
  const [selectedCallLog, setSelectedCallLog] = useState<LeadCallLog | null>(null);
  const [activeTab, setActiveTab] = useState<"recording" | "followup">("recording");

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<Awaited<ReturnType<Device["connect"]>> | null>(
    null
  );
  const callStartTimeRef = useRef<number | null>(null);
  const dialedNumberRef = useRef<string | null>(null);
  const callSidRef = useRef<string | null>(null);
  const autoStartTriggeredRef = useRef(false);

  type TwilioConnection = Awaited<ReturnType<Device["connect"]>>;
  type DeviceError = { message: string };

  useEffect(() => {
    setCallStatus(
      twilioStatusLoading
        ? "Checking calling availability..."
        : twilioReady
        ? "Ready to call"
        : twilioStatusMessage || "Twilio calling is unavailable."
    );
  }, [twilioReady, twilioStatusLoading, twilioStatusMessage]);

  const leadId = lead?._id || null;
  const leadName = lead?.name || null;
  const leadPhone = lead?.phone || null;



  const fetchCallLogs = useCallback(
    async (options?: { background?: boolean }) => {
      const isBackground = options?.background ?? false;

      if (!leadId) {
        setCallLogs([]);
        setCallLogsError(null);
        setCallLogsLoading(false);
        return;
      }

      try {
        setCallLogsError(null);
        if (!isBackground) {
          setCallLogsLoading(true);
        }
        
        const response = await twilioService.getLeadCallLogs(leadId, {
          limit: 10,
        });
        const nextLogs = response.data || [];

        // Avoid unnecessary re-renders if nothing changed
        setCallLogs((prev) => {
          try {
            if (JSON.stringify(prev) === JSON.stringify(nextLogs)) {
              return prev;
            }
          } catch {
            // If comparison fails for any reason, fall back to updating
          }
          return nextLogs;
        });
      } catch (loadError: any) {
        console.error("Failed to load call logs", loadError);
        setCallLogsError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            "Unable to load call logs."
        );
      } finally {
        if (!isBackground) {
          setCallLogsLoading(false);
        }
      }
    },
    [leadId, leadName, leadPhone]
  );

  useEffect(() => {
    fetchCallLogs();
  }, [fetchCallLogs]);

  const handleRefreshCallLogs = useCallback(async () => {
    if (!leadId) return;
    try {
      setIsRefreshingCallLogs(true);
      await fetchCallLogs();
    } finally {
      setIsRefreshingCallLogs(false);
    }
  }, [fetchCallLogs, leadId]);

  const handleRecordingView = useCallback(
    async (log: LeadCallLog) =>{
      setSelectedCallLogView({ type: "recording", log });
      // All actual audio fetching is handled in the Activity summary view,
      // which listens to selectedCallLogView changes and chooses the correct
      // provider-specific endpoint. We keep this handler as a pure selector.
    },
    [setSelectedCallLogView]
  );

  // New handler to open call details in the right panel
  const handleOpenCallDetails = useCallback(
    async (log: LeadCallLog) => {
      setSelectedCallLog(log);
      setActiveTab("recording");
      
      console.log("[handleOpenCallDetails] Call log:", log._id);
      
      setRecordingAudioUrl(null);
      setRecordingError(null);
      setRecordingLoading(true);

      try {
        const recordingUrl = log.elevenlabsRecordingUrl || log.recordingUrl || null;
        
        // If it's a direct URL (like data: or http), use it
        if (
          typeof recordingUrl === "string" &&
          (recordingUrl.startsWith("http://") || 
           recordingUrl.startsWith("https://") || 
           recordingUrl.startsWith("data:audio/"))
        ) {
          console.log("[handleOpenCallDetails] Setting audio URL:", recordingUrl);
          setRecordingAudioUrl(recordingUrl);
          setRecordingLoading(false);
          return;
        }

        // Otherwise fetch via API proxy
        const isElevenLabsCall =
          !!log.elevenlabsCallId ||
          !!log.elevenlabsRecordingUrl ||
          log.metadata?.provider === "elevenlabs";

        const endpoint = isElevenLabsCall
          ? `/elevenlabs/calls/${log._id}/recording`
          : `/twilio/calls/${log._id}/recording`;

        const response = await API.get(endpoint, {
          responseType: "blob",
        });
        const blob = response.data as Blob;
        const url = URL.createObjectURL(blob);
        setRecordingAudioUrl(url);

      } catch (err: any) {
        console.error("Failed to load call recording", err);
        // Only show error if no recording is expected or fetch failed
        if (!log.recordingSid && !log.elevenlabsRecordingUrl && !log.recordingUrl) {
             setRecordingError("No recording available for this call.");
        } else {
             setRecordingError(
               err?.response?.data?.error ||
               err?.message ||
               "Unable to load call recording."
             );
        }
      } finally {
        setRecordingLoading(false);
      }
    },
    []
  );

  // Handler to close call details and return to "Make a call" view
  const handleCloseCallDetails = useCallback(() => {
    setSelectedCallLog(null);
    setSelectedCallLogView(null); // Also clear old view
    setRecordingAudioUrl(null);
    setRecordingError(null);
    setRecordingLoading(false);
  }, [setSelectedCallLogView]);

  // Close details when switching tabs (modes)
  useEffect(() => {
    handleCloseCallDetails();
  }, [mode, handleCloseCallDetails]);

  // Load recording audio URL when recording view is selected
  const loadRecordingAudio = useCallback(async (view: SelectedCallLogView) => {
    const log = view?.log as any;
    if (!log?._id) {
      setRecordingError("Recording not available for this call.");
      return;
    }

    setRecordingAudioUrl(null);
    setRecordingError(null);
    try {
      setRecordingLoading(true);
      const recordingUrl =
        log.elevenlabsRecordingUrl || log.recordingUrl || null;

      // If we have an inline ElevenLabs data: URL, use it directly
      if (
        typeof recordingUrl === "string" &&
        recordingUrl.startsWith("data:audio/")
      ) {
        setRecordingAudioUrl(recordingUrl);
        return;
      }

      // ============================================================
      // RESTORED: Original API call for production use
      // ============================================================
      const isElevenLabsCall =
        !!log.elevenlabsCallId ||
        !!log.elevenlabsRecordingUrl ||
        log.metadata?.provider === "elevenlabs";

      const endpoint = isElevenLabsCall
        ? `/elevenlabs/calls/${log._id}/recording`
        : `/twilio/calls/${log._id}/recording`;

      const response = await API.get(endpoint, {
        responseType: "blob",
      });
      const blob = response.data as Blob;
      const url = URL.createObjectURL(blob);
      setRecordingAudioUrl(url);

      // If we got here, we have a URL from the blob
      if (!url) {
        setRecordingError("No recording available for this call.");
      }
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
  }, []);

  // Load recording when a recording view is selected
  useEffect(() => {
    if (
      selectedCallLogView?.type === "recording" &&
      selectedCallLogView.log._id
    ) {
      loadRecordingAudio(selectedCallLogView);
    }
  }, [selectedCallLogView, loadRecordingAudio]);

  // Cleanup recording URL when view is cleared
  useEffect(() => {
    // Only clear if NEITHER view is showing a recording
    if ((!selectedCallLogView || selectedCallLogView.type !== "recording") && !selectedCallLog) {
      if (recordingAudioUrl) {
        URL.revokeObjectURL(recordingAudioUrl);
        setRecordingAudioUrl(null);
      }
      setRecordingError(null);
      setRecordingLoading(false);
    }
  }, [selectedCallLogView, selectedCallLog, recordingAudioUrl]);

  const logCallCompletion = useCallback(
    async (status: LeadCallStatus = "completed") => {
      if (!leadId) {
        callStartTimeRef.current = null;
        dialedNumberRef.current = null;
        callSidRef.current = null;
        return;
      }

      const startedAtMs = callStartTimeRef.current;
      if (!startedAtMs) {
        dialedNumberRef.current = null;
        callSidRef.current = null;
        return;
      }

      const endedAtMs = Date.now();
      const durationSeconds = Math.max(
        0,
        Math.round((endedAtMs - startedAtMs) / 1000)
      );

      const payload: CreateLeadCallLogPayload = {
        leadId,
        direction: "outbound",
        status,
        channel: "Phone",
        startedAt: new Date(startedAtMs).toISOString(),
        endedAt: new Date(endedAtMs).toISOString(),
        durationSeconds,
        to: dialedNumberRef.current,
        leadName,
        leadPhone,
      };

      if (callSidRef.current) {
        payload.metadata = { callSid: callSidRef.current };
      }

      try {
        await twilioService.logLeadCall(payload);
        
        // Refresh call logs in the background so the UI doesn't flash
        await fetchCallLogs({ background: true });
      } catch (logError: any) {
        console.error("Unable to store call log", logError);
        setError((prev) => prev || "Call ended but log could not be saved.");
      } finally {
        callStartTimeRef.current = null;
        dialedNumberRef.current = null;
        callSidRef.current = null;
      }
    },
    [fetchCallLogs, leadId, leadName, leadPhone]
  );

  const getConnectionCallSid = (
    connection: TwilioConnection
  ): string | null => {
    const parameters = (connection as any)?.parameters;
    const sid =
      parameters?.CallSid ||
      parameters?.callSid ||
      parameters?.call_sid ||
      null;
    return typeof sid === "string" ? sid : null;
  };

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    frequencyDataRef.current = null;

    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close().catch(() => undefined);
    }
    audioContextRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setIsListening(false);
    setWaveformData([]);
  }, []);

  const animateVolume = useCallback(() => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const frequencyData = frequencyDataRef.current;
    if (!analyser || !dataArray || !frequencyData) return;

    // Create typed arrays for the analyser methods
    const timeDomainArray = new Uint8Array(analyser.fftSize);
    const freqArray = new Uint8Array(analyser.frequencyBinCount);

    analyser.getByteTimeDomainData(timeDomainArray);
    let sumSquares = 0;
    for (let i = 0; i < timeDomainArray.length; i++) {
      const value = (timeDomainArray[i] - 128) / 128;
      sumSquares += value * value;
    }
    const rms = Math.sqrt(sumSquares / timeDomainArray.length);
    const smoothed = Math.min(1, rms * 3);
    setVolumeLevel((prev) => prev * 0.8 + smoothed * 0.2);

    // Capture time-domain data for waveform (oscillates above/below zero)
    const dataLength = timeDomainArray.length;
    const barCount = 50; // Number of points in waveform
    const step = Math.floor(dataLength / barCount);
    const waveform = [];
    for (let i = 0; i < barCount; i++) {
      const index = i * step;
      // Time-domain values are already normalized to -1 to 1 range
      const value = (timeDomainArray[index] - 128) / 128;
      waveform.push(value);
    }
    setWaveformData(waveform);

    animationFrameRef.current = requestAnimationFrame(animateVolume);
  }, []);

  const startListening = useCallback(async () => {
    if (isListening) return;

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("Microphone access is not supported in this browser.");
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      mediaStreamRef.current = stream;

      const AudioContextConstructor =
        typeof window !== "undefined"
          ? window.AudioContext ||
            (
              window as typeof window & {
                webkitAudioContext?: typeof AudioContext;
              }
            ).webkitAudioContext
          : null;

      if (!AudioContextConstructor) {
        throw new Error("Web Audio API is not supported.");
      }

      const audioCtx = new AudioContextConstructor();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.fftSize);
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      setIsListening(true);
      animateVolume();
    } catch (streamError) {
      console.error("Failed to start microphone", streamError);
      setError(
        streamError instanceof DOMException &&
          streamError.name === "NotAllowedError"
          ? "Microphone permission was denied."
          : "Unable to access the microphone. Please try again."
      );
      stopListening();
    }
  }, [animateVolume, isListening, stopListening]);

  // Start listening to microphone when component mounts or Twilio becomes ready
  useEffect(() => {
    // Only prevent retry if it's a permission denial error
    const isPermissionError =
      error?.includes("permission") || error?.includes("denied");
    if (twilioReady && !isListening && !isPermissionError) {
      startListening();
    }
  }, [twilioReady, isListening, error, startListening]);

  useEffect(() => {
    return () => {
      stopListening();
      try {
        activeCallRef.current?.disconnect();
        deviceRef.current?.destroy();
      } catch (_) {
        /* noop */
      } finally {
        activeCallRef.current = null;
        deviceRef.current = null;
        callStartTimeRef.current = null;
        dialedNumberRef.current = null;
        callSidRef.current = null;
      }
    };
  }, [stopListening]);

  const normalizeNumber = useCallback((raw?: string | null): string | null => {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    let formatted = trimmed.replace(/[^+\d]/g, "");
    if (formatted.startsWith("00")) {
      formatted = "+" + formatted.slice(2);
    }

    if (!formatted.startsWith("+")) {
      if (/^\d{10}$/.test(formatted)) {
        formatted = "+1" + formatted;
      } else {
        return null;
      }
    }

    if (!/^\+[1-9]\d{7,14}$/.test(formatted)) {
      return null;
    }

    return formatted;
  }, []);

  const attachConnectionListeners = useCallback(
    (connection: TwilioConnection) => {
      connection.on("accept", () => {
        callStartTimeRef.current = Date.now();
        callSidRef.current = getConnectionCallSid(connection);
        setCallPhase("connected");
        setCallStatus("Call connected");
        // Microphone is already listening, no need to start again
      });

      connection.on("disconnect", () => {
        setCallStatus("Call ended");
        setCallPhase("idle");
        // Keep microphone listening for waveform visualization
        activeCallRef.current = null;
        void logCallCompletion("completed");
      });

      connection.on("cancel", () => {
        // Twilio fires "cancel" when the remote party hangs up
        // before the call is answered. If we've already marked
        // a start time (i.e., call was accepted/connected),
        // ignore this event to avoid confusing UI like
        // "Call cancelled" while audio is still live.
        if (callStartTimeRef.current) {
          return;
        }
        setCallStatus("Call cancelled");
        setCallPhase("idle");
        // Keep microphone listening for waveform visualization
        activeCallRef.current = null;
        // For now we don't persist a separate "cancelled" log when
        // the call never connected; disconnect events will handle logs.
      });

      connection.on("error", (event) => {
        setCallStatus(`Call error: ${event.message}`);
        setCallPhase("idle");
        // Keep microphone listening for waveform visualization
        activeCallRef.current = null;
        void logCallCompletion("failed");
      });
    },
    [logCallCompletion, startListening, stopListening]
  );

  const ensureDevice = useCallback(async (): Promise<Device> => {
    if (deviceRef.current) {
      return deviceRef.current;
    }

    let data;
    try {
      data = await twilioService.getToken();
    } catch (tokenError: any) {
      const friendlyMessage = axios.isAxiosError(tokenError)
        ? tokenError.response?.data?.error ||
          tokenError.response?.data?.message ||
          (tokenError.response?.status === 404
            ? "Company Twilio credentials aren't added yet."
            : "Unable to fetch calling token.")
        : tokenError?.message || "Unable to fetch calling token.";
      throw new Error(friendlyMessage);
    }
    if (!data.token) {
      throw new Error("Unable to fetch calling token");
    }

    const device = new Device(data.token, { logLevel: "error" });

    device.on("error", (event: DeviceError) => {
      setCallStatus(`Error: ${event.message}`);
    });

    device.on("disconnect", () => {
      setCallStatus("Call ended");
      setCallPhase("idle");
      // Keep microphone listening for waveform visualization
      activeCallRef.current = null;
    });

    device.on("registered", () => {
      setCallStatus("Ready to call");
    });

    device.on("unregistered", () => {
      setCallStatus("Reconnecting to calling service...");
    });

    // Handle incoming calls from Twilio (e.g., when someone dials your Twilio number)
    device.on("incoming", (connection: any) => {
      try {
        callSidRef.current = getConnectionCallSid(connection);
      } catch {
        callSidRef.current = null;
      }

      const params = (connection as any)?.parameters || {};
      const fromNumber =
        params.From || params.from || params.Caller || params.caller || null;
      dialedNumberRef.current =
        typeof fromNumber === "string" ? fromNumber : null;

      activeCallRef.current = connection;
      attachConnectionListeners(connection as TwilioConnection);

      setCallPhase("incoming");
      setCallStatus("Incoming call...");
    });

    await device.register();
    deviceRef.current = device;
    return device;
  }, [attachConnectionListeners]);

  // Proactively initialize and register the Twilio Device so that
  // incoming PSTN calls can be received even if the user hasn't
  // placed an outbound call yet.
  useEffect(() => {
    if (!twilioReady || twilioStatusLoading) {
      return;
    }

    let mounted = true;

    const initDevice = async () => {
      try {
        await ensureDevice();
      } catch (initError) {
        if (!mounted) return;
        setError(
          (prev) =>
            prev ||
            (initError instanceof Error
              ? initError.message
              : "Unable to initialize calling device.")
        );
      }
    };

    void initDevice();

    return () => {
      mounted = false;
    };
  }, [ensureDevice, twilioReady, twilioStatusLoading]);

  const handleCall = useCallback(async () => {
    if (callPhase === "ringing" || callPhase === "connected") {
      return;
    }

    if (!twilioReady) {
      setCallStatus(
        twilioStatusMessage || "Twilio calling isn't configured yet."
      );
      return;
    }

    const normalizedNumber = normalizeNumber(lead?.phone);
    if (!normalizedNumber) {
      setCallStatus("Lead phone number is missing or invalid.");
      return;
    }

    try {
      setCallPhase("ringing");
      setCallStatus("Ringing...");
      dialedNumberRef.current = normalizedNumber;

      const device = await ensureDevice();
      const connection = await device.connect({
        params: { To: normalizedNumber },
      });

      activeCallRef.current = connection;
      attachConnectionListeners(connection);
    } catch (callError) {
      setCallStatus(
        callError instanceof Error ? callError.message : "Unable to place call"
      );
      setCallPhase("idle");
      dialedNumberRef.current = null;
      // Keep microphone listening for waveform visualization
    }
  }, [
    attachConnectionListeners,
    callPhase,
    ensureDevice,
    lead?.phone,
    normalizeNumber,
  ]);

  const handleAnswerIncoming = useCallback(() => {
    if (callPhase !== "incoming") {
      return;
    }
    const connection = activeCallRef.current;
    if (!connection) {
      setCallStatus("No incoming call to answer.");
      setCallPhase("idle");
      return;
    }
    try {
      (connection as any).accept();
    } catch {
      setCallStatus("Failed to answer call.");
      setCallPhase("idle");
      activeCallRef.current = null;
    }
  }, [callPhase]);

  const handleAICall = useCallback(async () => {
    if (!lead?._id) {
      setError("Lead ID is missing");
      return;
    }

    if (aiCallLoading) {
      return;
    }

    try {
      setAiCallLoading(true);
      setError(null);
      setCallStatus("Initiating AI call...");

      const result = await elevenlabsService.initiateAICall(lead._id);

      setCallStatus("AI call initiated successfully");
      
      // Refresh call logs after a short delay to show the new call
      setTimeout(() => {
        handleRefreshCallLogs();
      }, 2000);
    } catch (callError: any) {
      const errorMessage =
        callError?.response?.data?.error ||
        callError?.message ||
        "Failed to initiate AI call";
      setError(errorMessage);
      setCallStatus(errorMessage);
    } finally {
      setAiCallLoading(false);
    }
  }, [lead?._id, aiCallLoading]);

  const handleDeclineIncoming = useCallback(() => {
    if (callPhase !== "incoming") {
      return;
    }
    const connection = activeCallRef.current;
    if (!connection) {
      setCallStatus("No incoming call to decline.");
      setCallPhase("idle");
      return;
    }
    try {
      // Prefer reject for unanswered inbound calls; fall back to disconnect
      if (typeof (connection as any).reject === "function") {
        (connection as any).reject();
      } else {
        (connection as any).disconnect();
      }
    } catch {
      // ignore errors, just reset UI state
    } finally {
      setCallStatus("Call declined");
      setCallPhase("idle");
      activeCallRef.current = null;
    }
  }, [callPhase]);

  const handleHangUp = useCallback(() => {
    activeCallRef.current?.disconnect();
    deviceRef.current?.disconnectAll();
    activeCallRef.current = null;
    setCallStatus("Call ended");
    setCallPhase("idle");
    // Keep microphone listening for waveform visualization
  }, []);

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

  const formatStatus = (status?: string | null) => {
    if (!status) {
      return "—";
    }
    return status
      .split(/[\s_-]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const getStatusColor = (status?: LeadCallStatus) => {
    if (!status) {
      return "text-white/60";
    }
    if (status === "failed" || status === "cancelled") {
      return "text-red-300";
    }
    if (status === "missed") {
      return "text-yellow-300";
    }
    return "text-emerald-300";
  };

  const scale = 1 + volumeLevel * 0.25;
  const glowOpacity = 0.35 + volumeLevel * 0.4;

  // Apply the same scale to all circle elements
  const circleScale = scale;

  const primaryActionDisabled =
    !twilioReady || callPhase === "ringing" || twilioStatusLoading;

  // Auto-start an outbound call when requested (e.g. from Companies -> Call Now)
  useEffect(() => {
    if (
      autoStart &&
      twilioReady &&
      !twilioStatusLoading &&
      callPhase === "idle" &&
      !autoStartTriggeredRef.current
    ) {
      autoStartTriggeredRef.current = true;
      void (async () => {
        try {
          await handleCall();
        } catch {
          // Swallow errors here; handleCall already updates UI state
        }
      })();
    }
  }, [autoStart, twilioReady, twilioStatusLoading, callPhase, handleCall]);

  // Automatically refresh call logs in the background while analysis is pending
  useEffect(() => {
    if (!leadId || callLogs.length === 0) {
      return;
    }

    const now = Date.now();
    const recentThresholdMs = 10 * 60 * 1000; // only poll for calls from last 10 minutes

    const hasPendingAnalysis = callLogs.some((log) => {
      const startedAtMs = log.startedAt
        ? new Date(log.startedAt).getTime()
        : 0;
      const isRecent =
        Number.isFinite(startedAtMs) && now - startedAtMs <= recentThresholdMs;
      if (!isRecent) {
        return false;
      }

      // Standard Twilio-based pending states
      const isTwilioPending =
        log.transcriptionStatus === "pending" ||
        log.leadSuccessScoreStatus === "pending" ||
        log.followupSuggestionStatus === "pending";

      const isElevenLabsCall =
        !!log.elevenlabsCallId ||
        !!log.elevenlabsRecordingUrl ||
        log.metadata?.provider === "elevenlabs";

      // ElevenLabs calls don't currently mark score/followup as "pending" on create,
      // so treat them as pending if we don't yet have a transcript/analysis.
      const isElevenLabsPending =
        isElevenLabsCall &&
        (!log.elevenlabsTranscript ||
          log.leadSuccessScoreStatus === "not-requested" ||
          log.followupSuggestionStatus === "not-requested");

      return isTwilioPending || isElevenLabsPending;
    });

    if (!hasPendingAnalysis) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void fetchCallLogs({ background: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [leadId, callLogs, fetchCallLogs]);

  return (
    <div className="grid grid-cols-3 gap-6 flex-1 w-full h-full px-0 pt-2 overflow-hidden">
      {/* Left Side: Call History - 2/3 width */}
      <div className="col-span-2 flex flex-col text-left space-y-3 overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-white leading-snug">
              Call Logs
            </h2>
            {/* <p className="text-xs text-white/60">Recent calls with transcription, success score and follow-up suggestions.</p> */}
          </div>
          <ActiveNavButton
            icon={RefreshCcw}
            text={isRefreshingCallLogs ? "Refreshing..." : "Refresh"}
            onClick={handleRefreshCallLogs}
            disabled={callLogsLoading || isRefreshingCallLogs || !leadId}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-3">
          {(() => {
              // Classify calls by provider so that:
              // - Twilio calls appear under the "Call" tab
              // - ElevenLabs AI calls appear under the "AI Call" tab
              const filteredLogs = callLogs.filter((log) => {
                const isElevenLabsCall =
                  !!log.elevenlabsCallId ||
                  !!log.elevenlabsRecordingUrl ||
                  log.metadata?.provider === "elevenlabs";

                if (mode === "ai") {
                  return isElevenLabsCall;
                }

                // Default "call" mode: show non-ElevenLabs (Twilio) calls
                return !isElevenLabsCall;
              });

              if (filteredLogs.length === 0) {
                return (
                  <div className="px-4 py-6 text-center text-xs text-white/60 rounded-2xl border border-white/10 bg-white/[0.03]">
                    {callLogsLoading
                      ? "Loading call logs..."
                      : leadId
                      ? mode === "ai"
                        ? "No AI calls have been logged yet."
                        : "No calls have been logged yet."
                      : "Select a lead to view call logs."}
                  </div>
                );
              }

              return filteredLogs.map((log) => {
                const rawScoreStatus =
                  log.leadSuccessScoreStatus || "not-requested";
                const rawFollowupStatus =
                  log.followupSuggestionStatus || "not-requested";

                // Use ElevenLabs recording/transcript if available, otherwise fall back to Twilio
                const recordingUrl =
                  log.elevenlabsRecordingUrl || log.recordingUrl;
                const transcriptText =
                  log.elevenlabsTranscript || log.transcriptionText;

                const scoreStatus = rawScoreStatus;
                const followupStatus = rawFollowupStatus;

                const isElevenLabsCall =
                  !!log.elevenlabsCallId ||
                  !!log.elevenlabsRecordingUrl ||
                  log.metadata?.provider === "elevenlabs";
                const isTwilioCall =
                  !isElevenLabsCall &&
                  (log.metadata?.provider === "twilio" || !!log.callSid);
                const hasTranscript =
                  !!transcriptText ||
                  (log.transcriptionStatus === "completed" &&
                    !!log.transcriptionText);

                // Determine call type display and icon background color
                const isMissed =
                  log.status === "missed" ||
                  log.status === "cancelled" ||
                  log.status === "failed";
                const isIncoming = log.direction === "inbound";
                const callTypeLabel = isMissed
                  ? "Outgoing Call"
                  : isIncoming
                  ? "Incoming Call"
                  : "Outgoing Call";
                
                const iconBgColor = isMissed 
                  ? "bg-red-500/10" 
                  : "bg-emerald-500/10";
                
                const iconColor = isMissed 
                  ? "text-red-400" 
                  : "text-emerald-400";

                const statusText = isMissed ? "Missed" : "";
                
                // Check if this call log is currently selected
                const isSelected = selectedCallLog?._id === log._id;

                return (
                  <div
                    key={log._id}
                    onClick={() => handleOpenCallDetails(log)}
                    className={`rounded-2xl border backdrop-blur-xl overflow-hidden transition-colors cursor-pointer ${
                      isSelected
                        ? "border-white/10 bg-white/20"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                      {/* Left side: Icon + Call Type + Duration */}
                      <div className="flex items-center gap-3 flex-1">
                        {/* Phone Icon */}
                        <div className={`w-7 h-7 rounded-full ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
                          <svg 
                            className={`w-4 h-4 ${iconColor}`} 
                            fill="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                          </svg>
                        </div>

                        {/* Call Type and Duration */}
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white">
                              {callTypeLabel}
                            </span>
                            {statusText && (
                              <span className="text-xs text-red-400">
                                {statusText}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-white/60">
                            Duration: {formatDuration(log.durationSeconds)}
                          </span>
                        </div>
                      </div>

                      {/* Right side: Play Button + Date */}
                      <div className="flex items-center gap-3">
                        {/* Play Button */}
                        {recordingUrl || log.callSid || log.elevenlabsCallId ? (
                          (() => {
                            const hasReadyRecording = !!recordingUrl;
                            const isProcessingRecording =
                              !recordingUrl &&
                              (log.callSid || log.elevenlabsCallId);

                            const playButton = (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!hasReadyRecording) return;
                                  void handleRecordingView(log);
                                }}
                                disabled={!hasReadyRecording}
                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                  hasReadyRecording
                                    ? "border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/20 cursor-pointer"
                                    : "border-white/15 bg-white/5 text-white/40 cursor-not-allowed"
                                }`}
                              >
                                <svg
                                  className={`w-4 h-4 ml-0.5 ${
                                    hasReadyRecording
                                      ? "text-emerald-400"
                                      : "text-white/40"
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              </button>
                            );

                            return isProcessingRecording ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {playButton}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <span>Recording processing…</span>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              playButton
                            );
                          })()
                        ) : null}

                        {/* Date */}
                        <span className="text-xs text-white/60 whitespace-nowrap">
                          {formatCallDate(log.startedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Additional Info Section - Score, Transcript, Follow-up - COMMENTED OUT
                    <div className="px-3 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Success Score * /}
                        {scoreStatus === "completed" &&
                          typeof log.leadSuccessScore === "number" && (
                            <div className="flex items-center gap-2">
                              {(() => {
                                const score = log.leadSuccessScore || 0;
                                let colorClasses =
                                  "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20";
                                if (score < 40) {
                                  colorClasses =
                                    "bg-red-500/10 text-red-300 border border-red-500/20";
                                } else if (score < 80) {
                                  colorClasses =
                                    "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20";
                                }
                                return (
                                  <span
                                    className={`inline-flex items-center px-2 py-1 h-5 rounded-full text-[0.65rem] font-medium ${colorClasses}`}
                                  >
                                    {score}/100
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        {(scoreStatus === "pending" ||
                          (isElevenLabsCall &&
                            (scoreStatus === "not-requested" ||
                              log.leadSuccessScore === null))) && (
                          <span className="inline-flex items-center px-2 py-1 h-5 rounded-full text-[0.65rem] font-medium border border-white/10 bg-[#292929] text-white/30 select-none">
                            Score loading…
                          </span>
                        )}

                        {/* Transcription * /}
                        {hasTranscript ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-5 px-2 py-1 rounded-full border-white/20 bg-white/5 text-[0.65rem] text-white hover:bg-white/10 hover:text-white"
                            onClick={() =>
                              setSelectedCallLogView({
                                type: "transcription",
                                log,
                              })
                            }
                          >
                            Transcript
                          </Button>
                        ) : (isTwilioCall && !!log.callSid) || isElevenLabsCall ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled
                            className="h-5 px-2 py-1 rounded-full border-white/10 bg-white/5 text-[0.65rem] text-white/50 cursor-not-allowed"
                          >
                            Transcript loading…
                          </Button>
                        ) : null}

                        {/* Follow-up * /}
                        {followupStatus === "completed" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-5 px-2 py-1 rounded-full border-white/20 bg-white/5 text-[0.65rem] text-white hover:bg-white/10 hover:text-white"
                            onClick={() =>
                              setSelectedCallLogView({
                                type: "followup",
                                log,
                              })
                            }
                          >
                            Follow-up
                          </Button>
                        ) : followupStatus === "pending" ||
                          (isElevenLabsCall &&
                            (followupStatus === "not-requested" ||
                              !log.followupSuggestionSummary)) ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled
                            className="h-5 px-2 py-1 rounded-full border-white/10 bg-white/5 text-[0.65rem] text-white/50 cursor-not-allowed"
                          >
                            Follow-up loading…
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    */}
                  </div>
                );
              });
            })()}
        </div>

        {callLogsError && (
          <p className="text-xs text-red-300">{callLogsError}</p>
        )}
      </div>

      {/* Right Side: Web Call / Call Details - 1/3 width */}
      <div className="col-span-1 flex flex-col text-white/80 text-center gap-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-semibold text-white leading-snug text-left">
            {selectedCallLog ? "Call Details" : "Call Now"}
          </h2>
          {selectedCallLog && (
            <button
              onClick={handleCloseCallDetails}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Close call details"
            >
              <svg className="w-4 h-4 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Card Container */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-y-auto scrollbar-hide p-6 flex flex-col gap-6 flex-1">
          
          {/* Show Call Details if a call log is selected */}
          {selectedCallLog ? (
            <div className="flex flex-col gap-4 h-full">
              {/* Call Info Header */}
              <div className="flex flex-col gap-2 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${
                    selectedCallLog.status === "completed" ? "bg-emerald-500/10" : "bg-red-500/10"
                  } flex items-center justify-center`}>
                    <svg className={`w-4 h-4 ${
                      selectedCallLog.status === "completed" ? "text-emerald-400" : "text-red-400"
                    }`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-white">
                      {selectedCallLog.direction === "inbound" ? "Incoming Call" : "Outgoing Call"}
                    </span>
                    <span className="text-xs text-white/60">
                      {formatCallDate(selectedCallLog.startedAt)} • {formatDuration(selectedCallLog.durationSeconds)}
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
                  onClick={() => setActiveTab("followup")}
                  className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                    activeTab === "followup"
                      ? "text-cyan-400"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  Follow-up
                  {activeTab === "followup" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {activeTab === "recording" ? (
                  <div className="flex flex-col gap-4">
                    {/* Audio Player */}
                    {recordingLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                        <span className="ml-2 text-sm text-white/60">Loading recording...</span>
                      </div>
                    ) : recordingError ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <svg className="w-8 h-8 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-300 text-center">{recordingError}</p>
                      </div>
                    ) : recordingAudioUrl ? (
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
                          Playback is streamed securely from EmpaTech servers.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg bg-white/5 border border-white/10">
                        <svg className="w-8 h-8 text-white/40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <p className="text-sm text-white/60 text-center">No recording available</p>
                      </div>
                    )}

                    {/* Transcript */}
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-semibold text-white/80">Transcript</h3>
                      {selectedCallLog.transcriptionStatus === "pending" ? (
                        <div className="flex items-center gap-2 py-4 px-4 rounded-lg bg-white/5 border border-white/10">
                          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                          <span className="text-sm text-white/60">Transcription in progress...</span>
                        </div>
                      ) : (selectedCallLog.transcriptionText || selectedCallLog.elevenlabsTranscript) ? (
                        <div className="py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-left">
                          <p className="text-sm text-white/80 leading-relaxed">
                            {selectedCallLog.transcriptionText || selectedCallLog.elevenlabsTranscript}
                          </p>
                        </div>
                      ) : (
                        <div className="py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-center">
                          <p className="text-sm text-white/40">No transcript available</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Follow-up Content */}
                    {selectedCallLog.leadSuccessScore !== null && selectedCallLog.leadSuccessScore !== undefined ? (
                      <div className="flex flex-col gap-2">
                        <h3 className="text-xs font-semibold text-white/80">Success Score</h3>
                        <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-white/80">Lead Quality</span>
                              <span className="text-sm font-semibold text-cyan-400">{selectedCallLog.leadSuccessScore}/100</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all"
                                style={{ width: `${selectedCallLog.leadSuccessScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Follow-up Suggestions with EditableFollowupSuggestion */}
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-semibold text-white/80">Follow-up Suggestions</h3>
                      {selectedCallLog.followupSuggestionStatus === "pending" ? (
                        <div className="flex items-center gap-2 py-4 px-4 rounded-lg bg-white/5 border border-white/10">
                          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                          <span className="text-sm text-white/60">Generating suggestions...</span>
                        </div>
                      ) : Array.isArray(
                          (selectedCallLog.followupSuggestionMetadata as any)?.raw?.touchpoints
                        ) &&
                        (selectedCallLog.followupSuggestionMetadata as any).raw.touchpoints.length > 0 ? (
                        <EditableFollowupSuggestion
                          touchpoints={
                            (selectedCallLog.followupSuggestionMetadata as any).raw.touchpoints
                          }
                          summary={selectedCallLog.followupSuggestionSummary || undefined}
                          callEndTime={
                            selectedCallLog.endedAt ||
                            new Date(
                              new Date(selectedCallLog.startedAt).getTime() +
                                (selectedCallLog.durationSeconds || 0) * 1000
                            ).toISOString()
                          }
                          leadId={selectedCallLog.leadId || lead?._id || ""}
                          onExecute={async (
                            todo,
                            startDate,
                            executedPlanId?: string
                          ) => {
                            try {
                              let planId: string | undefined;

                              if (executedPlanId) {
                                const response = await updatePlanMutation.mutateAsync({
                                  id: executedPlanId,
                                  payload: {
                                    todo: todo.map((task) => ({
                                      type: task.type,
                                      personId: task.personId,
                                      day: task.day,
                                      scheduledFor: task.scheduledFor,
                                      notes: task.notes,
                                    })),
                                  },
                                });
                                planId =
                                  (response as any)?.data?._id ||
                                  (response as any)?.data?.data?._id ||
                                  executedPlanId;
                                toast({
                                  title: "Follow-up plan updated",
                                  description:
                                    "The follow-up plan has been updated successfully.",
                                });
                              } else {
                                const response = await createPlanFromCallMutation.mutateAsync({
                                  leadId: selectedCallLog.leadId || lead?._id || "",
                                  startDate,
                                  todo,
                                  summary: selectedCallLog.followupSuggestionSummary,
                                });
                                planId =
                                  (response as any)?.data?._id ||
                                  (response as any)?.data?.data?._id;
                                toast({
                                  title: "Follow-up plan created",
                                  description:
                                    "The follow-up plan has been created and is now active.",
                                });
                              }

                              return {
                                planId,
                              };
                            } catch (error: any) {
                              toast({
                                title: executedPlanId
                                  ? "Failed to update plan"
                                  : "Failed to create plan",
                                description:
                                  error?.response?.data?.message ||
                                  error?.message ||
                                  "Please try again.",
                                variant: "destructive",
                              });
                              throw error;
                            }
                          }}
                          isExecuting={
                            createPlanFromCallMutation.isPending ||
                            updatePlanMutation.isPending
                          }
                        />
                      ) : selectedCallLog.followupSuggestionSummary ? (
                        <div className="py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-left">
                          <p className="text-sm text-white/80 leading-relaxed">
                            {selectedCallLog.followupSuggestionSummary}
                          </p>
                        </div>
                      ) : (
                        <div className="py-3 px-4 rounded-lg bg-white/5 border border-white/10 text-center">
                          <p className="text-sm text-white/40">No follow-up suggestions available</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Original "Make a call" content
            <>
          {mode === "call" && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center pt-5">
                <div
                  className="flex items-center justify-center rounded-full transition-all"
                  style={{
                    width: "130px",
                    height: "130px",
                    position: "relative",
                    transform: `scale(${circleScale})`,
                    transition: "transform 120ms ease-out",
                    overflow: "hidden",
                  }}
                >
                  {/* Sphere with gradient edges to transparent center */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `
                      radial-gradient(circle at center, 
                        transparent 0%, 
                        transparent 55%, 
                        rgba(66, 247, 255, 0.18) 65%, 
                        rgba(66, 247, 255, 0.55) 70%
                      )
                    `,
                      filter: "blur(0.5px)",
                    }}
                  />
                  {/* Inner button */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!twilioReady || primaryActionDisabled) {
                        return;
                      }
                      if (callPhase === "idle") {
                        handleCall();
                      } else if (callPhase === "incoming") {
                        handleAnswerIncoming();
                      } else if (callPhase === "connected") {
                        handleHangUp();
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") {
                        return;
                      }
                      event.preventDefault();
                      if (callPhase === "idle") {
                        handleCall();
                      } else if (callPhase === "incoming") {
                        handleAnswerIncoming();
                      } else if (callPhase === "connected") {
                        handleHangUp();
                      }
                    }}
                    className={`flex items-center justify-center rounded-full transition-colors relative z-10 ${
                      !twilioReady
                        ? "cursor-not-allowed opacity-60"
                        : callPhase === "idle"
                        ? "cursor-pointer hover:border-cyan-300/60"
                        : callPhase === "connected"
                        ? "cursor-pointer border-cyan-300/80"
                        : "cursor-not-allowed"
                    }`}
                    style={{
                      width: "130px",
                      height: "130px",
                      background: `
                      radial-gradient(circle at center, 
                        transparent 0%, 
                        transparent 30%, 
                        rgba(66, 247, 255, 0.01) 45%, 
                        rgba(66, 247, 255, 0.02) 55%, 
                        rgba(66, 247, 255, 0.04) 65%, 
                        rgba(66, 247, 255, 0.08) 75%, 
                        rgba(66, 247, 255, 0.15) 85%, 
                        rgba(66, 247, 255, 0.25) 92%, 
                        rgba(66, 247, 255, 0.45) 96%, 
                        rgba(66, 247, 255, 0.7) 98.5%, 
                        rgba(66, 247, 255, 1) 100%
                      )
                    `,
                      border: "1px solid rgba(66, 247, 255, 0.55)",
                      boxShadow: `
                      inset 0 0 10px rgba(66, 247, 255, 0.08)
                    `,
                      transition: "box-shadow 120ms ease-out",
                    }}
                  >
                    {/* White gradient overlay - small spread */}
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background: `
                        radial-gradient(circle at center, 
                          rgba(255, 255, 255, 0.12) 0%, 
                          rgba(255, 255, 255, 0.08) 25%, 
                          rgba(255, 255, 255, 0.04) 40%, 
                          rgba(255, 255, 255, 0.02) 50%, 
                          rgba(255, 255, 255, 0.01) 55%, 
                          transparent 65%
                        )
                      `,
                        zIndex: 1,
                      }}
                    />
                  </div>
                  {/* Waveform visualization */}
                  {isListening && waveformData.length > 0 && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        width: "130px",
                        height: "130px",
                        zIndex: 30,
                      }}
                    >
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 90 90"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient
                            id="waveformFade"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="0%"
                          >
                            <stop offset="0%" stopColor="white" stopOpacity="0" />
                            <stop offset="15%" stopColor="white" stopOpacity="1" />
                            <stop offset="85%" stopColor="white" stopOpacity="1" />
                            <stop offset="100%" stopColor="white" stopOpacity="0" />
                          </linearGradient>
                          <mask id="waveformMask">
                            <rect
                              width="100%"
                              height="100%"
                              fill="url(#waveformFade)"
                            />
                          </mask>
                        </defs>
                        <path
                          d={(() => {
                            if (waveformData.length < 2) return "";
                            const centerY = 45;
                            const amplitude = 35;
                            const points = waveformData.map((value, index) => {
                              const x =
                                (index / (waveformData.length - 1)) * 130;
                              const y = centerY - value * amplitude;
                              return { x, y };
                            });
                            let path = `M ${points[0].x} ${points[0].y}`;
                            for (let i = 0; i < points.length - 1; i++) {
                              const p0 = i > 0 ? points[i - 1] : points[i];
                              const p1 = points[i];
                              const p2 = points[i + 1];
                              const p3 =
                                i < points.length - 2
                                  ? points[i + 2]
                                  : points[i + 1];
                              const cp1x = p1.x + (p2.x - p0.x) / 6;
                              const cp1y = p1.y + (p2.y - p0.y) / 6;
                              const cp2x = p2.x - (p3.x - p1.x) / 6;
                              const cp2y = p2.y - (p3.y - p1.y) / 6;
                              path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                            }
                            return path;
                          })()}
                          fill="none"
                          stroke="rgba(66, 247, 255, 0.9)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          mask="url(#waveformMask)"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {mode === "ai" && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center pt-5">
                <div
                  className="flex items-center justify-center relative cursor-pointer group"
                  onClick={handleAICall}
                  style={{
                    width: "130px",
                    height: "130px",
                  }}
                >
                  {/* Layer 1: Outer Tech Ring (Static/Slow) */}
                  <div
                    className="absolute inset-0 rounded-full border border-cyan-500/20"
                    style={{
                      boxShadow: "0 0 15px rgba(6,182,212,0.1)",
                    }}
                  />

                  {/* Layer 2: Mechanical Gear (Dashed, Rotating) */}
                  <div
                    className="absolute inset-[4px] rounded-full border-2 border-dashed border-cyan-500/30"
                    style={{
                      animation: "spin 20s linear infinite",
                    }}
                  />

                  {/* Layer 3: Inner Gear (Reverse Rotation) */}
                  <div
                    className="absolute inset-[15px] rounded-full border border-cyan-400/20 border-t-cyan-400/60 border-b-cyan-400/60"
                     style={{
                      animation: "spin 10s linear infinite reverse",
                    }}
                  />

                  {/* Layer 4: Reticle / Crosshair */}
                  <div className="absolute inset-0 z-10 opacity-40 pointer-events-none">
                      {/* Top mark */}
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-cyan-400" />
                      {/* Bottom mark */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-cyan-400" />
                      {/* Left mark */}
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-cyan-400" />
                      {/* Right mark */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-cyan-400" />
                  </div>

                  {/* Layer 5: Scanning Radar Effect */}
                   <div 
                    className="absolute inset-0 rounded-full overflow-hidden opacity-30 pointer-events-none"
                    style={{
                      background: "linear-gradient(180deg, transparent 0%, rgba(34, 211, 238, 0.4) 50%, transparent 100%)",
                      animation: "spin 4s linear infinite",
                    }}
                  />

                  {/* Core Icon */}
                  <div className="relative z-30 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              {mode === "call" && (
                <Button
                  type="button"
                  onClick={
                    callPhase === "connected"
                      ? handleHangUp
                      : callPhase === "incoming"
                      ? handleAnswerIncoming
                      : callPhase === "idle" && twilioReady
                      ? handleCall
                      : undefined
                  }
                  disabled={primaryActionDisabled}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-900/40 hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {callPhase === "connected"
                    ? "End call"
                    : callPhase === "ringing"
                    ? "Ringing..."
                    : callPhase === "incoming"
                    ? "Answer call"
                    : "Make a call"}
                </Button>
              )}

              {mode === "ai" && lead?._id && (
                <ActiveNavButton
                  text={aiCallLoading ? "Initiating..." : "AI Call"}
                  onClick={handleAICall}
                  disabled={aiCallLoading}
                  className="h-8 text-xs"
                />
              )}
            </div>

            <p className="text-xs text-white/70">{callStatus}</p>

            {callPhase === "incoming" && (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  onClick={handleDeclineIncoming}
                  variant="destructive"
                  className="px-4 py-1 rounded-full text-xs font-semibold"
                >
                  Decline
                </Button>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full">
                {error}
              </div>
            )}

            <p className="text-xs  text-white/40">
              Calls are routed via Twilio Voice with mic data processed locally.
            </p>
          </div>
          </>
          )}

          {/* Selected Call Log View Content - Only show if not using new call details view */}
          {selectedCallLogView && !selectedCallLog && (
            <div className="w-full mt-6 pt-6 border-t border-white/10">
              {/* Recording View */}
              {selectedCallLogView.type === "recording" && (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Call Recording
                      </h3>
                      <p className="text-xs text-white/60 mt-1">
                        {selectedCallLogView.log.leadName || "This lead"} —{" "}
                        {formatCallDate(selectedCallLogView.log.startedAt)} •{" "}
                        {formatDuration(selectedCallLogView.log.durationSeconds)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 p-0 rounded-full"
                      onClick={() => setSelectedCallLogView(null)}
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.03] backdrop-blur-xl">
                    {recordingLoading && (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
                          <p className="text-sm text-white/70">
                            Loading recording...
                          </p>
                        </div>
                      </div>
                    )}
                    {!recordingLoading && recordingError && (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-2 text-center">
                          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <p className="text-sm text-red-300 max-w-xs">
                            {recordingError}
                          </p>
                        </div>
                      </div>
                    )}
                    {!recordingLoading && !recordingError && recordingAudioUrl && (
                      <div className="space-y-4">
                        <div className="rounded-xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4">
                          <audio
                            controls
                            className="w-full h-12"
                            src={recordingAudioUrl}
                            style={{
                              filter: 'invert(0.9) hue-rotate(180deg)',
                              borderRadius: '8px',
                            }}
                          />
                        </div>
                        <div className="flex items-start gap-2 px-2">
                          <svg className="w-4 h-4 text-cyan-400/60 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <p className="text-[0.7rem] text-white/40 leading-relaxed">
                            Playback is streamed securely from EmpaTech servers.
                          </p>
                        </div>
                      </div>
                    )}
                    {!recordingLoading && !recordingError && !recordingAudioUrl && (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-sm text-white/60">
                          Recording not available for this call.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Transcription View */}
              {selectedCallLogView.type === "transcription" && (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-white">
                        Call transcription
                      </h3>
                      <p className="text-xs text-white/60 mt-1">
                        {selectedCallLogView.log.leadName || "This lead"} —{" "}
                        {formatCallDate(selectedCallLogView.log.startedAt)} •{" "}
                        {formatDuration(selectedCallLogView.log.durationSeconds)}
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
                    {selectedCallLogView.log.transcriptionText ? (
                      <p className="text-xs text-white/80 whitespace-pre-wrap leading-relaxed">
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

              {/* Follow-up View */}
              {selectedCallLogView.type === "followup" && (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-white">
                        Follow-up suggestions
                      </h3>
                      <p className="text-xs text-white/60 mt-1">
                        Based on the last call with{" "}
                        <span className="font-medium">
                          {selectedCallLogView.log.leadName || "this lead"}
                        </span>{" "}
                        on {formatCallDate(selectedCallLogView.log.startedAt)}.
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

                  {Array.isArray(
                    (selectedCallLogView.log.followupSuggestionMetadata as any)
                      ?.raw?.touchpoints
                  ) &&
                  (selectedCallLogView.log.followupSuggestionMetadata as any)
                    .raw.touchpoints.length > 0 ? (
                    <EditableFollowupSuggestion
                      touchpoints={
                        (
                          selectedCallLogView.log
                            .followupSuggestionMetadata as any
                        ).raw.touchpoints
                      }
                      summary={
                        selectedCallLogView.log.followupSuggestionSummary ||
                        undefined
                      }
                      callEndTime={
                        selectedCallLogView.log.endedAt ||
                        new Date(
                          new Date(
                            selectedCallLogView.log.startedAt
                          ).getTime() +
                            (selectedCallLogView.log.durationSeconds || 0) *
                              1000
                        ).toISOString()
                      }
                      leadId={
                        selectedCallLogView.log.leadId || lead?._id || ""
                      }
                      onExecute={async (
                        todo,
                        startDate,
                        executedPlanId?: string
                      ) => {
                        try {
                          let planId: string | undefined;

                          if (executedPlanId) {
                            // Update existing plan
                            const response =
                              await updatePlanMutation.mutateAsync({
                                id: executedPlanId,
                                payload: {
                                  todo: todo.map((task) => ({
                                    type: task.type,
                                    personId: task.personId,
                                    day: task.day,
                                    scheduledFor: task.scheduledFor,
                                    notes: task.notes,
                                  })),
                                },
                              });
                            planId =
                              (response as any)?.data?._id ||
                              (response as any)?.data?.data?._id ||
                              executedPlanId;
                            toast({
                              title: "Follow-up plan updated",
                              description:
                                "The follow-up plan has been updated successfully.",
                            });
                          } else {
                            // Create new plan
                            const response =
                              await createPlanFromCallMutation.mutateAsync({
                                leadId:
                                  selectedCallLogView.log.leadId ||
                                  lead?._id ||
                                  "",
                                startDate,
                                todo,
                                summary:
                                  selectedCallLogView.log
                                    .followupSuggestionSummary,
                              });
                            planId =
                              (response as any)?.data?._id ||
                              (response as any)?.data?.data?._id;
                            toast({
                              title: "Follow-up plan created",
                              description:
                                "The follow-up plan has been created and is now active.",
                            });
                          }

                          // Return planId
                          return {
                            planId,
                          };
                        } catch (error: any) {
                          toast({
                            title: executedPlanId
                              ? "Failed to update plan"
                              : "Failed to create plan",
                            description:
                              error?.response?.data?.message ||
                              error?.message ||
                              "Please try again.",
                            variant: "destructive",
                          });
                          throw error;
                        }
                      }}
                      isExecuting={
                        createPlanFromCallMutation.isPending ||
                        updatePlanMutation.isPending
                      }
                    />
                  ) : (
                    <div className="space-y-4 max-h-[calc(100vh-500px)] overflow-y-auto scrollbar-hide pr-1">
                      <div
                        className="rounded-lg p-4"
                        style={{
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          background: "rgba(255, 255, 255, 0.02)",
                        }}
                      >
                        <p className="text-xs font-medium uppercase text-white/50 mb-1">
                          Summary
                        </p>
                        <p className="text-xs text-white/80">
                          {selectedCallLogView.log.followupSuggestionSummary ||
                            "No summary available for this call."}
                        </p>
                      </div>
                      <p className="text-xs text-white/60">
                        No touchpoints available for this call.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {/* End of Card Container */}
      </div>
    </div>
  );
};
