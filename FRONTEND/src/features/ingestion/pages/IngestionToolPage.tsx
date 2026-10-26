import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { TelemetryBatch, IngestResult } from '../../../api/types';
import { useToast } from '../../../components/feedback/ToastRegion';
import { InduxApiError } from '../../../api/errors';
import {
  UploadCloud,
  CheckCircle2,
  AlertOctagon,
  Layers,
  Code,
  Zap,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

const PRESET_NORMAL_BATCH: TelemetryBatch = {
  source_id: 'edge-gateway-plc-01',
  readings: [
    {
      asset_id: 'pump-101',
      sensor_id: 'sensor-p101-vib',
      value: 4.82,
      unit: 'mm/s',
      timestamp: new Date().toISOString(),
    },
    {
      asset_id: 'pump-101',
      sensor_id: 'sensor-p101-temp',
      value: 68.5,
      unit: '°C',
      timestamp: new Date().toISOString(),
    },
    {
      asset_id: 'pump-101',
      sensor_id: 'sensor-p101-press',
      value: 3.75,
      unit: 'bar',
      timestamp: new Date().toISOString(),
    },
  ],
};

const PRESET_ANOMALY_BATCH: TelemetryBatch = {
  source_id: 'edge-gateway-plc-02',
  readings: [
    {
      asset_id: 'comp-204',
      sensor_id: 'sensor-c204-temp',
      value: 174.2, // Critical thermal spike
      unit: '°C',
      timestamp: new Date().toISOString(),
    },
    {
      asset_id: 'comp-204',
      sensor_id: 'sensor-c204-vib',
      value: 12.4, // High crosshead velocity
      unit: 'mm/s',
      timestamp: new Date().toISOString(),
    },
  ],
};

const PRESET_MIXED_REJECT_BATCH: TelemetryBatch = {
  source_id: 'edge-gateway-plc-03',
  readings: [
    {
      asset_id: 'motor-301',
      sensor_id: 'sensor-m301-curr',
      value: 145.2,
      unit: 'A',
      timestamp: new Date().toISOString(),
    },
    {
      // Missing required sensor_id to test API rejection handling
      asset_id: 'motor-301',
      sensor_id: '',
      // @ts-expect-error test invalid value
      value: 'invalid_number',
      unit: '',
      timestamp: new Date().toISOString(),
    },
  ],
};

export const IngestionToolPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [payloadJson, setPayloadJson] = useState<string>(
    JSON.stringify(PRESET_NORMAL_BATCH, null, 2)
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [apiError, setApiError] = useState<InduxApiError | null>(null);

  const ingestMutation = useMutation({
    mutationFn: (batch: TelemetryBatch) => apiClient.ingestTelemetry(batch),
    onSuccess: (result) => {
      setIngestResult(result);
      setApiError(null);
      queryClient.invalidateQueries({ queryKey: ['latestTelemetry'] });
      queryClient.invalidateQueries({ queryKey: ['systemStatus'] });
      queryClient.invalidateQueries({ queryKey: ['telemetryHistory'] });
      showToast(
        result.rejected > 0 ? 'info' : 'success',
        'Batch Ingestion Processed',
        `Accepted: ${result.accepted}, Rejected: ${result.rejected}`
      );
    },
    onError: (err: unknown) => {
      if (err instanceof InduxApiError) {
        setApiError(err);
      } else {
        setApiError(new InduxApiError(500, 'CLIENT_ERROR', (err as Error).message));
      }
      showToast('error', 'Ingestion Request Failed', (err as Error).message);
    },
  });

  const handleApplyPreset = (preset: TelemetryBatch) => {
    // update timestamp to current
    const updated = {
      ...preset,
      readings: preset.readings.map((r) => ({
        ...r,
        timestamp: new Date().toISOString(),
      })),
    };
    setPayloadJson(JSON.stringify(updated, null, 2));
    setParseError(null);
  };

  const handleIngestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParseError(null);
    setApiError(null);

    let parsed: TelemetryBatch;
    try {
      parsed = JSON.parse(payloadJson);
    } catch {
      setParseError('Malformed JSON. Please verify syntax.');
      return;
    }

    if (!parsed.source_id) {
      setParseError("Missing required 'source_id' string");
      return;
    }

    if (!Array.isArray(parsed.readings) || parsed.readings.length === 0) {
      setParseError("'readings' must be an array with at least 1 reading (max 500)");
      return;
    }

    if (parsed.readings.length > 500) {
      setParseError(`Batch contains ${parsed.readings.length} readings, which exceeds maximum limit of 500`);
      return;
    }

    ingestMutation.mutate(parsed);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-5 rounded-lg bg-[#0E1524] border border-[#1E293B]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase text-blue-400 font-semibold tracking-wider">
                Developer & Demo Utility
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800/50">
                POST /telemetry/ingest
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Telemetry Ingestion Batch Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Exercise the ingestion API contract. Transmits batches up to 500 readings with per-item validation reporting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Manual Trigger Only
            </span>
          </div>
        </div>
      </div>

      {/* Preset Quick Selectors */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium mr-1">Load Preset Payload:</span>
        <button
          type="button"
          onClick={() => handleApplyPreset(PRESET_NORMAL_BATCH)}
          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pump P-101 Normal Batch (3 readings)</span>
        </button>

        <button
          type="button"
          onClick={() => handleApplyPreset(PRESET_ANOMALY_BATCH)}
          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Compressor C-204 Thermal Excursion (2 readings)</span>
        </button>

        <button
          type="button"
          onClick={() => handleApplyPreset(PRESET_MIXED_REJECT_BATCH)}
          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
          <span>Batch with Invalid Reading (Per-Item Rejection)</span>
        </button>
      </div>

      {/* Editor & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingestion Payload Form */}
        <form onSubmit={handleIngestSubmit} className="p-5 rounded-lg bg-[#0E1524] border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400" />
              Batch Payload (JSON)
            </h3>
            <span className="text-xs font-mono text-slate-500">1 to 500 items</span>
          </div>

          <textarea
            rows={14}
            value={payloadJson}
            onChange={(e) => setPayloadJson(e.target.value)}
            className="w-full p-3 text-xs font-mono rounded bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
          />

          {parseError && (
            <div className="p-3 rounded bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 font-mono">
              Never auto-submits. Click below to ingest.
            </span>
            <button
              type="submit"
              disabled={ingestMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{ingestMutation.isPending ? 'Transmitting Batch...' : 'Submit Batch to API'}</span>
            </button>
          </div>
        </form>

        {/* API Response Inspector */}
        <div className="p-5 rounded-lg bg-[#0E1524] border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              API Ingest Result
            </h3>
            <span className="text-xs font-mono text-slate-500">IngestResult Schema</span>
          </div>

          {apiError && (
            <div className="p-4 rounded bg-rose-950/30 border border-rose-500/40 text-rose-200 space-y-2">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-bold font-mono">API Error ({apiError.code})</span>
              </div>
              <p className="text-xs">{apiError.message}</p>
            </div>
          )}

          {!ingestResult && !apiError && (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-500 border border-dashed border-slate-800 rounded">
              <UploadCloud className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">Submit a batch to inspect per-reading acceptance results.</p>
            </div>
          )}

          {ingestResult && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                  <span className="text-xs text-emerald-300 font-medium">Accepted Readings</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {ingestResult.accepted}
                  </span>
                </div>
                <div className="p-3 rounded bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
                  <span className="text-xs text-rose-300 font-medium">Rejected Readings</span>
                  <span className="text-base font-bold font-mono text-rose-400">
                    {ingestResult.rejected}
                  </span>
                </div>
              </div>

              {/* Per-Item Results List */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Per-Reading Results ({ingestResult.results.length} items)
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {ingestResult.results.map((res) => (
                    <div
                      key={res.index}
                      className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500">#{res.index}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${
                            res.status === 'accepted'
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                              : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                          }`}
                        >
                          {res.status}
                        </span>
                        {res.message && (
                          <span className="text-slate-400 text-[11px] truncate max-w-xs">
                            {res.message}
                          </span>
                        )}
                      </div>
                      {res.reading_id && (
                        <span className="text-[10px] font-mono text-slate-500">
                          id: {res.reading_id}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

