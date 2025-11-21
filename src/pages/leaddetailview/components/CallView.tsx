import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Lead } from "@/services/leads.service";
import { Button } from "@/components/ui/button";
import { Device } from "@twilio/voice-sdk";
import { twilioService } from "@/services/twilio.service";

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

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<
    Awaited<ReturnType<Device["connect"]>> | null
  >(null);

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

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;

    if (audioContextRef.current?.state !== "closed") {
      audioContextRef.current?.close().catch(() => undefined);
    }
    audioContextRef.current = null;

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    setIsListening(false);
  }, []);

  const animateVolume = useCallback(() => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return;

    analyser.getByteTimeDomainData(dataArray);
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const value = (dataArray[i] - 128) / 128;
      sumSquares += value * value;
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);
    const smoothed = Math.min(1, rms * 3);
    setVolumeLevel((prev) => prev * 0.8 + smoothed * 0.2);

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
      dataArrayRef.current = new Uint8Array(
        new ArrayBuffer(analyser.fftSize)
      );

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
      stopListening();
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
        setCallPhase("connected");
        setCallStatus("Call connected");
        startListening();
      });

      connection.on("disconnect", () => {
        setCallStatus("Call ended");
        setCallPhase("idle");
        stopListening();
        activeCallRef.current = null;
      });

      connection.on("cancel", () => {
        setCallStatus("Call cancelled");
        setCallPhase("idle");
        stopListening();
        activeCallRef.current = null;
      });

      connection.on("error", (event) => {
        setCallStatus(`Call error: ${event.message}`);
        setCallPhase("idle");
        stopListening();
        activeCallRef.current = null;
      });
    },
    [startListening, stopListening]
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
      stopListening();
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
    stopListening();
  }, [stopListening]);

  const scale = 1 + volumeLevel * 0.6;
  const glowOpacity = 0.35 + volumeLevel * 0.4;

  const primaryActionDisabled =
    !twilioReady || callPhase === "ringing" || twilioStatusLoading;

  return (
    <div className="flex flex-1 w-full flex-col items-center justify-center text-white/80 text-center gap-6 py-14">
      <div className="relative flex items-center justify-center w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]">
        <div
          className="absolute inset-0 rounded-full blur-3xl transition-opacity duration-200"
          style={{
            opacity: glowOpacity,
            background:
              "radial-gradient(circle, rgba(66,247,255,0.55) 0%, rgba(9,11,27,0) 70%)",
          }}
        />
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
          className={`relative flex items-center justify-center rounded-full border border-white/20 transition-colors ${
            !twilioReady
              ? "cursor-not-allowed opacity-60"
              : callPhase === "idle"
              ? "cursor-pointer hover:border-cyan-300/60"
              : callPhase === "connected"
              ? "cursor-pointer border-cyan-300/80"
              : "cursor-not-allowed"
          }`}
          style={{
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(60% 60% at 50% 50%, rgba(11, 19, 38, 0.9) 0%, rgba(9, 11, 27, 0.6) 100%)",
            boxShadow: `0 0 ${35 + volumeLevel * 80}px rgba(66, 247, 255, 0.35)`,
            transform: `scale(${scale})`,
            transition: "transform 120ms ease-out, box-shadow 120ms ease-out",
          }}
        >
          <span className="text-white/80 text-sm tracking-wide uppercase">
            {callPhase === "connected"
              ? "On call"
              : callPhase === "ringing"
              ? "Ringing..."
              : "Make a call"}
          </span>
        </div>
        <div
          className="absolute w-[130%] h-[130%] rounded-full border border-cyan-400/30"
          style={{
            opacity: 0.2 + volumeLevel * 0.4,
            transform: `scale(${1 + volumeLevel * 0.3})`,
            transition: "transform 160ms ease-out, opacity 160ms ease-out",
          }}
        />
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
    </div>
  );
};