import React from 'react';
import { formatUtcDateTime, formatRelativeTime } from '../../lib/dates';

interface TimestampProps {
  value: string | null | undefined;
  relative?: boolean;
  className?: string;
}

export const Timestamp: React.FC<TimestampProps> = ({ value, relative = false, className = '' }) => {
  if (!value) {
    return <span className={`text-slate-500 italic ${className}`}>Not available</span>;
  }

  const utcText = formatUtcDateTime(value);
  const relText = formatRelativeTime(value);

  return (
    <span
      title={`${utcText} (${relText})`}
      className={`font-mono text-slate-300 ${className}`}
    >
      {relative ? relText : utcText}
    </span>
  );
};

