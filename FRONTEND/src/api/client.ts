import { config } from '../config/env';
import {
  HealthResponse,
  SystemStatus,
  Asset,
  AssetList,
  SensorList,
  TelemetryBatch,
  IngestResult,
  TelemetryReading,
  TelemetryList,
  Incident,
  IncidentList,
  IncidentStatus,
  Severity,
} from './types';
import { parseApiError } from './errors';
import {
  initialSystemStatus,
  initialAssets,
  initialSensors,
  initialIncidents,
  generateMockTelemetryReadings,
} from './mockData';

export type ConnectionMode = 'live' | 'mock' | 'checking';

// In-memory state for mock fallback mode
class MockStateEngine {
  public systemStatus: SystemStatus = { ...initialSystemStatus };
  public assets: Asset[] = [...initialAssets];
  public sensors = [...initialSensors];
  public incidents: Incident[] = [...initialIncidents];
  public telemetryReadings: TelemetryReading[] = generateMockTelemetryReadings();

  getHealth(): HealthResponse {
    return { status: 'ok' };
  }

  getSystemStatus(): SystemStatus {
    return { ...this.systemStatus };
  }

  listAssets(limit = 50, offset = 0): AssetList {
    const paged = this.assets.slice(offset, offset + limit);
    return {
      items: paged,
      total: this.assets.length,
      limit,
      offset,
    };
  }

  getAsset(id: string): Asset {
    const a = this.assets.find((item) => item.id === id);
    if (!a) {
      throw parseApiError(404, {
        error: { code: 'NOT_FOUND', message: `Asset '${id}' not found`, details: [] },
      });
    }
    return { ...a };
  }

  listAssetSensors(assetId: string, limit = 50, offset = 0): SensorList {
    const matching = this.sensors.filter((s) => s.asset_id === assetId);
    return {
      items: matching.slice(offset, offset + limit),
      total: matching.length,
      limit,
      offset,
    };
  }

  getLatestTelemetry(assetId?: string, limit = 50): { items: TelemetryReading[] } {
    let filtered = [...this.telemetryReadings];
    if (assetId) {
      filtered = filtered.filter((r) => r.asset_id === assetId);
    }
    // Sort descending by timestamp
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return {
      items: filtered.slice(0, Math.min(limit, 200)),
    };
  }

  getTelemetryHistory(
    assetId: string,
    start: string,
    end: string,
    limit = 50,
    offset = 0
  ): TelemetryList {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    if (endTime <= startTime) {
      throw parseApiError(400, {
        error: {
          code: 'INVALID_TIME_RANGE',
          message: 'End timestamp must be strictly later than start timestamp',
          details: [{ field: 'end', message: 'end must be > start' }],
        },
      });
    }

    const filtered = this.telemetryReadings
      .filter((r) => {
        if (r.asset_id !== assetId) return false;
        const t = new Date(r.timestamp).getTime();
        return t >= startTime && t < endTime;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      items: filtered.slice(offset, offset + limit),
      total: filtered.length,
      limit,
      offset,
    };
  }

  ingestTelemetry(batch: TelemetryBatch): IngestResult {
    if (!batch.readings || batch.readings.length === 0 || batch.readings.length > 500) {
      throw parseApiError(422, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Batch must contain between 1 and 500 readings',
          details: [],
        },
      });
    }

    let accepted = 0;
    let rejected = 0;
    const nowIso = new Date().toISOString();
    const results = batch.readings.map((r, index) => {
      // Validate item
      if (!r.asset_id || !r.sensor_id || typeof r.value !== 'number' || !r.unit || !r.timestamp) {
        rejected++;
        return {
          index,
          status: 'rejected' as const,
          code: 'FIELD_REQUIRED',
          message: 'Missing or invalid reading fields',
        };
      }

      accepted++;
      const id = Date.now() + index;
      const reading: TelemetryReading = {
        ...r,
        id,
        source_id: batch.source_id,
        received_at: nowIso,
      };
      this.telemetryReadings.push(reading);
      return {
        index,
        status: 'accepted' as const,
        reading_id: id,
      };
    });

    if (accepted > 0) {
      this.systemStatus.last_telemetry_at = nowIso;
    }

