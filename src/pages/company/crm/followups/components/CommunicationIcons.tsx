import { memo } from "react";
import { Mail, MessageCircle, MessageSquare, Phone } from "lucide-react";

const CommunicationIcons = memo(({
  cumulativeCounts
}: {
  cumulativeCounts: { email: number; sms: number; whatsapp: number; call: number }
}) => {
  return (
    <div className="flex items-center gap-3">
      {cumulativeCounts.email > 0 && (
        <div className="flex flex-col items-center gap-0.5" title={`${cumulativeCounts.email} Emails`}>
          <Mail className="w-3.5 h-3.5 text-cyan-300/80" />
          <span className="text-xs text-cyan-300/70 font-medium">
            {cumulativeCounts.email}
          </span>
        </div>
      )}

      {cumulativeCounts.sms > 0 && (
        <div className="flex flex-col items-center gap-0.5" title={`${cumulativeCounts.sms} SMS`}>
          <MessageSquare className="w-3.5 h-3.5 text-cyan-300/80" />
          <span className="text-xs text-cyan-300/70 font-medium">
            {cumulativeCounts.sms}
          </span>
        </div>
      )}

      {cumulativeCounts.whatsapp > 0 && (
        <div className="flex flex-col items-center gap-0.5" title={`${cumulativeCounts.whatsapp} WhatsApp`}>
          <MessageCircle className="w-3.5 h-3.5 text-cyan-300/80" />
          <span className="text-xs text-cyan-300/70 font-medium">
            {cumulativeCounts.whatsapp}
          </span>
        </div>
      )}

      {cumulativeCounts.call > 0 && (
        <div className="flex flex-col items-center gap-0.5" title={`${cumulativeCounts.call} Calls`}>
          <Phone className="w-3.5 h-3.5 text-cyan-300/80" />
          <span className="text-xs text-cyan-300/70 font-medium">
            {cumulativeCounts.call}
          </span>
        </div>
      )}
    </div>
  );
});

CommunicationIcons.displayName = "CommunicationIcons";

export default CommunicationIcons;