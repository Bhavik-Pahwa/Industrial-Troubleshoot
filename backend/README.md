# INDUX backend

Local FastAPI + SQLite implementation of
[`INDUX_backend_api.yaml`](../FRONTEND/INDUX_backend_api.yaml). All backend source, configuration,
tests, environment files, and runtime data live under this directory.

For the connected frontend + backend + AI stack, use the [root setup guide](../README.md).
Set `INDUX_DETECTOR=ai` to use the AI service on port 8001. Standalone instructions
below use the demo detector with the LLM disabled.

## Setup and run

Python 3.11 or newer is required. From the repository root in PowerShell:

```powershell
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements-dev.lock
backend/.venv/Scripts/python -m pip install --no-deps -e backend
```

Start the backend with one command, also from the repository root:

```powershell
backend/.venv/Scripts/python -m indux
```

The server binds to **127.0.0.1:8000**, runs one process, creates
`backend/data/indux.sqlite3`, and seeds two assets on an empty database. Existing data
survives restarts. Stop with Ctrl+C. No credentials, cloud services, Docker, LLM, or
equipment connections are needed. The LLM is intentionally disabled in this MVP.

On macOS/Linux, replace `backend/.venv/Scripts/python` with `backend/.venv/bin/python`.
For development with freshly resolved compatible dependencies instead of the tested lock,
install with `python -m pip install -e './backend[dev]'` inside your virtual environment.

- Interactive REST docs: http://127.0.0.1:8000/docs
- API health: http://127.0.0.1:8000/api/v1/health
- System readiness: http://127.0.0.1:8000/api/v1/system/status
- WebSocket: `ws://127.0.0.1:8000/api/v1/events`

## Run the demo

In another terminal, from the repository root:

```powershell
backend/.venv/Scripts/python -m indux.simulator --anomaly --count 20 --interval 1
```

The simulator sends normal readings first and anomalies from the fourth batch onward.
It only makes HTTP requests to this backend. Open `/docs` to list incidents,
acknowledge one, and resolve it with an optional note. Continuing anomalies after
resolution create a **new** incident. Normal readings do not resolve active incidents.
Resolution records an operator action; it is not an equipment safety assessment.

Seeded identities (sensor IDs repeat across assets intentionally):

| Asset ID   | Sensor ID     | Unit   | Demo high / critical threshold |
| ---------- | ------------- | ------ | ------------------------------ |
| `pump-01`  | `temperature` | `degC` | 80 / 100                       |
| `pump-01`  | `vibration`   | `mm/s` | 7 / 12                         |
| `motor-01` | `temperature` | `degC` | 80 / 100                       |
| `motor-01` | `vibration`   | `mm/s` | 7 / 12                         |

Thresholds are illustrative demo behavior, not a trained ML model or industrial limits.
The database starts without synthetic telemetry, so assets initially show `unknown`.
To register other equipment, extend the seed data or insert assets/sensors into SQLite
offline. Asset registration and equipment control endpoints are outside this contract.

## Configuration

Set environment variables **before** starting the process. No `.env` loader is needed.

| Variable                  | Default                                                       | Meaning                                                               |
| ------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| `INDUX_DATABASE_PATH`     | `backend/data/indux.sqlite3` (absolute package-relative path) | SQLite file; relative overrides resolve from the working directory    |
| `INDUX_FRESHNESS_SECONDS` | `15`                                                          | Positive, finite reading freshness threshold                          |
| `INDUX_DETECTOR`          | `demo`                                                        | `demo`, `disabled`, or an importable `module:factory`                 |
| `INDUX_CORS_ORIGINS`      | localhost and 127.0.0.1, ports 5173 and 3000                  | Comma-separated frontend origins, also checked for browser WebSockets |

Example:

```powershell
$env:INDUX_DETECTOR = 'disabled'
$env:INDUX_FRESHNESS_SECONDS = '30'
backend/.venv/Scripts/python -m indux
```

`health` reports process liveness independently of dependencies. System status is
`unavailable` if SQLite cannot be queried, `degraded` if ingestion or detection is not
ready, and otherwise `healthy`. A disabled optional LLM does not degrade readiness.
Detector failures are logged and reported as `unavailable`; disabling detection reports
`not_configured`. Database failures return the common JSON error shape and HTTP 503.

## Layout

```text
backend/
  pyproject.toml               Package, dependencies, CLI commands, test/lint configuration
  requirements-dev.lock       Exact tested runtime + development dependency versions
  src/indux/
    main.py                   App factory, lifespan, service wiring and status monitor
    config.py                 Environment configuration
    models.py                 Validated inputs and response models
    errors.py                 Consistent JSON errors
    time.py                   UTC normalization and deterministic serialization
    events.py                 In-process bounded WebSocket notifications
    api/                      Thin system, assets, telemetry and incident routes
    services/                 Validation, queries, equipment status and incident workflows
    storage/                  SQLite schema, transactions and seed data
    detectors/                Detector protocol and replaceable demo implementation
    simulator.py              Synthetic HTTP telemetry sender
  tests/                      Contract, workflow, resilience and WebSocket tests
  data/                       Ignored runtime SQLite files
  .venv/                      Ignored local Python environment
```

SQLite connections belong to a single operation/thread and always close. Write
transactions use `BEGIN IMMEDIATE`; a partial unique index enforces one active incident
per asset/category. Reads run in FastAPI's thread pool; mutation services and detector
calls also run off the event loop. HTTP mutations are serialized within the process.
Run **one worker**: notification subscriptions and detector state are in memory.

## API behavior and integration decisions