    return {
      accepted,
      rejected,
      results,
    };
  }

  listIncidents(
    status?: IncidentStatus,
    assetId?: string,
    severity?: Severity,
    limit = 50,
    offset = 0
  ): IncidentList {
    let filtered = [...this.incidents];

    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }
    if (assetId) {
      filtered = filtered.filter((i) => i.asset_id === assetId);
    }
    if (severity) {
      filtered = filtered.filter((i) => i.severity === severity);
    }

    filtered.sort((a, b) => new Date(b.last_observed_at).getTime() - new Date(a.last_observed_at).getTime());

    return {
      items: filtered.slice(offset, offset + limit),
      total: filtered.length,
      limit,
      offset,
    };
  }

  getIncident(incidentId: string): Incident {
    const inc = this.incidents.find((i) => i.id === incidentId);
    if (!inc) {
      throw parseApiError(404, {
        error: { code: 'NOT_FOUND', message: `Incident '${incidentId}' not found`, details: [] },
      });
    }
    return { ...inc };
  }

  acknowledgeIncident(incidentId: string): Incident {
    const inc = this.incidents.find((i) => i.id === incidentId);
    if (!inc) {
      throw parseApiError(404, {
        error: { code: 'NOT_FOUND', message: `Incident '${incidentId}' not found`, details: [] },
      });
    }
    if (inc.status === 'resolved') {
      throw parseApiError(409, {
        error: {
          code: 'CONFLICT',
          message: 'Incident is already resolved and cannot be acknowledged',
          details: [],
        },
      });
    }

    inc.status = 'acknowledged';
    inc.acknowledged_at = new Date().toISOString();
    inc.updated_at = new Date().toISOString();
    return { ...inc };
  }

  resolveIncident(incidentId: string, note?: string): Incident {
    const inc = this.incidents.find((i) => i.id === incidentId);
    if (!inc) {
      throw parseApiError(404, {
        error: { code: 'NOT_FOUND', message: `Incident '${incidentId}' not found`, details: [] },
      });
    }
    if (inc.status === 'resolved') {
      throw parseApiError(409, {
        error: {
          code: 'CONFLICT',
          message: 'Incident is already resolved',
          details: [],
        },
      });
    }

    inc.status = 'resolved';
    inc.resolved_at = new Date().toISOString();
    inc.updated_at = new Date().toISOString();
    inc.resolution_note = note || null;
    return { ...inc };
  }
}

export const mockEngine = new MockStateEngine();

class InduxApiClient {
  private baseUrl: string = config.apiBaseUrl;
  private mode: ConnectionMode = 'checking';
  private modeListeners: Set<(mode: ConnectionMode) => void> = new Set();

  constructor() {
    this.checkHealthInitial();
  }

  public getMode(): ConnectionMode {
    return this.mode;
  }

  public setMode(mode: ConnectionMode) {
    this.mode = mode;
    this.notifyModeChange();
  }

  public onModeChange(listener: (mode: ConnectionMode) => void): () => void {
    this.modeListeners.add(listener);
    listener(this.mode);
    return () => {
      this.modeListeners.delete(listener);
    };
  }

