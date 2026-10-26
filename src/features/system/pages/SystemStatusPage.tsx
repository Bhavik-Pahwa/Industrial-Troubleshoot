import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { queryKeys } from '../../../lib/queryKeys';
import { SystemStatusBadge } from '../../../components/data-display/StatusBadge';
import { Timestamp } from '../../../components/data-display/Timestamp';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import {
  Server,
  Database,
  Activity,
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SystemStatusPage: React.FC = () => {
  const {
    data: health,
    isLoading: healthLoading,
    isError: healthError,
    error: healthErr,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiClient.getHealth(),
  });

  const {
    data: status,
    isLoading: statusLoading,
    isError: statusError,
    error: statusErr,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: queryKeys.systemStatus,
    queryFn: () => apiClient.getSystemStatus(),
  });

  const isLoading = healthLoading || statusLoading;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Info Banner */}
      <div className="p-5 rounded-lg bg-[#0E1524] border border-[#1E293B]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase text-blue-400 font-semibold tracking-wider">
                Industrial Architecture Health
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">System Status & Service Components</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Distinguishes API process availability (<code className="text-xs text-blue-300">GET /health</code>) from individual backend subsystems (<code className="text-xs text-blue-300">GET /system/status</code>).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {status && <SystemStatusBadge status={status.status} size="md" />}
          </div>
        </div>
      </div>

      {isLoading && <LoadingState message="Querying system telemetry and component health..." />}

      {/* Process Reachability vs Component Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Process Health Card */}
        <div className="p-5 rounded-lg bg-[#0E1524] border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white text-sm">API Process Reachability</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">GET /health</span>
          </div>

          {healthError ? (
            <ErrorState
              title="API Process Unreachable"
              error={healthErr}
              onRetry={() => refetchHealth()}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded bg-slate-900/40 border border-slate-800">
                <span className="text-sm text-slate-300">Process State</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-medium text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  status: ok
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The HTTP listener is responsive and answering incoming requests at{' '}
                <code className="text-slate-300 font-mono text-[11px]">{apiClient.getBaseUrl()}</code>.
              </p>
            </div>
          )}
        </div>

        {/* Telemetry Freshness Card */}
        <div className="p-5 rounded-lg bg-[#0E1524] border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white text-sm">Telemetry Freshness & Ingestion</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">last_telemetry_at</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded bg-slate-900/40 border border-slate-800">
              <span className="text-sm text-slate-300">Latest Packet Ingest</span>
              {status?.last_telemetry_at ? (
                <div className="text-right">
                  <Timestamp value={status.last_telemetry_at} className="text-xs text-indigo-300 block font-mono" />
                  <span className="text-[11px] text-slate-400">
                    (<Timestamp value={status.last_telemetry_at} relative />)
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic font-mono">No telemetry received yet</span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Timestamps represent telemetry measurement time verified by backend ingestion pipelines, never local client wall-clock time.
            </p>
          </div>
        </div>
      </div>

      {/* Subsystem Health Cards */}
      {statusError && (
        <ErrorState
          title="Component Status Error"
          error={statusErr}
          onRetry={() => refetchStatus()}
        />
      )}

      {status && (
        <div className="space-y-3">
          <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
            Subsystem Status Inventory
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Database Card */}
            <div className="p-4 rounded-lg bg-[#0E1524] border border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-200">Database</h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium capitalize border ${
                    status.database === 'ready'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  {status.database}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stores asset registry, telemetry streams, and persistent incident state.
              </p>
            </div>

            {/* Ingestion Pipeline Card */}
            <div className="p-4 rounded-lg bg-[#0E1524] border border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-200">Ingestion</h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium capitalize border ${
                    status.ingestion === 'ready'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : status.ingestion === 'stopped'
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  {status.ingestion}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Processes batch telemetry payloads from industrial gateways.
              </p>
            </div>

            {/* Anomaly Detector Card */}
            <div className="p-4 rounded-lg bg-[#0E1524] border border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-200">Detector</h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium capitalize border ${
                    status.detector === 'ready'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : status.detector === 'not_configured'
                      ? 'text-slate-400 bg-slate-800/50 border-slate-700/50'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  {status.detector.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies vibration thresholds, thermal gradients, and heuristic anomaly detectors.
              </p>
            </div>

            {/* LLM Runtime Card */}
            <div className="p-4 rounded-lg bg-[#0E1524] border border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <h4 className="text-sm font-semibold text-slate-200">LLM Engine</h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono font-medium capitalize border ${
                    status.llm === 'ready'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : status.llm === 'not_configured' || status.llm === 'disabled'
                      ? 'text-slate-400 bg-slate-800/50 border-slate-700/50'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  {status.llm.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Local AI explanation runtime for secondary incident synthesis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Quick Action */}
      <div className="p-4 rounded-lg bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-blue-400" />
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Test Telemetry Ingestion API</h4>
            <p className="text-xs text-slate-400">
              Submit structured batches to <code className="text-blue-300 font-mono text-[11px]">POST /telemetry/ingest</code> with sample vibration & thermal datasets.
            </p>
          </div>
        </div>
        <Link
          to="/ingest"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white transition-colors shrink-0"
        >
          <span>Open Ingest Simulator</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
