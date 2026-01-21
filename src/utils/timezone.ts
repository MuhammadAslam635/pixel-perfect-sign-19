import { DateTime } from "luxon";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const pad = (value: number) => value.toString().padStart(2, "0");

const isValidTime = (time: string) => TIME_PATTERN.test(time);

export const convertLocalTimeToUTC = (time: string) => {
  if (!isValidTime(time)) {
    return time;
  }

  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
};

export const convertUTCToLocalTime = (utcTime: string) => {
  if (!isValidTime(utcTime)) {
    return utcTime;
  }

  const [hours, minutes] = utcTime.split(":").map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * Get the browser's timezone using Luxon
 * Falls back to Intl API if Luxon fails
 * @returns IANA timezone identifier (e.g., "America/New_York") or null if detection fails
 */
export const getBrowserTimezone = (): string | null => {
  try {
    // Luxon automatically uses the system timezone
    const timezone = DateTime.now().zoneName;
    if (timezone && timezone !== "system") {
      return timezone;
    }
  } catch (error) {
    console.warn("Luxon timezone detection failed:", error);
  }

  // Fallback to Intl API
  try {
    if (
      typeof Intl !== "undefined" &&
      typeof Intl.DateTimeFormat !== "undefined"
    ) {
      const intlTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (intlTimezone) {
        return intlTimezone;
      }
    }
  } catch (error) {
    console.warn("Intl timezone detection failed:", error);
  }

  return null;
};

/**
 * Validate if a timezone string is a valid IANA timezone identifier
 * @param timezone - Timezone string to validate
 * @returns True if valid, false otherwise
 */
export const isValidTimezone = (timezone: string | null | undefined): boolean => {
  if (!timezone || typeof timezone !== "string") {
    return false;
  }

  try {
    // Try to create a DateTime with this timezone
    const dt = DateTime.now().setZone(timezone);
    return dt.isValid && dt.zoneName === timezone;
  } catch (error) {
    return false;
  }
};

/**
 * Get timezone offset in minutes for a given timezone
 * @param timezone - IANA timezone identifier
 * @returns Offset in minutes from UTC, or null if invalid
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
 * Format a date in a specific timezone
 * @param date - Date to format
 * @param timezone - IANA timezone identifier
 * @param format - Luxon format string (default: "yyyy-MM-dd HH:mm:ss")
 * @returns Formatted date string or null if invalid
 */
export const formatDateInTimezone = (
  date: Date | string,
  timezone: string,
  format: string = "yyyy-MM-dd HH:mm:ss"
): string | null => {
  try {
    const dt = DateTime.fromJSDate(
      typeof date === "string" ? new Date(date) : date
    ).setZone(timezone);

    if (!dt.isValid) {
      return null;
    }

    return dt.toFormat(format);
  } catch (error) {
    return null;
  }
};