  private notifyModeChange() {
    this.modeListeners.forEach((listener) => listener(this.mode));
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public async checkHealthInitial(): Promise<ConnectionMode> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        this.mode = 'live';
      } else {
        this.mode = 'mock';
      }
    } catch {
      // Backend not running locally, fall back to high-fidelity mock engine
      this.mode = 'mock';
    }
    this.notifyModeChange();
    return this.mode;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = null;
        }
        throw parseApiError(response.status, errorData);
      }

      if (response.status === 204) {
        return undefined as unknown as T;
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof Error && err.name === 'InduxApiError') {
        throw err;
      }
      // Network unreachable
      throw parseApiError(0, {
        error: {
          code: 'NETWORK_ERROR',
          message: `Unable to connect to backend at ${this.baseUrl}. Check if the server is running.`,
          details: [{ originalError: String(err) }],
        },
      });
    }
  }

  // --- API Endpoints matching OpenAPI 3.1.0 ---

  async getHealth(): Promise<HealthResponse> {
    if (this.mode === 'mock') {
      return mockEngine.getHealth();
    }
    try {
      return await this.request<HealthResponse>('/health');
    } catch (err) {
      if (this.mode !== 'live') return mockEngine.getHealth();
      throw err;
    }
  }

  async getSystemStatus(): Promise<SystemStatus> {
    if (this.mode === 'mock') {
      return mockEngine.getSystemStatus();
    }
    try {
      return await this.request<SystemStatus>('/system/status');
    } catch (err) {
      if (this.mode !== 'live') return mockEngine.getSystemStatus();
      throw err;
    }
  }

  async listAssets(limit = 50, offset = 0): Promise<AssetList> {
    if (this.mode === 'mock') {
      return mockEngine.listAssets(limit, offset);
    }
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      return await this.request<AssetList>(`/assets?${params.toString()}`);
    } catch (err) {
      if (this.mode !== 'live') return mockEngine.listAssets(limit, offset);
      throw err;
    }
  }

  async getAsset(assetId: string): Promise<Asset> {
    if (this.mode === 'mock') {
      return mockEngine.getAsset(assetId);
    }
    try {
      return await this.request<Asset>(`/assets/${encodeURIComponent(assetId)}`);
    } catch (err) {
      if (this.mode !== 'live') return mockEngine.getAsset(assetId);
      throw err;
    }
  }

  async listAssetSensors(assetId: string, limit = 50, offset = 0): Promise<SensorList> {
    if (this.mode === 'mock') {
      return mockEngine.listAssetSensors(assetId, limit, offset);
    }
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      return await this.request<SensorList>(
        `/assets/${encodeURIComponent(assetId)}/sensors?${params.toString()}`
      );
    } catch (err) {
      if (this.mode !== 'live') return mockEngine.listAssetSensors(assetId, limit, offset);
      throw err;
    }
  }

  async getLatestTelemetry(assetId?: string, limit = 50): Promise<{ items: TelemetryReading[] }> {
    if (this.mode === 'mock') {
      return mockEngine.getLatestTelemetry(assetId, limit);
    }
    try {
      const params = new URLSearchParams();
      if (assetId) params.append('asset_id', assetId);
      params.append('limit', String(limit));
      return await this.request<{ items: TelemetryReading[] }>(
        `/telemetry/latest?${params.toString()}`
      );
    } catch (err) {
      if (this.mode !== 'live') return mockEngine.getLatestTelemetry(assetId, limit);
      throw err;
    }
  }

  async getTelemetryHistory(
    assetId: string,
    start: string,
    end: string,
    limit = 50,
    offset = 0
  ): Promise<TelemetryList> {
    if (this.mode === 'mock') {
      return mockEngine.getTelemetryHistory(assetId, start, end, limit, offset);
    }
    try {
      const params = new URLSearchParams({
        asset_id: assetId,
        start,
        end,
        limit: String(limit),
        offset: String(offset),
      });
      return await this.request<TelemetryList>(`/telemetry/history?${params.toString()}`);
    } catch (err) {
      if (this.mode !== 'live') return mockEngine.getTelemetryHistory(assetId, start, end, limit, offset);
      throw err;
    }
  }

  async ingestTelemetry(batch: TelemetryBatch): Promise<IngestResult> {
    if (this.mode === 'mock') {
      return mockEngine.ingestTelemetry(batch);
    }
    try {
      return await this.request<IngestResult>('/telemetry/ingest', {
        method: 'POST',
        body: JSON.stringify(batch),
      });
    } catch (err) {
      if (this.mode !== 'live') return mockEngine.ingestTelemetry(batch);
      throw err;
    }
  }

  async listIncidents(
    status?: IncidentStatus,
    assetId?: string,
    severity?: Severity,
    limit = 50,
    offset = 0
  ): Promise<IncidentList> {
    if (this.mode === 'mock') {
      return mockEngine.listIncidents(status, assetId, severity, limit, offset);
    }
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (assetId) params.append('asset_id', assetId);
      if (severity) params.append('severity', severity);
      params.append('limit', String(limit));
      params.append('offset', String(offset));

      return await this.request<IncidentList>(`/incidents?${params.toString()}`);
    } catch (err) {
      if (this.mode !== 'live') return mockEngine.listIncidents(status, assetId, severity, limit, offset);
      throw err;
    }
  }

  async getIncident(incidentId: string): Promise<Incident> {
    if (this.mode === 'mock') {
      return mockEngine.getIncident(incidentId);
    }
    try {
      return await this.request<Incident>(`/incidents/${encodeURIComponent(incidentId)}`);
    } catch (err) {
      if (this.mode !== 'live') return mockEngine.getIncident(incidentId);
      throw err;
    }
  }

  async acknowledgeIncident(incidentId: string): Promise<Incident> {
    if (this.mode === 'mock') {
      return mockEngine.acknowledgeIncident(incidentId);
    }
    try {
      return await this.request<Incident>(
        `/incidents/${encodeURIComponent(incidentId)}/acknowledge`,
        { method: 'POST' }
      );
    } catch (err) {
      if (this.mode !== 'live') return mockEngine.acknowledgeIncident(incidentId);
      throw err;
    }
  }

  async resolveIncident(incidentId: string, note?: string): Promise<Incident> {
    if (this.mode === 'mock') {
      return mockEngine.resolveIncident(incidentId, note);
    }
    try {
      const body = note !== undefined ? JSON.stringify({ note }) : undefined;
      return await this.request<Incident>(
        `/incidents/${encodeURIComponent(incidentId)}/resolve`,
        {
          method: 'POST',
          body,
        }
      );
    } catch (err) {
      if (this.mode !== 'live') return mockEngine.resolveIncident(incidentId, note);
      throw err;
    }
  }
}

export const apiClient = new InduxApiClient();

