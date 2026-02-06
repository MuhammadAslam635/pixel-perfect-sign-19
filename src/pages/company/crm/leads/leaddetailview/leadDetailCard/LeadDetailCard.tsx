import { FC, useEffect, useMemo, useState } from "react";
import { Lead, leadsService } from "@/services/leads.service";
import { companiesService } from "@/services/companies.service";
import { calendarService } from "@/services/calendar.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/hooks/usePermissions";
import { convertLeadTimeToUserTime, convertTimezoneLocalToUTC, formatDateTimeLocalInTimezone, getCurrentTimeInTimezone, getDefaultSearchEndInTimezone, getTimezoneAbbreviation, getTimezoneOffset } from "@/utils/commonFunctions";
import { LeadScheduleMeetingDialog } from "./components/LeadScheduleMeetingDialog";
import LeadInformation from "./components/LeadInformation";

type ScheduleMeetingForm = {
  subject: string;
  body: string;
  location: string;
  findAvailableSlot: boolean;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  recallBotIncluded: boolean;
};

type LeadDetailCardProps = {
  lead: Lead;
};
const MAX_SEARCH_RANGE_MS = 62 * 24 * 60 * 60 * 1000;

const LeadDetailCard: FC<LeadDetailCardProps> = ({ lead }) => {
  const queryClient = useQueryClient();
  const { canEdit } = usePermissions();
  const [fillingData, setFillingData] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulingMeeting, setSchedulingMeeting] = useState(false);
  const [checkingMicrosoft, setCheckingMicrosoft] = useState(false);
  const [microsoftConnected, setMicrosoftConnected] = useState<boolean | null>(null);
  const [microsoftStatusMessage, setMicrosoftStatusMessage] = useState<string | null>(null);
  const [microsoftStatusError, setMicrosoftStatusError] = useState<string | null>(null);
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
  const avatarSrc = lead.pictureUrl;

  const createInitialScheduleForm = useMemo<() => ScheduleMeetingForm>(() => {
    return () => {
      const now = new Date();
      const targetTimezone = lead?.timezone || '';
      return {
        subject: lead?.name ? `Meeting with ${lead.name}` : "Meeting",
        body: "",
        location: "",
        findAvailableSlot: true, // Always use automatic scheduling
        startDate: formatDateTimeLocalInTimezone(now, targetTimezone),
        endDate: getDefaultSearchEndInTimezone(now, targetTimezone),
        durationMinutes: 30,
        recallBotIncluded: true,
      };
    };
  }, [lead?.name, lead?.timezone]);
  const [scheduleForm, setScheduleForm] = useState<ScheduleMeetingForm>(createInitialScheduleForm);
  const resetScheduleForm = () => {
    setScheduleForm(createInitialScheduleForm());
  };

  const isSearchRangeTooLarge = useMemo(() => {
    if (!scheduleForm.findAvailableSlot || !scheduleForm.startDate || !scheduleForm.endDate) {
      return false;
    }
    const start = new Date(scheduleForm.startDate);
    const end = new Date(scheduleForm.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false;
    }
    return end.getTime() - start.getTime() > MAX_SEARCH_RANGE_MS;
  }, [scheduleForm.findAvailableSlot, scheduleForm.startDate, scheduleForm.endDate]);

  const maxSearchEndDate = useMemo(() => {
    if (!scheduleForm.startDate) {
      return undefined;
    }
    const start = new Date(scheduleForm.startDate);
    if (Number.isNaN(start.getTime())) {
      return undefined;
    }
    const max = new Date(start.getTime() + MAX_SEARCH_RANGE_MS);
    return formatDateTimeLocalInTimezone(max, lead?.timezone || '');
  }, [scheduleForm.startDate, lead?.timezone]);

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
    calendarService.getMicrosoftConnectionStatus()
      .then((response) => {
        if (!isActive) {
          return;
        }
        const connected = Boolean(response?.connected);
        setMicrosoftConnected(connected);
        if (connected) {
          const note = response?.data?.providerUserEmail ? `Connected as ${response.data.providerUserEmail}` : "Microsoft Calendar is connected.";
          setMicrosoftStatusMessage(note);
          setMicrosoftStatusError(null);
        } else {
          setMicrosoftStatusMessage(null);
          setMicrosoftStatusError("Microsoft Calendar is not connected. Connect it from Settings → Integrations.");
        }
      })
      .catch((error: any) => {
        if (!isActive) {
          return;
        }
        const message = error?.response?.data?.message || "Unable to verify Microsoft connection. Please try again.";
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
        const fieldsUpdated = response?.data?.fieldsUpdated || [];
        const phoneRevealPending = response?.data?.phoneRevealPending || false;

        if (fieldsUpdated.length > 0) {
          // Format field names for display
          const fieldLabels: Record<string, string> = {
            email: "Email",
            phone: "Phone",
            position: "Position",
            linkedinUrl: "LinkedIn URL",
            location: "Location",
            pictureUrl: "Profile Picture",
            description: "Description",
            companyName: "Company Name",
            companyLocation: "Company Location",
          };

          const updatedFieldsList = fieldsUpdated.map((field: string) => fieldLabels[field] || field).join(", ");
          let toastMessage = `Successfully updated: ${updatedFieldsList}`;
          if (phoneRevealPending) {
            toastMessage += ". Phone number will be updated shortly.";
          }
          toast.success(toastMessage);
        } else {
          if (phoneRevealPending) {
            toast.info("Phone number is being revealed and will be updated shortly.");
          } else {
            toast.info("No new data found. All available information is already up to date.");
          }
        }

        // Invalidate and refetch lead data
        await queryClient.invalidateQueries({ queryKey: ["lead", lead._id] });
      } else {
        toast.error(response?.message || "Failed to enrich lead");
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Unable to fill missing information";
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
      // Build update payload - use null instead of undefined to allow clearing fields
      // null values will be sent in JSON, allowing backend to clear the fields
      const updatePayload: Partial<Lead> = {
        phone: editData.phone.trim() || null,
        whatsapp: editData.whatsapp.trim() || null,
        email: editData.email.trim() || null,
        linkedinUrl: cleanedLinkedinUrl || null,
        location: editData.location.trim() || null,
        position: editData.position.trim() || null,
        language: editData.language.trim() || null,
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
      toast.error(microsoftStatusError || "Microsoft Calendar is not connected. Connect it in Settings before scheduling.");
      return;
    }

    if (scheduleForm.findAvailableSlot && isSearchRangeTooLarge) {
      toast.error("Search window must be less than 62 days from the start date.");
      return;
    }

    if (!scheduleForm.startDate) {
      toast.error("Start search date is required");
      return;
    }

    // Use lead's timezone if available, otherwise fall back to user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const schedulingTimezone = lead.timezone || userTimezone;
    // Convert datetime-local strings from lead's timezone to proper UTC Date objects
    // This fixes the bug where new Date() would interpret the string as user's local timezone
    const autoModeStart = scheduleForm.startDate ? convertTimezoneLocalToUTC(scheduleForm.startDate, schedulingTimezone) : new Date();

    let autoModeEnd: Date | undefined;
    if (scheduleForm.findAvailableSlot) {
      if (scheduleForm.endDate) {
        autoModeEnd = convertTimezoneLocalToUTC(scheduleForm.endDate, schedulingTimezone);
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
      findAvailableSlot: true, // Always use automatic scheduling
      durationMinutes: scheduleForm.durationMinutes,
      timezone: schedulingTimezone, // Send lead's timezone (or user's if lead has none)
      startDate: autoModeStart.toISOString(),
      endDate: autoModeEnd.toISOString(),
      recallBotIncluded: scheduleForm.recallBotIncluded,
    };
    setSchedulingMeeting(true);
    try {
      const response = await calendarService.scheduleMeeting(payload);
      // Check if the meeting was successfully saved to database
      if (response.success) {
        if (response.data?.leadMeetingId) {
          // Full success - meeting saved to both Microsoft Calendar and database
          const leadTimezone = response.data?.timezone || schedulingTimezone;
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const timezoneAbbrev = userTimezone !== "UTC"
            ? ` (${getTimezoneAbbreviation(userTimezone)})`
            : "";

          // Format meeting date and time
          let meetingDateTime = "";
          if (response.data?.startTime) {
            try {
              // Microsoft Calendar API returns start/end as objects with dateTime property
              const startTimeObj = response.data.startTime as any;
              const endTimeObj = response.data.endTime as any;

              // Microsoft API returns dateTime in lead's timezone, but as ISO strings without timezone suffix
              // We need to treat these as local times in the lead's timezone
              const startTimeStr = startTimeObj?.dateTime || String(startTimeObj);
              const endTimeStr = endTimeObj?.dateTime || String(endTimeObj);

              console.log('Meeting time debugging:', {
                startTimeObj,
                endTimeObj,
                startTimeStr,
                endTimeStr,
                leadTimezone,
                userTimezone
              });

              // The dateTime from Microsoft API represents time in the lead's timezone
              // We need to convert this to the correct UTC time, then to user's timezone

              // Create Date objects from the ISO strings - JavaScript interprets these as UTC
              const startDateUtc = new Date(startTimeStr);
              const endDateUtc = endTimeStr ? new Date(endTimeStr) : null;

              // But these represent times in lead's timezone, not UTC
              // So we need to convert: lead time -> UTC -> user timezone

              // Get the offset between lead timezone and UTC
              const leadOffsetMinutes = getTimezoneOffset(leadTimezone, startDateUtc);

              // The startDateUtc currently represents "lead time interpreted as UTC"
              // To get the correct UTC time, we need to subtract the lead's timezone offset
              const startDate = new Date(startDateUtc.getTime() - (leadOffsetMinutes * 60 * 1000));
              const endDate = endDateUtc ? new Date(endDateUtc.getTime() - (leadOffsetMinutes * 60 * 1000)) : null;
              console.log('Date objects:', {
                startDateUtc: startDateUtc.toISOString(),
                endDateUtc: endDateUtc?.toISOString(),
                startDate: startDate.toISOString(),
                endDate: endDate?.toISOString(),
                startDateLocal: startDate.toString(),
                endDateLocal: endDate?.toString(),
                leadOffsetMinutes
              });

              // Format in user's timezone
              const timeFormatter = new Intl.DateTimeFormat('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: userTimezone
              });

              meetingDateTime = `${timeFormatter.format(startDate)}`;
              if (endDate) {
                const endTimeFormatted = new Intl.DateTimeFormat('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: userTimezone
                }).format(endDate);
                meetingDateTime += ` - ${endTimeFormatted}`;
              }

              console.log('Final formatted time:', {
                meetingDateTime,
                userTimezone,
                timezoneAbbrev
              });
            } catch (error) {
              console.error('Error formatting meeting time:', error);
            }
          }

          // Create simple toast message with just the meeting time
          const toastMessage = meetingDateTime ? `Meeting scheduled for ${meetingDateTime}${timezoneAbbrev}` : "Meeting scheduled successfully";
          toast.success(toastMessage);
          setScheduleDialogOpen(false);
          resetScheduleForm();
          await Promise.all([
            // Invalidate lead query to refresh stage (appointment_booked)
            queryClient.invalidateQueries({
              queryKey: ["lead", lead._id],
            }),
            // Invalidate lead summary query
            queryClient.invalidateQueries({
              queryKey: ["lead-summary", lead._id],
            }),
            // Invalidate all meetings query (for stage detection)
            queryClient.invalidateQueries({
              queryKey: ["lead-all-meetings", lead._id],
            }),
            // Invalidate calendar month meetings query (for calendar view)
            queryClient.invalidateQueries({
              queryKey: ["lead-calendar-meetings", lead._id],
            }),
            // Immediately refetch notifications to show meeting creation notification
            queryClient.refetchQueries({
              queryKey: ["notifications"],
            }),
            queryClient.invalidateQueries({
              queryKey: ["calendar-available-slots"],
            }),
          ]);
        } else {
          // Partial success - meeting in Microsoft Calendar but not in database
          toast.warning(
            "Meeting created in Microsoft Calendar but could not be saved locally. " +
            "The meeting exists in your calendar but may not appear in the app. " +
            "Please refresh or contact support if the meeting doesn't appear."
          );
          // Still close dialog and reset form, but don't invalidate queries
          // since the meeting isn't in the database
          setScheduleDialogOpen(false);
          resetScheduleForm();
        }
      } else {
        // Full failure
        toast.error(response.message || "Failed to schedule meeting");
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to schedule meeting";
      toast.error(message);
    } finally {
      setSchedulingMeeting(false);
    }
  };

  return (
    <>
      <LeadInformation
        lead={lead}
        avatarSrc={avatarSrc}
        isEditing={isEditing}
        isSaving={isSaving}
        fillingData={fillingData}
        editData={editData}
        setEditData={setEditData}
        canEdit={canEdit}
        handleEdit={handleEdit}
        handleSave={handleSave}
        handleCancel={handleCancel}
        handleFillPersonData={handleFillPersonData}
        handlePhoneClick={handlePhoneClick}
        handleWhatsAppClick={handleWhatsAppClick}
        handleEmailClick={handleEmailClick}
        handleLinkedinClick={handleLinkedinClick}
        resetScheduleForm={resetScheduleForm}
        setScheduleDialogOpen={setScheduleDialogOpen}
      />

      <LeadScheduleMeetingDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        lead={lead}
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        schedulingMeeting={schedulingMeeting}
        checkingMicrosoft={checkingMicrosoft}
        microsoftConnected={microsoftConnected}
        microsoftStatusMessage={microsoftStatusMessage}
        microsoftStatusError={microsoftStatusError}
        isSearchRangeTooLarge={isSearchRangeTooLarge}
        maxSearchEndDate={maxSearchEndDate}
        onScheduleMeeting={handleScheduleMeeting}
        onReset={resetScheduleForm}
        getTimezoneAbbreviation={getTimezoneAbbreviation}
        getCurrentTimeInTimezone={getCurrentTimeInTimezone}
        convertLeadTimeToUserTime={convertLeadTimeToUserTime}
      />
    </>
  );
};

export default LeadDetailCard;