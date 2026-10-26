import { describe, it, expect } from 'vitest';
import { validateDateRange, formatUtcDateTime, formatRelativeTime } from '../lib/dates';
import { parseApiError } from '../api/errors';
import {
  getAssetStatusConfig,
  getIncidentSeverityConfig,
  getIncidentStatusConfig,
  formatTelemetryValue,
} from '../lib/formatting';

describe('Date & Time Handling (PRD Section 10 & 14.1)', () => {
  it('validates that end must be strictly later than start', () => {
    const valid = validateDateRange('2026-10-26T10:00:00Z', '2026-10-26T12:00:00Z');
    expect(valid.valid).toBe(true);

    const invalidSame = validateDateRange('2026-10-26T10:00:00Z', '2026-10-26T10:00:00Z');
    expect(invalidSame.valid).toBe(false);
    expect(invalidSame.error).toContain('strictly later than start');

    const invalidReversed = validateDateRange('2026-10-26T14:00:00Z', '2026-10-26T12:00:00Z');
    expect(invalidReversed.valid).toBe(false);
  });

  it('formats UTC ISO strings strictly with UTC label and handles null gracefully', () => {
    expect(formatUtcDateTime(null)).toBe('Not available');
    expect(formatUtcDateTime(undefined)).toBe('Not available');
    expect(formatUtcDateTime('2026-10-26T14:30:00.000Z')).toBe('2026-10-26 14:30:00 UTC');
  });

  it('handles null relative timestamps without throwing', () => {
    expect(formatRelativeTime(null)).toBe('Never');
    expect(formatRelativeTime(undefined)).toBe('Never');
  });
});

describe('Error Envelope Parsing (PRD Section 7.4 & 14.1)', () => {
  it('normalizes structured API error payload while retaining code, message, and details', () => {
    const rawError = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Batch exceeds maximum size of 500 readings',
        details: [{ field: 'readings', count: 501 }],
      },
    };

    const parsed = parseApiError(422, rawError);
    expect(parsed.status).toBe(422);
    expect(parsed.code).toBe('VALIDATION_ERROR');
    expect(parsed.message).toBe('Batch exceeds maximum size of 500 readings');
    expect(parsed.details).toHaveLength(1);
    expect(parsed.details[0].count).toBe(501);
  });

  it('provides sensible fallback for standard HTTP status codes without envelope', () => {
    const err404 = parseApiError(404, null);
    expect(err404.code).toBe('NOT_FOUND');
    expect(err404.message).toContain('not found');

    const err409 = parseApiError(409, null);
    expect(err409.code).toBe('CONFLICT');
    expect(err409.message).toContain('already resolved');
  });
});

describe('Status & Severity Visual Mappings (PRD Section 9.2 & 14.1)', () => {
  it('maps all asset statuses and includes accessible text labels', () => {
    expect(getAssetStatusConfig('normal').label).toBe('Normal');
    expect(getAssetStatusConfig('warning').label).toBe('Warning');
    expect(getAssetStatusConfig('critical').label).toBe('Critical');
    expect(getAssetStatusConfig('unknown').label).toBe('Unknown');
  });

  it('maps incident severity levels distinctly from lifecycle status', () => {
    expect(getIncidentSeverityConfig('low').label).toBe('Low');
    expect(getIncidentSeverityConfig('medium').label).toBe('Medium');
    expect(getIncidentSeverityConfig('high').label).toBe('High');
    expect(getIncidentSeverityConfig('critical').label).toBe('Critical');

    expect(getIncidentStatusConfig('open').label).toBe('Open');
    expect(getIncidentStatusConfig('acknowledged').label).toBe('Acknowledged');
    expect(getIncidentStatusConfig('resolved').label).toBe('Resolved');
  });

  it('formats telemetry readings with units and preserves numeric precision', () => {
    expect(formatTelemetryValue(14.234, 'mm/s')).toBe('14.23 mm/s');
    expect(formatTelemetryValue(120, 'RPM')).toBe('120 RPM');
  });
});
