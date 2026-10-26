import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { queryKeys } from '../../../lib/queryKeys';
import { SystemStatusBadge } from '../../../components/data-display/StatusBadge';
import { Timestamp } from '../../../components/data-display/Timestamp';
import { Database, Activity, Cpu, Sparkles, Clock, AlertTriangle } from 'lucide-react';

export const SystemStatusStrip: React.FC = () => {
  const { data: status, isError, isLoading, error } = useQuery({
    queryKey: queryKeys.systemStatus,
    queryFn: () => apiClient.getSystemStatus(),
    refetchInterval: 15000,
  });

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 animate-pulse">
        <div className="h-5 w-48 bg-slate-800 rounded mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-800/40 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !status) {
    return (
      <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/30 flex items-center gap-3 text-amber-200 text-sm">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <span>System component status query unavailable: {(error as Error)?.message || 'Connection failed'}</span>
      </div>
    );
  }

  const getPill = (val: string) => {
    switch (val) {
      case 'ready':
      case 'healthy':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'degraded':
      case 'stopped':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'unavailable':
      case 'error':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'not_configured':
      case 'disabled':
      default:
        return 'text-slate-400 bg-slate-800/50 border-slate-700/50';
    }
  };

  return (
    <div className="p-4 rounded-lg bg-[#0E1524] border border-[#1E293B] shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-[#1E293B] gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Backend Component Health
          </span>
          <SystemStatusBadge status={status.status} size="sm" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Last Telemetry:</span>
          {status.last_telemetry_at ? (
            <Timestamp value={status.last_telemetry_at} relative />
          ) : (
            <span className="text-slate-500 italic">No telemetry received yet</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        {/* Database */}
        <div className="p-2.5 rounded bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-300 font-medium">Database</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize border ${getPill(status.database)}`}>
            {status.database}
          </span>
        </div>

        {/* Ingestion */}
        <div className="p-2.5 rounded bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-300 font-medium">Ingestion</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize border ${getPill(status.ingestion)}`}>
            {status.ingestion}
          </span>
        </div>

        {/* Detector */}
        <div className="p-2.5 rounded bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-300 font-medium">Detector</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize border ${getPill(status.detector)}`}>
            {status.detector.replace('_', ' ')}
          </span>
        </div>

        {/* LLM */}
        <div className="p-2.5 rounded bg-slate-900/40 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-300 font-medium">LLM Runtime</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize border ${getPill(status.llm)}`}>
            {status.llm.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
};
