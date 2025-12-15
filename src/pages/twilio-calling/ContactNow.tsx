import { useCallback, useEffect, useRef, useState } from "react";
import { Device } from "@twilio/voice-sdk";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { twilioService } from "@/services/twilio.service";

const ContactNow = () => {
  type TwilioCall = Awaited<ReturnType<Device["connect"]>>;
  type DeviceError = { message: string };

  const deviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<TwilioCall | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState("");
  const [calling, setCalling] = useState(false);
  const [incomingLabel, setIncomingLabel] = useState<string | null>(null);

  const [messageNumber, setMessageNumber] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  function normalizeNumber(raw: string): string | null {
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
  }

  async function ensureDevice(): Promise<Device> {
    if (deviceRef.current) {
      return deviceRef.current;
    }

    try {
      const data = await twilioService.getToken();
      if (!data.token) {
        throw new Error("Token missing from response");
      }

      const device = new Device(data.token, { logLevel: "error" });

      device.on("error", (event: DeviceError) => {
        setCallStatus(`Error: ${event.message}`);
      });

      device.on("disconnect", () => {
        setCalling(false);
        setCallStatus("Call ended");
        activeCallRef.current = null;
      });

      device.on("registered", () => {
        setCallStatus("Ready for calls");
      });

      device.on("unregistered", () => {
        setCallStatus("Reconnecting to Twilio...");
      });

      await device.register();
      deviceRef.current = device;
      return device;
    } catch (error: unknown) {
      // Extract error message from API response
      let errorMessage = "Failed to fetch token";

      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as {
          response?: { data?: { message?: string; error?: string } };
        };
        // Backend returned an error response
        const errorData = apiError.response?.data;
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setCallStatus(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async function handleCall() {
    if (!phoneNumber) {
      setCallStatus("Enter a phone number");
      return;
    }

    const normalized = normalizeNumber(phoneNumber);
    if (!normalized) {
      setCallStatus("Use E.164 format e.g. +15705145377");
      return;
    }

    try {
      const device = await ensureDevice();
      setCalling(true);
      setCallStatus("Connecting...");

      const connection = await device.connect({ params: { To: normalized } });
      activeCallRef.current = connection;

      connection.on("accept", () => setCallStatus("In call"));
      connection.on("disconnect", () => {
        setCalling(false);
        setCallStatus("Call ended");
        activeCallRef.current = null;
      });
      connection.on("cancel", () => {
        setCalling(false);
        setCallStatus("Cancelled");
        activeCallRef.current = null;
      });
      connection.on("error", (event) => {
        setCalling(false);
        setCallStatus(`Call error: ${event.message}`);
        activeCallRef.current = null;
      });
    } catch (error) {
      setCalling(false);
      setCallStatus(
        error instanceof Error ? error.message : "Unable to place call"
      );
    }
  }

  function handleHangUp() {
    activeCallRef.current?.disconnect();
    deviceRef.current?.disconnectAll();
    setCalling(false);
    setCallStatus("Call ended");
  }

  async function handleSendMessage() {
    if (!messageNumber) {
      setMessageStatus("Enter a phone number");
      return;
    }

    if (!messageBody.trim()) {
      setMessageStatus("Enter a message");
      return;
    }

    const normalized = normalizeNumber(messageNumber);
    if (!normalized) {
      setMessageStatus("Use E.164 format e.g. +15705145377");
      return;
    }

    setSendingMessage(true);
    setMessageStatus("Sending...");

    try {
      const data = await twilioService.sendMessage({
        to: normalized,
        body: messageBody.trim(),
      });

      setMessageStatus(`Message ${data?.status ?? "queued"}`);
      setMessageBody("");
    } catch (error: unknown) {
      let errorMessage = "Failed to send message";

      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as {
          response?: { data?: { error?: string } };
          message?: string;
        };
        errorMessage =
          apiError.response?.data?.error || apiError.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setMessageStatus(errorMessage);
    } finally {
      setSendingMessage(false);
    }
  }

  const handleIncoming = useCallback((connection: TwilioCall) => {
    const caller =
      (connection.parameters as unknown as { From?: string })?.From ??
      connection.customParameters?.get("From") ??
      "";
    const label = caller ? `Incoming call from ${caller}` : "Incoming call";

    setCallStatus(label);
    setIncomingLabel(label);
    setCalling(false);
    activeCallRef.current = null;

    connection.on("accept", () => {
      setIncomingLabel(null);
      setCalling(true);
      setCallStatus("In call");
    });
    connection.on("disconnect", () => {
      setCalling(false);
      setIncomingLabel(null);
      setCallStatus("Call ended");
      activeCallRef.current = null;
    });
    connection.on("cancel", () => {
      setCalling(false);
      setIncomingLabel(null);
      setCallStatus("Cancelled");
      activeCallRef.current = null;
    });
    connection.on("error", (event: DeviceError) => {
      setCalling(false);
      setIncomingLabel(null);
      setCallStatus(`Call error: ${event.message}`);
      activeCallRef.current = null;
    });

    activeCallRef.current = connection;
  }, []);

  const handleAcceptIncoming = useCallback(() => {
    const connection = activeCallRef.current;
    if (!connection) {
      return;
    }
    setCallStatus("Answering...");
    connection.accept();
    activeCallRef.current = connection;
  }, []);

  const handleRejectIncoming = useCallback(() => {
    const connection = activeCallRef.current;
    if (!connection) {
      return;
    }
    connection.reject();
    setIncomingLabel(null);
    setCallStatus("Call declined");
    activeCallRef.current = null;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const device = await ensureDevice();
        if (!mounted) {
          return;
        }
        device.on("incoming", handleIncoming);
      } catch (error: unknown) {
        if (!mounted) {
          return;
        }
        // Extract error message from API response or use default
        let errorMessage = "Unable to initialize device";

        if (error && typeof error === "object" && "response" in error) {
          const apiError = error as {
            response?: { data?: { message?: string; error?: string } };
          };
          errorMessage =
            apiError.response?.data?.message ||
            apiError.response?.data?.error ||
            errorMessage;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setCallStatus(errorMessage);
      }
    }

    init();

    return () => {
      mounted = false;
      try {
        deviceRef.current?.destroy();
        deviceRef.current = null;
      } catch (_) {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleIncoming]);

  return (
    <DashboardLayout>
      <main className="relative mt-24 mb-8 flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-[66px] text-white">
        <div className="mx-auto max-w-2xl space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Contact Now
            </h1>
            <p className="max-w-2xl text-sm text-white/70 sm:text-base">
              Place a call or send a text without leaving the dashboard.
            </p>
          </header>

          {/* Voice Calling Section */}
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1f3032] via-[#243f42] to-[#1b2c2d] p-6 shadow-[0_22px_45px_-20px_rgba(19,82,87,0.55)]">
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/90">
                  Phone number (E.164)
                </label>
                <Input
                  placeholder="e.g. +15551234567"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleCall}
                  disabled={calling || !!incomingLabel}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {calling ? "Calling..." : "Start Call"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleHangUp}
                  disabled={!calling}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                >
                  Hang Up
                </Button>
                {incomingLabel && (
                  <>
                    <Button
                      onClick={handleAcceptIncoming}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Accept
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRejectIncoming}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    >
                      Decline
                    </Button>
                  </>
                )}
              </div>

              {callStatus && (
                <div className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white/80">
                  {callStatus}
                </div>
              )}
            </div>
          </section>

          {/* SMS Messaging Section */}
          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#1f3032] via-[#243f42] to-[#1b2c2d] p-6 shadow-[0_22px_45px_-20px_rgba(19,82,87,0.55)]">
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/90">
                  SMS recipient (E.164)
                </label>
                <Input
                  placeholder="e.g. +15551234567"
                  value={messageNumber}
                  onChange={(event) => setMessageNumber(event.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-white/90">
                  Message
                </label>
                <Textarea
                  placeholder="Type your message"
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px] focus-visible:ring-primary"
                  rows={4}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleSendMessage}
                  disabled={sendingMessage}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {sendingMessage ? "Sending..." : "Send Message"}
                </Button>
                {messageStatus && (
                  <div className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white/80">
                    {messageStatus}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default ContactNow;
