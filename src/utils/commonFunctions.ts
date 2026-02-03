import { feedbackService } from "@/services/feedback.service";
import { isAxiosError } from "axios";
import { format } from "date-fns";
import { toast } from "sonner";

// clear markdown function 
export const cleanMarkdown = (text: string): string => {
    if (!text) return text;
    let cleaned = text;
    // Remove ALL types of headers (##, ###, ####, etc.)
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    // Remove headers in middle of text too
    cleaned = cleaned.replace(/\n#{1,6}\s+/g, '\n');
    // Remove bold markdown (**text** or __text__)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
    cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
    // Remove italic markdown (*text* or _text_)
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
    cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
    // Remove code markdown (`code`)
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
    // Remove strikethrough (~~text~~)
    cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');
    // Remove links but keep text [text](url) -> text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // Remove images ![alt](url)
    cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
    // Remove horizontal rules (---, ***, ___)
    cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, '');
    // Remove blockquote markers (>)
    cleaned = cleaned.replace(/^>\s+/gm, '');
    // Remove list markers (-, *, +, 1., 2., etc.)
    cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
    cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');
    // Clean up extra whitespace and newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();
    return cleaned;
};

// format file sizes function 
export const formatFileSize = (bytes?: number): string => {
    if (bytes === undefined || bytes === null) return "Unknown size";
    if (bytes < 0) return "Invalid size";
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    const size = bytes / Math.pow(k, i);

    // 2 decimal max, but remove trailing zeros
    const formatted = size.toFixed(2).replace(/\.?0+$/, "");

    return `${formatted} ${units[i]}`;
};


// download attachment function 
export const handleDownloadAttachment = async (fileUrl: string, fileName: string) => {
    const toastId = toast.loading("Downloading attachment...");
    try {
        const blob = await feedbackService.downloadAttachment(fileUrl);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.dismiss(toastId);
        toast.success("Download started");
    } catch (error) {
        console.error("Download failed:", error);
        toast.dismiss(toastId);
        toast.error("Failed to download attachment. Please try again.");
    }
};

// check if a date is today
export const isCreatedToday = (createdAt: string | Date) => {
    const today = new Date();
    const created = new Date(createdAt);

    return (
        created.getDate() === today.getDate() &&
        created.getMonth() === today.getMonth() &&
        created.getFullYear() === today.getFullYear()
    );
};

// Helper function to format URL and create clickable link
export const formatWebsiteUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    // Remove protocol and www for display
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
};

// Helper function to get full URL with protocol
export const getFullUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    // Add protocol if missing
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return `https://${url}`;
    }
    return url;
};

// Helper function to generate Google Maps URL
export const getGoogleMapsUrl = (address: string | null | undefined): string => {
    if (!address) return "";
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
};

// Helper function to generate Google Maps embed URL
export const getGoogleMapsEmbedUrl = (
    address: string | null | undefined
): string | null => {
    if (!address) return null;
    const encodedAddress = encodeURIComponent(address);
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
        return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}`;
    }
    // Fallback: Use Google Maps search embed URL (works without API key for basic usage)
    return `https://www.google.com/maps?q=${encodedAddress}&output=embed&hl=en`;
};


// Helper function to format large financial numbers
export const formatFinancialValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return value.toString();

    // If it's already a formatted string like "39.0B", just return it
    if (typeof value === "string" && /[KMBT]$/i.test(value)) return value;

    if (num >= 1e12) return (num / 1e12).toFixed(1) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toString();
};