The original YAML remains the REST contract. Every REST operation is implemented.
Tests validate exercised success and error payloads against that original file.

- Ingestion validates the envelope first (1–500 items). Each item then gets its own
  `accepted` or `rejected` result, preserving the input index. Missing values, booleans,
  numeric strings, NaN/infinities, invalid timestamps, unknown references and wrong units
  never become zero or silently enter storage.
- Duplicate identity is `(source_id, asset_id, sensor_id, normalized timestamp)`.
  Equivalent timezone offsets deduplicate. A different source is a different reading.
  Reading IDs are stable but need not be consecutive.
- Timezone-aware timestamps normalize to UTC `Z` with six fractional digits; excess
  fractional precision is truncated to Python/SQLite's application-level microsecond
  precision. Naive timestamps are rejected. Future readings are stored but cannot make
  an asset appear fresh before their event time arrives.
- `telemetry/latest` returns one newest reading **per asset/sensor**, selecting highest
  reading ID on timestamp ties, ordered by asset ID and sensor ID, capped by `limit`.
- History includes `start`, excludes `end`, and sorts by timestamp then reading ID.
  `total` counts all matching records before pagination. Asset/sensor lists sort by ID;
  incidents sort by descending `updated_at`, then ID. All paginated lists default to
  50 items and allow at most 200.
- Telemetry commits before detector execution. Detector errors do not change accepted
  ingestion results. No detection retry/replay is implemented; after a failure, new
  accepted batches try the detector again. A detector import failure requires fixing
  configuration and restarting.
- Grouping uses `(asset_id, anomaly_category)` across sensors, retaining acknowledgement,
  counting every detection, preserving the newest observation/evidence, and keeping the
  highest severity seen in that active incident. All detections from a batch commit
  atomically; invalid detector output rolls back those incident changes.
- Repeated acknowledgement is idempotent. Acknowledge/resolve after resolution returns 409. An omitted resolution body is allowed; notes are limited to 1,000 characters.
- Equipment status uses the most recent nonfuture event timestamp for the asset. No
  usable/fresh reading means `unknown`, even with critical incidents; otherwise active
  critical → `critical`, high/medium → `warning`, and low/no active incidents → `normal`.
  Active incidents remain independently available through the incidents API.
- Bad queries return 400; bad request envelopes return 422; absent resources return 404.
  Per-reading errors are in the HTTP 200 ingestion result. Unexpected errors return 500
  without internal exception details.

## Replace the detector

Implement the synchronous `Detector.detect(readings)` interface in
`src/indux/detectors/base.py`, returning `Detection` objects (or equivalent dictionaries).
It receives **only newly persisted valid readings**, including database IDs and receipt
timestamps. It should return promptly, set timeouts on any external I/O, and not write
incidents or control equipment. No detector calls are made by REST reads.

```python
from indux.detectors.base import Detection

class MyDetector:
    def detect(self, readings):
        # Call your model here, returning zero or more validated Detection objects.
        return []

def create_detector():
    return MyDetector()
```

Set `INDUX_DETECTOR=your_package.your_module:create_detector` after making that module
importable in the environment. Tests can inject a detector through
`create_app(settings, detector=my_detector)` without HTTP or database logic in the model.
Detections require asset/sensor IDs, category, severity, observed timestamp, and JSON
evidence; score is optional. Evidence is stored with the sensor ID and score.

## WebSocket frontend integration

Events are lightweight invalidations, not authoritative records:

```json
{
	"id": "event-uuid",
	"type": "incident.created",
	"timestamp": "2026-10-26T09:00:00.000000Z",
	"data": { "incident_id": "incident-uuid", "asset_id": "pump-01" }
}
```

| Type                    | Data                      | Suggested REST refresh                |
| ----------------------- | ------------------------- | ------------------------------------- |
| `telemetry.updated`     | `asset_ids`, `accepted`   | Latest readings and assets            |
| `incident.created`      | `incident_id`, `asset_id` | Incidents and affected asset          |
| `incident.updated`      | `incident_id`, `asset_id` | Incident details, incidents and asset |
| `system.status_changed` | Complete system status    | System status                         |

System status is checked after mutations and every second. `last_telemetry_at` is the
last server receipt time, including data restored on restart. Asset freshness can
expire without a new event; refresh assets periodically (for example every five seconds)
to get server-computed status. The frontend must not calculate competing equipment status.

On connection/reconnection, refresh REST snapshots. Events have no replay. Each client
has a 128-event buffer; overflow disconnects with code 1013 so the client can reconnect
and resync. No client messages are needed, and incoming messages trigger no commands.
The frontend lives in `../FRONTEND` and uses REST polling. The event table above is
also available to WebSocket clients.

## Verification

From the repository root:

```powershell
backend/.venv/Scripts/python -m pytest backend/tests -q
backend/.venv/Scripts/python -m ruff check --cache-dir backend/.ruff_cache backend/src backend/tests
backend/.venv/Scripts/python -m ruff format --check --cache-dir backend/.ruff_cache backend/src backend/tests
```

The suite covers startup/seeding, contract response validation, independent item
rejections, batch limits, duplicate races, composite sensor identity, timezone handling,
history bounds/tie ordering, incident grouping/categories/lifecycle/restart persistence,
all equipment status priorities, configurable staleness, optional detector/LLM behavior,
database rollback/failure recovery, error sanitization, CORS and WebSocket delivery,
disconnect, reconnect and bounded buffers. Temporary test databases never touch demo data.

This is a localhost-only MVP. It intentionally has no authentication, control endpoints,
distributed queue, deployment infrastructure, or automated remediation.
