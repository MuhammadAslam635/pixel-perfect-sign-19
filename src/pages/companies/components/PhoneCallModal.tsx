import { FC, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

type PhoneCallModalProps = {
  open: boolean;
  onClose: () => void;
  leadName?: string;
  phoneNumber?: string;
  transcript?: string;
};

export const PhoneCallModal: FC<PhoneCallModalProps> = ({
  open,
  onClose,
  leadName,
  phoneNumber,
  transcript,
}) => {
  const sanitizedPhoneNumber = useMemo(
    () => phoneNumber?.replace(/\D/g, "") || "",
    [phoneNumber]
  );

  const handleCall = () => {
    if (!phoneNumber) {
      return;
    }

    window.open(`tel:${phoneNumber}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] bg-[#1e2829] border-[#3A3A3A] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Call {leadName || "Lead"}
          </DialogTitle>
          <p className="text-sm text-white/60 mt-1">
            Review the most recent call notes before reaching out again.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="rounded-lg border border-white/10 bg-[#2A3435]/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">
                  Phone Number
                </p>
                <p className="text-sm font-medium text-white">
                  {phoneNumber || "Not available"}
                </p>
              </div>
              {sanitizedPhoneNumber && (
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                  Ready
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#2A3435]/40 p-4">
            <p className="text-xs uppercase tracking-wide text-white/40 mb-2">
              Call Transcript
            </p>
            <div className="max-h-64 overflow-y-auto rounded-md border border-white/5 bg-[#253032]/40 p-3 text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
              {transcript?.trim()
                ? transcript
                : "No call transcript is available for this lead yet."}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="bg-[#2A3435] hover:bg-[#364142] text-white border-0 rounded-full px-6 py-2"
            >
              Close
            </Button>
            <Button
              onClick={handleCall}
              disabled={!phoneNumber}
              className="bg-primary hover:bg-primary/90 disabled:bg-white/10 disabled:text-white/40 text-white rounded-full px-6 py-2 flex items-center gap-2"
            >
              <Phone className="h-4 w-4" />
              Call Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
