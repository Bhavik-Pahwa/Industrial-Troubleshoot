import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading operational telemetry...',
  className = 'py-12',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
      <p className="text-sm text-slate-400 font-medium">{message}</p>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-slate-800/40 rounded border border-slate-800" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 bg-slate-900/50 rounded border border-slate-800/60" />
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-6 rounded-lg bg-slate-900/60 border border-slate-800 animate-pulse space-y-4">
      <div className="h-4 w-1/3 bg-slate-800 rounded" />
      <div className="h-8 w-1/2 bg-slate-800/60 rounded" />
      <div className="h-3 w-3/4 bg-slate-800/40 rounded" />
    </div>
  );
};
