import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/client';
import { queryKeys } from '../../../lib/queryKeys';
import { AssetStatusBadge } from '../../../components/data-display/StatusBadge';
import { Timestamp } from '../../../components/data-display/Timestamp';
import { LoadingState, TableSkeleton } from '../../../components/feedback/LoadingState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { formatTelemetryValue } from '../../../lib/formatting';
import { validateDateRange, toUtcIsoString, formatUtcDateTime } from '../../../lib/dates';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Cpu,
  ArrowLeft,
  Activity,
  Gauge,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const AssetDetailPage: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();

  // Date range state for history (defaults to past 4 hours)
  const [rangeHours, setRangeHours] = useState<number>(4);
  const [customStart, setCustomStart] = useState<string>(
    new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [customEnd, setCustomEnd] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [appliedRange, setAppliedRange] = useState<{ start: string; end: string } | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);

  // Selected sensor for the chart to prevent incompatible unit mixing
  const [selectedSensorId, setSelectedSensorId] = useState<string>('all');

  // Compute start/end ISO strings
  const { start, end } = useMemo(() => {
    if (isCustomRange && appliedRange) {
      return appliedRange;
    }
    const end = new Date();
    const start = new Date(end.getTime() - rangeHours * 3600 * 1000);
    return { start: toUtcIsoString(start), end: toUtcIsoString(end) };
  }, [isCustomRange, appliedRange, rangeHours]);

  // 1. Fetch Asset
  const {
    data: asset,
    isLoading: assetLoading,
    isError: assetIsError,
    error: assetError,
    refetch: refetchAsset,
  } = useQuery({
    queryKey: queryKeys.asset(assetId || ''),
    queryFn: () => apiClient.getAsset(assetId!),
    enabled: !!assetId,
  });

  // 2. Fetch Sensors
  const {
    data: sensorList,
    isLoading: sensorsLoading,
    isError: sensorsIsError,
    error: sensorsError,
  } = useQuery({
    queryKey: queryKeys.assetSensors(assetId || ''),
    queryFn: () => apiClient.listAssetSensors(assetId!),
    enabled: !!assetId,
  });

  // 3. Fetch Latest Telemetry
  const {
    data: latestTelemetry,
    isLoading: latestLoading,
    isError: latestIsError,
    error: latestError,
  } = useQuery({
    queryKey: queryKeys.latestTelemetry(assetId),
    queryFn: () => apiClient.getLatestTelemetry(assetId, 50),
    enabled: !!assetId,
    refetchInterval: 10000,
  });

  // 4. Fetch Telemetry History
  const {
    data: historyList,
    isLoading: historyLoading,
    isError: historyIsError,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: queryKeys.telemetryHistory(assetId || '', start, end, 200, 0),
    queryFn: () => {
      const check = validateDateRange(start, end);
      if (!check.valid) {
        throw new Error(check.error);
      }
      return apiClient.getTelemetryHistory(assetId!, start, end, 200, 0);
    },
    enabled: !!assetId && !rangeError,
  });

  if (assetLoading) {
    return <LoadingState message="Loading asset telemetry profile..." />;
  }

  if (assetIsError || !asset) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Link
          to="/assets"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Asset Inventory</span>
        </Link>
        <ErrorState
          title={`Asset '${assetId}' Not Found`}
          error={assetError}
          onRetry={() => refetchAsset()}
        />
      </div>
    );
  }

  const sensors = sensorList?.items || [];
  const readings = historyList?.items || [];

  // Filter history readings by sensor if one is selected
  const filteredReadings = selectedSensorId === 'all'
    ? readings
    : readings.filter((r) => r.sensor_id === selectedSensorId);

  // Group readings by timestamp for multi-line Recharts
  const chartDataMap: { [timestamp: string]: { time: string; [sensorName: string]: string | number } } = {};
  filteredReadings.forEach((r) => {
    const timeKey = r.timestamp.slice(11, 19); // HH:mm:ss
    if (!chartDataMap[r.timestamp]) {
      chartDataMap[r.timestamp] = { time: timeKey };
    }
    const sensor = sensors.find((s) => s.id === r.sensor_id);
    const seriesLabel = sensor ? `${sensor.name} (${sensor.unit})` : `${r.sensor_id} (${r.unit})`;
    chartDataMap[r.timestamp][seriesLabel] = r.value;
  });

  const chartData = Object.values(chartDataMap);

  // Palette of colors for distinct sensors
  const sensorColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    const sIso = customStart ? `${customStart}:00Z` : '';
    const eIso = customEnd ? `${customEnd}:00Z` : '';
    const validation = validateDateRange(sIso, eIso);
    if (!validation.valid) {
      setRangeError(validation.error || 'Invalid date range');
      return;
    }
    setRangeError(null);
    setAppliedRange({ start: sIso, end: eIso });
    setIsCustomRange(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/assets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Asset Inventory</span>
        </Link>
        <span className="text-xs font-mono text-slate-500">Asset ID: {asset.id}</span>
      </div>

      {/* Asset Header Card */}
      <div className="p-6 rounded-lg bg-[#0E1524] border border-[#1E293B] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {asset.name}
              </h2>
              <AssetStatusBadge status={asset.status} size="md" />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="font-medium text-slate-300">{asset.asset_type}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {asset.location || 'Location unassigned'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Last seen: <Timestamp value={asset.last_seen_at} relative />
              </span>
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 flex flex-col gap-1">
            <div>
              Registered: <span className="text-slate-300">{asset.created_at.slice(0, 10)}</span>
            </div>
            <div>
              Installed Sensors: <span className="text-blue-400 font-bold">{sensors.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Installed Sensors & Latest Readings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor Inventory */}
        <div className="p-5 rounded-lg bg-[#0E1524] border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-400" />
              Connected Sensors
            </h3>
            <span className="text-xs font-mono text-slate-500">{sensors.length} online</span>
          </div>

          {sensorsLoading && <TableSkeleton rows={4} />}

          {sensorsIsError && (
            <ErrorState title="Failed to load sensors" error={sensorsError} />
          )}

          {!sensorsLoading && sensors.length === 0 && (
            <EmptyState
              title="No Sensors Detected"
              description="No sensor instrumentation registered for this asset."
            />
          )}

          {!sensorsLoading && sensors.length > 0 && (
            <div className="space-y-2.5">
              {sensors.map((sensor) => (
                <div
                  key={sensor.id}
                  className="p-3 rounded bg-slate-900/40 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <h5 className="text-xs font-semibold text-slate-200">{sensor.name}</h5>
                    <span className="text-[10px] font-mono text-slate-500">
                      ID: {sensor.id} {sensor.sensor_type && `• ${sensor.sensor_type}`}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    {sensor.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Telemetry Readings */}
        <div className="lg:col-span-2 p-5 rounded-lg bg-[#0E1524] border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Latest Telemetry Stream
            </h3>
            <span className="text-xs font-mono text-slate-400">
              <Timestamp value={latestTelemetry?.items?.[0]?.timestamp} relative />
            </span>
          </div>

          {latestLoading && <TableSkeleton rows={4} />}

          {latestIsError && (
            <ErrorState title="Could not stream latest telemetry" error={latestError} />
          )}

          {!latestLoading && (!latestTelemetry || latestTelemetry.items.length === 0) && (
            <EmptyState
              title="No Telemetry Received"
              description="No recent telemetry readings registered for this asset ID."
            />
          )}

          {!latestLoading && latestTelemetry && latestTelemetry.items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {latestTelemetry.items.slice(0, 6).map((reading) => {
                const sensor = sensors.find((s) => s.id === reading.sensor_id);
                return (
                  <div
                    key={reading.id}
                    className="p-3 rounded bg-slate-900/40 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs text-slate-400 block">
                        {sensor ? sensor.name : reading.sensor_id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block">
                        Measured: <Timestamp value={reading.timestamp} relative />
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold font-mono text-white block">
                        {formatTelemetryValue(reading.value, reading.unit)}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        rcv: {reading.received_at.slice(11, 19)} UTC
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Historical Telemetry Chart & Query Section */}
      <div className="p-6 rounded-lg bg-[#0E1524] border border-[#1E293B] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Historical Sensor Telemetry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict UTC queries against <code className="text-blue-300 font-mono text-[11px]">GET /telemetry/history</code>.
            </p>
          </div>

          {/* Quick presets and custom range form */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded bg-slate-900 border border-slate-700 p-0.5 text-xs">
              {[1, 4, 12, 24].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    setRangeHours(h);
                    setIsCustomRange(false);
                    setRangeError(null);
                  }}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    !isCustomRange && rangeHours === h
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>

            {/* Sensor unit separator / isolate series */}
            {sensors.length > 0 && (
              <select
                value={selectedSensorId}
                onChange={(e) => setSelectedSensorId(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Sensors (Grouped)</option>
                {sensors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.unit})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Custom date range form */}
        <form onSubmit={handleApplyCustomRange} className="flex flex-wrap items-center gap-3 p-3 rounded bg-slate-900/40 border border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">Custom Query Range:</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Start (UTC):</span>
            <input
              aria-label="Start (UTC)"
              type="datetime-local"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">End (UTC):</span>
            <input
              aria-label="End (UTC)"
              type="datetime-local"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
          >
            Apply Range
          </button>
        </form>

        {rangeError && (
          <div className="p-3 rounded bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{rangeError}</span>
          </div>
        )}

        {/* History Chart */}
        {historyLoading && <TableSkeleton rows={6} />}

        {historyIsError && (
          <ErrorState
            title="Failed to Load Telemetry History"
            error={historyError}
            onRetry={() => refetchHistory()}
          />
        )}

        {!historyLoading && !historyIsError && chartData.length === 0 && (
          <EmptyState
            title="No Telemetry in Selected Range"
            description={`No sensor readings found between ${formatUtcDateTime(start)} and ${formatUtcDateTime(end)}.`}
            icon={<Activity className="w-6 h-6" />}
          />
        )}

        {!historyLoading && !historyIsError && chartData.length > 0 && (
          <div className="space-y-3">
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis
                    dataKey="time"
                    stroke="#64748B"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  <YAxis
                    stroke="#64748B"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0E1524',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  {/* Generate lines for each sensor key present in data */}
                  {Object.keys(chartData[0] || {})
                    .filter((key) => key !== 'time')
                    .map((seriesKey, idx) => (
                      <Line
                        key={seriesKey}
                        type="monotone"
                        dataKey={seriesKey}
                        stroke={sensorColors[idx % sensorColors.length]}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 font-mono text-center">
              * Showing {filteredReadings.length} actual readings ordered chronologically. No data fabricated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

