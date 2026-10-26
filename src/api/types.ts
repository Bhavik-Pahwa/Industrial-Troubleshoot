/**
 * INDUX OpenAPI 3.1.0 TypeScript definitions.
 * Canonical source: INDUX_backend_api.yaml
 */

export type OverallSystemStatus = 'healthy' | 'degraded' | 'unavailable';
export type DatabaseStatus = 'ready' | 'unavailable';
export type IngestionStatus = 'ready' | 'stopped' | 'error';
export type DetectorStatus = 'ready' | 'unavailable' | 'not_configured';
export type LlmStatus = 'ready' | 'unavailable' | 'disabled' | 'not_configured';

export interface SystemStatus {
  status: OverallSystemStatus;
  database: DatabaseStatus;
  ingestion: IngestionStatus;
  detector: DetectorStatus;
  llm: LlmStatus;
  last_telemetry_at: string | null;
}

export interface HealthResponse {
  status: 'ok';
}

export type AssetStatus = 'normal' | 'warning' | 'critical' | 'unknown';

export interface Asset {
  id: string;
  name: string;
  asset_type: string;
  location: string | null;
  status: AssetStatus;
  last_seen_at: string | null;
  created_at: string;
}

export interface AssetList {
  items: Asset[];
  total: number;
  limit: number;
  offset: number;
}

export interface Sensor {
  id: string;
  asset_id: string;
  name: string;
  unit: string;
  sensor_type: string | null;
}

export interface SensorList {
  items: Sensor[];
  total: number;
  limit: number;
  offset: number;
}

export interface TelemetryReadingInput {
  asset_id: string;
  sensor_id: string;
  value: number;
  unit: string;
  timestamp: string; // ISO 8601 UTC
}

export interface TelemetryReading extends TelemetryReadingInput {
  id: number;
  source_id: string;
  received_at: string; // ISO 8601 UTC
}

export interface TelemetryBatch {
  source_id: string;
  readings: TelemetryReadingInput[];
}

export type ReadingResultStatus = 'accepted' | 'rejected';

export interface ReadingResult {
  index: number;
  status: ReadingResultStatus;
  code?: string;
  message?: string;
  reading_id?: number;
}

export interface IngestResult {
  accepted: number;
  rejected: number;
  results: ReadingResult[];
}

export interface TelemetryList {
  items: TelemetryReading[];
  total: number;
  limit: number;
  offset: number;
}

export type IncidentStatus = 'open' | 'acknowledged' | 'resolved';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Incident {
  id: string;
  asset_id: string;
  anomaly_category: string;
  title: string;
  description: string | null;
  severity: Severity;
  status: IncidentStatus;
  created_at: string;
  last_observed_at: string;
  updated_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  occurrence_count: number;
  latest_evidence: Record<string, unknown>;
}

export interface IncidentList {
  items: Incident[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiErrorDetail {
  [key: string]: unknown;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details: ApiErrorDetail[];
  };
}
