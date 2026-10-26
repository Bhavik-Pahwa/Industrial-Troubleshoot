import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../api/client';
import { queryKeys } from '../../../lib/queryKeys';
import { SystemStatusStrip } from '../../system/components/SystemStatusStrip';
import { AssetStatusBadge, IncidentStatusBadge } from '../../../components/data-display/StatusBadge';
import { SeverityBadge } from '../../../components/data-display/SeverityBadge';
import { Timestamp } from '../../../components/data-display/Timestamp';
import { TableSkeleton } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { formatTelemetryValue } from '../../../lib/formatting';
import {
  Cpu,
  AlertTriangle,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  // 1. Fetch Assets (first 50)
  const {
    data: assetList,
    isLoading: assetsLoading,
    isError: assetsIsError,
    error: assetsError,
    refetch: refetchAssets,
  } = useQuery({
    queryKey: queryKeys.assets(50, 0),
    queryFn: () => apiClient.listAssets(50, 0),
  });

  // 2. Fetch Incidents (first 20)
  const {
    data: incidentList,
    isLoading: incidentsLoading,
    isError: incidentsIsError,
    error: incidentsError,
    refetch: refetchIncidents,
  } = useQuery({
    queryKey: queryKeys.incidents(undefined, undefined, undefined, 20, 0),
    queryFn: () => apiClient.listIncidents(undefined, undefined, undefined, 20, 0),
  });

  // 3. Fetch Latest Telemetry (first 10 readings)
  const {
    data: latestTelemetry,
    isLoading: telemetryLoading,
    isError: telemetryIsError,
    error: telemetryError,
    refetch: refetchTelemetry,
  } = useQuery({
    queryKey: queryKeys.latestTelemetry(undefined, 10),
    queryFn: () => apiClient.getLatestTelemetry(undefined, 10),
    refetchInterval: 10000,
  });

  // Calculate asset counts from current loaded items (with clear disclosure)
  const assets = assetList?.items || [];
  const assetCounts = {
    critical: assets.filter((a) => a.status === 'critical').length,
    warning: assets.filter((a) => a.status === 'warning').length,
    normal: assets.filter((a) => a.status === 'normal').length,
    unknown: assets.filter((a) => a.status === 'unknown').length,
  };

  const incidents = incidentList?.items || [];
  const openIncidents = incidents.filter((i) => i.status === 'open');
  const ackIncidents = incidents.filter((i) => i.status === 'acknowledged');
  const criticalIncidents = incidents.filter((i) => i.severity === 'critical');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. System Status Strip */}
      <SystemStatusStrip />

      {/* 2. Operations Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Monitored Assets */}
        <div className="p-4 rounded-lg bg-[#0E1524] border border-[#1E293B] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Registered Assets
            </span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-white">
              {assetsLoading ? '—' : assetList?.total ?? 0}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-rose-400 font-semibold">{assetCounts.critical} crit</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400">{assetCounts.warning} warn</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {assets.length === assetList?.total
              ? 'Complete asset inventory loaded'
              : `Showing top ${assets.length} of ${assetList?.total ?? 0} assets`}
          </div>
        </div>

        {/* Active Incidents Requiring Triage */}
        <div className="p-4 rounded-lg bg-[#0E1524] border border-[#1E293B] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Open Incidents
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-rose-400">
              {incidentsLoading ? '—' : openIncidents.length}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-amber-400">{ackIncidents.length} ack</span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-500 font-bold">{criticalIncidents.length} critical</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            From current {incidents.length} queue entries (Total: {incidentList?.total ?? 0})
          </div>
        </div>

        {/* Normal Operating Equipment */}
        <div className="p-4 rounded-lg bg-[#0E1524] border border-[#1E293B] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Healthy Systems
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {assetsLoading ? '—' : assetCounts.normal}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {assets.length > 0 ? `${Math.round((assetCounts.normal / assets.length) * 100)}%` : '—'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Sensors operating within normal thresholds
          </div>
        </div>

        {/* Ingest Packet Status */}
        <div className="p-4 rounded-lg bg-[#0E1524] border border-[#1E293B] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Active Telemetry Stream
            </span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {telemetryLoading ? '—' : latestTelemetry?.items?.length ?? 0}
            </span>
            <span className="text-xs font-mono text-slate-400">Recent readings</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Streaming via <code className="text-slate-400 font-mono">/telemetry/latest</code>
          </div>
        </div>
      </div>

      {/* 3. Two-Column Operations Layout: Recent Incidents & Latest Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents Panel */}
        <div className="p-5 rounded-lg bg-[#0E1524] border border-[#1E293B] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Recent Abnormal Incidents</h3>
            </div>
            <Link
              to="/incidents"
              className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View all ({incidentList?.total ?? 0})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {incidentsLoading && <TableSkeleton rows={4} />}

          {incidentsIsError && (
            <ErrorState
              title="Failed to Load Incidents"
              error={incidentsError}
              onRetry={() => refetchIncidents()}
            />
          )}

          {!incidentsLoading && !incidentsIsError && incidents.length === 0 && (
            <EmptyState
              title="No Incidents Reported"
              description="No anomaly excursions currently active across plant equipment."
            />
          )}

          {!incidentsLoading && !incidentsIsError && incidents.length > 0 && (
            <div className="divide-y divide-[#1A2438]">
              {incidents.slice(0, 5).map((inc) => (
                <div
                  key={inc.id}
                  className="py-3 flex items-start justify-between gap-3 group hover:bg-slate-800/20 px-2 rounded transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={inc.severity} size="sm" />
                      <IncidentStatusBadge status={inc.status} size="sm" />
                      <span className="text-[10px] font-mono text-slate-500">
                        {inc.asset_id}
                      </span>
                    </div>
                    <Link
                      to={`/incidents/${inc.id}`}
                      className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors block truncate"
                    >
                      {inc.title}
                    </Link>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Observed: <Timestamp value={inc.last_observed_at} relative /> • {inc.occurrence_count} occurrences
                    </span>
                  </div>

                  <Link
                    to={`/incidents/${inc.id}`}
                    className="p-1.5 rounded bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white transition-colors shrink-0 mt-1"
                    title="Investigate incident"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Telemetry Stream Panel */}
        <div className="p-5 rounded-lg bg-[#0E1524] border border-[#1E293B] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Latest Telemetry Readings</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              10s interval
            </span>
          </div>

          {telemetryLoading && <TableSkeleton rows={4} />}

          {telemetryIsError && (
            <ErrorState
              title="Telemetry Ingestion Stream Error"
              error={telemetryError}
              onRetry={() => refetchTelemetry()}
            />
          )}

          {!telemetryLoading && !telemetryIsError && (!latestTelemetry || latestTelemetry.items.length === 0) && (
            <EmptyState
              title="No Telemetry Received"
              description="Waiting for incoming telemetry packets from industrial gateways."
            />
          )}

          {!telemetryLoading && !telemetryIsError && latestTelemetry && latestTelemetry.items.length > 0 && (
            <div className="divide-y divide-[#1A2438]">
              {latestTelemetry.items.slice(0, 5).map((reading) => (
                <div
                  key={reading.id}
                  className="py-3 flex items-center justify-between gap-3 px-2 rounded hover:bg-slate-800/20 transition-colors"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/assets/${reading.asset_id}`}
                        className="text-xs font-semibold text-slate-200 hover:text-blue-400 font-mono"
                      >
                        {reading.asset_id}
                      </Link>
                      <span className="text-[10px] font-mono text-slate-500">
                        {reading.sensor_id}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Measured: <Timestamp value={reading.timestamp} relative />
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-white block">
                      {formatTelemetryValue(reading.value, reading.unit)}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 block">
                      src: {reading.source_id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Monitored Assets Overview Table */}
      <div className="p-5 rounded-lg bg-[#0E1524] border border-[#1E293B] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Monitored Plant Assets</h3>
          </div>
          <Link
            to="/assets"
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Open Asset Inventory ({assetList?.total ?? 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {assetsLoading && <TableSkeleton rows={4} />}

        {assetsIsError && (
          <ErrorState
            title="Failed to Load Assets"
            error={assetsError}
            onRetry={() => refetchAssets()}
          />
        )}

        {!assetsLoading && !assetsIsError && assets.length === 0 && (
          <EmptyState
            title="No Assets Registered"
            description="The asset inventory is currently empty."
          />
        )}

        {!assetsLoading && !assetsIsError && assets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141C2E] text-slate-400 font-mono uppercase text-[11px] border-b border-[#1E293B]">
                <tr>
                  <th className="py-2.5 px-3">Equipment</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Seen</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2438]">
                {assets.slice(0, 5).map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-medium text-slate-200">
                      <Link to={`/assets/${asset.id}`} className="hover:text-blue-400">
                        {asset.name}
                      </Link>
                      <span className="font-mono text-[10px] text-slate-500 block">
                        {asset.id}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{asset.asset_type}</td>
                    <td className="py-3 px-3 text-slate-400">{asset.location || '—'}</td>
                    <td className="py-3 px-3">
                      <AssetStatusBadge status={asset.status} />
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      <Timestamp value={asset.last_seen_at} relative />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/assets/${asset.id}`}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
