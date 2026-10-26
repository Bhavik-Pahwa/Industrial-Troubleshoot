import React from 'react';
import { AssetStatus, IncidentStatus, OverallSystemStatus } from '../../api/types';
import {
  getAssetStatusConfig,
  getIncidentStatusConfig,
  getSystemStatusConfig,
} from '../../lib/formatting';

interface AssetStatusBadgeProps {
  status: AssetStatus;
  size?: 'sm' | 'md';
}

export const AssetStatusBadge: React.FC<AssetStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = getAssetStatusConfig(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

interface IncidentStatusBadgeProps {
  status: IncidentStatus;
  size?: 'sm' | 'md';
}

export const IncidentStatusBadge: React.FC<IncidentStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = getIncidentStatusConfig(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

interface SystemStatusBadgeProps {
  status: OverallSystemStatus;
  size?: 'sm' | 'md';
}

export const SystemStatusBadge: React.FC<SystemStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = getSystemStatusConfig(status);
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-2 font-medium rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};

