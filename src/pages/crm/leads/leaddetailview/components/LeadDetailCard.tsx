import { FC, useEffect, useMemo, useState } from "react";
import { Lead, leadsService } from "@/services/leads.service";

// Helper function to get timezone abbreviation
const getTimezoneAbbreviation = (timezone: string): string => {
  try {
    // Create a date and format it with the timezone to get abbreviation
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(part => part.type === 'timeZoneName');
    return tzPart ? tzPart.value : timezone;
  } catch {
    // Fallback to original timezone string if abbreviation fails
    return timezone;
  }
};

/**
 * Converts a datetime-local value from lead's timezone to user's timezone for display
 * @param datetimeLocal - The datetime-local string (YYYY-MM-DDTHH:mm) representing time in lead's timezone
 * @param leadTimezone - The lead's timezone (source timezone)
 * @returns Formatted time string in the user's local timezone
 */
const convertLeadTimeToUserTime = (datetimeLocal: string, leadTimezone: string): string => {
  if (!datetimeLocal || !leadTimezone) return '';

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (userTimezone === leadTimezone) return '';

  try {
    // Parse datetime-local components (YYYY-MM-DDTHH:mm)
    const [datePart, timePart] = datetimeLocal.split('T');
    if (!datePart || !timePart) return '';

    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    // Create a Date object - JavaScript interprets this as user's local time
    const localInterpretedDate = new Date(year, month - 1, day, hour, minute);

    // Format this date in the lead's timezone to see what wall time it shows there
    const leadFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: leadTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const leadParts = leadFormatter.formatToParts(localInterpretedDate);
    const getLead = (type: string) => Number(leadParts.find(p => p.type === type)?.value || 0);

    // Calculate the offset needed to adjust the date
    // We want lead timezone to show: day hour:minute
    // It currently shows: getLead('day') getLead('hour'):getLead('minute')
    const targetMinutesOfDay = hour * 60 + minute;
    const leadMinutesOfDay = getLead('hour') * 60 + getLead('minute');
    const dayDiff = day - getLead('day');

    // Total minutes difference
    const totalMinutesDiff = (dayDiff * 24 * 60) + (targetMinutesOfDay - leadMinutesOfDay);

    // Adjust the date to get the correct UTC instant
    const correctedDate = new Date(localInterpretedDate.getTime() + totalMinutesDiff * 60 * 1000);

    // Format in user's timezone
    const userFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'short',
      day: 'numeric',
    });

    return userFormatter.format(correctedDate);
  } catch {
    return '';
  }
};

// Helper function to get current time in a specific timezone
const getCurrentTimeInTimezone = (timezone: string): string => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return formatter.format(now);
  } catch {
    return '';
  }
};

// Helper to validate and get effective timezone
const getEffectiveTimezone = (timezone: string | undefined | null): string => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!timezone || timezone.trim() === '') {
    return userTimezone;
  }
  // Validate the timezone by trying to use it
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return timezone;
  } catch {
    return userTimezone;
  }
};

// Helper function to format a date for datetime-local input in a specific timezone
const formatDateTimeLocalInTimezone = (date: Date, timezone: string): string => {
  const effectiveTimezone = getEffectiveTimezone(timezone);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: effectiveTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
};

// Helper function to get the end of the search window (11:59 PM of lead's current day) in a specific timezone
const getDefaultSearchEndInTimezone = (date: Date, timezone: string): string => {
  const effectiveTimezone = getEffectiveTimezone(timezone);
  // Use the same day (current day in lead's timezone), ending at 11:59 PM
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: effectiveTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')}T23:59`;
};

/**
 * Converts a datetime-local string from a source timezone to a UTC Date object.
 * This is needed because new Date() interprets datetime-local strings as the user's local timezone,
 * but we need to interpret them as the lead's timezone.
 *
 * @param datetimeLocal - The datetime-local string (YYYY-MM-DDTHH:mm) in the source timezone
 * @param sourceTimezone - The timezone the datetime-local string represents
 * @returns A Date object representing the correct UTC instant
 */
