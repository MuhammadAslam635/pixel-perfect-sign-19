import { FC } from "react";
import { Lead } from "@/services/leads.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Phone,
  Mail,
  Linkedin,
  MessageCircle,
  Calendar,
  Languages,
  MapPin,
  Eye,
} from "lucide-react";

type LeadDetailCardProps = {
  lead: Lead;
};

const LeadDetailCard: FC<LeadDetailCardProps> = ({ lead }) => {
  const avatarLetter = lead.name?.charAt(0).toUpperCase() || "?";
  const avatarSrc = lead.pictureUrl;

  // Determine API source based on lead fields
  const getApiSource = (): string => {
    if (lead.exaItemId) {
      return "Exa API";
    }
    if (lead.peopleWebsetId) {
      return "PeopleWebset API";
    }
    // Default fallback
    return "Unknown API";
  };

  const apiSource = getApiSource();

  const handleWhatsAppClick = () => {
    if (lead.phone) {
      const whatsappPhone = lead.phone.replace(/\D/g, "");
      window.open(`https://wa.me/${whatsappPhone}`, "_blank");
    }
  };

  const handleLinkedinClick = () => {
    if (lead.linkedinUrl) {
      window.open(
        lead.linkedinUrl.startsWith("http")
          ? lead.linkedinUrl
          : `https://${lead.linkedinUrl}`,
        "_blank"
      );
    }
  };

  const handleEmailClick = () => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`, "_blank");
    }
  };

  const handlePhoneClick = () => {
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, "_blank");
    }
  };

  return (
    <Card
      className="w-full flex-1 min-h-0 flex flex-col"
      style={{
        background:
          "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
        boxShadow:
          "0px 3.43px 3.43px 0px #FFFFFF29 inset, 0px -3.43px 3.43px 0px #FFFFFF29 inset",
        borderRadius: "20px",
        border: "1px solid #FFFFFF1A",
      }}
    >
      <CardContent className="p-4 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {/* Profile Section */}
        <div className="flex flex-col items-center mb-6">
          <Avatar className="h-20 w-20 mb-3 border-2 border-white/20">
            <AvatarImage src={avatarSrc} alt={lead.name} />
            <AvatarFallback className="bg-[#3d4f51] text-white text-2xl">
              {avatarLetter}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-base font-semibold text-white mb-1 text-center break-words">
            {lead.name}
          </h2>
          <p className="text-[10px] text-white/80 text-center break-words leading-tight">
            {lead.companyName || "Company"} |{" "}
            {lead.position || "Chief Executive Officer"}
          </p>
        </div>

        {/* Contact Section */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white mb-2">Contact</h3>
          <div className="space-y-1.5">
            {/* Phone */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-white/60">Phone</label>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <Phone className="w-3 h-3 text-white/60 flex-shrink-0" />
                <span className="text-[10px] text-white flex-1 truncate">
                  {lead.phone || "N/A"}
                </span>
                {lead.phone && (
                  <button
                    onClick={handlePhoneClick}
                    className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                    title="Call"
                  >
                    <Phone className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-white/60">WhatsApp</label>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <MessageCircle className="w-3 h-3 text-white/60 flex-shrink-0" />
                <span className="text-[10px] text-white flex-1 truncate">
                  {lead.phone || "N/A"}
                </span>
                {lead.phone && (
                  <button
                    onClick={handleWhatsAppClick}
                    className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                    title="Open WhatsApp"
                  >
                    <MessageCircle className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-white/60">Email</label>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <Mail className="w-3 h-3 text-white/60 flex-shrink-0" />
                <span className="text-[10px] text-white flex-1 truncate">
                  {lead.email || "N/A"}
                </span>
                {lead.email && (
                  <button
                    onClick={handleEmailClick}
                    className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                    title="Send Email"
                  >
                    <Mail className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* LinkedIn */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-white/60">LinkedIn</label>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <Linkedin className="w-3 h-3 text-white/60 flex-shrink-0" />
                <span className="text-[10px] text-white flex-1 truncate">
                  {lead.linkedinUrl
                    ? `@${lead.linkedinUrl
                        .replace(/^https?:\/\/(www\.)?linkedin\.com\//, "")
                        .replace(/^\//, "")}`
                    : "N/A"}
                </span>
                {lead.linkedinUrl && (
                  <button
                    onClick={handleLinkedinClick}
                    className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                    title="Open LinkedIn"
                  >
                    <Linkedin className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Section */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-2">Personal</h3>
          <div className="space-y-1.5">
            {/* Date of Birth - Not available in Lead type, showing placeholder */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-white/60">Date of Birth</label>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <Calendar className="w-3 h-3 text-white/60 flex-shrink-0" />
                <span className="text-[10px] text-white">N/A</span>
              </div>
            </div>

            {/* Language - Not available in Lead type, showing placeholder */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-white/60">Language</label>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <Languages className="w-3 h-3 text-white/60 flex-shrink-0" />
                <span className="text-[10px] text-white">N/A</span>
              </div>
            </div>

            {/* Region */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-white/60">Region</label>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <MapPin className="w-3 h-3 text-white/60 flex-shrink-0" />
                <span className="text-[10px] text-white truncate">
                  {lead.location || lead.companyLocation || "N/A"}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-white/60">Status</label>
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                <Eye className="w-3 h-3 text-white/60 flex-shrink-0" />
                <span className="text-[10px] text-white">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Section */}
        <div className="mt-5 pt-3 border-t border-white/10">
          <h3
            className="text-white mb-1.5"
            style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              color: "#FFFFFF",
            }}
          >
            Resource
          </h3>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{
              background: "#1a1a1a",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <span className="text-[10px] text-white truncate">{apiSource}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadDetailCard;
