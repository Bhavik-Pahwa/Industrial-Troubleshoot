import { Asset, Sensor, Incident, TelemetryReading, SystemStatus } from './types';

export const initialSystemStatus: SystemStatus = {
  status: 'healthy',
  database: 'ready',
  ingestion: 'ready',
  detector: 'ready',
  llm: 'ready',
  last_telemetry_at: new Date(Date.now() - 45 * 1000).toISOString(),
};

export const initialAssets: Asset[] = [
  {
    id: 'pump-101',
    name: 'Centrifugal Slurry Pump P-101',
    asset_type: 'Centrifugal Pump',
    location: 'Processing Unit 1 - Train A',
    status: 'critical',
    last_seen_at: new Date(Date.now() - 35 * 1000).toISOString(),
    created_at: '2026-08-10T08:00:00Z',
  },
  {
    id: 'comp-204',
    name: 'Reciprocating Gas Compressor C-204',
    asset_type: 'Gas Compressor',
    location: 'Compression Facility Bay 3',
    status: 'warning',
    last_seen_at: new Date(Date.now() - 55 * 1000).toISOString(),
    created_at: '2026-08-15T09:30:00Z',
  },
  {
    id: 'cnc-05',
    name: '5-Axis Precision Spindle CNC-05',
    asset_type: 'Milling Spindle',
    location: 'Advanced Fabrication Cell 4',
    status: 'warning',
    last_seen_at: new Date(Date.now() - 110 * 1000).toISOString(),
    created_at: '2026-09-01T11:15:00Z',
  },
  {
    id: 'motor-301',
    name: 'Heavy Induction Motor M-301',
    asset_type: 'Electric Motor',
    location: 'Cooling Water Pump House',
    status: 'normal',
    last_seen_at: new Date(Date.now() - 20 * 1000).toISOString(),
    created_at: '2026-07-22T06:45:00Z',
  },
  {
    id: 'heat-102',
    name: 'Shell & Tube Exchanger HX-102',
    asset_type: 'Heat Exchanger',
    location: 'Refining Unit 2',
    status: 'normal',
    last_seen_at: new Date(Date.now() - 90 * 1000).toISOString(),
    created_at: '2026-08-01T14:00:00Z',
  },
  {
    id: 'turbine-01',
    name: 'Main Cogeneration Steam Turbine ST-01',
    asset_type: 'Steam Turbine',
    location: 'Power Generation Hall',
    status: 'normal',
    last_seen_at: new Date(Date.now() - 15 * 1000).toISOString(),
    created_at: '2026-06-18T10:00:00Z',
  },
  {
    id: 'conveyor-12',
    name: 'Bulk Ore Feeder Conveyor CV-12',
    asset_type: 'Heavy Conveyor',
    location: null, // Test nullable location
    status: 'unknown',
    last_seen_at: null, // Test nullable last_seen_at
    created_at: '2026-10-01T12:00:00Z',
  },
];

export const initialSensors: Sensor[] = [
  // pump-101
  {
    id: 'sensor-p101-vib',
    asset_id: 'pump-101',
    name: 'Drive End Bearing Vibration',
    unit: 'mm/s',
    sensor_type: 'piezoelectric_accelerometer',
  },
  {
    id: 'sensor-p101-temp',
    asset_id: 'pump-101',
    name: 'Inboard Bearing Temperature',
    unit: '°C',
    sensor_type: 'rtd_pt100',
  },
  {
    id: 'sensor-p101-press',
    asset_id: 'pump-101',
    name: 'Suction Head Pressure',
    unit: 'bar',
    sensor_type: 'piezoresistive_pressure',
  },
  {
    id: 'sensor-p101-flow',
    asset_id: 'pump-101',
    name: 'Discharge Volumetric Flow',
    unit: 'm³/h',
    sensor_type: 'magnetic_flowmeter',
  },
  // comp-204
  {
    id: 'sensor-c204-vib',
    asset_id: 'comp-204',
    name: 'Crosshead Vibration Velocity',
    unit: 'mm/s',
    sensor_type: 'accelerometer',
  },
  {
    id: 'sensor-c204-temp',
    asset_id: 'comp-204',
    name: 'Stage 2 Cylinder Exhaust Temp',
    unit: '°C',
    sensor_type: 'thermocouple_k',
  },
  {
    id: 'sensor-c204-press',
    asset_id: 'comp-204',
    name: 'Interstage Discharge Pressure',
    unit: 'bar',
    sensor_type: 'pressure_transmitter',
  },
  // cnc-05
  {
    id: 'sensor-cnc-vib',
    asset_id: 'cnc-05',
    name: 'Spindle Radial Vibration',
    unit: 'mm/s',
    sensor_type: 'triaxial_accelerometer',
  },
  {
    id: 'sensor-cnc-rpm',
    asset_id: 'cnc-05',
    name: 'Spindle Rotational Speed',
    unit: 'RPM',
    sensor_type: 'optical_encoder',
  },
  // motor-301
  {
    id: 'sensor-m301-curr',
    asset_id: 'motor-301',
    name: 'Phase A Stator Current',
    unit: 'A',
    sensor_type: 'current_transformer',
  },
  {
    id: 'sensor-m301-temp',
    asset_id: 'motor-301',
    name: 'Stator Winding Core Temp',
    unit: '°C',
    sensor_type: 'rtd_pt100',
  },
  // turbine-01
  {
    id: 'sensor-st01-press',
    asset_id: 'turbine-01',
    name: 'Inlet Steam Throttle Pressure',
    unit: 'bar',
    sensor_type: 'high_pressure_strain_gauge',
  },
  {
    id: 'sensor-st01-temp',
    asset_id: 'turbine-01',
    name: 'Exhaust Steam Condenser Temp',
    unit: '°C',
    sensor_type: 'rtd_pt100',
  },
];

