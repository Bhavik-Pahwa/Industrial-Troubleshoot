import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  Server,
  UploadCloud,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const navItems = [
    { to: '/dashboard', label: 'Operations Overview', icon: LayoutDashboard },
    { to: '/assets', label: 'Asset Inventory', icon: Cpu },
    { to: '/incidents', label: 'Incident Queue', icon: AlertTriangle },
    { to: '/system', label: 'System Health', icon: Server },
    { to: '/ingest', label: 'Telemetry Ingest Tool', icon: UploadCloud },
  ];

  return (
    <aside className="w-64 bg-[#0D131F] border-r border-[#1E293B] flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-[#1E293B]">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:from-blue-500 group-hover:to-indigo-600 transition-all">
            <span className="font-mono font-bold text-base text-white tracking-wider">IX</span>
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              INDUX
              <span className="text-[10px] font-mono font-normal uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                v0.1
              </span>
            </span>
            <span className="block text-[10px] text-slate-400 tracking-wide font-mono uppercase">
              Industrial Telemetry
            </span>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-mono uppercase tracking-wider text-slate-300">
          Monitoring Views
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[11px] font-mono uppercase tracking-wider text-slate-300">
          Public Experience
        </div>
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Landing Page
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Open ↗</span>
        </Link>
      </nav>

      {/* Operational Guardrails info box */}
      <div className="p-3 m-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Read-Only Integration</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          SCADA & PLC telemetry is monitored via API. Actuator write commands are strictly disabled.
        </p>
      </div>
    </aside>
  );
};

