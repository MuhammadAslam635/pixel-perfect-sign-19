import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Phone,
  Sparkles,
  Terminal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import { toast } from "sonner";

interface UserProvisioningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    _id: string;
    email: string;
    name?: string;
    hasTwilioConfig?: boolean;
    hasElevenLabsConfig?: boolean;
    twilioError?: string | null;
    elevenlabsError?: string | null;
  };
  onSuccess?: () => void;
}

interface LogEntry {
  type: "info" | "success" | "error" | "warning";
  message: string;
}

export const UserProvisioningModal = ({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserProvisioningModalProps) => {
  const [isConfiguringTwilio, setIsConfiguringTwilio] = useState(false);
  const [isConfiguringElevenLabs, setIsConfiguringElevenLabs] = useState(false);
  const [twilioStatus, setTwilioStatus] = useState<{
    success: boolean;
    error: string | null;
  } | null>(null);
  const [elevenlabsStatus, setElevenlabsStatus] = useState<{
    success: boolean;
    error: string | null;
  } | null>(null);
  const [twilioLogs, setTwilioLogs] = useState<LogEntry[]>([]);
  const [elevenlabsLogs, setElevenlabsLogs] = useState<LogEntry[]>([]);
  const [showTwilioLogs, setShowTwilioLogs] = useState(false);
  const [showElevenlabsLogs, setShowElevenlabsLogs] = useState(false);

  const hasTwilio = user.hasTwilioConfig ?? false;
  const hasElevenLabs = user.hasElevenLabsConfig ?? false;
  const needsTwilio = !hasTwilio;
  const needsElevenLabs = !hasElevenLabs;
  const hasAnyMissing = needsTwilio || needsElevenLabs;

  const handleConfigureTwilio = async () => {
    setIsConfiguringTwilio(true);
    setTwilioStatus(null);
    setTwilioLogs([]);
    setShowTwilioLogs(true);
    // Close ElevenLabs logs when configuring Twilio
    setShowElevenlabsLogs(false);

    try {
      const response = await adminService.configureUserTwilio(user._id);

      if (response.logs) {
        setTwilioLogs(response.logs as LogEntry[]);
      }

      if (response.success) {
        setTwilioStatus({ success: true, error: null });
        toast.success("Twilio configured successfully!");
        // Refresh user list in background but keep modal open
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setTwilioStatus({
          success: false,
          error: response.error || "Failed to configure Twilio",
        });
        toast.error(response.error || "Failed to configure Twilio");
      }
    } catch (error: unknown) {
      console.error("Twilio configuration error:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string; error?: string; logs?: LogEntry[] } } })?.response?.data?.message ||
        (error as { response?: { data?: { message?: string; error?: string; logs?: LogEntry[] } } })?.response?.data?.error ||
        (error as { message?: string })?.message ||
        "Failed to configure Twilio";
      
      const errorResponse = (error as { response?: { data?: { message?: string; error?: string; logs?: LogEntry[] } } })?.response?.data;
      if (errorResponse?.logs) {
        setTwilioLogs(errorResponse.logs as LogEntry[]);
      } else {
        setTwilioLogs([
          { type: "error" as const, message: errorMessage }
        ]);
      }
      
      setTwilioStatus({ success: false, error: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsConfiguringTwilio(false);
    }
  };

  const handleConfigureElevenLabs = async () => {
    // Check if Twilio is configured first
    if (!hasTwilio && !twilioStatus?.success) {
      toast.error("Twilio must be configured before ElevenLabs");
      return;
    }

    setIsConfiguringElevenLabs(true);
    setElevenlabsStatus(null);
    setElevenlabsLogs([]);
    setShowElevenlabsLogs(true);
    // Close Twilio logs when configuring ElevenLabs
    setShowTwilioLogs(false);

    try {
      const response = await adminService.configureUserElevenLabs(user._id);

      if (response.logs) {
        setElevenlabsLogs(response.logs as LogEntry[]);
      }

      if (response.success) {
        setElevenlabsStatus({ success: true, error: null });
        toast.success("ElevenLabs configured successfully!");
        // Refresh user list in background but keep modal open
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setElevenlabsStatus({
          success: false,
          error: response.error || "Failed to configure ElevenLabs",
        });
        toast.error(response.error || "Failed to configure ElevenLabs");
      }
    } catch (error: unknown) {
      console.error("ElevenLabs configuration error:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string; error?: string; logs?: LogEntry[] } } })?.response?.data?.message ||
        (error as { response?: { data?: { message?: string; error?: string; logs?: LogEntry[] } } })?.response?.data?.error ||
        (error as { message?: string })?.message ||
        "Failed to configure ElevenLabs";
      
      const errorResponse = (error as { response?: { data?: { message?: string; error?: string; logs?: LogEntry[] } } })?.response?.data;
      if (errorResponse?.logs) {
        setElevenlabsLogs(errorResponse.logs as LogEntry[]);
      } else {
        setElevenlabsLogs([
          { type: "error" as const, message: errorMessage }
        ]);
      }
      
      setElevenlabsStatus({ success: false, error: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsConfiguringElevenLabs(false);
    }
  };

  const getServiceStatus = (
    serviceName: "twilio" | "elevenlabs",
    isConfigured: boolean,
    status: { success: boolean; error: string | null } | null
  ) => {
    if (status) {
      if (status.success) {
        return { icon: CheckCircle2, color: "text-green-400", text: "Configured" };
      } else {
        return {
          icon: XCircle,
          color: "text-red-400",
          text: status.error || "Failed",
        };
      }
    }

    if (isConfigured) {
      return { icon: CheckCircle2, color: "text-green-400", text: "Configured" };
    } else {
      return {
        icon: AlertTriangle,
        color: "text-yellow-400",
        text: "Not Configured",
      };
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-3 w-3 text-green-400" />;
      case "error":
        return <XCircle className="h-3 w-3 text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-3 w-3 text-yellow-400" />;
      default:
        return <Terminal className="h-3 w-3 text-cyan-400" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-300";
      case "error":
        return "text-red-300";
      case "warning":
        return "text-yellow-300";
      default:
        return "text-cyan-300";
    }
  };

  const twilioStatusDisplay = getServiceStatus("twilio", hasTwilio, twilioStatus);
  const elevenlabsStatusDisplay = getServiceStatus(
    "elevenlabs",
    hasElevenLabs,
    elevenlabsStatus
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 text-white border border-white/10 overflow-hidden rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.55)] bg-[linear-gradient(135deg,rgba(58,62,75,0.82),rgba(28,30,40,0.94))] max-h-[90vh]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
          }}
        />

        <div className="relative z-10 flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold text-white">
              Configure Services
            </DialogTitle>
            <DialogDescription className="text-sm text-white/70">
              {user.name || user.email}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-6">
              {/* Twilio Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Twilio</p>
                      <p className="text-xs text-white/60">Phone number & SMS</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <twilioStatusDisplay.icon
                      className={`h-5 w-5 ${twilioStatusDisplay.color}`}
                    />
                    <Badge
                      className={`${
                        twilioStatusDisplay.color === "text-green-400"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : twilioStatusDisplay.color === "text-red-400"
                          ? "bg-red-500/20 text-red-300 border-red-500/30"
                          : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                      } border rounded-full px-3 py-1 text-xs`}
                    >
                      {twilioStatusDisplay.text}
                    </Badge>
                  </div>
                </div>

                {/* Configure Twilio Button */}
                {needsTwilio && (
                  <Button
                    type="button"
                    onClick={handleConfigureTwilio}
                    disabled={isConfiguringTwilio || isConfiguringElevenLabs}
                    className="w-full bg-gradient-to-r from-[#67B0B7] to-[#4066B3] text-white hover:opacity-90 rounded-full px-6 py-2.5 text-sm font-medium shadow-[0_5px_18px_rgba(103,176,183,0.35)] transition-all duration-300 disabled:opacity-50"
                  >
                    {isConfiguringTwilio ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Configuring Twilio...
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Configure Twilio
                      </>
                    )}
                  </Button>
                )}

                {/* Twilio Logs */}
                {twilioLogs.length > 0 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = !showTwilioLogs;
                        setShowTwilioLogs(newValue);
                        // Close ElevenLabs logs if opening Twilio logs
                        if (newValue) {
                          setShowElevenlabsLogs(false);
                        }
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/10 hover:bg-black/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-cyan-400" />
                        <span className="text-xs font-medium text-white">
                          Configuration Logs ({twilioLogs.length})
                        </span>
                      </div>
                      {showTwilioLogs ? (
                        <ChevronUp className="h-4 w-4 text-white/50" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-white/50" />
                      )}
                    </button>
                    {showTwilioLogs && (
                      <ScrollArea className="h-48 rounded-lg bg-black/40 border border-white/10 p-3">
                        <div className="space-y-1.5">
                          {twilioLogs.map((log, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 text-xs font-mono"
                            >
                              <span className="flex-shrink-0 mt-0.5">
                                {getLogIcon(log.type)}
                              </span>
                              <span className={getLogColor(log.type)}>
                                {log.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}

                {/* Error message for Twilio */}
                {(user.twilioError || twilioStatus?.error) && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-300">
                      <strong>Error:</strong> {twilioStatus?.error || user.twilioError}
                    </p>
                  </div>
                )}
              </div>

              {/* ElevenLabs Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-white">ElevenLabs</p>
                      <p className="text-xs text-white/60">AI Voice Agent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <elevenlabsStatusDisplay.icon
                      className={`h-5 w-5 ${elevenlabsStatusDisplay.color}`}
                    />
                    <Badge
                      className={`${
                        elevenlabsStatusDisplay.color === "text-green-400"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : elevenlabsStatusDisplay.color === "text-red-400"
                          ? "bg-red-500/20 text-red-300 border-red-500/30"
                          : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                      } border rounded-full px-3 py-1 text-xs`}
                    >
                      {elevenlabsStatusDisplay.text}
                    </Badge>
                  </div>
                </div>

                {/* Configure ElevenLabs Button */}
                {needsElevenLabs && (
                  <Button
                    type="button"
                    onClick={handleConfigureElevenLabs}
                    disabled={
                      isConfiguringElevenLabs ||
                      isConfiguringTwilio ||
                      (!hasTwilio && !twilioStatus?.success)
                    }
                    className="w-full bg-gradient-to-r from-purple-500/30 to-purple-600/30 text-purple-200 border border-purple-500/40 hover:from-purple-500/40 hover:to-purple-600/40 rounded-full px-6 py-2.5 text-sm font-medium shadow-[0_5px_18px_rgba(168,85,247,0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConfiguringElevenLabs ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Configuring ElevenLabs...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Configure ElevenLabs
                      </>
                    )}
                  </Button>
                )}

                {/* ElevenLabs Logs */}
                {elevenlabsLogs.length > 0 && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newValue = !showElevenlabsLogs;
                        setShowElevenlabsLogs(newValue);
                        // Close Twilio logs if opening ElevenLabs logs
                        if (newValue) {
                          setShowTwilioLogs(false);
                        }
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/10 hover:bg-black/40 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-medium text-white">
                          Configuration Logs ({elevenlabsLogs.length})
                        </span>
                      </div>
                      {showElevenlabsLogs ? (
                        <ChevronUp className="h-4 w-4 text-white/50" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-white/50" />
                      )}
                    </button>
                    {showElevenlabsLogs && (
                      <ScrollArea className="h-48 rounded-lg bg-black/40 border border-white/10 p-3">
                        <div className="space-y-1.5">
                          {elevenlabsLogs.map((log, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 text-xs font-mono"
                            >
                              <span className="flex-shrink-0 mt-0.5">
                                {getLogIcon(log.type)}
                              </span>
                              <span className={getLogColor(log.type)}>
                                {log.message}
                              </span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}

                {/* Error message for ElevenLabs */}
                {(user.elevenlabsError || elevenlabsStatus?.error) && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-300">
                      <strong>Error:</strong>{" "}
                      {elevenlabsStatus?.error || user.elevenlabsError}
                    </p>
                  </div>
                )}

                {/* Info message if Twilio is required */}
                {needsElevenLabs && !hasTwilio && !twilioStatus?.success && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-xs text-yellow-300">
                      Twilio must be configured before ElevenLabs can be configured.
                    </p>
                  </div>
                )}
              </div>

              {!hasAnyMissing && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-green-300">
                    All services are configured and ready to use.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 gap-2 border-t border-white/10 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              className="text-white/70 hover:text-white rounded-full"
              onClick={() => {
                onOpenChange(false);
                setTwilioStatus(null);
                setElevenlabsStatus(null);
                setTwilioLogs([]);
                setElevenlabsLogs([]);
                setShowTwilioLogs(false);
                setShowElevenlabsLogs(false);
              }}
              disabled={isConfiguringTwilio || isConfiguringElevenLabs}
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProvisioningModal;
