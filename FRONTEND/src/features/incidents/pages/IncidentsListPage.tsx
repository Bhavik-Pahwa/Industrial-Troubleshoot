import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { queryKeys } from '../../../lib/queryKeys';
import { IncidentStatus, Severity } from '../../../api/types';
import { SeverityBadge } from '../../../components/data-display/SeverityBadge';
import { IncidentStatusBadge } from '../../../components/data-display/StatusBadge';
import { Timestamp } from '../../../components/data-display/Timestamp';
import { Pagination } from '../../../components/data-display/Pagination';
import { TableSkeleton } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { AlertTriangle, Filter, RotateCcw, ArrowRight, ShieldAlert } from 'lucide-react';

export const IncidentsListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query parameters
  const statusParam = (searchParams.get('status') as IncidentStatus) || undefined;
  const severityParam = (searchParams.get('severity') as Severity) || undefined;
  const assetIdParam = searchParams.get('asset_id') || undefined;
  const limitParam = parseInt(searchParams.get('limit') || '20', 10);
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);

  // Fetch incidents matching server-side filter parameters
  const {
    data: incidentList,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.incidents(statusParam, assetIdParam, severityParam, limitParam, offsetParam),
    queryFn: () => apiClient.listIncidents(statusParam, assetIdParam, severityParam, limitParam, offsetParam),
  });

  const updateParam = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.set('offset', '0'); // reset offset on filter change
    setSearchParams(next);
  };

  const handlePageChange = (newOffset: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('offset', String(newOffset));
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = !!(statusParam || severityParam || assetIdParam || offsetParam > 0);
  const incidents = incidentList?.items || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner and Filter Bar */}
      <div className="p-4 sm:p-5 rounded-lg bg-[#0E1524] border border-[#1E293B] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              Incident & Anomaly Queue
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Triage open detector anomalies, manage review lifecycle, and inspect historical resolutions.
            </p>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#1E293B]">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Lifecycle Status
            </label>
            <select
              value={statusParam || 'all'}
              onChange={(e) => updateParam('status', e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses (Open, Ack, Resolved)</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Anomaly Severity
            </label>
            <select
              value={severityParam || 'all'}
              onChange={(e) => updateParam('severity', e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Asset ID Filter */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Asset ID Filter
            </label>
            <input
              type="text"
              placeholder="Filter by asset_id (e.g. pump-101)..."
              value={assetIdParam || ''}
              onChange={(e) => updateParam('asset_id', e.target.value || undefined)}
              className="w-full px-3 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading && <TableSkeleton rows={6} />}

      {isError && (
        <ErrorState
          title="Could Not Load Incidents"
          error={error}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && incidents.length === 0 && (
        <EmptyState
          title="No Incidents Found"
          description={
            hasActiveFilters
              ? 'No incidents match the active server filter criteria.'
              : 'The incident queue is completely clear. No abnormal excursions recorded.'
          }
          icon={<AlertTriangle className="w-6 h-6 text-emerald-400" />}
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-500"
              >
                Clear Active Filters
              </button>
            ) : undefined
          }
        />
      )}

      {!isLoading && !isError && incidents.length > 0 && (
        <div className="rounded-lg bg-[#0E1524] border border-[#1E293B] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141C2E] border-b border-[#1E293B] text-slate-400 font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Incident Title & Category</th>
                  <th className="py-3 px-4">Asset ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Occurrences</th>
                  <th className="py-3 px-4">Last Observed</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2438]">
                {incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <Link
                        to={`/incidents/${incident.id}`}
                        className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors block"
                      >
                        {incident.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] text-blue-400/90 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/40">
                          {incident.anomaly_category}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          ID: {incident.id}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <Link
                        to={`/assets/${incident.asset_id}`}
                        className="hover:text-blue-400 underline decoration-slate-600 underline-offset-2"
                      >
                        {incident.asset_id}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <IncidentStatusBadge status={incident.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {incident.occurrence_count}×
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      <Timestamp value={incident.last_observed_at} relative />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/incidents/${incident.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 text-xs font-medium transition-colors"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {incidentList && (
            <div className="px-4 bg-[#0B101B]">
              <Pagination
                total={incidentList.total}
                limit={incidentList.limit}
                offset={incidentList.offset}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

