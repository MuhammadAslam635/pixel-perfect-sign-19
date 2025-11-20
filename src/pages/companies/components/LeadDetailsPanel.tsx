import { FC, useState } from "react";
import {
  Users,
  Phone,
  Mail,
  Linkedin,
  MessageCircle,
  Send,
  Upload,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lead } from "@/services/leads.service";
import { CompanyPerson, companiesService } from "@/services/companies.service";
import { highlevelService } from "@/services/highlevel.service";
import { toast } from "sonner";

type LeadDetailsPanelProps = {
  lead?: Lead;
  onEmailClick: (lead: Lead) => void;
  fallbackExecutive?: CompanyPerson | null;
  onPhoneClick?: (
    lead?: Lead,
    fallbackExecutive?: CompanyPerson | null
  ) => void;
  onLinkedinClick?: (lead: Lead) => void;
  syncedLeadIds?: Set<string>;
  onLeadSynced?: (leadId: string) => void;
};

const toStringOrUndefined = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const getIconButtonClasses = (isDisabled: boolean) =>
  `h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/40 ${
    isDisabled
      ? "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
      : "bg-white border-white text-gray-900 hover:bg-white/80 hover:text-gray-950"
  }`;

const LeadDetailsPanel: FC<LeadDetailsPanelProps> = ({
  lead,
  onEmailClick,
  fallbackExecutive,
  onPhoneClick,
  onLinkedinClick,
  syncedLeadIds = new Set(),
  onLeadSynced,
}) => {
  const [syncingToGHL, setSyncingToGHL] = useState(false);
  const [fillingData, setFillingData] = useState(false);
  const isSynced = lead?._id ? syncedLeadIds.has(lead._id) : false;

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

  const phone =
    lead?.phone || (!lead && fallbackPhone ? fallbackPhone : undefined);
  const email =
    lead?.email || (!lead && fallbackEmail ? fallbackEmail : undefined);
  const linkedin =
    lead?.linkedinUrl ||
    (!lead && fallbackLinkedin ? fallbackLinkedin : undefined);

  const canSendLinkedin = Boolean(linkedin);
  const isPhoneDisabled = !phone;
  const isEmailDisabled = !email;
  const isLinkedinDisabled = !linkedin;

  const handleSyncToGHL = async () => {
    if (!lead?._id || !lead?.companyId) {
      toast.error("Cannot sync: Missing lead or company information");
      return;
    }

    setSyncingToGHL(true);
    try {
      await highlevelService.createContactFromCompanyPerson({
        companyPersonId: lead._id,
        companyId: lead.companyId,
        type: "lead",
        source: "api v1",
        tags: [],
      });
      // Mark as synced
      onLeadSynced?.(lead._id);
      toast.success("Lead synced to GoHighLevel successfully!");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to sync lead to GoHighLevel";
      toast.error(errorMessage);
    } finally {
      setSyncingToGHL(false);
    }
  };

  const handleFillLeadData = async () => {
    if (!lead?._id || !lead?.companyId) {
      toast.error("Cannot enrich: Missing lead or company information");
      return;
    }

    setFillingData(true);
    try {
      const response = await companiesService.fillPersonData({
        companyId: lead.companyId,
        personId: lead._id,
      });

      if (response?.success) {
        toast.success(
          response.message || "Enrichment request submitted successfully"
        );
      } else {
        toast.error(response?.message || "Failed to enrich lead");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to fill missing information";
      toast.error(errorMessage);
    } finally {
      setFillingData(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 px-3 sm:px-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-white/10 text-white flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-foreground">Details</h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            className={getIconButtonClasses(isPhoneDisabled)}
            onClick={() => {
              if (phone) {
                onPhoneClick?.(lead, fallbackExecutive ?? null);
              }
            }}
            disabled={isPhoneDisabled}
            aria-disabled={isPhoneDisabled}
            title={isPhoneDisabled ? "No phone available" : "Call lead"}
          >
            <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            className={getIconButtonClasses(isEmailDisabled)}
            onClick={() => {
              if (lead) {
                onEmailClick(lead);
              } else if (email) {
                window.open(`mailto:${email}`);
              }
            }}
            disabled={isEmailDisabled}
            aria-disabled={isEmailDisabled}
            title={isEmailDisabled ? "No email available" : "Email lead"}
          >
            <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            className={getIconButtonClasses(isLinkedinDisabled)}
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
            disabled={isLinkedinDisabled}
            aria-disabled={isLinkedinDisabled}
            title={
              isLinkedinDisabled ? "No LinkedIn available" : "Open LinkedIn"
            }
          >
            <Linkedin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            className={getIconButtonClasses(isPhoneDisabled)}
            onClick={() => {
              if (phone) {
                const whatsappPhone = phone.replace(/\D/g, "");
                window.open(`https://wa.me/${whatsappPhone}`, "_blank");
              }
            }}
            disabled={isPhoneDisabled}
            aria-disabled={isPhoneDisabled}
            title={isPhoneDisabled ? "No phone available" : "Open WhatsApp"}
          >
            <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <button
            className={getIconButtonClasses(!canSendLinkedin)}
            onClick={() => {
              if (!linkedin) return;
              if (lead && onLinkedinClick) {
                onLinkedinClick(lead);
              } else {
                window.open(
                  linkedin.startsWith("http")
                    ? linkedin
                    : `https://${linkedin}`,
                  "_blank"
                );
              }
            }}
            disabled={!canSendLinkedin}
            aria-disabled={!canSendLinkedin}
            title={
              !canSendLinkedin
                ? "No LinkedIn available"
                : "Send LinkedIn message"
            }
          >
            <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          {lead && (
            <button
              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/40 ${
                syncingToGHL
                  ? "bg-primary/50 border-primary/50 text-white cursor-wait"
                  : isSynced
                  ? "bg-white border-white text-gray-900 hover:bg-white/80 hover:text-gray-950"
                  : "bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:text-white/40"
              }`}
              onClick={handleSyncToGHL}
              disabled={syncingToGHL}
              aria-disabled={syncingToGHL}
              title={isSynced ? "Synced to GoHighLevel" : "Sync to GoHighLevel"}
            >
              {syncingToGHL ? (
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
              ) : (
                <Upload
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                  strokeWidth={isSynced ? 2.5 : 1.5}
                />
              )}
            </button>
          )}
          {lead && lead.companyId && (
            <button
              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/40 ${
                fillingData
                  ? "bg-white/15 border-white/20 text-white cursor-wait"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/15 hover:text-white"
              }`}
              onClick={handleFillLeadData}
              disabled={fillingData}
              aria-disabled={fillingData}
              title="Fill missing information"
            >
              {fillingData ? (
                <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 px-3 sm:px-4">
        {displayName ? (
          <div className="flex flex-col items-center text-center py-4 sm:py-8">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mb-3 sm:mb-4 border-2 sm:border-4 border-white/10">
              <AvatarImage src={avatarSrc} alt={displayName} />
              <AvatarFallback className="bg-[#3d4f51] text-white text-2xl sm:text-3xl">
                {avatarLetter}
              </AvatarFallback>
            </Avatar>
            <h4 className="text-lg sm:text-xl font-semibold text-white mb-2">
              {displayName}
            </h4>
            <p className="text-xs sm:text-sm text-white/50 mb-1 break-words max-w-full">
              {displayCompany}
            </p>
            <p className="text-xs text-white/40">
              {displayPosition || "Chief Executive Officer"}
            </p>
            {lead && (
              <button
                onClick={handleSyncToGHL}
                disabled={syncingToGHL}
                className={`mt-4 px-4 py-2 disabled:cursor-wait text-xs font-medium rounded-full flex items-center gap-2 transition-colors ${
                  syncingToGHL
                    ? "bg-primary/50 text-white"
                    : isSynced
                    ? "bg-white text-gray-900 hover:bg-white/80"
                    : "bg-primary hover:bg-primary/80 text-white"
                }`}
              >
                {syncingToGHL ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Upload
                      className="w-3 h-3"
                      strokeWidth={isSynced ? 2.5 : 1.5}
                    />
                    <span>
                      {isSynced
                        ? "Synced to GoHighLevel"
                        : "Sync to GoHighLevel"}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground/60 text-center py-6 sm:py-8">
            Select a lead to view details.
          </p>
        )}
      </div>
    </>
  );
};

export default LeadDetailsPanel;