const convertTimezoneLocalToUTC = (datetimeLocal: string, sourceTimezone: string): Date => {
  if (!datetimeLocal) return new Date();

  const effectiveTimezone = getEffectiveTimezone(sourceTimezone);

  // Parse the datetime-local components
  const [datePart, timePart] = datetimeLocal.split('T');
  if (!datePart || !timePart) return new Date();

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  // Create a date interpreted as user's local time (this is what new Date() does)
  const localInterpretedDate = new Date(year, month - 1, day, hour, minute);

  // Format this date in the SOURCE timezone to see what wall time it shows there
  const sourceFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: effectiveTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const sourceParts = sourceFormatter.formatToParts(localInterpretedDate);
  const getSource = (type: string) => Number(sourceParts.find(p => p.type === type)?.value || 0);

  // Calculate the offset needed to adjust the date
  // We want source timezone to show: year-month-day hour:minute
  // It currently shows: getSource values
  const targetMinutesOfDay = hour * 60 + minute;
  const sourceMinutesOfDay = getSource('hour') * 60 + getSource('minute');

  // Handle day difference (can happen around midnight with large timezone offsets)
  const targetDay = day;
  const sourceDay = getSource('day');
  const dayDiff = targetDay - sourceDay;

  // Total minutes difference
  const totalMinutesDiff = (dayDiff * 24 * 60) + (targetMinutesOfDay - sourceMinutesOfDay);

  // Adjust the date to get the correct UTC instant
  return new Date(localInterpretedDate.getTime() + totalMinutesDiff * 60 * 1000);
};

/**
 * Converts a datetime-local string from user's browser timezone to lead's timezone.
 * The datetime-local input always captures user's local time, but we need to send
 * the time as it should appear in lead's timezone.
 *
 * @param userLocalDatetime - The datetime-local string (YYYY-MM-DDTHH:mm) in user's browser timezone
 * @param targetTimezone - The lead's timezone to convert to
 * @returns A datetime-local string representing the same instant in lead's timezone
 */
