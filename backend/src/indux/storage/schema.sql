CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, asset_type TEXT NOT NULL,
    location TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sensors (
    asset_id TEXT NOT NULL REFERENCES assets(id), id TEXT NOT NULL,
    name TEXT NOT NULL, unit TEXT NOT NULL, sensor_type TEXT, created_at TEXT NOT NULL,
    PRIMARY KEY (asset_id, id)
);
CREATE TABLE IF NOT EXISTS telemetry_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT, source_id TEXT NOT NULL,
    asset_id TEXT NOT NULL, sensor_id TEXT NOT NULL, value REAL NOT NULL,
    unit TEXT NOT NULL, timestamp TEXT NOT NULL, received_at TEXT NOT NULL,
    FOREIGN KEY (asset_id, sensor_id) REFERENCES sensors(asset_id, id),
    UNIQUE (source_id, asset_id, sensor_id, timestamp)
);
CREATE INDEX IF NOT EXISTS telemetry_asset_time ON telemetry_readings(asset_id, timestamp, id);
CREATE INDEX IF NOT EXISTS telemetry_sensor_time
    ON telemetry_readings(asset_id, sensor_id, timestamp DESC, id DESC);
CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY, asset_id TEXT NOT NULL REFERENCES assets(id),
    anomaly_category TEXT NOT NULL, title TEXT NOT NULL, description TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL CHECK (status IN ('open', 'acknowledged', 'resolved')),
    created_at TEXT NOT NULL, last_observed_at TEXT NOT NULL, updated_at TEXT NOT NULL,
    acknowledged_at TEXT, resolved_at TEXT, resolution_note TEXT,
    occurrence_count INTEGER NOT NULL CHECK (occurrence_count >= 1),
    latest_evidence TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS incidents_status_severity_updated
    ON incidents(status, severity, updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS incidents_active_group
    ON incidents(asset_id, anomaly_category) WHERE status IN ('open', 'acknowledged');
