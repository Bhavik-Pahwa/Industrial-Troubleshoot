import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, Server, AlertTriangle } from 'lucide-react';
import { apiClient, ConnectionMode } from '../../api/client';

export const ConnectionState: React.FC = () => {
  const [mode, setMode] = useState<ConnectionMode>(apiClient.getMode());
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    return apiClient.onModeChange((newMode) => {
      setMode(newMode);
    });
  }, []);

  const handleRetryCheck = async () => {
    setChecking(true);
    await apiClient.checkHealthInitial();
    setChecking(false);
  };

  const handleToggleMock = () => {
    if (mode === 'live') {
      apiClient.setMode('mock');
    } else {
      apiClient.setMode('live');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {mode === 'live' ? (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Server className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Backend API Live</span>
          <span className="text-[10px] text-emerald-500/70 font-mono hidden md:inline">127.0.0.1:8000</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <Radio className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Demo Simulation Mode</span>
          <button
            type="button"
            onClick={handleRetryCheck}
            disabled={checking}
            title="Check for live backend on 127.0.0.1:8000"
            className="ml-1 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* Mode switcher button for development/demonstration evaluation */}
      <button
        type="button"
        onClick={handleToggleMock}
        className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50 transition-colors"
        title={mode === 'live' ? 'Switch to local Mock Engine' : 'Switch to Live API endpoint'}
      >
        {mode === 'live' ? 'Use Mock' : 'Use Live'}
      </button>
    </div>
  );
};

