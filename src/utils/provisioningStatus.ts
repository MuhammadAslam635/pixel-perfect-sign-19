import { toast } from "sonner";

export interface ProvisioningStatus {
  twilio: {
    success: boolean;
    error: string | null;
  };
  elevenlabs: {
    success: boolean;
    error: string | null;
  };
}

/**
 * Display provisioning status in toast notifications
 */
export const showProvisioningStatus = (provisioning: ProvisioningStatus) => {
  const { twilio, elevenlabs } = provisioning;

  // Show Twilio status
  if (twilio.success) {
    toast.success("Twilio provisioning completed successfully", {
      description: "Phone number and TwiML app have been set up.",
    });
  } else if (twilio.error) {
    toast.error("Twilio provisioning failed", {
      description: twilio.error,
    });
  }

  // Show ElevenLabs status
  if (elevenlabs.success) {
    toast.success("ElevenLabs provisioning completed successfully", {
      description: "AI agent and phone number integration have been set up.",
    });
  } else if (elevenlabs.error) {
    toast.error("ElevenLabs provisioning failed", {
      description: elevenlabs.error,
    });
  }

  // Show summary if both completed
  if (twilio.success && elevenlabs.success) {
    toast.success("All provisioning completed successfully", {
      description: "Twilio and ElevenLabs have been fully configured.",
      duration: 5000,
    });
  }
};

