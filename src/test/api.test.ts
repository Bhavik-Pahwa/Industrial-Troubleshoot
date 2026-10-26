import { describe, it, expect, beforeEach } from 'vitest';
import { apiClient } from '../api/client';
import { InduxApiError } from '../api/errors';

describe('API Client & Contract Validation (PRD Section 14.3)', () => {
  beforeEach(() => {
    apiClient.setMode('mock');
  });

  it('queries health and system status', async () => {
    const health = await apiClient.getHealth();
    expect(health.status).toBe('ok');

    const system = await apiClient.getSystemStatus();
    expect(['healthy', 'degraded', 'unavailable']).toContain(system.status);
    expect(['ready', 'unavailable']).toContain(system.database);
    expect(['ready', 'stopped', 'error']).toContain(system.ingestion);
    expect(['ready', 'unavailable', 'not_configured']).toContain(system.detector);
    expect(['ready', 'unavailable', 'disabled', 'not_configured']).toContain(system.llm);
  });

  it('lists assets with pagination metadata and retrieves asset details', async () => {
    const list = await apiClient.listAssets(5, 0);
    expect(list.items.length).toBeGreaterThan(0);
    expect(list.total).toBeGreaterThanOrEqual(list.items.length);
    expect(list.limit).toBe(5);
    expect(list.offset).toBe(0);

    const first = list.items[0];
    const details = await apiClient.getAsset(first.id);
    expect(details.id).toBe(first.id);
    expect(details.name).toBe(first.name);
  });

  it('throws 404 InduxApiError on unknown asset ID', async () => {
    await expect(apiClient.getAsset('unknown-nonexistent-id')).rejects.toThrow(InduxApiError);
    try {
      await apiClient.getAsset('unknown-nonexistent-id');
    } catch (err) {
      expect((err as InduxApiError).status).toBe(404);
      expect((err as InduxApiError).code).toBe('NOT_FOUND');
    }
  });

  it('retrieves sensors and telemetry for an asset', async () => {
    const sensors = await apiClient.listAssetSensors('pump-101');
    expect(sensors.items.length).toBeGreaterThan(0);
    expect(sensors.items[0].asset_id).toBe('pump-101');

    const latest = await apiClient.getLatestTelemetry('pump-101', 10);
    expect(latest.items.length).toBeGreaterThan(0);
    expect(latest.items[0].asset_id).toBe('pump-101');
  });

  it('exercises telemetry history with UTC start/end and validates order', async () => {
    const end = new Date().toISOString();
    const start = new Date(Date.now() - 4 * 3600 * 1000).toISOString();
    const history = await apiClient.getTelemetryHistory('pump-101', start, end, 50, 0);
    expect(history.items.length).toBeGreaterThan(0);

    // Verify chronological ordering
    for (let i = 1; i < history.items.length; i++) {
      const prevTime = new Date(history.items[i - 1].timestamp).getTime();
      const currTime = new Date(history.items[i].timestamp).getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }
  });

  it('rejects history query when end is before start with 400 error', async () => {
    const start = '2026-10-26T14:00:00Z';
    const end = '2026-10-26T12:00:00Z';
    await expect(apiClient.getTelemetryHistory('pump-101', start, end)).rejects.toThrow();
  });

  it('acknowledges an open incident and transitions status', async () => {
    // inc-9201 is open
    const acked = await apiClient.acknowledgeIncident('inc-9201');
    expect(acked.status).toBe('acknowledged');
    expect(acked.acknowledged_at).not.toBeNull();
  });

  it('resolves an active incident with a resolution note', async () => {
    const note = 'Aligned coupling and replaced drive-end bearings.';
    const resolved = await apiClient.resolveIncident('inc-9201', note);
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolved_at).not.toBeNull();
    expect(resolved.resolution_note).toBe(note);
  });

  it('throws 409 CONFLICT if trying to acknowledge or resolve an already-resolved incident', async () => {
    try {
      await apiClient.acknowledgeIncident('inc-9190'); // inc-9190 is already resolved
      expect.fail('Should have thrown 409');
    } catch (err) {
      expect((err as InduxApiError).status).toBe(409);
      expect((err as InduxApiError).code).toBe('CONFLICT');
    }
  });

  it('processes telemetry batch ingestion with per-item reporting', async () => {
    const batch = {
      source_id: 'test-gateway-01',
      readings: [
        {
          asset_id: 'pump-101',
          sensor_id: 'sensor-p101-vib',
          value: 5.4,
          unit: 'mm/s',
          timestamp: new Date().toISOString(),
        },
        {
          asset_id: 'pump-101',
          sensor_id: '', // invalid
          value: 0,
          unit: '',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await apiClient.ingestTelemetry(batch);
    expect(res.accepted).toBe(1);
    expect(res.rejected).toBe(1);
    expect(res.results).toHaveLength(2);
    expect(res.results[0].status).toBe('accepted');
    expect(res.results[1].status).toBe('rejected');
  });
});
