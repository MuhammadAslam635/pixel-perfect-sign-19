import { DateTime } from "luxon";

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