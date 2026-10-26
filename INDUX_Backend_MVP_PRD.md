# INDUX Backend MVP --- Product Requirements Document

**Version:** 0.1\
**Date:** 2026-10-26\
**Status:** Hackathon implementation baseline

## 1. Purpose

Build a small local backend for INDUX that receives industrial
telemetry, stores it, invokes a separate anomaly-detection module,
creates actionable incidents, and serves the frontend through a simple
REST API and WebSocket event stream.

The backend must be demonstrable on one computer. Prefer one FastAPI
process and SQLite. Do not add infrastructure that is not needed for the
demo.

## 2. MVP goals

-   Run locally with a single documented startup command.
-   Provide a simulator-friendly telemetry ingestion endpoint.
-   Validate and persist readings in SQLite.
-   Expose assets, sensors, telemetry history, incidents, and system
    status through REST.
-   Call the anomaly detector through a small, stable interface. The
    detector is a separate module and may initially be a stub if the
    real implementation is not ready.
-   Group repeated detections into incidents instead of creating one
    incident per reading.
-   Push lightweight change notifications over WebSocket.
-   Keep the system read-only toward industrial equipment.

## 3. Explicit non-goals

-   No PLC writes, actuator commands, or automated equipment control.
-   No cloud deployment, multi-machine orchestration, message broker,
    microservices, or separate database server.
-   No authentication framework for the localhost-only demo.
-   No advanced role-based access control, audit platform, incident
    assignment, notification integrations, or configurable rules engine.
-   No promise that anomalies predict equipment failure.
-   No complex retry queue, distributed deduplication, or cursor
    pagination.

## 4. Assumptions for the MVP

These are chosen defaults so implementation can proceed without blocking
on unresolved project details.

-   The API runs on `127.0.0.1:8000` and the frontend runs on the same
    computer.
-   SQLite is the only database.
-   Sensor IDs are unique within an asset. Canonical identity is
    `(asset_id, sensor_id)`.
-   All API timestamps are ISO 8601 UTC timestamps.
-   Telemetry ingestion uses partial acceptance: valid readings are
    stored; invalid readings receive per-item rejection results.
-   Maximum ingest batch size is 500 readings.
-   List endpoints use `limit`/`offset`; default limit 50, maximum 200.
-   A reading is stale after 15 seconds by default. This is a demo
    default and should be configurable with one setting.
-   An active incident is one with status `open` or `acknowledged`.
-   Incident grouping key is `(asset_id, anomaly_category)`.
-   A resolved incident is not reopened. A later matching anomaly
    creates a new incident.
-   Equipment status values are `normal`, `warning`, `critical`,
    `unknown`.
-   The AI explanation component is optional and separate from ingestion
    and anomaly detection. The backend must work if the local LLM is
    disabled or unavailable.

## 5. Users and primary demo flow

**Primary user:** a hackathon judge or operator viewing a local
dashboard.

1.  Start the backend and frontend.
2.  Start or run the telemetry simulator.
3.  View registered assets and latest sensor readings.
4.  Observe an anomaly detected by the ML module.
5.  See an incident appear and receive an event notification.
6.  Open the incident, inspect evidence, acknowledge it, and resolve it.
7.  Verify the incident remains in history and the system status reports
    component readiness.

## 6. Functional requirements

### FR-1: Health and system status

-   `GET /api/v1/health` reports whether the API process responds.
-   `GET /api/v1/system/status` reports database, ingestion, detector,
    optional LLM, and last-telemetry status.
-   API health must not imply that the detector or LLM is ready.

### FR-2: Assets and sensors

-   List assets and retrieve one asset by ID.
-   List sensors for an asset.
-   Use stable IDs supplied by the simulator or seeded demo data.
-   Unknown asset/sensor references must not be silently accepted.

### FR-3: Telemetry ingestion

-   Accept a batch containing `source_id` and readings.
-   Each reading includes `asset_id`, `sensor_id`, numeric `value`,
    `unit`, and `timestamp`.
-   Validate each reading independently after validating the request
    envelope.
-   Persist valid readings; report invalid items by input index and
    reason.
-   Reject non-finite numbers, malformed timestamps, unknown
    assets/sensors, and unsupported unit mismatches.
-   Store both event timestamp (`timestamp`) and server receipt
    timestamp (`received_at`).
-   Do not replace missing or invalid values with zero.
-   A structurally invalid request or batch larger than 500 is rejected
    as a whole.
-   Duplicate suppression is best-effort for the MVP: use
    `(source_id, asset_id, sensor_id, timestamp)` as the deduplication
    key. Duplicate readings are reported as rejected with code
    `DUPLICATE_READING`.

### FR-4: Telemetry query

-   Return latest readings across assets or for a specified asset.
-   Return history for one asset and a bounded time range.
-   History uses `start` inclusive and `end` exclusive, ordered by
    timestamp then reading ID.
-   Limit history responses using `limit` and `offset`.

### FR-5: Anomaly detection boundary

-   Backend services call a separate detector interface; REST routes
    must not embed detector logic.
-   The detector receives normalized readings or a small batch of new
    readings and returns zero or more detections.
-   A detection minimally includes `asset_id`, `sensor_id`,
    `anomaly_category`, `score` (optional), `severity`, `observed_at`,
    and evidence.
-   The backend owns incident grouping, persistence, equipment status,
    and API responses.
-   The demo must remain usable if the detector is not configured;
    status reports that condition clearly.
-   Do not invoke the detector once per individual HTTP route read.
    Process new persisted readings through a simple in-process worker or
    ingestion service call.