// Helper function to get timezone abbreviation
export const getTimezoneAbbreviation = (timezone: string): string => {
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
export const convertLeadTimeToUserTime = (datetimeLocal: string, leadTimezone: string): string => {
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
export const getCurrentTimeInTimezone = (timezone: string): string => {
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
export const getEffectiveTimezone = (timezone: string | undefined | null): string => {
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
export const formatDateTimeLocalInTimezone = (date: Date, timezone: string): string => {
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
export const getDefaultSearchEndInTimezone = (date: Date, timezone: string): string => {
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
export const convertTimezoneLocalToUTC = (datetimeLocal: string, sourceTimezone: string): Date => {
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

// Helper function to get timezone offset in minutes for a given timezone and date
export const getTimezoneOffset = (timezone: string, date: Date): number => {
    try {
        // Get the timezone offset by comparing local time vs UTC time for the same moment
        // If we have a date representing 12:00 UTC, and we format it in the target timezone,
        // the difference tells us the offset
        const utcTime = date.getTime();
        const tzTime = new Date(date.toLocaleString('en-US', { timeZone: timezone })).getTime();
        return (tzTime - utcTime) / (1000 * 60);
    } catch {
        return 0;
    }
};

// Converts start/end datetime strings to human-readable local time range
export const formatDateTimeRange = (start?: string, end?: string) => {
    if (!start || !end) {
        return "Time not available";
    }
    // Parse dates - new Date() automatically converts UTC to local timezone
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return "Time not available";
    }

    // Use toLocaleString to ensure we're displaying in user's local timezone
    const sameDay =
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth() &&
        startDate.getDate() === endDate.getDate();

    if (sameDay) {
        // Format in user's local timezone
        const dateStr = startDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
        const startTime = startDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
        const endTime = endDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
        return `${dateStr} · ${startTime} – ${endTime}`;
    }

    // Different days
    const startDateStr = startDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
    const startTimeStr = startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    const endDateStr = endDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
    const endTimeStr = endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    return `${startDateStr} · ${startTimeStr} → ${endDateStr} · ${endTimeStr}`;
};


export const resolveErrorMessage = (error: unknown) => {
    if (!error) {
        return null;
    }
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return null;
};


export const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};


export const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const sundayFirstIndex = firstDay.getDay(); // 0 (Sun) -> 6 (Sat)
    return (sundayFirstIndex + 6) % 7; // convert to Monday-first index
};


export const formatDateTimeRanges = (start?: string, end?: string, timezone?: string) => {
    if (!start || !end) {
        return "Time not available";
    }
    try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return "Invalid date";
        }
        const startFormatted = format(startDate, "MMM d, h:mm a");
        const endFormatted = format(endDate, "h:mm a");

        let timeRange = `${startFormatted} - ${endFormatted}`;
        if (timezone && timezone !== "UTC") {
            // Extract timezone name (e.g., "America/New_York" -> "ET")
            const tzAbbrev = getTimezoneAbbreviation(timezone);
            timeRange += ` ${tzAbbrev}`;
        }
        return timeRange;
    } catch {
        return "Invalid date";
    }
};

// Get array of month names (short format)
export const getMonthNames = (): string[] => {
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
};


export const getErrorMessage = (error: unknown, fallback: string) => {
    if (isAxiosError<{ message?: string }>(error)) {
        return error.response?.data?.message ?? error.message ?? fallback;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
};


export const formatTimeWithAMPM = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export const getStatusBadgeStyle = (status: string) => {
    switch (status) {
        case "Scheduled": return "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-transparent";
        case "In Progress": return "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-transparent";
        case "Completed": return "bg-blue-500/20 text-blue-400 border-blue-500/40 hover:bg-transparent";
        default: return "bg-white/10 text-white/60 border-white/20 hover:bg-transparent";
    }
};

type FormatDateOptions = {
    month?: "short" | "long";
    showSeconds?: boolean;
};
export const formatDate = (
    dateString: string | null,
    options: FormatDateOptions = {}
) => {
    if (!dateString) return "N/A";

    const { month = "short", showSeconds = false } = options;

    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month,
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        ...(showSeconds && { second: "2-digit" }),
    });
};
export const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
};

export const getStatusColor = (status: string) => {
    switch (status) {
        case "Completed": return "bg-green-100 text-green-800 hover:bg-green-200";
        case "Active": return "bg-blue-100 text-blue-800 hover:bg-blue-200";
        case "Idle Timeout": return "bg-gradient-to-r from-[#30cfd0] via-[#2a9cb3] to-[#1f6f86] text-white hover:from-[#25b8ba] hover:via-[#1f8ba0] hover:to-[#1a5f72]";
        case "Disconnected": return "bg-red-100 text-red-800 hover:bg-red-200";
        default: return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
};
export const getStatusColorClientDetails = (status: string) => {
    switch (status) {
        case "Completed":
            return "bg-green-100 text-green-800 hover:bg-green-200";
        case "Active":
            return "bg-blue-100 text-blue-800 hover:bg-blue-200";
        case "Idle Timeout":
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
        case "Disconnected":
            return "bg-red-100 text-red-800 hover:bg-red-200";
        default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
};
// Helper function to format large numbers
export const formatNumber = (num: number): string => {
    if (!num || num === 0) return "0";
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toFixed(0);
};

export const getDaysFromSelection = (selection: string): number => {
    switch (selection) {
        case "last-7-days":
            return 7;
        case "last-week":
            return 7;
        case "last-month":
            return 30;
        case "last-3-months":
            return 90;
        case "last-year":
            return 365;
        default:
            return 7;
    }
};

export const formatedDate = (value?: string) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
};