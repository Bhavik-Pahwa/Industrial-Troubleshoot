# INDUX — Industrial Telemetry Monitoring & Incident Intelligence

Local-first industrial monitoring interface for viewing industrial assets, sensor telemetry, anomalies/incidents, and subsystem health status.

For the connected frontend, backend, and local AI setup, see the [root guide](../README.md).
Run `npm run test:e2e` against that running stack to verify real browser ingestion,
AI assessments, and incident actions.

Conforms strictly to the canonical API contract: **`INDUX_backend_api.yaml` (OpenAPI 3.1.0, version 0.1.0)** and **`INDUX_FRONTEND_PRD.md`**.

---

## Architecture & System Overview

INDUX is a presentation and interaction layer for heavy industrial assets (centrifugal pumps, gas compressors, induction motors, CNC milling spindles, and steam turbines).

```
   +------------------------------------+
   |     Industrial Edge Gateways /     |
   |       PLCs & Sensor Network        |
   +-----------------+------------------+
                     |
                     v
   +------------------------------------+
   |        INDUX Backend API           |
   |  (http://127.0.0.1:8000/api/v1)    |
   |  • Database & Stream Ingestion     |
   |  • Anomaly Detector & LLM Runtime  |
   +-----------------+------------------+
                     |  REST / OpenAPI 3.1.0
                     v
   +------------------------------------+
   |     INDUX Operations Frontend      |
   |  • Marketing Landing Page (/)      |
   |  • Operations Overview (/dashboard)|
   |  • Asset Inventory (/assets)       |
   |  • Incident Queue (/incidents)     |
   |  • Subsystem Health (/system)      |
   |  • Ingest Simulator Tool (/ingest) |
   +------------------------------------+
```

### Safety & Operational Principles
- **Read-Only Industrial Monitoring:** The frontend strictly cannot connect directly to PLCs, SCADA, or local AI runtimes, and never issues actuator write commands.
- **Honest Freshness:** Timestamps represent actual measurement times reported by backend ingestion pipelines; missing timestamps display explicit neutral states.
- **Subsystem Fault Isolation:** If the incident queue or an individual component fails, asset inventory and telemetry views remain fully operational.

---

## Route Inventory

| Route | View | Description & API Endpoints |
|---|---|---|
| `/` | **Marketing Landing Page** | Industrial product narrative, problem overview, core capabilities, architecture flow, and dashboard preview. |
| `/dashboard` | **Operations Overview** | System status strip, asset status counts, recent abnormal incidents, and latest telemetry readings (`GET /system/status`, `GET /assets`, `GET /incidents`, `GET /telemetry/latest`). |
| `/assets` | **Asset Inventory** | Equipment registry with operating status (`normal`, `warning`, `critical`, `unknown`), physical location, pagination, and search (`GET /assets`). |
| `/assets/:assetId` | **Asset Detail & Telemetry** | Equipment context, connected sensor list, latest readings, and chronological historical time-series chart with UTC range selector (`GET /assets/{id}`, `GET /assets/{id}/sensors`, `GET /telemetry/latest`, `GET /telemetry/history`). |
| `/incidents` | **Incident Queue** | Triage queue with server-side filters for `status` (`open`, `acknowledged`, `resolved`), `severity` (`critical`, `high`, `medium`, `low`), and `asset_id` synced with URL search params (`GET /incidents`). |
| `/incidents/:incidentId` | **Incident Detail & Actions** | Complete forensic telemetry payload inspection, occurrence count, acknowledge action (`POST /incidents/{id}/acknowledge`), and resolution modal with optional remediation note (`POST /incidents/{id}/resolve`). |
| `/system` | **System Health & Subsystems** | Distinguishes process reachability (`GET /health`) from individual component states (`database`, `ingestion`, `detector`, `llm`, and `last_telemetry_at`). |
| `/ingest` | **Telemetry Ingest Tool** | Developer/demo utility for batch ingestion conforming to `POST /telemetry/ingest` with preset payloads and per-reading acceptance/rejection reporting. |

---

## Getting Started

### Prerequisites
- Node.js >= 18 (Tested on Node.js v24.16.0)
- npm >= 9

### Installation
```bash
npm install
```

### Running the Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### Dual Live / Demo Mode
- **Live Mode:** By default, connects to `http://127.0.0.1:8000/api/v1`. If your backend server is running on port 8000, all requests hit the live API.
- **Demo Simulation Mode:** If the backend is not running, INDUX automatically activates its built-in high-fidelity state engine conforming exactly to the OpenAPI 3.1.0 schemas. You can also toggle between Live and Demo modes at any time using the connection pill in the topbar.

### Running Automated Tests
```bash
npm run test
```
Runs 24 automated unit, component, and contract integration tests via Vitest.

### Production Build
```bash
npm run build
```
Typechecks and compiles production assets into `dist/`.

---

## Technology Stack
- **Framework:** React 18 with TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS (Dense technical industrial dark palette)
- **Routing:** React Router v6
- **Data Fetching:** TanStack React Query v5
- **Visualizations:** Recharts (SVG Time-Series)
- **Icons:** Lucide React
- **Date Handling:** Date-fns (Strict ISO 8601 UTC validation)
- **Testing:** Vitest + React Testing Library + JSDOM

