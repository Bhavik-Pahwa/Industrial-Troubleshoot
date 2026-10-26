import { ApiErrorPayload } from './types';

export class InduxApiError extends Error {
  public code: string;
  public details: Array<Record<string, unknown>>;
  public status: number;

  constructor(status: number, code: string, message: string, details: Array<Record<string, unknown>> = []) {
    super(message);
    this.name = 'InduxApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function parseApiError(status: number, data: unknown): InduxApiError {
  if (data && typeof data === 'object' && 'error' in data) {
    const errorPayload = (data as ApiErrorPayload).error;
    if (errorPayload && typeof errorPayload === 'object') {
      return new InduxApiError(
        status,
        errorPayload.code || `HTTP_${status}`,
        errorPayload.message || 'An unexpected API error occurred',
        Array.isArray(errorPayload.details) ? errorPayload.details : []
      );
    }
  }

  // Fallbacks for standard HTTP codes
  let defaultMsg = `Request failed with status ${status}`;
  let code = `HTTP_${status}`;

  if (status === 400) {
    code = 'BAD_REQUEST';
    defaultMsg = 'Invalid request parameters or time range';
  } else if (status === 404) {
    code = 'NOT_FOUND';
    defaultMsg = 'The requested resource was not found';
  } else if (status === 409) {
    code = 'CONFLICT';
    defaultMsg = 'The incident state has changed or is already resolved';
  } else if (status === 422) {
    code = 'VALIDATION_ERROR';
    defaultMsg = 'Invalid payload format or oversized telemetry batch';
  } else if (status === 503) {
    code = 'SERVICE_UNAVAILABLE';
    defaultMsg = 'A required backend component is unavailable';
  }

  return new InduxApiError(status, code, defaultMsg);
}

