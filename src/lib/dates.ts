import { format, parseISO, isValid, formatDistanceToNowStrict } from 'date-fns';

/**
 * Validates that end is strictly after start.
 */
export function validateDateRange(startIso: string, endIso: string): { valid: boolean; error?: string } {
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    if (!isValid(start)) return { valid: false, error: 'Start timestamp is invalid' };
    if (!isValid(end)) return { valid: false, error: 'End timestamp is invalid' };
    if (end.getTime() <= start.getTime()) {
      return { valid: false, error: 'End timestamp must be strictly later than start timestamp' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Malformed date range' };
  }
}

/**
 * Format timestamp in ISO 8601 UTC string for API queries.
 */
export function toUtcIsoString(date: Date): string {
  return date.toISOString();
}

/**
 * Formats ISO date string into readable UTC format: "2026-10-26 14:30:15 UTC"
 */
export function formatUtcDateTime(isoString: string | null | undefined): string {
  if (!isoString) return 'Not available';
  try {
    const d = parseISO(isoString);
    if (!isValid(d)) return 'Invalid date';
    // Format in UTC for strict industrial auditability
    return `${d.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
  } catch {
    return 'Invalid date';
  }
}

/**
 * Formats ISO date string into local time with timezone code: "Oct 26, 2026, 14:30:15 (GMT+5:30)"
 */
export function formatLocalDateTime(isoString: string | null | undefined): string {
  if (!isoString) return 'Not available';
  try {
    const d = parseISO(isoString);
    if (!isValid(d)) return 'Invalid date';
    return format(d, 'MMM d, yyyy HH:mm:ss');
  } catch {
    return 'Invalid date';
  }
}

/**
 * Formats relative time (e.g. "3m ago", "2h ago")
 */
export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return 'Never';
  try {
    const d = parseISO(isoString);
    if (!isValid(d)) return 'Invalid date';
    return `${formatDistanceToNowStrict(d)} ago`;
  } catch {
    return 'Invalid date';
  }
}

/**
 * Quick helper to get ISO string for N minutes/hours ago
 */
export function getRelativeIsoTime(hoursAgo: number): string {
  const d = new Date(Date.now() - hoursAgo * 3600 * 1000);
  return d.toISOString();
}
