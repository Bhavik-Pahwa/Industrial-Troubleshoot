import React from 'react';
import { Menu, RefreshCw } from 'lucide-react';
import { ConnectionState } from '../feedback/ConnectionState';

interface TopbarProps {
  title: string;
  subtitle?: string;
  lastRefreshTime?: Date | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  lastRefreshTime,
  isRefreshing = false,
  onRefresh,
  onOpenMobileMenu,
}) => {
  return (
    <header className="h-16 bg-[#0B101B]/90 backdrop-blur-md border-b border-[#1E293B] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Connection pill */}
        <ConnectionState />

        {/* Last refreshed timestamp and trigger */}
        {onRefresh && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            {lastRefreshTime && (
              <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">
                Updated {lastRefreshTime.toISOString().slice(11, 19)} UTC
              </span>
            )}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 text-xs font-medium text-slate-200 border border-slate-700/60 transition-colors"
              title="Refresh operational telemetry data"
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