export const initialIncidents: Incident[] = [
  {
    id: 'inc-9201',
    asset_id: 'pump-101',
    anomaly_category: 'bearing_degradation',
    title: 'High Vibration Excursion on Drive-End Bearing',
    description: 'Vibration velocity surpassed critical threshold (14.2 mm/s vs 7.1 mm/s baseline limit) with prominent 2x running speed harmonics indicative of inner race spalling.',
    severity: 'critical',
    status: 'open',
    created_at: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    last_observed_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    acknowledged_at: null,
    resolved_at: null,
    resolution_note: null,
    occurrence_count: 14,
    latest_evidence: {
      rms_velocity_mm_s: 14.2,
      iso_threshold_mm_s: 7.1,
      peak_frequency_hz: 119.8,
      kurtosis_score: 5.2,
      detector_confidence: 0.96,
      subsystem: 'Drive End Housing',
    },
  },
  {
    id: 'inc-9202',
    asset_id: 'comp-204',
    anomaly_category: 'thermal_stress',
    title: 'Stage 2 Cylinder Exhaust Differential Overheat',
    description: 'Cylinder exhaust temperature rose 32°C above adjacent stages within 15 minutes, exceeding allowable differential tolerance.',
    severity: 'high',
    status: 'acknowledged',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    last_observed_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    acknowledged_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    resolved_at: null,
    resolution_note: null,
    occurrence_count: 5,
    latest_evidence: {
      measured_temp_c: 168.4,
      threshold_max_c: 145.0,
      differential_c: 32.1,
      valve_cycle_rate_hz: 4.8,
    },
  },
  {
    id: 'inc-9203',
    asset_id: 'cnc-05',
    anomaly_category: 'harmonic_resonance',
    title: 'Spindle High-Speed Tool Chatter Resonance',
    description: 'Radial accelerometer detected high frequency chatter harmonic around 3.2 kHz during titanium roughing cycle.',
    severity: 'medium',
    status: 'open',
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    last_observed_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    acknowledged_at: null,
    resolved_at: null,
    resolution_note: null,
    occurrence_count: 3,
    latest_evidence: {
      chatter_amplitude_g: 3.4,
      resonance_frequency_hz: 3210,
      feed_rate_mm_min: 1200,
    },
  },
  {
    id: 'inc-9190',
    asset_id: 'pump-101',
    anomaly_category: 'cavitation_instability',
    title: 'Suction Port Cavitation & Vapor Voiding',
    description: 'Broadband acoustic signature detected at suction flange coinciding with transient drop in net positive suction head (NPSH).',
    severity: 'critical',
    status: 'resolved',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    last_observed_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 17 * 3600 * 1000).toISOString(),
    acknowledged_at: new Date(Date.now() - 23 * 3600 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 17 * 3600 * 1000).toISOString(),
    resolution_note: 'Cleaned suction strainer basket and primed upstream booster loop. NPSH restored to 4.2 bar.',
    occurrence_count: 8,
    latest_evidence: {
      cavitation_index: 0.18,
      suction_pressure_bar: 1.1,
      expected_min_bar: 2.8,
    },
  },
  {
    id: 'inc-9182',
    asset_id: 'motor-301',
    anomaly_category: 'electrical_imbalance',
    title: 'Phase A Transient Current Sag',
    description: 'Minor 6% current sag observed on Phase A line current during grid switching sequence.',
    severity: 'low',
    status: 'resolved',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    last_observed_at: new Date(Date.now() - 47 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
    acknowledged_at: new Date(Date.now() - 46 * 3600 * 1000).toISOString(),
    resolved_at: new Date(Date.now() - 44 * 3600 * 1000).toISOString(),
    resolution_note: 'Verified transformer tap position and confirmed balanced feeder lines.',
    occurrence_count: 1,
    latest_evidence: {
      imbalance_percentage: 6.2,
      duration_ms: 450,
    },
  },
];