### FR-6: Incidents

-   List incidents with optional `status`, `asset_id`, and `severity`
    filters.
-   Retrieve incident details and evidence.
-   Acknowledge an open incident; preserve the acknowledgement when new
    matching detections update it.
-   Resolve an active incident with an optional note.
-   Group a new detection into an existing active incident with the same
    `(asset_id, anomaly_category)`.
-   Update `last_observed_at`, latest evidence, and occurrence count
    when grouped.
-   Create a new incident when no matching active incident exists.
-   Do not auto-resolve incidents based on a single normal reading.
-   Incident resolution is an operator-recorded workflow state, not
    proof that the equipment is safe.

### FR-7: Equipment status

Compute status in the backend with these rules: 1. If there is no usable
reading or the latest valid reading is older than the configured
freshness threshold, status is `unknown`. 2. Otherwise, if an active
critical incident exists, status is `critical`. 3. Otherwise, if an
active high/medium incident exists, status is `warning`. 4. Otherwise,
status is `normal`.

A stale asset may have status `unknown` while still exposing an active
critical incident separately. Frontend code must not derive a
conflicting status independently.

### FR-8: Realtime events

-   Provide WebSocket endpoint `/api/v1/events`.
-   Send event envelopes for `telemetry.updated`, `incident.created`,
    `incident.updated`, and `system.status_changed`.
-   Events are notifications, not the authoritative record. On
    reconnect, the frontend refreshes REST data.
-   No event replay or durable event queue is required for the MVP.

### FR-9: Error handling

Use one consistent JSON error shape:

``` json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Asset was not found.",
    "details": []
  }
}
```

Use appropriate HTTP status codes: `400` malformed query/input, `404`
missing resource, `409` invalid state transition where applicable, `422`
invalid request envelope, `500` unexpected server error, `503` required
component unavailable. Per-reading validation failures are returned in
the ingestion result rather than failing the entire batch.

## 7. API contract summary

The accompanying `INDUX_backend_api.yaml` is the source of truth for
REST request and response shapes.

-   `GET /api/v1/health`
-   `GET /api/v1/system/status`
-   `GET /api/v1/assets`
-   `GET /api/v1/assets/{asset_id}`
-   `GET /api/v1/assets/{asset_id}/sensors`
-   `POST /api/v1/telemetry/ingest`
-   `GET /api/v1/telemetry/latest`
-   `GET /api/v1/telemetry/history`
-   `GET /api/v1/incidents`
-   `GET /api/v1/incidents/{incident_id}`
-   `POST /api/v1/incidents/{incident_id}/acknowledge`
-   `POST /api/v1/incidents/{incident_id}/resolve`
-   WebSocket `/api/v1/events` (documented in this PRD because OpenAPI
    does not standardize WebSocket operations)

## 8. Minimal data model

-   `assets`: `id`, `name`, `asset_type`, `location` (optional),
    `created_at`
-   `sensors`: `asset_id`, `id`, `name`, `unit`, `sensor_type`
    (optional), `created_at`; unique `(asset_id, id)`
-   `telemetry_readings`: integer ID, `source_id`, `asset_id`,
    `sensor_id`, `value`, `unit`, `timestamp`, `received_at`; unique
    deduplication key
-   `incidents`: `id`, `asset_id`, `anomaly_category`, `title`,
    `description`, `severity`, `status`, `created_at`,
    `last_observed_at`, `updated_at`, `acknowledged_at` (optional),
    `resolved_at` (optional), `resolution_note` (optional),
    `occurrence_count`, `latest_evidence` (JSON text)

Use foreign keys and indexes on telemetry `(asset_id, timestamp)`,
`(asset_id, sensor_id, timestamp)`, and incidents
`(status, severity, updated_at)`. No ORM-specific architecture is
mandated; use the simplest maintainable SQLite access pattern already
used by the project.

## 9. Non-functional requirements

-   One machine, one backend process, local SQLite file.
-   Startup should create the database schema and seed a small demo
    dataset if the database is empty.
-   Use UTC timestamps and deterministic serialization.
-   Keep ingestion and detector failures visible in system status/logs.
-   Keep REST handlers thin; put validation and workflow in service
    functions.
-   No secrets should be needed for localhost demo mode.
-   The server must not expose any write-to-equipment capability.

## 10. Acceptance criteria

-   [ ] Backend starts with a documented command and creates/opens its
    SQLite database.
-   [ ] Health endpoint responds even if the detector or LLM is
    disabled.
-   [ ] Assets and sensors can be listed.
-   [ ] A mixed batch stores valid readings and reports invalid readings
    individually.
-   [ ] Duplicate telemetry is not inserted twice.
-   [ ] Latest and history endpoints return stable, ordered data.
-   [ ] A detection creates an incident; repeated matching detections
    update it.
-   [ ] Different categories create separate incidents.
-   [ ] Acknowledgement and resolution work and persist across restart.
-   [ ] Equipment status follows the specified rules.
-   [ ] WebSocket clients receive notifications for telemetry/incident
    changes.
-   [ ] The demo works without the optional LLM.
-   [ ] No endpoint writes to industrial equipment.

## 11. Build order

1.  SQLite schema and seed data.
2.  Assets/sensors and health endpoints.
3.  Telemetry ingestion and query endpoints.
4.  Detector interface and simple processing hook.
5.  Incident grouping and lifecycle.
6.  Equipment status.
7.  WebSocket notifications.
8.  Frontend integration and end-to-end demo test.

Do not add infrastructure or abstractions until an acceptance criterion
requires them.
