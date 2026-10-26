import { AssetStatus, IncidentStatus, Severity, OverallSystemStatus } from '../api/types';

export function getAssetStatusConfig(status: AssetStatus) {
  switch (status) {
    case 'normal':
      return {
        label: 'Normal',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        dotColor: 'bg-emerald-400',
      };
    case 'warning':
      return {
        label: 'Warning',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        dotColor: 'bg-amber-400',
      };
    case 'critical':
      return {
        label: 'Critical',
        textColor: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        dotColor: 'bg-rose-400',
      };
    case 'unknown':
    default:
      return {
        label: 'Unknown',
        textColor: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        dotColor: 'bg-slate-400',
      };
  }
}

export function getIncidentSeverityConfig(severity: Severity) {
  switch (severity) {
    case 'low':
      return {
        label: 'Low',
        textColor: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
      };
    case 'medium':
      return {
        label: 'Medium',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
      };
    case 'high':
      return {
        label: 'High',
        textColor: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
      };
    case 'critical':
      return {
        label: 'Critical',
        textColor: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
      };
  }
}

export function getIncidentStatusConfig(status: IncidentStatus) {
  switch (status) {
    case 'open':
      return {
        label: 'Open',
        textColor: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        dotColor: 'bg-rose-400 animate-pulse',
      };
    case 'acknowledged':
      return {
        label: 'Acknowledged',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        dotColor: 'bg-amber-400',
      };
    case 'resolved':
      return {
        label: 'Resolved',
        textColor: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        dotColor: 'bg-slate-400',
      };
  }
}

export function getSystemStatusConfig(status: OverallSystemStatus) {
  switch (status) {
    case 'healthy':
      return {
        label: 'System Operational',
        textColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        dotColor: 'bg-emerald-400',
      };
    case 'degraded':
      return {
        label: 'System Degraded',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        dotColor: 'bg-amber-400',
      };
    case 'unavailable':
      return {
        label: 'System Unavailable',
        textColor: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        dotColor: 'bg-rose-400',
      };
  }
}

export function formatTelemetryValue(val: number, unit?: string): string {
  const formattedVal = Number.isInteger(val) ? val.toString() : val.toFixed(2);
  return unit ? `${formattedVal} ${unit}` : formattedVal;
}

