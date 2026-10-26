import { IncidentStatus, Severity } from '../api/types';

export const queryKeys = {
  health: ['health'] as const,
  systemStatus: ['systemStatus'] as const,
  assets: (limit = 50, offset = 0) => ['assets', { limit, offset }] as const,
  asset: (id: string) => ['asset', id] as const,
  assetSensors: (id: string, limit = 50, offset = 0) => ['assetSensors', id, { limit, offset }] as const,
  latestTelemetry: (assetId?: string, limit = 50) => ['latestTelemetry', { assetId, limit }] as const,
  telemetryHistory: (assetId: string, start: string, end: string, limit = 50, offset = 0) =>
    ['telemetryHistory', assetId, { start, end, limit, offset }] as const,
  incidents: (status?: IncidentStatus, assetId?: string, severity?: Severity, limit = 50, offset = 0) =>
    ['incidents', { status, assetId, severity, limit, offset }] as const,
  incident: (id: string) => ['incident', id] as const,
};

