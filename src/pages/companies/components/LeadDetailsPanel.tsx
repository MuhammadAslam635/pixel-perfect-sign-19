import { FC } from "react";
import { Users, Phone, Mail, Linkedin, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lead } from "@/services/leads.service";
import { CompanyPerson } from "@/services/companies.service";

type LeadDetailsPanelProps = {
  lead?: Lead;
  onEmailClick: (lead: Lead) => void;
  fallbackExecutive?: CompanyPerson | null;
};

const toStringOrUndefined = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const LeadDetailsPanel: FC<LeadDetailsPanelProps> = ({
  lead,
  onEmailClick,
  fallbackExecutive,
}) => {
  const fallbackEmail = toStringOrUndefined(fallbackExecutive?.email);
  const fallbackPhone = toStringOrUndefined(fallbackExecutive?.phone);
  const fallbackLinkedin = toStringOrUndefined(fallbackExecutive?.linkedin);
  const fallbackTitle =
    toStringOrUndefined(fallbackExecutive?.title) ??
    toStringOrUndefined(fallbackExecutive?.position);

  const displayName = lead?.name || fallbackExecutive?.name;
  const displayCompany =
    lead?.companyName ||
    toStringOrUndefined(fallbackExecutive?.company) ||
    "Company not specified";
  const displayPosition = lead?.position || fallbackTitle;

  const avatarLetter = displayName?.charAt(0).toUpperCase() || "?";
  const avatarSrc = lead?.pictureUrl || undefined;

  const phone = lead?.phone || fallbackPhone || undefined;
  const email = lead?.email || fallbackEmail || undefined;
  const linkedin = lead?.linkedinUrl || fallbackLinkedin || undefined;

  return (
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
            className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-40"
            onClick={() => {
              if (phone) {
                window.open(`tel:${phone}`);
              }
            }}
            disabled={!phone}
          >
            <Phone className="w-3.5 h-3.5 text-gray-800" />
          </button>
          <button
            className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-40"
            onClick={() => {
              if (lead) {
                onEmailClick(lead);
              } else if (email) {
                window.open(`mailto:${email}`);
              }
            }}
            disabled={!lead && !email}
          >
            <Mail className="w-3.5 h-3.5 text-gray-800" />
          </button>
          <button
            className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-40"
            onClick={() => {
              if (linkedin) {
                window.open(
                  linkedin.startsWith("http")
                    ? linkedin
                    : `https://${linkedin}`,
                  "_blank"
                );
              }
            }}
            disabled={!linkedin}
          >
            <Linkedin className="w-3.5 h-3.5 text-gray-800" />
          </button>
          <button
            className="h-8 w-8 rounded-full bg-white hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-40"
            onClick={() => {
              if (phone) {
                const whatsappPhone = phone.replace(/\D/g, "");
                window.open(`https://wa.me/${whatsappPhone}`, "_blank");
              }
            }}
            disabled={!phone}
          >
            <MessageCircle className="w-3.5 h-3.5 text-gray-800" />
          </button>
        </div>
      </div>

      <div className="space-y-4 px-4">
        {displayName ? (
          <div className="flex flex-col items-center text-center py-8">
            <Avatar className="h-32 w-32 mb-4 border-4 border-white/10">
              <AvatarImage src={avatarSrc} alt={displayName} />
              <AvatarFallback className="bg-[#3d4f51] text-white text-3xl">
                {avatarLetter}
              </AvatarFallback>
            </Avatar>
            <h4 className="text-xl font-semibold text-white mb-2">
              {displayName}
            </h4>
            <p className="text-sm text-white/50 mb-1">{displayCompany}</p>
            <p className="text-xs text-white/40">
              {displayPosition || "Chief Executive Officer"}
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
};

export default LeadDetailsPanel;
