import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  Server,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Radio,
  Layers,
  ChevronRight,
  Zap,
  Gauge,
  Database,
  Eye,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* 1. Marketing Navigation */}
      <nav className="border-b border-[#1A2333] bg-[#070A10]/85 backdrop-blur-md sticky top-0 z-40 px-6 lg:px-12 h-18 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-mono font-bold text-base text-white tracking-wider">IX</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white font-sans">INDUX</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Local-First
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-slate-300 font-medium">
            <a href="#capabilities" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#security" className="hover:text-white transition-colors">
              Security & Guardrails
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02]"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-24 px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="text-center max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-xs text-blue-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Industrial Telemetry & Incident Intelligence Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Operational Clarity for Heavy Industrial Assets
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Detect equipment degradation, thermal excursions, and vibration anomalies early. Built with a local-first, read-only architecture that protects industrial SCADA and PLCs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white shadow-xl shadow-blue-600/25 transition-all"
            >
              <span>Launch Operations Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#capabilities"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-slate-200 border border-slate-800 transition-colors"
            >
              <span>Explore Capabilities</span>
            </a>
          </div>
        </div>

        {/* 3. Hero Visual - Composed Dashboard Preview */}
        <div className="mt-16 rounded-xl bg-[#0D131F] border border-[#23304B] shadow-2xl p-4 sm:p-6 space-y-4 max-w-5xl mx-auto relative group">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-slate-300">INDUX Operations Center — Live View</span>
            </div>
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              API Connected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Centrifugal Pump P-101</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-rose-400">14.2 mm/s</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Critical
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">Drive End Bearing Vibration</span>
            </div>

            <div className="p-3.5 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Gas Compressor C-204</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-amber-400">168.4 °C</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Warning
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">Stage 2 Exhaust Temperature</span>
            </div>

            <div className="p-3.5 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-mono uppercase text-slate-400 block">Induction Motor M-301</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono text-emerald-400">142.3 A</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Normal
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">Balanced Stator Current</span>
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Incident INC-9201: High Vibration Excursion on Drive-End Bearing</span>
            <Link
              to="/dashboard"
              className="text-blue-400 hover:text-blue-300 font-mono text-[11px] flex items-center gap-1"
            >
              View in Dashboard <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Problem & Operational Context */}
      <section className="py-20 px-6 lg:px-12 border-t border-[#1A2333] bg-[#0A0E17]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase text-rose-400 font-semibold tracking-wider">
              The Operational Problem
            </span>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Scattered Telemetry Leads to Unplanned Equipment Outages
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Industrial plants generate thousands of telemetry points per second across disjointed PLCs and SCADA networks. Subtle early failure signatures are easily missed until catastrophic mechanical failure occurs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Alarm Fatigue</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operators are inundated with noisy alarms without clear severity triage or prioritized historical context.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Gauge className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Siloed Sensor Streams</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Correlating vibration, temperature, and hydraulic pressure across related machinery requires manual, error-prone effort.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Air-Gapped Realities</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Critical OT environments cannot send proprietary plant telemetry to public cloud AI platforms without risking operational safety.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Core Capabilities */}
      <section id="capabilities" className="py-20 px-6 lg:px-12 border-t border-[#1A2333] max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-mono uppercase text-blue-400 font-semibold tracking-wider">
            Key Capabilities
          </span>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Engineered for Industrial Telemetry Monitoring
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            INDUX provides the presentation and anomaly intelligence layer for operations teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-3">
            <Cpu className="w-6 h-6 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Asset Inventory & Registry</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scan operational status (normal, warning, critical, unknown) and physical locations across all connected equipment.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-3">
            <Activity className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Telemetry & Time-Series History</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stream latest sensor readings and plot rigorous chronological history with ISO 8601 UTC time ranges and unit isolation.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-3">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
            <h3 className="text-base font-semibold text-white">Incident Lifecycle Management</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track open anomalies, acknowledge active alerts, and record auditable remediation notes upon formal resolution.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-3">
            <Server className="w-6 h-6 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">Subsystem Health Monitoring</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Distinguishes HTTP process reachability from database, ingestion engine, anomaly detector, and local LLM runtime health.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-3">
            <Radio className="w-6 h-6 text-cyan-400" />
            <h3 className="text-base font-semibold text-white">Local-First Deployment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Runs on-premise alongside plant edge gateways at <code className="text-xs text-cyan-300">127.0.0.1:8000</code>. No mandatory public cloud dependency.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-semibold text-white">Read-Only Safety Boundaries</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strictly read-only monitoring. The frontend cannot issue actuator write commands, setpoint adjustments, or SCADA override controls.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Technical Architecture Flow */}
      <section id="architecture" className="py-20 px-6 lg:px-12 border-t border-[#1A2333] bg-[#0A0E17]">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono uppercase text-blue-400 font-semibold tracking-wider">
              Data Pipeline & Architecture
            </span>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              From Edge Sensor to Incident Triage
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              How telemetry flows through the INDUX architecture conforming to the OpenAPI 3.1.0 contract.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div className="p-5 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-2">
              <span className="text-[10px] font-mono uppercase text-blue-400 block font-semibold">Step 1</span>
              <Gauge className="w-6 h-6 text-blue-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">Plant Sensors & PLCs</h4>
              <p className="text-[11px] text-slate-400">Vibration, temperature, and pressure instrumentation</p>
            </div>

            <div className="p-5 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-2">
              <span className="text-[10px] font-mono uppercase text-cyan-400 block font-semibold">Step 2</span>
              <Database className="w-6 h-6 text-cyan-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">Ingestion Engine</h4>
              <p className="text-[11px] text-slate-400">Validates batches up to 500 readings via /telemetry/ingest</p>
            </div>

            <div className="p-5 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-2">
              <span className="text-[10px] font-mono uppercase text-amber-400 block font-semibold">Step 3</span>
              <Cpu className="w-6 h-6 text-amber-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">Anomaly Detectors</h4>
              <p className="text-[11px] text-slate-400">Heuristics & threshold models classify abnormal signatures</p>
            </div>

            <div className="p-5 rounded-xl bg-[#0E1524] border border-[#1E293B] space-y-2">
              <span className="text-[10px] font-mono uppercase text-emerald-400 block font-semibold">Step 4</span>
              <LayoutDashboard className="w-6 h-6 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-semibold text-white">INDUX Dashboard</h4>
              <p className="text-[11px] text-slate-400">Operator review, acknowledgement, and resolution</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Security & Guardrails */}
      <section id="security" className="py-16 px-6 lg:px-12 border-t border-[#1A2333] max-w-5xl mx-auto">
        <div className="p-8 rounded-2xl bg-[#0E1524] border border-[#1E293B] space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Industrial Safety & Security Guardrails</h3>
              <p className="text-xs text-slate-400">Strict principles enforced across the entire frontend implementation.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white block">No Actuator Control:</span>
                The frontend strictly exposes zero write operations to SCADA or PLCs.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white block">Honest Freshness:</span>
                Displays true API timestamps and clearly marks missing or unavailable data.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white block">Subsystem Independence:</span>
                A failing detector or LLM does not crash the asset inventory or telemetry views.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white block">No Fake Claims:</span>
                Zero fabricated production stats, uptime claims, or fake predictive percentages.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Call to Action */}
      <section className="py-20 px-6 lg:px-12 border-t border-[#1A2333] text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Ready to Inspect Industrial Telemetry?
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Open the operations console to explore asset health, real-time sensor streams, and incident management.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-105"
        >
          <span>Open Operations Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* 9. Footer */}
      <footer className="border-t border-[#1A2333] py-8 px-6 lg:px-12 text-center text-xs text-slate-500 font-mono">
        <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">INDUX</span>
            <span>•</span>
            <span>OpenAPI 3.1.0 Contract v0.1.0</span>
          </div>
          <div>
            Local-first Industrial Telemetry Monitoring & Incident Intelligence
          </div>
        </div>
      </footer>
    </div>
  );
};
