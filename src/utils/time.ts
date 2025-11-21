/**
 * Time utility functions
 */

/**
 * Result of parsing a time string
 */
export interface TimeResult {
  hours: number;
  minutes: number;
}

/**
 * Parse a time string into hours and minutes
 * Supports:
 * - 24-hour format: "14:30", "09:00", "9:00"
 * - 12-hour format: "2:30 PM", "09:00 AM", "9:00am", "10:00 pm"
 *
 * @param timeStr Time string to parse
 * @returns Object with hours and minutes, or null if parsing fails
 */
export function parseTime(timeStr: string): TimeResult | null {
  if (!timeStr) return null;

  const normalized = timeStr.trim().toLowerCase();

  // Check for AM/PM
  const isAM = normalized.includes('am') || normalized.includes('午前');
  const isPM = normalized.includes('pm') || normalized.includes('午後');

  // Remove AM/PM markers for parsing numbers
  const timeOnly = normalized
    .replace(/am|pm|午前|午後/g, '')
    .trim();

  const parts = timeOnly.split(':');
  if (parts.length < 2) return null;

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return null;

  // Adjust for 12-hour format
  if (isAM || isPM) {
    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
  }

  // Validate range
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}
