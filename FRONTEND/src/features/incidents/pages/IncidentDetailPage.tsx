import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { queryKeys } from '../../../lib/queryKeys';
import { SeverityBadge } from '../../../components/data-display/SeverityBadge';
import { IncidentStatusBadge } from '../../../components/data-display/StatusBadge';
import { Timestamp } from '../../../components/data-display/Timestamp';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { useToast } from '../../../components/feedback/ToastRegion';
import { InduxApiError } from '../../../api/errors';
import {
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  AlertOctagon,
  Cpu,
  Info,
  ExternalLink,
  Check,
} from 'lucide-react';

export const IncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  // 1. Fetch Incident Details
  const {
    data: incident,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.incident(incidentId || ''),
    queryFn: () => apiClient.getIncident(incidentId!),
    enabled: !!incidentId,
  });

  // 2. Acknowledge Mutation
  const acknowledgeMutation = useMutation({
    mutationFn: () => apiClient.acknowledgeIncident(incidentId!),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.incident(incidentId!), updated);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      showToast('success', 'Incident Acknowledged', `Incident ${updated.id} status changed to acknowledged.`);
    },
    onError: (err: unknown) => {
      if (err instanceof InduxApiError && err.status === 409) {
        showToast('error', 'Conflict (409)', 'Incident has already been resolved on the server.');
        refetch();
      } else {
        showToast('error', 'Acknowledgement Failed', (err as Error).message);
      }
    },
  });

  // 3. Resolve Mutation
  const resolveMutation = useMutation({
    mutationFn: (note?: string) => apiClient.resolveIncident(incidentId!, note),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.incident(incidentId!), updated);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      setResolveModalOpen(false);
      setResolutionNote('');
      showToast('success', 'Incident Resolved', `Incident ${updated.id} closed successfully.`);
    },
    onError: (err: unknown) => {
      if (err instanceof InduxApiError && err.status === 409) {
        showToast('error', 'Conflict (409)', 'Incident is already resolved on the server.');
        refetch();
      } else {
        showToast('error', 'Resolution Failed', (err as Error).message);
      }
    },
  });

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resolutionNote.length > 1000) {
      setNoteError('Resolution note cannot exceed 1000 characters');
      return;
    }
    setNoteError(null);
    resolveMutation.mutate(resolutionNote.trim() || undefined);
  };

  if (isLoading) {
    return <LoadingState message="Retrieving incident telemetry forensics..." />;
  }

  if (isError || !incident) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incident Queue</span>
        </Link>
        <ErrorState
          title={`Incident '${incidentId}' Not Found`}
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isResolved = incident.status === 'resolved';
  const isAcknowledged = incident.status === 'acknowledged';
  const isOpen = incident.status === 'open';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incident Queue</span>
        </Link>
        <span className="text-xs font-mono text-slate-500">Incident ID: {incident.id}</span>
      </div>

      {/* Main Incident Card */}
      <div className="p-6 rounded-lg bg-[#0E1524] border border-[#1E293B] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#1E293B] pb-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <SeverityBadge severity={incident.severity} size="md" />
              <IncidentStatusBadge status={incident.status} size="md" />
              <span className="text-xs font-mono text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-900/50">
                {incident.anomaly_category}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {incident.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Cpu className="w-4 h-4 text-slate-500" />
              <span>Target Asset:</span>
              <Link
                to={`/assets/${incident.asset_id}`}
                className="font-mono text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>{incident.asset_id}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isOpen && (
              <button
                type="button"
                onClick={() => acknowledgeMutation.mutate()}
                disabled={acknowledgeMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-xs font-semibold text-white shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{acknowledgeMutation.isPending ? 'Acknowledging...' : 'Acknowledge Incident'}</span>
              </button>
            )}

            {!isResolved && (
              <button
                type="button"
                onClick={() => setResolveModalOpen(true)}
                disabled={resolveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Resolve Incident</span>
              </button>
            )}

            {isResolved && (
              <div className="px-3.5 py-2 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Incident Closed</span>
              </div>
            )}
          </div>
        </div>

        {/* Description Section */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Description & Operational Context
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/40 p-4 rounded border border-slate-800">
            {incident.description || 'No detailed technical narrative provided.'}
          </p>
        </div>

        {/* Timestamps and Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded bg-slate-900/40 border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
              Total Occurrences
            </span>
            <span className="text-base font-bold font-mono text-white mt-1 block">
              {incident.occurrence_count}×
            </span>
          </div>

          <div className="p-3 rounded bg-slate-900/40 border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
              Created At
            </span>
            <Timestamp value={incident.created_at} className="text-xs mt-1 block" />
          </div>

          <div className="p-3 rounded bg-slate-900/40 border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
              Last Observed
            </span>
            <Timestamp value={incident.last_observed_at} className="text-xs mt-1 block" />
          </div>

          <div className="p-3 rounded bg-slate-900/40 border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
              Acknowledged At
            </span>
            <Timestamp value={incident.acknowledged_at} className="text-xs mt-1 block" />
          </div>
        </div>

        {/* Resolution Note display if resolved */}
        {incident.resolution_note && (
          <div className="space-y-2 p-4 rounded bg-emerald-950/20 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Resolution Note
              </span>
              <span className="text-[11px] font-mono text-emerald-400/70">
                Resolved at: <Timestamp value={incident.resolved_at} />
              </span>
            </div>
            <p className="text-sm text-emerald-100/90 leading-relaxed pt-1">
              {incident.resolution_note}
            </p>
          </div>
        )}

        {typeof incident.latest_evidence?.explanation === 'string' && (
          <section className="space-y-3 p-4 rounded bg-slate-900/60 border border-slate-700">
            <h4 className="text-sm font-semibold text-white">AI Assessment</h4>
            <p className="text-sm text-slate-200 leading-relaxed">{incident.latest_evidence.explanation}</p>
            {typeof incident.latest_evidence.recommended_action === 'string' && (
              <p className="text-sm text-slate-300">{incident.latest_evidence.recommended_action}</p>
            )}
            <p className="text-xs text-slate-400">
              {incident.latest_evidence.analysis_source === 'ollama'
                ? `Generated by ${String(incident.latest_evidence.model)}`
                : 'Threshold-based fallback; language model unavailable'}
            </p>
          </section>
        )}

        {/* Latest Evidence Forensic Inspector */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Latest Forensic Evidence (API Object)
            </h4>
            <span className="text-[11px] font-mono text-slate-500">Defensive Key/Value Inspection</span>
          </div>

          {Object.keys(incident.latest_evidence || {}).length === 0 ? (
            <p className="text-xs text-slate-500 italic p-4 rounded bg-slate-900/30 border border-slate-800">
              No supplementary telemetry evidence payload attached.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(incident.latest_evidence).map(([key, val]) => (
                <div key={key} className="p-3 rounded bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block truncate" title={key}>
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-mono font-semibold text-blue-300 mt-1 block truncate" title={String(val)}>
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Raw JSON expander for audit verification */}
          <details className="mt-3 text-xs text-slate-400">
            <summary className="cursor-pointer hover:text-slate-200 font-mono py-1">
              View Raw JSON Evidence Payload
            </summary>
            <pre className="mt-2 p-3 rounded bg-black/60 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
              {JSON.stringify(incident.latest_evidence, null, 2)}
            </pre>
          </details>
        </div>
      </div>

      {/* Resolve Incident Confirmation Modal */}
      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl bg-[#0E1524] border border-[#1E293B] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Resolve Incident {incident.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setResolveModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Resolving will update the incident lifecycle status to <span className="font-mono text-emerald-400">resolved</span>. You may record an optional root-cause or remediation note (max 1000 characters).
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Remediation Note (Optional)</span>
                  <span className={`text-[11px] font-mono ${resolutionNote.length > 1000 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {resolutionNote.length} / 1000
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g., Replaced mechanical seal on drive end, aligned motor couplings, and verified vibration velocity returned to 3.8 mm/s baseline..."
                  className="w-full p-3 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                />
                {noteError && <p className="text-xs text-rose-400 mt-1">{noteError}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolveMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors"
                >
                  {resolveMutation.isPending ? 'Submitting...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

