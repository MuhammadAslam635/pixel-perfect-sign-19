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
} from "@/services/twilio.service";

type CallViewProps = {
  lead?: Lead;
  twilioReady: boolean;
  twilioStatusMessage: string;
  twilioStatusLoading: boolean;
};

export const CallView = ({
  lead,
  twilioReady,
  twilioStatusMessage,
  twilioStatusLoading,
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
  const [callPhase, setCallPhase] = useState<"idle" | "ringing" | "connected">(
    "idle"
  );
  const [callLogs, setCallLogs] = useState<LeadCallLog[]>([]);
  const [callLogsLoading, setCallLogsLoading] = useState(false);
  const [callLogsError, setCallLogsError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const frequencyDataRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<
    Awaited<ReturnType<Device["connect"]>> | null
  >(null);
  const callStartTimeRef = useRef<number | null>(null);
  const dialedNumberRef = useRef<string | null>(null);
  const callSidRef = useRef<string | null>(null);

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

  const fetchCallLogs = useCallback(async () => {
    if (!leadId) {
      setCallLogs([]);
      setCallLogsError(null);
      setCallLogsLoading(false);
      return;
    }
    try {
      setCallLogsError(null);
      setCallLogsLoading(true);
      const response = await twilioService.getLeadCallLogs(leadId, {
        limit: 10,
      });
      setCallLogs(response.data || []);
    } catch (loadError: any) {
      console.error("Failed to load call logs", loadError);
      setCallLogsError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Unable to load call logs."
      );
    } finally {
      setCallLogsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchCallLogs();
  }, [fetchCallLogs]);

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
        await fetchCallLogs();
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

  const getConnectionCallSid = (connection: TwilioConnection): string | null => {
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
            (window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }).webkitAudioContext
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
        streamError instanceof DOMException && streamError.name === "NotAllowedError"
          ? "Microphone permission was denied."
          : "Unable to access the microphone. Please try again."
      );
      stopListening();
    }
  }, [animateVolume, isListening, stopListening]);

  // Start listening to microphone when component mounts or Twilio becomes ready
  useEffect(() => {
    // Only prevent retry if it's a permission denial error
    const isPermissionError = error?.includes("permission") || error?.includes("denied");
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

    await device.register();
    deviceRef.current = device;
    return device;
  }, [stopListening]);

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
        setCallStatus("Call cancelled");
        setCallPhase("idle");
        // Keep microphone listening for waveform visualization
        activeCallRef.current = null;
        void logCallCompletion("cancelled");
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
        callError instanceof Error
          ? callError.message
          : "Unable to place call"
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
    stopListening,
  ]);

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

  return (
    <div className="flex flex-1 w-full flex-col items-center justify-start text-white/80 text-center gap-6 pt-6 pb-10 max-h-[calc(100vh-480px)] overflow-y-auto scrollbar-hide">
      <div className="flex flex-col items-center gap-4">
        {/* <div
          className="flex items-center justify-center rounded-full blur-3xl transition-opacity duration-200"
          style={{
            opacity: glowOpacity,
            width: "260px",
            height: "260px",
            background:
              "radial-gradient(circle, rgba(66,247,255,0.55) 0%, rgba(9,11,27,0) 70%)",
          }}
        ></div> */}
        <div className="flex items-center justify-center py-5">
          <div
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: "300px",
              height: "300px",
              position: "relative",
              transform: `scale(${circleScale})`,
              transition: "transform 120ms ease-out",
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
                // opacity: 0.7 + volumeLevel * 0.25,
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
                width: "300px",
                height: "300px",
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
                // to add glow shadow
                // 0 0 ${35 + volumeLevel * 80}px rgba(66, 247, 255, 0.35),
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
              {/* <span className="text-white/80 text-sm tracking-wide uppercase relative z-20">
                {callPhase === "connected"
                  ? "On call"
                  : callPhase === "ringing"
                  ? "Ringing..."
                  : "Make a call"}
              </span> */}
            </div>
            {/* Waveform visualization - line wave spread across and beyond circle edges */}
            {isListening && waveformData.length > 0 && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  width: "380px",
                  height: "200px",
                  zIndex: 30,
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 380 200"
                  preserveAspectRatio="none"
                  style={{ overflow: "visible" }}
                >
                  <defs>
                    <linearGradient id="waveformFade" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="white" stopOpacity="0" />
                      <stop offset="15%" stopColor="white" stopOpacity="1" />
                      <stop offset="85%" stopColor="white" stopOpacity="1" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                    <mask id="waveformMask">
                      <rect width="100%" height="100%" fill="url(#waveformFade)" />
                    </mask>
                  </defs>
                  <path
                    d={(() => {
                      if (waveformData.length < 2) return '';
                      const centerY = 100;
                      const amplitude = 155; // Maximum amplitude for biggest, most visible waves
                      
                      // Create points array
                      const points = waveformData.map((value, index) => {
                        const x = (index / (waveformData.length - 1)) * 380;
                        const y = centerY - (value * amplitude);
                        return { x, y };
                      });
                      
                      // Start path with first point
                      let path = `M ${points[0].x} ${points[0].y}`;
                      
                      // Use cubic bezier curves for smooth interpolation
                      for (let i = 0; i < points.length - 1; i++) {
                        const p0 = i > 0 ? points[i - 1] : points[i];
                        const p1 = points[i];
                        const p2 = points[i + 1];
                        const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];
                        
                        // Calculate control points for smooth cubic bezier
                        const cp1x = p1.x + (p2.x - p0.x) / 6;
                        const cp1y = p1.y + (p2.y - p0.y) / 6;
                        const cp2x = p2.x - (p3.x - p1.x) / 6;
                        const cp2y = p2.y - (p3.y - p1.y) / 6;
                        
                        // Use cubic bezier curve for smooth path
                        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                      }
                      
                      return path;
                    })()}
                    fill="none"
                    stroke="rgba(66, 247, 255, 0.9)"
                    strokeWidth="2.5"
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

      <div className="flex flex-col items-center gap-3">
        <Button
          type="button"
          onClick={
            callPhase === "connected"
              ? handleHangUp
              : callPhase === "idle" && twilioReady
              ? handleCall
              : undefined
          }
          disabled={primaryActionDisabled}
          className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {callPhase === "connected"
            ? "End call"
            : callPhase === "ringing"
            ? "Ringing..."
            : "Make a call"}
        </Button>

        <p className="text-sm text-white/70">{callStatus}</p>

        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full">
            {error}
          </div>
        )}

        <p className="text-xs text-white/40">
          Calls are routed via Twilio Voice with mic data processed locally.
        </p>
      </div>

      <div className="w-full max-w-5xl mt-16 text-left space-y-4">
        <div>
          <h2 className="text-3xl font-semibold text-white leading-tight">
            Call Logs
          </h2>
          <p className="text-sm text-white/60">
            You can find all call logs and statics
          </p>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-[0_35px_120px_rgba(7,6,19,0.55)]">
          <div className="grid grid-cols-5 px-8 py-5 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-white/50">
            <span>Caller Information</span>
            <span>Date</span>
            <span>Duration</span>
            <span>Channel</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-white/5">
            {callLogsLoading ? (
              <div className="px-8 py-10 text-center text-sm text-white/70">
                Loading call logs...
              </div>
            ) : callLogs.length === 0 ? (
              <div className="px-8 py-10 text-center text-sm text-white/60">
                {leadId
                  ? "No calls have been logged yet."
                  : "Select a lead to view call logs."}
              </div>
            ) : (
              callLogs.map((log) => (
                <div
                  key={log._id}
                  className="grid grid-cols-5 px-8 py-6 text-sm text-white/80 bg-white/[0.01] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-white">
                      {log.leadName || "Unknown caller"}
                    </span>
                    {log.leadPhone && (
                      <span className="text-xs text-white/50">
                        {log.leadPhone}
                      </span>
                    )}
                  </div>
                  <div className="text-white/70">
                    {formatCallDate(log.startedAt)}
                  </div>
                  <div className="text-white/70">
                    {formatDuration(log.durationSeconds)}
                  </div>
                  <div className="text-white/70">{log.channel || "Phone"}</div>
                  <div className={`font-semibold ${getStatusColor(log.status)}`}>
                    {formatStatus(log.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {callLogsError && (
          <p className="text-sm text-red-300">{callLogsError}</p>
        )}
      </div>
    </div>
  );
};