import { FC } from "react";
import { Card } from "@/components/ui/card";
import { ArrowRight, Linkedin, Mail, MessageCircle, Phone } from "lucide-react";
import { Lead } from "@/services/leads.service";

type LeadsListProps = {
  leads: Lead[];
  loading: boolean;
  selectedLeadId: string | null;
  onSelectLead: (leadId: string) => void;
  onEmailClick: (lead: Lead) => void;
};

const LeadsList: FC<LeadsListProps> = ({
  leads,
  loading,
  selectedLeadId,
  onSelectLead,
  onEmailClick,
}) => {
  if (loading) {
    return (
      <div className="text-center text-white/70 py-8">Loading leads...</div>
    );
  }

  if (leads.length === 0) {
    return <div className="text-center text-white/70 py-8">No leads found</div>;
  }

  return (
    <>
      {leads.map((lead) => {
        const isActive = selectedLeadId === lead._id;
        const displayEmail = lead.email || "N/A";
        const displayPhone = lead.phone || "N/A";

        return (
          <Card
            key={lead._id}
            onClick={() => onSelectLead(lead._id)}
            className={`relative flex items-center justify-between gap-6 bg-gradient-to-r from-[#13363b] via-[#1f4c55] to-[#16383f] border ${
              isActive ? "border-primary/60" : "border-[#274a4f]"
            } rounded-[26px] px-8 py-3 pl-3 transition-all duration-300 hover:shadow-[0_18px_40px_rgba(0,0,0,0.3)] before:absolute before:content-[''] before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-[5px] before:rounded-full ${
              isActive ? "before:bg-primary" : "before:bg-white/75"
            } cursor-pointer`}
          >
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 text-white">
                <h3 className="text-lg font-semibold">{lead.name}</h3>
                {lead.companyName && (
                  <span className="text-sm text-white/70">
                    | {lead.companyName}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60 mt-1">
                {lead.position || "Chief Executive Officer"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-300">
                <div className="flex items-center gap-1.5 ">
                  <Linkedin className="w-6 h-6 rounded-full text-gray-800 bg-white border p-1 border-white/20" />
                  <span className="font-medium truncate max-w-[200px]">
                    {lead.linkedinUrl || "linkedin.com"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ">
                  <Mail className="w-6 h-6 rounded-full text-gray-800 bg-white border p-1 border-white/20" />
                  <span className="font-medium truncate max-w-[200px]">
                    {displayEmail}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (displayPhone !== "N/A") {
                      window.open(`tel:${displayPhone}`);
                    }
                  }}
                >
                  <Phone className="w-3.5 h-3.5 text-gray-800" />
                </button>
                <button
                  className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEmailClick(lead);
                  }}
                >
                  <Mail className="w-3.5 h-3.5 text-gray-800" />
                </button>
                <button
                  className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (lead.linkedinUrl) {
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (displayPhone !== "N/A") {
                      const whatsappPhone = displayPhone.replace(/\D/g, "");
                      window.open(`https://wa.me/${whatsappPhone}`, "_blank");
                    }
                  }}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-gray-800" />
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLead(lead._id);
                }}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-full px-8 py-1.5 flex items-center gap-3 transition-colors"
              >
                View Details
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </Card>
        );
      })}
    </>
  );
};

export default LeadsList;
