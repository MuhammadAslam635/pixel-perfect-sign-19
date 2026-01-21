import { DateTime } from "luxon";

/**
 * Format UTC offset as a string (e.g., "UTC+5", "UTC-8")
 */
export const formatUTCOffset = (offsetMinutes: number): string => {
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const minutes = Math.abs(offsetMinutes) % 60;
  const sign = offsetMinutes >= 0 ? "+" : "-";
  
  if (minutes === 0) {
    return `UTC${sign}${hours}`;
  }
  return `UTC${sign}${hours}:${minutes.toString().padStart(2, "0")}`;
};

/**
 * Get UTC offset for a timezone
 */
export const getTimezoneOffset = (timezone: string): number | null => {
  try {
    const dt = DateTime.now().setZone(timezone);
    if (!dt.isValid) {
      return null;
    }
    return dt.offset;
  } catch (error) {
    return null;
  }
};

/**
 * Timezone with offset information
 */
export interface TimezoneOption {
  value: string;
  label: string;
  offset: number | null;
  offsetLabel: string;
}

/**
 * Common IANA timezone identifiers grouped by region
 * Used for timezone selection in user preferences
 */
export const TIMEZONES: TimezoneOption[] = [
  // North America
  { value: "America/New_York", label: "Eastern Time (US & Canada)", offset: null, offsetLabel: "" },
  { value: "America/Chicago", label: "Central Time (US & Canada)", offset: null, offsetLabel: "" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)", offset: null, offsetLabel: "" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)", offset: null, offsetLabel: "" },
  { value: "America/Phoenix", label: "Arizona", offset: null, offsetLabel: "" },
  { value: "America/Anchorage", label: "Alaska", offset: null, offsetLabel: "" },
  { value: "America/Toronto", label: "Toronto", offset: null, offsetLabel: "" },
  { value: "America/Vancouver", label: "Vancouver", offset: null, offsetLabel: "" },
  { value: "America/Mexico_City", label: "Mexico City", offset: null, offsetLabel: "" },

  // South America
  { value: "America/Sao_Paulo", label: "São Paulo", offset: null, offsetLabel: "" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires", offset: null, offsetLabel: "" },
  { value: "America/Bogota", label: "Bogotá", offset: null, offsetLabel: "" },
  { value: "America/Santiago", label: "Santiago", offset: null, offsetLabel: "" },
  { value: "America/Lima", label: "Lima", offset: null, offsetLabel: "" },

  // Europe
  { value: "Europe/London", label: "London", offset: null, offsetLabel: "" },
  { value: "Europe/Paris", label: "Paris", offset: null, offsetLabel: "" },
  { value: "Europe/Berlin", label: "Berlin", offset: null, offsetLabel: "" },
  { value: "Europe/Rome", label: "Rome", offset: null, offsetLabel: "" },
  { value: "Europe/Madrid", label: "Madrid", offset: null, offsetLabel: "" },
  { value: "Europe/Amsterdam", label: "Amsterdam", offset: null, offsetLabel: "" },
  { value: "Europe/Brussels", label: "Brussels", offset: null, offsetLabel: "" },
  { value: "Europe/Vienna", label: "Vienna", offset: null, offsetLabel: "" },
  { value: "Europe/Stockholm", label: "Stockholm", offset: null, offsetLabel: "" },
  { value: "Europe/Zurich", label: "Zurich", offset: null, offsetLabel: "" },
  { value: "Europe/Warsaw", label: "Warsaw", offset: null, offsetLabel: "" },
  { value: "Europe/Moscow", label: "Moscow", offset: null, offsetLabel: "" },
  { value: "Europe/Athens", label: "Athens", offset: null, offsetLabel: "" },
  { value: "Europe/Istanbul", label: "Istanbul", offset: null, offsetLabel: "" },
  { value: "Europe/Dublin", label: "Dublin", offset: null, offsetLabel: "" },
  { value: "Europe/Lisbon", label: "Lisbon", offset: null, offsetLabel: "" },

  // Asia
  { value: "Asia/Dubai", label: "Dubai", offset: null, offsetLabel: "" },
  { value: "Asia/Karachi", label: "Karachi", offset: null, offsetLabel: "" },
  { value: "Asia/Kolkata", label: "Mumbai, New Delhi", offset: null, offsetLabel: "" },
  { value: "Asia/Dhaka", label: "Dhaka", offset: null, offsetLabel: "" },
  { value: "Asia/Bangkok", label: "Bangkok", offset: null, offsetLabel: "" },
  { value: "Asia/Singapore", label: "Singapore", offset: null, offsetLabel: "" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", offset: null, offsetLabel: "" },
  { value: "Asia/Shanghai", label: "Shanghai", offset: null, offsetLabel: "" },
  { value: "Asia/Tokyo", label: "Tokyo", offset: null, offsetLabel: "" },
  { value: "Asia/Seoul", label: "Seoul", offset: null, offsetLabel: "" },
  { value: "Asia/Manila", label: "Manila", offset: null, offsetLabel: "" },
  { value: "Asia/Jakarta", label: "Jakarta", offset: null, offsetLabel: "" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur", offset: null, offsetLabel: "" },
  { value: "Asia/Taipei", label: "Taipei", offset: null, offsetLabel: "" },
  { value: "Asia/Riyadh", label: "Riyadh", offset: null, offsetLabel: "" },
  { value: "Asia/Jerusalem", label: "Jerusalem", offset: null, offsetLabel: "" },

  // Africa
  { value: "Africa/Cairo", label: "Cairo", offset: null, offsetLabel: "" },
  { value: "Africa/Johannesburg", label: "Johannesburg", offset: null, offsetLabel: "" },
  { value: "Africa/Lagos", label: "Lagos", offset: null, offsetLabel: "" },
  { value: "Africa/Nairobi", label: "Nairobi", offset: null, offsetLabel: "" },
  { value: "Africa/Casablanca", label: "Casablanca", offset: null, offsetLabel: "" },

  // Oceania
  { value: "Australia/Sydney", label: "Sydney", offset: null, offsetLabel: "" },
  { value: "Australia/Melbourne", label: "Melbourne", offset: null, offsetLabel: "" },
  { value: "Australia/Brisbane", label: "Brisbane", offset: null, offsetLabel: "" },
  { value: "Pacific/Auckland", label: "Auckland", offset: null, offsetLabel: "" },

  // UTC
  { value: "UTC", label: "UTC (Coordinated Universal Time)", offset: 0, offsetLabel: "UTC+0" },
];

// Calculate offsets for all timezones
TIMEZONES.forEach((tz) => {
  if (tz.offset === null) {
    const offset = getTimezoneOffset(tz.value);
    tz.offset = offset;
    tz.offsetLabel = offset !== null ? formatUTCOffset(offset) : "";
  }
});

// Sort timezones by offset for better UX
TIMEZONES.sort((a, b) => {
  const offsetA = a.offset ?? 0;
  const offsetB = b.offset ?? 0;
  if (offsetA !== offsetB) {
    return offsetA - offsetB;
  }
  return a.label.localeCompare(b.label);
});

/**
 * Get timezone label by value
 */
export const getTimezoneLabel = (value: string | null | undefined): string => {
  if (!value) return "Not set";
  const timezone = TIMEZONES.find((tz) => tz.value === value);
  return timezone ? timezone.label : value;
};

/**
 * Get timezone with offset label
 */
export const getTimezoneWithOffset = (value: string | null | undefined): string => {
  if (!value) return "Not set";
  const timezone = TIMEZONES.find((tz) => tz.value === value);
  if (!timezone) return value;
  if (timezone.offsetLabel) {
    return `${timezone.label} (${timezone.offsetLabel})`;
  }
  return timezone.label;
};
