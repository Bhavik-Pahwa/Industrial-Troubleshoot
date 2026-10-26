import React from 'react';
import { Severity } from '../../api/types';
import { getIncidentSeverityConfig } from '../../lib/formatting';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'sm' }) => {
  const config = getIncidentSeverityConfig(severity);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wider rounded border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
};

