import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { InduxApiError } from '../../api/errors';

interface ErrorStateProps {
  title?: string;
  error: Error | InduxApiError | unknown;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Operational Data Error',
  error,
  onRetry,
  className = 'p-6',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  let message = 'An unexpected error occurred while communicating with the backend API.';
  let code: string | undefined;
  let status: number | undefined;
  let details: Array<Record<string, unknown>> = [];

  if (error instanceof InduxApiError) {
    message = error.message;
    code = error.code;
    status = error.status;
    details = error.details;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div
      className={`rounded-lg border border-rose-500/30 bg-rose-950/20 text-rose-200 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-rose-300">{title}</h4>
            {code && (
              <span className="px-1.5 py-0.5 text-xs font-mono rounded bg-rose-900/60 text-rose-300 border border-rose-700/50">
                {code}
              </span>
            )}
            {status !== undefined && status > 0 && (
              <span className="text-xs text-rose-400/80">({status})</span>
            )}
          </div>
          <p className="text-sm text-rose-200/90 mt-1">{message}</p>

          {details && details.length > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs flex items-center gap-1 text-rose-400 hover:text-rose-300 underline font-mono"
              >
                {showDetails ? 'Hide diagnostics' : 'Show diagnostics details'}
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showDetails && (
                <pre className="mt-2 p-2 rounded bg-black/50 text-xs font-mono text-rose-300 overflow-x-auto max-h-40 border border-rose-900/50">
                  {JSON.stringify(details, null, 2)}
                </pre>
              )}
            </div>
          )}

          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-rose-900/40 hover:bg-rose-900/60 text-rose-200 border border-rose-700/50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

