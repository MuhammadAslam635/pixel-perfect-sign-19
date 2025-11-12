import { FC } from "react";
import { Users, Phone, Mail, Linkedin, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lead } from "@/services/leads.service";

type LeadDetailsPanelProps = {
  lead?: Lead;
  onEmailClick: (lead: Lead) => void;
};

const LeadDetailsPanel: FC<LeadDetailsPanelProps> = ({
  lead,
  onEmailClick,
}) => (
  <>
    <div className="flex items-center justify-between mb-6 px-4">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-full bg-white/10 text-white flex items-center justify-center">
          <Users className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-medium text-foreground">Details</h3>
      </div>
      <div className="flex items-center gap-1">
        <button
          className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
          onClick={() => {
            if (lead?.phone) {
              window.open(`tel:${lead.phone}`);
            }
          }}
        >
          <Phone className="w-3.5 h-3.5 text-gray-800" />
        </button>
        <button
          className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
          onClick={() => {
            if (lead) {
              onEmailClick(lead);
            }
          }}
        >
          <Mail className="w-3.5 h-3.5 text-gray-800" />
        </button>
        <button
          className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
          onClick={() => {
            if (lead?.linkedinUrl) {
              window.open(
                lead.linkedinUrl.startsWith("http")
                  ? lead.linkedinUrl
                  : `https://${lead.linkedinUrl}`,
                "_blank"
              );
            }
          }}
        >
          <Linkedin className="w-3.5 h-3.5 text-gray-800" />
        </button>
        <button
          className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
          onClick={() => {
            if (lead?.phone) {
              const whatsappPhone = lead.phone.replace(/\D/g, "");
              window.open(`https://wa.me/${whatsappPhone}`, "_blank");
            }
          }}
        >
          <MessageCircle className="w-3.5 h-3.5 text-gray-800" />
        </button>
      </div>
    </div>

    <div className="space-y-4 px-4">
      {lead ? (
        <div className="flex flex-col items-center text-center py-8">
          <Avatar className="h-32 w-32 mb-4 border-4 border-white/10">
            <AvatarImage src={lead.pictureUrl} alt={lead.name} />
            <AvatarFallback className="bg-[#3d4f51] text-white text-3xl">
              {lead.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h4 className="text-xl font-semibold text-white mb-2">{lead.name}</h4>
          <p className="text-sm text-white/50 mb-1">
            {lead.companyName || "Company not specified"}
          </p>
          <p className="text-xs text-white/40">
            {lead.position || "Chief Executive Officer"}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/60 text-center py-8">
          Select a lead to view details.
        </p>
      )}
    </div>
  </>
);

export default LeadDetailsPanel;
