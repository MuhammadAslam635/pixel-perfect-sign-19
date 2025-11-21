import { FC, useMemo, useState } from "react";
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
  Sparkles,
  Loader2,
  CalendarPlus,
} from "lucide-react";
import { companiesService } from "@/services/companies.service";
import { calendarService } from "@/services/calendar.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

const LeadDetailCard: FC<LeadDetailCardProps> = ({ lead }) => {
  const [fillingData, setFillingData] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  const avatarLetter = lead.name?.charAt(0).toUpperCase() || "?";
  const avatarSrc = lead.pictureUrl;

  const formatDateTimeLocal = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

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

  const handleScheduleMeeting = async () => {
    if (!lead._id) {
      toast.error("Missing lead identifier");
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
        response?.message || "Meeting scheduled successfully in Microsoft Calendar"
      );
      setScheduleDialogOpen(false);
      resetScheduleForm();
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
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={handleFillPersonData}
              disabled={fillingData || !lead._id || !lead.companyId}
              className={`mt-3 inline-flex items-center justify-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold transition-colors ${
                fillingData
                  ? "bg-white/15 border-white/20 text-white cursor-wait"
                  : "bg-white/5 border-white/15 text-white hover:bg-white/15"
              }`}
            >
              {fillingData ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Filling...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Fill Missing Info
                </>
              )}
            </button>
            <Button
              disabled={!lead._id}
              onClick={() => {
                resetScheduleForm();
                setScheduleDialogOpen(true);
              }}
              className="w-full justify-center text-[10px] h-8 bg-white/15 hover:bg-white/25 text-white border border-white/20"
            >
              <CalendarPlus className="w-3 h-3 mr-1" />
              Schedule Meeting
            </Button>
          </div>
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

      <Dialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) {
            resetScheduleForm();
          }
        }}
      >
        <DialogContent className="max-w-lg bg-[#0b0f20] text-white border border-white/10">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription className="text-white/70">
              Create a Microsoft Calendar event with {lead.name || "this lead"}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
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
                className="bg-white/5 border-white/10 text-white text-sm"
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
                className="bg-white/5 border-white/10 text-white text-sm min-h-[80px]"
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
                className="bg-white/5 border-white/10 text-white text-sm"
                placeholder="Optional location or meeting link"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-white">Auto find slot</p>
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
                    className="bg-white/5 border-white/10 text-white text-sm"
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
                    className="bg-white/5 border-white/10 text-white text-sm"
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
                      className="bg-white/10 border-white/10 text-white text-sm cursor-not-allowed opacity-70"
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
                      className="bg-white/5 border-white/10 text-white text-sm"
                      placeholder="Defaults to end of day"
                    />
                  </div>
                </div>
                <div className="space-y-2">
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
                    className="bg-white/5 border-white/10 text-white text-sm"
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
              disabled={schedulingMeeting}
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
