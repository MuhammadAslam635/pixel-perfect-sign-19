import { FC, useEffect, useMemo, useState } from "react";
import { Lead, leadsService } from "@/services/leads.service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Phone,
  Mail,
  Linkedin,
  Calendar,
  Languages,
  MapPin,
  Eye,
  Sparkles,
  Loader2,
  CalendarPlus,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { companiesService } from "@/services/companies.service";
import { calendarService } from "@/services/calendar.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";

type ScheduleMeetingForm = {
  subject: string;
  body: string;
  location: string;
  findAvailableSlot: boolean;
  startDateTime: string;
  endDateTime: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
};

type LeadDetailCardProps = {
  lead: Lead;
};

const MAX_SEARCH_RANGE_MS = 62 * 24 * 60 * 60 * 1000; // 62 days

const formatDateTimeLocal = (date: Date) => {
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const LeadDetailCard: FC<LeadDetailCardProps> = ({ lead }) => {
  const queryClient = useQueryClient();
  const [fillingData, setFillingData] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  const [checkingMicrosoft, setCheckingMicrosoft] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState<boolean | null>(
    null
  );
  const [microsoftStatusMessage, setMicrosoftStatusMessage] = useState<
    string | null
  >(null);
  const [microsoftStatusError, setMicrosoftStatusError] = useState<
    string | null
  >(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    phone: lead.phone || "",
    whatsapp: lead.whatsapp || "",
    email: lead.email || "",
    linkedinUrl: lead.linkedinUrl || "",
    location: lead.location || lead.companyLocation || "",
    position: lead.position || "",
    language: lead.language || "",
  });
  const avatarLetter = lead.name?.charAt(0).toUpperCase() || "?";
  const avatarSrc = lead.pictureUrl;

  const createInitialScheduleForm = useMemo<() => ScheduleMeetingForm>(() => {
    return () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 0, 0);

      return {
        subject: lead?.name ? `Meeting with ${lead.name}` : "Meeting",
        body: "",
        location: "",
        findAvailableSlot: true,
        startDateTime: "",
        endDateTime: "",
        startDate: formatDateTimeLocal(now),
        endDate: formatDateTimeLocal(endOfDay),
        durationMinutes: 30,
      };
    };
  }, [lead?.name]);

  const [scheduleForm, setScheduleForm] = useState<ScheduleMeetingForm>(
    createInitialScheduleForm
  );

  const resetScheduleForm = () => {
    setScheduleForm(createInitialScheduleForm());
  };

  const isSearchRangeTooLarge = useMemo(() => {
    if (
      !scheduleForm.findAvailableSlot ||
      !scheduleForm.startDate ||
      !scheduleForm.endDate
    ) {
      return false;
    }
    const start = new Date(scheduleForm.startDate);
    const end = new Date(scheduleForm.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false;
    }
    return end.getTime() - start.getTime() > MAX_SEARCH_RANGE_MS;
  }, [
    scheduleForm.findAvailableSlot,
    scheduleForm.startDate,
    scheduleForm.endDate,
  ]);

  const maxSearchEndDate = useMemo(() => {
    if (!scheduleForm.startDate) {
      return undefined;
    }
    const start = new Date(scheduleForm.startDate);
    if (Number.isNaN(start.getTime())) {
      return undefined;
    }
    const max = new Date(start.getTime() + MAX_SEARCH_RANGE_MS);
    return formatDateTimeLocal(max);
  }, [scheduleForm.startDate]);

  useEffect(() => {
    if (!scheduleDialogOpen) {
      setMicrosoftConnected(null);
      setMicrosoftStatusMessage(null);
      setMicrosoftStatusError(null);
      setCheckingMicrosoft(false);
      return;
    }

    let isActive = true;
    setCheckingMicrosoft(true);
    setMicrosoftStatusMessage(null);
    setMicrosoftStatusError(null);

    calendarService
      .getMicrosoftConnectionStatus()
      .then((response) => {
        if (!isActive) {
          return;
        }
        const connected = Boolean(response?.connected);
        setMicrosoftConnected(connected);
        if (connected) {
          const note = response?.data?.providerUserEmail
            ? `Connected as ${response.data.providerUserEmail}`
            : "Microsoft Calendar is connected.";
          setMicrosoftStatusMessage(note);
          setMicrosoftStatusError(null);
        } else {
          setMicrosoftStatusMessage(null);
          setMicrosoftStatusError(
            "Microsoft Calendar is not connected. Connect it from Settings → Integrations."
          );
        }
      })
      .catch((error: any) => {
        if (!isActive) {
          return;
        }
        const message =
          error?.response?.data?.message ||
          "Unable to verify Microsoft connection. Please try again.";
        setMicrosoftConnected(false);
        setMicrosoftStatusMessage(null);
        setMicrosoftStatusError(message);
      })
      .finally(() => {
        if (isActive) {
          setCheckingMicrosoft(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [scheduleDialogOpen]);

  const handleWhatsAppClick = () => {
    const whatsappNumber = lead.whatsapp || lead.phone;
    if (whatsappNumber) {
      const cleanNumber = whatsappNumber.replace(/\D/g, "");
      window.open(`https://wa.me/${cleanNumber}`, "_blank");
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

  const handleFillPersonData = async () => {
    if (!lead._id || !lead.companyId) {
      toast.error("Cannot enrich: missing lead or company information");
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
        // Invalidate and refetch lead data
        await queryClient.invalidateQueries({ queryKey: ["lead", lead._id] });
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

  // Update editData when lead changes
  useEffect(() => {
    if (!isEditing) {
      setEditData({
        phone: lead.phone || "",
        whatsapp: lead.whatsapp || "",
        email: lead.email || "",
        linkedinUrl: lead.linkedinUrl || "",
        location: lead.location || lead.companyLocation || "",
        position: lead.position || "",
        language: lead.language || "",
      });
    }
  }, [lead, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      phone: lead.phone || "",
      whatsapp: lead.whatsapp || "",
      email: lead.email || "",
      linkedinUrl: lead.linkedinUrl || "",
      location: lead.location || lead.companyLocation || "",
      position: lead.position || "",
      language: lead.language || "",
    });
  };

  const handleSave = async () => {
    if (!lead._id) {
      toast.error("Lead ID is missing");
      return;
    }

    setIsSaving(true);
    try {
      // Clean up LinkedIn URL - remove protocol and www if present
      let cleanedLinkedinUrl = editData.linkedinUrl.trim();
      if (cleanedLinkedinUrl) {
        cleanedLinkedinUrl = cleanedLinkedinUrl
          .replace(/^https?:\/\/(www\.)?/, "")
          .replace(/^linkedin\.com\//, "");
      }

      const updatePayload: Partial<Lead> = {
        phone: editData.phone.trim() || undefined,
        whatsapp: editData.whatsapp.trim() || undefined,
        email: editData.email.trim() || undefined,
        linkedinUrl: cleanedLinkedinUrl || undefined,
        location: editData.location.trim() || undefined,
        position: editData.position.trim() || undefined,
        language: editData.language.trim() || undefined,
      };

      const response = await leadsService.updateLead(lead._id, updatePayload);

      if (response.success) {
        toast.success("Lead updated successfully");
        setIsEditing(false);
        // Invalidate and refetch lead data
        await queryClient.invalidateQueries({ queryKey: ["lead", lead._id] });
      } else {
        toast.error(response.message || "Failed to update lead");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update lead";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!lead._id) {
      toast.error("Missing lead identifier");
      return;
    }

    if (checkingMicrosoft) {
      toast.error("Please wait while we confirm your Microsoft connection.");
      return;
    }

    if (!microsoftConnected) {
      toast.error(
        microsoftStatusError ||
          "Microsoft Calendar is not connected. Connect it in Settings before scheduling."
      );
      return;
    }

    if (scheduleForm.findAvailableSlot && isSearchRangeTooLarge) {
      toast.error(
        "Search window must be less than 62 days from the start date."
      );
      return;
    }

    if (!scheduleForm.findAvailableSlot) {
      if (!scheduleForm.startDateTime || !scheduleForm.endDateTime) {
        toast.error("Start and end date/time are required");
        return;
      }
    } else {
      if (!scheduleForm.startDate) {
        toast.error("Start search date is required");
        return;
      }
    }

    const autoModeStart = scheduleForm.startDate
      ? new Date(scheduleForm.startDate)
      : new Date();

    let autoModeEnd: Date | undefined;
    if (scheduleForm.findAvailableSlot) {
      if (scheduleForm.endDate) {
        autoModeEnd = new Date(scheduleForm.endDate);
      } else {
        autoModeEnd = new Date(autoModeStart);
        autoModeEnd.setHours(23, 59, 59, 999);
      }
    }

    const payload = {
      personId: lead._id,
      subject: scheduleForm.subject?.trim() || undefined,
      body: scheduleForm.body?.trim() || undefined,
      location: scheduleForm.location?.trim() || undefined,
      findAvailableSlot: scheduleForm.findAvailableSlot,
      durationMinutes: scheduleForm.findAvailableSlot
        ? scheduleForm.durationMinutes
        : undefined,
      startDateTime: !scheduleForm.findAvailableSlot
        ? new Date(scheduleForm.startDateTime).toISOString()
        : undefined,
      endDateTime: !scheduleForm.findAvailableSlot
        ? new Date(scheduleForm.endDateTime).toISOString()
        : undefined,
      startDate:
        scheduleForm.findAvailableSlot && autoModeStart
          ? autoModeStart.toISOString()
          : undefined,
      endDate:
        scheduleForm.findAvailableSlot && autoModeEnd
          ? autoModeEnd.toISOString()
          : undefined,
    };

    setSchedulingMeeting(true);
    try {
      const response = await calendarService.scheduleMeeting(payload);
      toast.success(
        response?.message ||
          "Meeting scheduled successfully in Microsoft Calendar"
      );
      setScheduleDialogOpen(false);
      resetScheduleForm();
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["lead-calendar-meetings", lead._id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["calendar-available-slots"],
        }),
      ]);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to schedule meeting";
      toast.error(message);
    } finally {
      setSchedulingMeeting(false);
    }
  };

  return (
    <>
      <Card
        className="w-full flex flex-col overflow-hidden h-[calc(100vh-200px)] min-h-0"
        style={{
          background:
            "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 2e-05) 38.08%, rgba(255, 255, 255, 2e-05) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)",
          border: "1px solid #FFFFFF0D",
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
            <h2 className="text-xs sm:text-sm font-semibold text-white mb-1 text-center break-words">
              {lead.name}
            </h2>
            {isEditing ? (
              <div className="w-full px-2 mb-3">
                <Input
                  value={editData.position}
                  onChange={(e) =>
                    setEditData({ ...editData, position: e.target.value })
                  }
                  className="h-6 text-[10px] bg-white/5 border-white/20 text-white focus-visible:ring-1 focus-visible:ring-white/30 px-2"
                  placeholder="Position"
                />
              </div>
            ) : (
              <p className="text-[10px] text-white/80 text-center break-words leading-tight">
                {lead.companyName || "Company"} |{" "}
                {lead.position || "Chief Executive Officer"}
              </p>
            )}
            <div className="flex flex-col gap-2 w-full">
              {!isEditing ? (
                <>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    {/* Fill Missing Info */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={handleFillPersonData}
                          disabled={fillingData || !lead._id || !lead.companyId}
                          className={`flex h-8 w-8 items-center justify-center rounded-full border text-white transition-colors ${
                            fillingData
                              ? "bg-white/15 border-white/25 cursor-wait opacity-70"
                              : "bg-white/5 border-white/20 hover:bg-white/15"
                          }`}
                        >
                          {fillingData ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="center">
                        <span className="text-xs">Fill missing info</span>
                      </TooltipContent>
                    </Tooltip>

                    {/* Edit Details */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={handleEdit}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="center">
                        <span className="text-xs">Edit details</span>
                      </TooltipContent>
                    </Tooltip>

                    {/* Schedule Meeting */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          disabled={!lead._id}
                          onClick={() => {
                            resetScheduleForm();
                            setScheduleDialogOpen(true);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CalendarPlus className="w-3 h-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" align="center">
                        <span className="text-xs">Schedule meeting</span>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full justify-center text-[10px] h-8 bg-white/25 hover:bg-white/35 text-white border border-white/30"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3 h-3 mr-1" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="w-full justify-center text-[10px] h-8 bg-white/5 hover:bg-white/15 text-white border border-white/15"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Contact Section */}
          <div className="mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">Contact</h3>
            <div className="space-y-1.5">
              {/* Phone */}
              <div className="flex flex-col gap-0.5">
                {isEditing ? (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <Input
                      value={editData.phone}
                      onChange={(e) =>
                        setEditData({ ...editData, phone: e.target.value })
                      }
                      className="flex-1 h-6 text-[10px] bg-transparent border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-0"
                      placeholder="Phone number"
                    />
                  </div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20 cursor-pointer"
                        onClick={handlePhoneClick}
                      >
                        <Phone className="w-3 h-3 text-white/60 flex-shrink-0" />
                        <span className="text-[10px] text-white flex-1 truncate">
                          {lead.phone || "N/A"}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{lead.phone || "No phone available"}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* WhatsApp */}
              <div className="flex flex-col gap-0.5">
                {isEditing ? (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <Input
                      value={editData.whatsapp}
                      onChange={(e) =>
                        setEditData({ ...editData, whatsapp: e.target.value })
                      }
                      className="flex-1 h-6 text-[10px] bg-transparent border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-0"
                      placeholder="WhatsApp number"
                    />
                  </div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20 cursor-pointer"
                        onClick={handleWhatsAppClick}
                      >
                        <svg
                          className="w-3 h-3 text-white/60 flex-shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.742.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="text-[10px] text-white flex-1 truncate">
                          {lead.whatsapp || "N/A"}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{lead.whatsapp || "No WhatsApp available"}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-0.5">
                {isEditing ? (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <Input
                      type="email"
                      value={editData.email}
                      onChange={(e) =>
                        setEditData({ ...editData, email: e.target.value })
                      }
                      className="flex-1 h-6 text-[10px] bg-transparent border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-0"
                      placeholder="Email address"
                    />
                  </div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20 cursor-pointer"
                        onClick={handleEmailClick}
                      >
                        <Mail className="w-3 h-3 text-white/60 flex-shrink-0" />
                        <span className="text-[10px] text-white flex-1 truncate">
                          {lead.email || "N/A"}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{lead.email || "No email available"}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* LinkedIn */}
              <div className="flex flex-col gap-0.5">
                {isEditing ? (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <Input
                      value={editData.linkedinUrl}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          linkedinUrl: e.target.value,
                        })
                      }
                      className="flex-1 h-6 text-[10px] bg-transparent border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-0"
                      placeholder="LinkedIn URL or username"
                    />
                  </div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20 cursor-pointer"
                        onClick={handleLinkedinClick}
                      >
                        <Linkedin className="w-3 h-3 text-white/60 flex-shrink-0" />
                        <span className="text-[10px] text-white flex-1 truncate">
                          {lead.linkedinUrl
                            ? `@${lead.linkedinUrl
                                .replace(
                                  /^https?:\/\/(www\.)?linkedin\.com\//,
                                  ""
                                )
                                .replace(/^\//, "")}`
                            : "N/A"}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{lead.linkedinUrl || "No LinkedIn available"}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>

          {/* Personal Section */}
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">Personal</h3>
            <div className="space-y-1.5">
              {/* Date of Birth - Not available in Lead type, showing placeholder */}
              <div className="flex flex-col gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20"
                      >
                        <Calendar className="w-3 h-3 text-white/60 flex-shrink-0" />
                        <span className="text-[10px] text-white">N/A</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Date of Birth not available</p>
                    </TooltipContent>
                  </Tooltip>
              </div>

              {/* Language */}
              <div className="flex flex-col gap-0.5">
                {isEditing ? (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <Languages className="w-3 h-3 text-white/60 flex-shrink-0" />
                    <Input
                      value={editData.language}
                      onChange={(e) =>
                        setEditData({ ...editData, language: e.target.value })
                      }
                      className="flex-1 h-6 text-[10px] bg-transparent border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-0"
                      placeholder="Language"
                    />
                  </div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20"
                      >
                        <Languages className="w-3 h-3 text-white/60 flex-shrink-0" />
                        <span className="text-[10px] text-white flex-1 truncate">
                          {lead.language || "N/A"}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{lead.language || "No language specified"}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Region */}
              <div className="flex flex-col gap-0.5">
                {isEditing ? (
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: "#1a1a1a",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <MapPin className="w-3 h-3 text-white/60 flex-shrink-0" />
                    <Input
                      value={editData.location}
                      onChange={(e) =>
                        setEditData({ ...editData, location: e.target.value })
                      }
                      className="flex-1 h-6 text-[10px] bg-transparent border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-0"
                      placeholder="Location"
                    />
                  </div>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20"
                      >
                        <MapPin className="w-3 h-3 text-white/60 flex-shrink-0" />
                        <span className="text-[10px] text-white truncate">
                          {lead.location || lead.companyLocation || "N/A"}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{lead.location || lead.companyLocation || "No location specified"}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) {
            resetScheduleForm();
            setMicrosoftConnected(null);
            setMicrosoftStatusMessage(null);
            setMicrosoftStatusError(null);
            setCheckingMicrosoft(false);
          }
        }}
      >
        <DialogContent className="max-w-lg bg-[#0b0f20] text-white border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xs sm:text-sm font-semibold">Schedule Meeting</DialogTitle>
            <DialogDescription className="text-xs text-white/70">
              Create a Microsoft Calendar event with {lead.name || "this lead"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide px-1">
            {checkingMicrosoft && (
              <Alert className="bg-white/5 border-white/10 text-white">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <AlertDescription className="text-xs text-white/80">
                  Checking Microsoft Calendar connection...
                </AlertDescription>
              </Alert>
            )}

            {!checkingMicrosoft && microsoftConnected === false && (
              <Alert
                variant="destructive"
                className="border-red-500/40 bg-red-500/10 text-white"
              >
                <AlertTriangle className="h-4 w-4 text-red-300" />
                <div>
                  <AlertTitle className="text-xs font-semibold text-white">
                    Microsoft not connected
                  </AlertTitle>
                  <AlertDescription className="text-xs text-white/80">
                    {microsoftStatusError ||
                      "Connect Microsoft in Settings → Integrations before scheduling a meeting."}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {!checkingMicrosoft &&
              microsoftConnected &&
              microsoftStatusMessage && (
                <Alert className="bg-white/10 border-white/15 text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  <AlertDescription className="text-xs text-white/80">
                    {microsoftStatusMessage}
                  </AlertDescription>
                </Alert>
              )}

            <div className="space-y-2">
              <Label className="text-xs text-white/70">Subject</Label>
              <Input
                value={scheduleForm.subject}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                className="bg-white/5 border-white/10 text-white text-xs"
                placeholder="Meeting subject"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-white/70">Description</Label>
              <Textarea
                value={scheduleForm.body}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    body: e.target.value,
                  }))
                }
                className="bg-white/5 border-white/10 text-white text-xs min-h-[80px]"
                placeholder="Add context or agenda"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-white/70">Location</Label>
              <Input
                value={scheduleForm.location}
                onChange={(e) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                className="bg-white/5 border-white/10 text-white text-xs"
                placeholder="Optional location"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div>
                <p className="text-xs font-medium text-white">Auto find slot</p>
                <p className="text-xs text-white/60">
                  Let Microsoft calendar choose the first available time
                </p>
              </div>
              <Switch
                checked={scheduleForm.findAvailableSlot}
                onCheckedChange={(checked) =>
                  setScheduleForm((prev) => ({
                    ...prev,
                    findAvailableSlot: checked,
                  }))
                }
              />
            </div>

            {!scheduleForm.findAvailableSlot && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs text-white/70">
                    Start date & time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={scheduleForm.startDateTime}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        startDateTime: e.target.value,
                      }))
                    }
                    className="bg-white/5 border-white/10 text-white text-xs [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-white/70">
                    End date & time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={scheduleForm.endDateTime}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        endDateTime: e.target.value,
                      }))
                    }
                    className="bg-white/5 border-white/10 text-white text-xs [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </div>
            )}

            {scheduleForm.findAvailableSlot && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">
                      Start of search window
                    </Label>
                    <Input
                      type="datetime-local"
                      value={scheduleForm.startDate}
                      disabled
                      className="bg-white/10 border-white/10 text-white text-xs cursor-not-allowed opacity-70 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">
                      End of search window
                    </Label>
                    <Input
                      type="datetime-local"
                      value={scheduleForm.endDate}
                      onChange={(e) =>
                        setScheduleForm((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="bg-white/5 border-white/10 text-white text-xs [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                      placeholder="Defaults to end of day"
                      max={maxSearchEndDate}
                    />
                    {isSearchRangeTooLarge && (
                      <p className="text-xs text-red-400">
                        Search window must be less than 62 days from the start
                        date.
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2 pb-4">
                  <Label className="text-xs text-white/70">
                    Meeting duration (minutes)
                  </Label>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    value={scheduleForm.durationMinutes}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        durationMinutes: Number(e.target.value) || 30,
                      }))
                    }
                    className="bg-white/5 border-white/10 text-white text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-white/70 hover:text-white"
              onClick={() => {
                setScheduleDialogOpen(false);
                resetScheduleForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-white text-[#0b0f20] hover:bg-white/90"
              disabled={
                schedulingMeeting ||
                checkingMicrosoft ||
                microsoftConnected === false ||
                (scheduleForm.findAvailableSlot && isSearchRangeTooLarge)
              }
              onClick={handleScheduleMeeting}
            >
              {schedulingMeeting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Schedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LeadDetailCard;