const convertUserLocalToLeadTimezone = (userLocalDatetime: string, targetTimezone: string): string => {
  if (!userLocalDatetime) return '';

  const effectiveTimezone = getEffectiveTimezone(targetTimezone);
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // If same timezone, no conversion needed
  if (effectiveTimezone === userTimezone) {
    return userLocalDatetime;
  }

  // Parse the datetime-local and interpret as user's local time
  const [datePart, timePart] = userLocalDatetime.split('T');
  if (!datePart || !timePart) return userLocalDatetime;

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  // Create Date object (interprets as user's local time, gives us UTC internally)
  const userLocalDate = new Date(year, month - 1, day, hour, minute);

  // Format this UTC instant in lead's timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: effectiveTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(userLocalDate);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '00';

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
};
import { AvatarFallback } from "@/components/ui/avatar-fallback";
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
  Clock,
  CheckCircle,
  Globe,
} from "lucide-react";
import { CompanyLogoFallback } from "@/components/ui/company-logo-fallback";
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
      // Use lead's timezone - helper functions will validate and fallback if needed
      const targetTimezone = lead?.timezone || '';

      return {
        subject: lead?.name ? `Meeting with ${lead.name}` : "Meeting",
        body: "",
        location: "",
        findAvailableSlot: true,
        startDateTime: "",
        endDateTime: "",
        startDate: formatDateTimeLocalInTimezone(now, targetTimezone),
        endDate: getDefaultSearchEndInTimezone(now, targetTimezone),
        durationMinutes: 30,
      };
    };
  }, [lead?.name, lead?.timezone]);

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
    // Use lead's timezone - helper function will validate and fallback if needed
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
          
          const updatedFieldsList = fieldsUpdated
            .map((field: string) => fieldLabels[field] || field)
            .join(", ");
          
          let toastMessage = `Successfully updated: ${updatedFieldsList}`;
          
          if (phoneRevealPending) {
            toastMessage += ". Phone number will be updated shortly.";
          }
          
          toast.success(toastMessage);
        } else {
          if (phoneRevealPending) {
            toast.info(
              "Phone number is being revealed and will be updated shortly."
            );
          } else {
            toast.info(
              "No new data found. All available information is already up to date."
            );
          }
        }
        
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

    // Use lead's timezone if available, otherwise fall back to user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const schedulingTimezone = lead.timezone || userTimezone;

    // Convert datetime-local strings from lead's timezone to proper UTC Date objects
    // This fixes the bug where new Date() would interpret the string as user's local timezone
    const autoModeStart = scheduleForm.startDate
      ? convertTimezoneLocalToUTC(scheduleForm.startDate, schedulingTimezone)
      : new Date();

    let autoModeEnd: Date | undefined;
    if (scheduleForm.findAvailableSlot) {
      if (scheduleForm.endDate) {
        autoModeEnd = convertTimezoneLocalToUTC(scheduleForm.endDate, schedulingTimezone);
      } else {
        autoModeEnd = new Date(autoModeStart);
        autoModeEnd.setHours(23, 59, 59, 999);
      }
    }

    // For manual mode: Send the raw datetime-local value as-is
    // The user enters times in lead's timezone (as indicated by the label),
    // so we send the literal value without conversion
    const rawStartDateTime = scheduleForm.startDateTime?.trim() || '';
    const rawEndDateTime = scheduleForm.endDateTime?.trim() || '';

    const payload = {
      personId: lead._id,
      subject: scheduleForm.subject?.trim() || undefined,
      body: scheduleForm.body?.trim() || undefined,
      location: scheduleForm.location?.trim() || undefined,
      findAvailableSlot: scheduleForm.findAvailableSlot,
      durationMinutes: scheduleForm.findAvailableSlot
        ? scheduleForm.durationMinutes
        : undefined,
      startDateTime: !scheduleForm.findAvailableSlot && rawStartDateTime
        ? rawStartDateTime // Raw value - user entered in lead's timezone
        : undefined,
      endDateTime: !scheduleForm.findAvailableSlot && rawEndDateTime
        ? rawEndDateTime // Raw value - user entered in lead's timezone
        : undefined,
      timezone: schedulingTimezone, // Send lead's timezone (or user's if lead has none)
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
      
      // Check if the meeting was successfully saved to database
      if (response.success) {
        if (response.data?.leadMeetingId) {
          // Full success - meeting saved to both Microsoft Calendar and database
          const usedTimezone = response.data?.timezone || schedulingTimezone;
          const timezoneInfo = usedTimezone && usedTimezone !== "UTC"
            ? ` in ${lead.name?.split(' ')[0] || 'lead'}'s timezone (${getTimezoneAbbreviation(usedTimezone)})`
            : "";
          toast.success(
            `${response?.message || "Meeting scheduled successfully"}${timezoneInfo}`
          );
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
            <AvatarFallback
              name={lead.name}
              pictureUrl={avatarSrc}
              size="lg"
              className="mb-3 border-2 border-white/20"
            />
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
                      <TooltipContent>
                        Fill missing info
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
                      <TooltipContent>
                        Edit details
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
                      <TooltipContent>
                        Schedule meeting
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
                        {lead.isVerifiedEmail && (
                           <Tooltip>
                             <TooltipTrigger asChild>
                                <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                             </TooltipTrigger>
                             <TooltipContent>
                               <p>Verified Email</p>
                             </TooltipContent>
                           </Tooltip>
                        )}
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
              {/* Country */}
              <div className="flex flex-col gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20"
                      >
                        <Globe className="w-3 h-3 text-white/60 flex-shrink-0" />
                        <span className="text-[10px] text-white truncate">
                          {lead.country || "N/A"}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{lead.country || "Country not available"}</p>
                    </TooltipContent>
                  </Tooltip>
              </div>

              {/* Timezone */}
              <div className="flex flex-col gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors bg-[#1a1a1a] border border-white/10 hover:bg-white/20"
                      >
                        <Clock className="w-3 h-3 text-white/60 flex-shrink-0" />
                        <span className="text-[10px] text-white truncate">
                          {lead.timezone || "N/A"}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{lead.timezone || "Timezone not available"}</p>
                    </TooltipContent>
                  </Tooltip>
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

          {/* Departments */}
          {lead.departments && lead.departments.length > 0 && (
            <div className="mt-4">
               <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">Departments</h3>
               <div className="flex flex-col gap-1.5">
                  {lead.departments.map((dept: string, index: number) => (
                    <div key={index} className="w-full px-2 py-1 rounded-lg bg-[#1a1a1a] border border-white/10 text-[10px] text-white/80 truncate">
                       {dept.replace(/_/g, ' ')}
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Employment History Section */}
          {lead.employmentHistory && lead.employmentHistory.length > 0 && (
             <div className="mt-4">
                <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">Experience</h3>
                <div className="space-y-2">
                   {lead.employmentHistory.map((job) => {
                      const isCurrentCompany = 
                        (lead.company?.name && job.organizationName?.toLowerCase() === lead.company.name.toLowerCase()) ||
                        (lead.companyName && job.organizationName?.toLowerCase() === lead.companyName.toLowerCase());
                      
                      const logoUrl = isCurrentCompany ? lead.company?.logo : undefined;

                      return (
                      <div key={job._id || job.title} className="flex gap-3 items-start p-2 rounded-lg bg-[#1a1a1a] border border-white/5">
                         <div className="flex-shrink-0 mt-0.5">
                            <CompanyLogoFallback
                               name={job.organizationName}
                               logo={logoUrl}
                               size="sm"
                               className="rounded"
                            />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-semibold text-white truncate">{job.title}</h4>
                            <p className="text-[10px] text-white/70 truncate">{job.organizationName}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                               {job.current ? (
                                  <span className="text-[9px] text-emerald-400 font-medium">Present</span>
                               ) : (
                                  <span className="text-[9px] text-white/40">
                                     {job.from ? new Date(job.from).getFullYear() : ''} - {job.to ? new Date(job.to).getFullYear() : 'Present'}
                                  </span>
                               )}
                            </div>
                         </div>
                      </div>
                   ); })}
                </div>
             </div>
          )}
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
        <DialogContent 
        className="max-w-2xl max-h-[90vh] flex flex-col p-0 text-white border border-white/10 overflow-hidden rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.55)]"
        style={{
          background: "#0a0a0a"
        }}
      >
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(173.83deg, rgba(255, 255, 255, 0.08) 4.82%, rgba(255, 255, 255, 0) 38.08%, rgba(255, 255, 255, 0) 56.68%, rgba(255, 255, 255, 0.02) 95.1%)"
          }}
        />
        
        <div className="relative z-10 flex flex-col h-full min-h-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/10">
            <DialogTitle className="text-xs sm:text-sm font-semibold text-white drop-shadow-lg -mb-1">Schedule Meeting</DialogTitle>
            <DialogDescription className="text-xs text-white/70">
              Create a Microsoft Calendar event with {lead.name || "this lead"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 space-y-4 scrollbar-hide py-4 min-h-0">
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

            {/* Timezone Info Banner */}
            {lead.timezone && (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-300 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-blue-200">
                      Scheduling in {lead.name?.split(' ')[0] || 'lead'}'s timezone
                    </p>
                    <p className="text-xs text-blue-200/70 mt-0.5">
                      {lead.timezone} ({getTimezoneAbbreviation(lead.timezone)}) — Currently {getCurrentTimeInTimezone(lead.timezone)}
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      Your time: {Intl.DateTimeFormat().resolvedOptions().timeZone} ({getTimezoneAbbreviation(Intl.DateTimeFormat().resolvedOptions().timeZone)}) — {getCurrentTimeInTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!lead.timezone && (
              <Alert className="bg-amber-500/10 border-amber-500/30 text-white">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                <AlertDescription className="text-xs text-amber-200/80">
                  Lead's timezone is not set. Meeting will be scheduled in your local timezone.
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
                    Start date & time {lead.timezone && `(${getTimezoneAbbreviation(lead.timezone)})`}
                  </Label>
                  <Input
                    type="datetime-local"
                    value={scheduleForm.startDateTime}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      setScheduleForm((prev) => ({
                        ...prev,
                        startDateTime: rawValue,
                      }));
                    }}
                    className="bg-white/5 border-white/10 text-white text-xs [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                  {scheduleForm.startDateTime && lead.timezone && lead.timezone !== Intl.DateTimeFormat().resolvedOptions().timeZone && (
                    <p className="text-[10px] text-white/50">
                      Your time: {convertLeadTimeToUserTime(scheduleForm.startDateTime, lead.timezone || '')} ({getTimezoneAbbreviation(Intl.DateTimeFormat().resolvedOptions().timeZone)})
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-white/70">
                    End date & time {lead.timezone && `(${getTimezoneAbbreviation(lead.timezone)})`}
                  </Label>
                  <Input
                    type="datetime-local"
                    value={scheduleForm.endDateTime}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      setScheduleForm((prev) => ({
                        ...prev,
                        endDateTime: rawValue,
                      }));
                    }}
                    className="bg-white/5 border-white/10 text-white text-xs [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                  {scheduleForm.endDateTime && lead.timezone && lead.timezone !== Intl.DateTimeFormat().resolvedOptions().timeZone && (
                    <p className="text-[10px] text-white/50">
                      Your time: {convertLeadTimeToUserTime(scheduleForm.endDateTime, lead.timezone || '')} ({getTimezoneAbbreviation(Intl.DateTimeFormat().resolvedOptions().timeZone)})
                    </p>
                  )}
                </div>
              </div>
            )}

            {scheduleForm.findAvailableSlot && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">
                      Start of search window {lead.timezone && `(${getTimezoneAbbreviation(lead.timezone)})`}
                    </Label>
                    <Input
                      type="datetime-local"
                      value={scheduleForm.startDate}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, startDate: e.target.value })
                      }
                      className="bg-white/10 border-white/10 text-white text-xs [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                    />
                    {scheduleForm.startDate && lead.timezone && lead.timezone !== Intl.DateTimeFormat().resolvedOptions().timeZone && (
                      <p className="text-[10px] text-white/50">
                        Your time: {convertLeadTimeToUserTime(scheduleForm.startDate, lead.timezone || '')} ({getTimezoneAbbreviation(Intl.DateTimeFormat().resolvedOptions().timeZone)})
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-white/70">
                      End of search window {lead.timezone && `(${getTimezoneAbbreviation(lead.timezone)})`}
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
                    {scheduleForm.endDate && lead.timezone && lead.timezone !== Intl.DateTimeFormat().resolvedOptions().timeZone && !isSearchRangeTooLarge && (
                      <p className="text-[10px] text-white/50">
                        Your time: {convertLeadTimeToUserTime(scheduleForm.endDate, lead.timezone || '')} ({getTimezoneAbbreviation(Intl.DateTimeFormat().resolvedOptions().timeZone)})
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

          <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-white/10 gap-2">
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
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
};

export default LeadDetailCard;