/**
 * Generate 60 historical readings for a given asset over time
 */
export function generateMockTelemetryReadings(): TelemetryReading[] {
  const readings: TelemetryReading[] = [];
  const now = Date.now();
  let idCounter = 10000;

  // Let's generate points for pump-101 over the last 4 hours (every 4 minutes)
  for (let i = 60; i >= 0; i--) {
    const timestamp = new Date(now - i * 4 * 60 * 1000).toISOString();
    const receivedAt = new Date(now - i * 4 * 60 * 1000 + 400).toISOString();

    // Normal baseline vibration ~4.5 mm/s, rising sharply in the last 15 steps to 14.5 mm/s!
    const isAnomalyZone = i <= 15;
    const vibVal = isAnomalyZone
      ? 11.0 + Math.sin(i) * 2.5 + (15 - i) * 0.25
      : 4.2 + Math.sin(i * 0.5) * 0.8;

    const tempVal = isAnomalyZone
      ? 82.0 + (15 - i) * 0.8 + Math.cos(i) * 1.2
      : 65.0 + Math.sin(i * 0.3) * 2.0;

    const pressVal = 3.6 + Math.sin(i * 0.2) * 0.4;
    const flowVal = 185 + Math.cos(i * 0.4) * 8.0;

    readings.push({
      id: idCounter++,
      source_id: 'edge-gateway-plc-01',
      asset_id: 'pump-101',
      sensor_id: 'sensor-p101-vib',
      value: Number(vibVal.toFixed(2)),
      unit: 'mm/s',
      timestamp,
      received_at: receivedAt,
    });

    readings.push({
      id: idCounter++,
      source_id: 'edge-gateway-plc-01',
      asset_id: 'pump-101',
      sensor_id: 'sensor-p101-temp',
      value: Number(tempVal.toFixed(2)),
      unit: '°C',
      timestamp,
      received_at: receivedAt,
    });

    readings.push({
      id: idCounter++,
      source_id: 'edge-gateway-plc-01',
      asset_id: 'pump-101',
      sensor_id: 'sensor-p101-press',
      value: Number(pressVal.toFixed(2)),
      unit: 'bar',
      timestamp,
      received_at: receivedAt,
    });

    readings.push({
      id: idCounter++,
      source_id: 'edge-gateway-plc-01',
      asset_id: 'pump-101',
      sensor_id: 'sensor-p101-flow',
      value: Number(flowVal.toFixed(1)),
      unit: 'm³/h',
      timestamp,
      received_at: receivedAt,
    });
  }

  // Also add some recent readings for comp-204 and motor-301
  const recentTime = new Date(now - 30 * 1000).toISOString();
  readings.push({
    id: idCounter++,
    source_id: 'edge-gateway-plc-02',
    asset_id: 'comp-204',
    sensor_id: 'sensor-c204-temp',
    value: 168.4,
    unit: '°C',
    timestamp: recentTime,
    received_at: recentTime,
  });
  readings.push({
    id: idCounter++,
    source_id: 'edge-gateway-plc-02',
    asset_id: 'comp-204',
    sensor_id: 'sensor-c204-vib',
    value: 8.9,
    unit: 'mm/s',
    timestamp: recentTime,
    received_at: recentTime,
  });
  readings.push({
    id: idCounter++,
    source_id: 'edge-gateway-plc-03',
    asset_id: 'motor-301',
    sensor_id: 'sensor-m301-curr',
    value: 142.3,
    unit: 'A',
    timestamp: recentTime,
    received_at: recentTime,
  });

  return readings;
}
