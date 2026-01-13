import { useRef, useState, useCallback, useEffect } from "react";
import { Device } from "@twilio/voice-sdk";
import { twilioService } from "@/services/twilio.service";

type TwilioCall = Awaited<ReturnType<Device["connect"]>>;
type DeviceError = { message: string };

export type CallStatus = "idle" | "connecting" | "in-call" | "ended" | "error";

export interface UseTwilioCallingReturn {
  callStatus: CallStatus;
  callStatusMessage: string;
  isCalling: boolean;
  initiateCall: (phoneNumber: string) => Promise<void>;
  endCall: () => void;
  normalizePhoneNumber: (raw: string) => string | null;
}

export const useTwilioCalling = (): UseTwilioCallingReturn => {
  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<TwilioCall | null>(null);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callStatusMessage, setCallStatusMessage] = useState("");
  const [isCalling, setIsCalling] = useState(false);

  /**
   * Set error status and auto-clear after delay
   */
  const setErrorStatus = useCallback((message: string) => {
    setCallStatus("error");
    setCallStatusMessage(message);
    
    // Clear any existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    // Auto-clear error after 10 seconds
    errorTimeoutRef.current = setTimeout(() => {
      if (callStatus === "error") {
        setCallStatus("idle");
        setCallStatusMessage("");
      }
    }, 10000);
  }, [callStatus]);

  /**
   * Normalize phone number to E.164 format
   */
  const normalizePhoneNumber = useCallback((raw: string): string | null => {
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

  /**
   * Ensure Twilio device is initialized and registered
   */
  const ensureDevice = useCallback(async (forceRefresh = false): Promise<Device> => {
    // If forcing refresh, destroy existing device first
    if (forceRefresh && deviceRef.current) {
      console.log("🔄 Forcing device refresh, destroying old device...");
      try {
        deviceRef.current.destroy();
      } catch (e) {
        console.warn("⚠️ Error destroying old device:", e);
      }
      deviceRef.current = null;
    }

    // Check if device exists and is in a usable state
    if (deviceRef.current) {
      const state = deviceRef.current.state;
      console.log("♻️ Existing device found, state:", state);
      
      // Only reuse if registered, otherwise force refresh
      if (state === "registered") {
        console.log("✅ Reusing registered Twilio device");
        return deviceRef.current;
      } else {
        console.log("⚠️ Device in non-registered state, forcing refresh");
        try {
          deviceRef.current.destroy();
        } catch (e) {
          console.warn("⚠️ Error destroying old device:", e);
        }
        deviceRef.current = null;
      }
    }

    try {
      console.log("🔑 Fetching Twilio token...");
      const data = await twilioService.getToken();
      console.log("✅ Token received:", data.token ? "YES" : "NO");
      
      if (!data.token) {
        throw new Error("Token missing from response");
      }

      console.log("🎧 Creating new Twilio Device...");
      const device = new Device(data.token, { 
        logLevel: 1, // Debug level for more info
        codecPreferences: ["opus", "pcmu"],
      });

      device.on("error", (event: DeviceError) => {
        console.error("🔴 Twilio Device error:", event);
        setErrorStatus(`Device error: ${event.message}`);
        // Clear device on error to force refresh on next call
        deviceRef.current = null;
      });

      device.on("disconnect", () => {
        console.log("📴 Twilio Device disconnected");
        setIsCalling(false);
        setCallStatus("ended");
        setCallStatusMessage("Call ended");
        activeCallRef.current = null;
      });

      device.on("registered", () => {
        console.log("✅ Twilio Device registered");
        setCallStatus("idle");
        setCallStatusMessage("Ready for calls");
      });

      device.on("unregistered", () => {
        console.log("⚠️ Twilio Device unregistered");
        setCallStatus("idle");
        setCallStatusMessage("Reconnecting to Twilio...");
        // Clear device to force refresh on next call
        deviceRef.current = null;
      });

      console.log("📝 Registering Twilio Device...");
      
      // Register with timeout - don't wait forever
      const registrationPromise = device.register();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Registration timeout after 10 seconds")), 10000)
      );

      try {
        await Promise.race([registrationPromise, timeoutPromise]);
        console.log("✅ Twilio Device registration complete");
      } catch (error) {
        console.error("❌ Device registration failed:", error);
        // Throw the error so caller knows registration failed
        throw new Error(`Twilio device registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      deviceRef.current = device;
      return device;
    } catch (error: unknown) {
      let errorMessage = "Failed to initialize Twilio";

      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as {
          response?: { data?: { message?: string; error?: string }; status?: number };
        };
        const errorData = apiError.response?.data;
        const status = apiError.response?.status;
        
        // Provide user-friendly messages for common errors
        if (status === 400 || status === 500) {
          errorMessage = errorData?.message || errorData?.error || "Twilio is not configured for your account";
        } else {
          errorMessage = errorData?.message || errorData?.error || errorMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      console.error("❌ ensureDevice error:", errorMessage);
      setErrorStatus(errorMessage);
      throw new Error(errorMessage);
    }
  }, [setErrorStatus]);

  /**
   * Initiate an outbound call to the given phone number
   */
  const initiateCall = useCallback(
    async (phoneNumber: string, retryCount = 0) => {
      console.log("🎯 initiateCall called with:", phoneNumber, "retry:", retryCount);

      if (!phoneNumber) {
        setErrorStatus("Enter a phone number");
        console.error("❌ No phone number provided");
        return;
      }

      const normalized = normalizePhoneNumber(phoneNumber);
      if (!normalized) {
        setErrorStatus("Invalid phone number format (use E.164)");
        console.error("❌ Invalid phone number format:", phoneNumber);
        return;
      }

      console.log("✅ Normalized phone:", normalized);

      try {
        console.log("🔄 Ensuring Twilio device...");
        // Force refresh on retry
        const device = await ensureDevice(retryCount > 0);
        console.log("✅ Device ready:", device);

        setIsCalling(true);
        setCallStatus("connecting");
        setCallStatusMessage("Connecting...");

        console.log("📞 Connecting to:", normalized);
        const connection = await device.connect({ params: { To: normalized } });
        console.log("✅ Connection established:", connection);
        
        activeCallRef.current = connection;

        connection.on("accept", () => {
          console.log("✅ Call accepted");
          setCallStatus("in-call");
          setCallStatusMessage("In call");
        });

        connection.on("disconnect", () => {
          console.log("📴 Call disconnected");
          setIsCalling(false);
          setCallStatus("ended");
          setCallStatusMessage("Call ended");
          activeCallRef.current = null;
        });

        connection.on("cancel", () => {
          console.log("🚫 Call cancelled");
          setIsCalling(false);
          setCallStatus("ended");
          setCallStatusMessage("Cancelled");
          activeCallRef.current = null;
        });

        connection.on("error", (event) => {
          console.error("❌ Call error:", event);
          setIsCalling(false);
          setErrorStatus(`Call error: ${event.message}`);
          activeCallRef.current = null;
        });
      } catch (error) {
        console.error("❌ initiateCall error:", error);
        
        // If this is the first attempt and we get a connection error, retry once with fresh device
        if (retryCount === 0 && error instanceof Error && 
            (error.message.includes("registration") || 
             error.message.includes("WebSocket") ||
             error.message.includes("connection"))) {
          console.log("🔄 Retrying with fresh device...");
          return initiateCall(phoneNumber, retryCount + 1);
        }
        
        setIsCalling(false);
        setErrorStatus(
          error instanceof Error ? error.message : "Unable to place call"
        );
      }
    },
    [normalizePhoneNumber, ensureDevice, setErrorStatus]
  );

  /**
   * End the current call
   */
  const endCall = useCallback(() => {
    activeCallRef.current?.disconnect();
    deviceRef.current?.disconnectAll();
    setIsCalling(false);
    setCallStatus("ended");
    setCallStatusMessage("Call ended");
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up Twilio device on unmount");
      
      // Clear error timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      
      // Disconnect active call
      if (activeCallRef.current) {
        activeCallRef.current.disconnect();
      }
      
      // Destroy device
      if (deviceRef.current) {
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
    };
  }, []);

  return {
    callStatus,
    callStatusMessage,
    isCalling,
    initiateCall,
    endCall,
    normalizePhoneNumber,
  };
};
