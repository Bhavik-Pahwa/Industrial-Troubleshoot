# INDUX Frontend Product Requirements Document (PRD)

**Document status:** Draft for implementation planning\
**Product:** INDUX --- local-first industrial telemetry monitoring and
anomaly/incident dashboard\
**Audience:** Antigravity / frontend implementation agent, frontend
engineers, backend engineers, product team\
**Source of truth for API integration:** `INDUX_backend_api.yaml`
(OpenAPI 3.1.0, version 0.1.0)\
**Design references supplied by the team:** - Dashboard UI Kit:
https://www.figma.com/design/sGgva0UAQ1kQnb92V0Np3U/Dashboard-UI-Kit---Dashboard--Free-Admin-Dashboard--Community-?node-id=0-1&t=ZXOG4IogFgFynyiv-1 -
SaaS Landing Pages collection:
https://www.figma.com/design/0RqxDNN5spKvLOpzlMZiJn/30--SaaS-Landing-pages--Community-?node-id=17-1736&t=kJVrBvLskkgfpDaw-4

> **Scope note:** This document treats the uploaded YAML strictly as the
> API contract. It is not a replacement for the full product PRD. Where
> product behavior, copy, visual details, streaming behavior, or data
> semantics are not specified by the API, this document marks them as
> proposed frontend behavior or an open question rather than presenting
> them as confirmed backend capabilities.

------------------------------------------------------------------------

## 1. Product Overview

INDUX is a local-first industrial monitoring interface for viewing
industrial assets, sensor telemetry, incidents, and the status of the
backend components that support monitoring. The frontend must make
operational state understandable at a glance, help an operator move from
a system-wide overview to an individual asset or incident, and
communicate clearly when data or supporting services are unavailable.

The application has two public-facing experiences:

1.  **Marketing landing page:** Introduces the INDUX problem, proposed
    solution, key capabilities, and a clear path into the
    demo/dashboard. It should feel credible for industrial operations
    rather than like a generic SaaS template.
2.  **Operations dashboard:** A dense but readable interface for assets,
    telemetry, incidents, and system health. It should prioritize
    scanability, clear severity/status communication, and useful
    empty/error states.

The frontend is a presentation and interaction layer. It must not
connect directly to PLCs, SCADA systems, sensors, databases, or the
local AI runtime. It communicates with the INDUX backend API. Industrial
integrations are described by the API as read-only.

### 1.1 Product principles

-   **Operational clarity first:** Users should quickly distinguish
    healthy, warning, critical, unknown, and unavailable states.
-   **Evidence over decoration:** Charts and metrics must be derived
    from actual API data; do not fabricate readings or operational
    statistics.
-   **Graceful degradation:** A detector, LLM, ingestion process,
    database, or telemetry source may be unavailable independently.
-   **Read-only industrial integration:** Do not expose controls that
    write to industrial equipment or SCADA.
-   **Honest freshness:** Display the latest timestamp available and
    make stale or missing data apparent.
-   **Modular implementation:** Separate pages, feature modules, API
    services, reusable UI components, and domain types.
-   **Industrial visual identity:** Use a restrained technical visual
    system with strong information hierarchy, not a generic AI-gradient
    dashboard.

------------------------------------------------------------------------

## 2. Goals and Non-Goals

### 2.1 Goals

-   Provide a visually strong, responsive landing page aligned with the
    supplied SaaS landing-page reference.
-   Provide an operational dashboard aligned with the supplied dashboard
    UI reference.
-   Surface asset status, latest telemetry, historical telemetry,
    incident status/severity, and backend component status using the API
    contract.
-   Support incident filtering, incident detail review, acknowledgement,
    and resolution.
-   Show per-reading results when telemetry ingestion is exposed to an
    authorized demo/operator workflow.
-   Keep the frontend compatible with a local backend at
    `http://127.0.0.1:8000/api/v1` by default, while allowing the base
    URL to be configured for development/demo deployment.
-   Make loading, empty, error, offline, and partial-service states
    explicit.
-   Keep the code modular and testable.

### 2.2 Non-goals

Unless a future product PRD explicitly adds them, do not implement: -
Direct browser connections to PLCs, SCADA, OPC UA, Modbus, or industrial
devices. - Direct browser-to-local-LLM calls. - Equipment control,
actuator commands, setpoint changes, or any write operation to
industrial systems. - User accounts, login, role management, or
permissions; the provided API contract does not define authentication. -
Asset creation, editing, deletion, or sensor configuration; no such
endpoints are defined. - Incident creation or deletion; no such
endpoints are defined. - AI chat, explanation generation, root-cause
narratives, or remediation recommendations unless specified by the full
product PRD and backed by a documented API. - WebSocket implementation
based solely on the YAML. The YAML says WebSocket events are described
in the product PRD, but the event schema and connection contract are not
included in this API file. - Fake production telemetry, fake incidents,
fake uptime, or fabricated impact/cost metrics.

------------------------------------------------------------------------

## 3. Users and Primary Jobs

The following are proposed user groups based on the industrial
monitoring product direction; confirm them against the full product PRD.

  -------------------------------------------------------------------------
  User                      Primary job             Frontend need
  ------------------------- ----------------------- -----------------------
  Plant/operator user       Understand current      Fast overview, status
                            asset and incident      filters, latest
                            state                   readings, incident
                                                    queue

  Maintenance/engineering   Investigate abnormal    Asset context,
  user                      behavior                historical telemetry,
                                                    incident evidence and
                                                    timestamps

  Demo                      Understand the value    Clear landing page,
  evaluator/stakeholder     and technical readiness understandable
                                                    dashboard, visible
                                                    component health

  Developer/demo operator   Check whether backend   System status and clear
                            components are running  API connection errors
  -------------------------------------------------------------------------

The UI must not imply that a person can perform an operation that the
backend does not support.

------------------------------------------------------------------------

## 4. Information Architecture and Routes

Use client-side routing. Route names below are proposed frontend routes,
not backend endpoints.

  ----------------------------------------------------------------------------------
  Frontend route             Purpose                 Data source
  -------------------------- ----------------------- -------------------------------
  `/`                        Landing page            Static product content;
                                                     optional health/status request
                                                     only if desired

  `/dashboard`               Operations overview     `/system/status`, `/assets`,
                                                     `/telemetry/latest`,
                                                     `/incidents`

  `/assets`                  Asset inventory         `/assets`

  `/assets/:assetId`         Asset detail and        `/assets/{asset_id}`,
                             telemetry               `/assets/{asset_id}/sensors`,
                                                     `/telemetry/latest`,
                                                     `/telemetry/history`

  `/incidents`               Incident list and       `/incidents`
                             filters                 

  `/incidents/:incidentId`   Incident detail and     `/incidents/{incident_id}`,
                             actions                 acknowledge/resolve endpoints

  `/system`                  Backend/system status   `/system/status`, `/health`

  `*`                        Not-found page          No API call required
  ----------------------------------------------------------------------------------

If the team wants fewer pages for the MVP, asset details and incident
details may use side panels or drawers, but deep links must still work
and the user must be able to refresh a detail URL without losing the
route.

### 4.1 Global application shell

Dashboard routes share: - Left navigation rail/sidebar with INDUX mark
and route links. - Header with current page title, optional breadcrumbs,
API connection state, and a refresh affordance. - Main content area with
consistent spacing and responsive grid. - Global notification/toast area
for action success/failure. - A persistent, non-alarming system status
indicator derived from `/system/status`; do not show "healthy" unless
the API confirms it.

The landing page may use a separate marketing navigation and footer
rather than the operations shell.

------------------------------------------------------------------------

## 5. Landing Page Requirements

### 5.1 Purpose

Explain the product quickly and establish credibility with industrial
audiences. The page should look deliberate and industrial: clear
typography, structured layout, restrained motion, purposeful diagrams or
product screenshots, and strong calls to action.

### 5.2 Recommended sections

1.  **Navigation**
    -   INDUX brand mark/wordmark.
    -   Links to product capabilities, how it works, and
        technology/architecture if supported by the final product
        narrative.
    -   Primary CTA: "Open Dashboard" or "View Demo".
    -   Secondary CTA: "Explore Capabilities".
    -   Do not imply hosted cloud availability if the deployment is
        local-first.
2.  **Hero**
    -   A concise headline focused on operational visibility and earlier
        detection of abnormal asset behavior.
    -   One supporting paragraph describing telemetry monitoring and
        incident visibility.
    -   Primary CTA leading to `/dashboard`.
    -   Secondary CTA scrolling to the product explanation.
    -   Hero visual should use an actual dashboard preview, a carefully
        designed UI composition, or a schematic of telemetry-to-incident
        flow. Avoid decorative fake charts with values that look like
        real plant data.
3.  **Problem / context**
    -   Explain the operational difficulty of interpreting scattered
        telemetry and detecting unusual behavior in automated industrial
        environments.
    -   Any market statistics must be sourced by the product team and
        cited on the page or in accompanying material. Do not invent
        numbers.
4.  **Solution overview**
    -   Explain the visible workflow: collect/ingest telemetry through
        backend integrations, analyze data in the system, surface
        anomalies/incidents, and support operator review.
    -   Keep claims limited to functionality implemented and documented
        by the project.
5.  **Core capability blocks**
    -   Asset visibility.
    -   Telemetry monitoring and history.
    -   Incident triage and lifecycle.
    -   Backend component health.
    -   Local-first deployment positioning, if confirmed by the full
        PRD.
    -   Use short, concrete descriptions instead of generic claims such
        as "revolutionary AI".
6.  **How it works**
    -   A simple architecture/workflow illustration: industrial data
        source → INDUX backend ingestion → analysis/detection components
        → incident and telemetry API → dashboard.
    -   Mark the frontend as consuming the backend API; do not depict a
        direct browser-to-SCADA or browser-to-LLM connection.
    -   Ensure the architecture matches the final backend/AI
        architecture approved by the team.
7.  **Dashboard preview**
    -   Use a screenshot or composed preview of the actual application.
    -   All visible sample data must be clearly identified as
        sample/demo data until real API data is available.
8.  **Trust / deployment section**
    -   Describe read-only industrial integration and local-first
        operation only to the extent confirmed by the final PRD.
    -   Do not make unsupported cybersecurity, compliance, zero-latency,
        predictive-accuracy, or guaranteed-uptime claims.
9.  **Final CTA and footer**
    -   CTA to open the dashboard.
    -   Product name, short description, and project/team links if
        provided.
    -   Avoid non-functional links or placeholder social links.

### 5.3 Landing page acceptance criteria

-   Page has a clear hierarchy at desktop, tablet, and mobile widths.
-   Main CTA works and routes to the dashboard.
-   Navigation links scroll or navigate to real destinations.
-   No unsupported statistics or performance claims appear.
-   The dashboard preview does not misrepresent mock data as live data.
-   Reduced-motion preferences are respected.
-   No horizontal overflow at mobile widths.

------------------------------------------------------------------------

## 6. Dashboard Requirements

### 6.1 Overview page (`/dashboard`)

The overview should answer: 1. Is the backend reachable? 2. Are the
monitoring components ready, degraded, or unavailable? 3. What is the
current state of the assets? 4. What telemetry has arrived recently? 5.
Which incidents need attention?

#### Proposed layout

-   **Page header:** "Operations Overview", short explanatory subtitle,
    last refresh time, refresh control.
-   **System status strip:** Overall status, database, ingestion,
    detector, LLM, and last telemetry timestamp.
-   **Asset summary:** Counts by asset status (`normal`, `warning`,
    `critical`, `unknown`) calculated from the returned asset list only
    if all relevant assets have been loaded. If pagination means the
    full set is not loaded, use the API `total` and avoid presenting
    partial counts as global counts.
-   **Incident summary:** Counts by severity/status only when the
    underlying list results are complete or when explicitly labeled as
    counts from the current result set. The API does not provide
    dedicated aggregate endpoints.
-   **Recent incidents:** Small list/table showing title, asset ID,
    severity, status, last observed timestamp, and link to detail.
-   **Latest telemetry:** Compact table/list of recent readings with
    asset, sensor, value, unit, timestamp.
-   **Asset status table:** Asset name, type, location, status, last
    seen.
-   **Empty states:** Distinguish "No assets returned" from "Could not
    load assets".

#### Data loading

-   Fetch `/health` and `/system/status`.
-   Fetch `/assets?limit=...&offset=...`.
-   Fetch `/telemetry/latest?limit=...`; use `asset_id` only when
    filtering to a specific asset.
-   Fetch `/incidents?limit=...&offset=...`.
-   Independent sections should fail independently: if incidents fail,
    the telemetry and system status sections should remain usable.
-   Avoid issuing an unbounded number of requests. Use API limits and
    sensible pagination.
-   Do not label the dashboard "live" unless a documented push or
    polling mechanism is implemented.

### 6.2 Assets list (`/assets`)

#### Required behaviors

-   Render assets from `GET /assets`.
-   Support pagination using `limit` and `offset`.
-   Show `total`, current page, and a clear next/previous interaction.
-   Display asset name, type, location when present, status, and
    last-seen time.
-   Make `unknown` visually distinct from `normal`.
-   Provide a detail link to `/assets/:assetId`.
-   Include loading skeleton, empty state, retryable error, and
    page-level error handling.

#### Filters

-   The API contract does not define asset status/type/location filter
    parameters. Do not pretend server-side filters exist.
-   If client-side filters are implemented, label them as filtering the
    currently loaded page only unless the frontend has loaded all
    assets.
-   A text search may be local to the loaded data, but must not be
    represented as a backend search.

### 6.3 Asset detail (`/assets/:assetId`)

#### Required behaviors

-   Load `GET /assets/{asset_id}`.
-   Load `GET /assets/{asset_id}/sensors?limit=...&offset=...`.
-   Load `GET /telemetry/latest?asset_id={asset_id}&limit=...`.
-   Provide a historical telemetry view using `GET /telemetry/history`
    with required `asset_id`, `start`, and `end` parameters.
-   Show asset name, ID, type, location, status, created time, and
    last-seen timestamp.
-   Show the available sensor list, including sensor name, unit, and
    sensor type when present.
-   Show latest readings with value, unit, timestamp, and sensor/asset
    context where available.
-   Provide a date/time range selector for history. Use ISO 8601 UTC
    timestamps in requests and validate that `end` is later than
    `start`.
-   Handle no sensors, no readings, invalid ranges, unknown asset IDs,
    and API errors distinctly.

#### Chart rules

-   Plot only real values returned by the API.
-   Use timestamps in chronological order.
-   Label units and time range clearly.
-   Do not combine incompatible units on one axis.
-   Avoid interpolation that implies measurements were received when
    they were not.
-   If charting libraries are used, keep chart components separate from
    data fetching and transformation.
-   The API returns reading value, unit, timestamp, asset ID, sensor ID,
    and received time; it does not provide pre-aggregated chart series
    or anomaly overlays.

### 6.4 Incidents list (`/incidents`)

#### Required behaviors

-   Load incidents from `GET /incidents`.
-   Support query parameters `status`, `asset_id`, `severity`, `limit`,
    and `offset`.
-   Supported status values: `open`, `acknowledged`, `resolved`.
-   Supported severity values: `low`, `medium`, `high`, `critical`.
-   Show incident title, asset ID, anomaly category, severity, status,
    created time, last observed time, and occurrence count.
-   Support pagination.
-   Provide a clear reset-filters action.
-   Preserve active filters in the URL query string so the page can be
    bookmarked/shared.
-   Do not invent filters that the API does not support as server-side
    filters.

#### Visual hierarchy

-   Severity and lifecycle status must be separately represented;
    severity is not the same as status.
-   Use text labels as well as color, so meaning does not depend on
    color alone.
-   `critical` should be prominent but not so visually loud that the
    entire list becomes difficult to scan.
-   Resolved incidents should remain distinguishable from active
    incidents.

### 6.5 Incident detail (`/incidents/:incidentId`)

#### Required behaviors

-   Load `GET /incidents/{incident_id}`.
-   Display title, ID, asset ID, anomaly category, description if
    present, severity, status, created time, last observed time, updated
    time, acknowledgement time, resolution time, occurrence count,
    latest evidence, and resolution note when present.
-   `latest_evidence` is an open object in the API schema. Render known
    structured fields safely when their shape is defined by the backend;
    otherwise use a defensive key/value representation or raw structured
    data view. Do not assume an undocumented evidence schema.
-   Show **Acknowledge** when the incident is eligible for
    acknowledgement according to the API behavior and current status.
-   Call `POST /incidents/{incident_id}/acknowledge` on confirmation.
-   Show **Resolve** for active incidents; allow an optional resolution
    note up to 1000 characters and call
    `POST /incidents/{incident_id}/resolve`.
-   Confirm before resolution if the action changes the incident
    lifecycle.
-   Disable action buttons while a request is pending.
-   On success, update the visible incident from the returned API
    response rather than guessing the new timestamps/status.
-   Handle `404` and `409` distinctly. A `409` on acknowledge/resolve
    means the incident is already resolved according to the API
    description; refresh the incident and explain that its state
    changed.
-   Do not show unsupported "reopen", "snooze", "assign", or "delete"
    controls.

### 6.6 System status (`/system`)

Use `GET /health` for process reachability and `GET /system/status` for
component state.

Render these fields exactly: - Overall `status`: `healthy`, `degraded`,
`unavailable` - `database`: `ready`, `unavailable` - `ingestion`:
`ready`, `stopped`, `error` - `detector`: `ready`, `unavailable`,
`not_configured` - `llm`: `ready`, `unavailable`, `disabled`,
`not_configured` - `last_telemetry_at`: timestamp or null

Requirements: - Do not collapse all component statuses into a single
green/red light. - Explain the difference between API process health and
component health. - If `/health` succeeds but `/system/status` fails,
show that the process responds while detailed component status is
unavailable. - If `/health` fails, show API connection failure and a
retry action. - `null` `last_telemetry_at` should display "No telemetry
received yet" rather than a fabricated timestamp. - Use a "not
configured" state rather than an error state where the API explicitly
returns `not_configured`.

### 6.7 Telemetry ingestion UI (conditional)

The API defines `POST /telemetry/ingest`, but the product workflow and
target user for manual ingestion are not specified. Therefore: - Do not
place a manual ingestion form in the primary operator dashboard by
default. - If the full PRD requires a developer/demo ingestion utility,
implement it as a separate, clearly labeled tool or restricted demo
section. - Request body must contain `source_id` and `readings`, with
1--500 readings. - Each reading requires `asset_id`, `sensor_id`,
numeric `value`, `unit`, and ISO date-time `timestamp`. - Display the
`accepted`, `rejected`, and per-item `results` returned by the API. - A
`200` response can contain rejected individual readings; do not treat
every `200` as "all readings accepted". - Handle `422` envelope/batch
validation errors and `503` component-unavailable errors. - Never
generate telemetry or submit it automatically without an explicit user
action.

------------------------------------------------------------------------

## 7. API Integration Contract

### 7.1 Base URL

Default local development API base URL:

`http://127.0.0.1:8000/api/v1`

The base URL must be configurable through the frontend
environment/configuration mechanism. Do not hard-code it across
components. The frontend must make requests through a single API client
module.

### 7.2 Endpoint inventory

  -----------------------------------------------------------------------------------------
  Method                  Endpoint                                 Frontend use
  ----------------------- ---------------------------------------- ------------------------
  `GET`                   `/health`                                API process health

  `GET`                   `/system/status`                         Backend component health

  `GET`                   `/assets`                                Asset list and
                                                                   pagination

  `GET`                   `/assets/{asset_id}`                     Asset detail

  `GET`                   `/assets/{asset_id}/sensors`             Sensors associated with
                                                                   an asset

  `POST`                  `/telemetry/ingest`                      Optional ingestion
                                                                   utility, only if
                                                                   required by the full PRD

  `GET`                   `/telemetry/latest`                      Latest telemetry,
                                                                   optional `asset_id`,
                                                                   `limit` 1--200

  `GET`                   `/telemetry/history`                     Historical telemetry for
                                                                   required asset/time
                                                                   range

  `GET`                   `/incidents`                             Incident
                                                                   list/filter/pagination

  `GET`                   `/incidents/{incident_id}`               Incident detail

  `POST`                  `/incidents/{incident_id}/acknowledge`   Acknowledge incident

  `POST`                  `/incidents/{incident_id}/resolve`       Resolve incident with
                                                                   optional note
  -----------------------------------------------------------------------------------------

### 7.3 Pagination

The shared API parameters are: - `limit`: integer, minimum 1, maximum
200, default 50. - `offset`: integer, minimum 0, default 0.

The frontend should: - Use a default page size of 20 or 50 based on the
visual density and performance of the chosen layout. - Never send
`limit` above 200. - Treat the response `total`, `limit`, and `offset`
as authoritative for paginated asset, sensor, telemetry-history, and
incident responses. - Preserve the current filter set when changing
pages. - Avoid silently implying that a single page contains every
record.

### 7.4 Error envelope

The API error structure is:

-   `error.code`
-   `error.message`
-   `error.details` (array of objects)

The API client should normalize errors into a consistent frontend error
type while retaining the server code/message/details for diagnostics.
User-facing messages should be clear and concise; detailed raw payloads
may be available in a developer details panel but should not overwhelm
operators.

Handle at minimum: - Network failure / server unreachable. - `400`
invalid telemetry time range. - `404` missing asset or incident. - `409`
incident action conflict. - `422` invalid telemetry ingestion envelope
or oversized batch. - `503` required backend component unavailable. -
Unexpected status or malformed response.

### 7.5 Request and response rules

-   Use URL encoding for path and query parameters.
-   Serialize dates as ISO 8601 date-time values; history query
    parameters are UTC timestamps, `start` inclusive and `end`
    exclusive.
-   Keep response parsing and schema validation at the API boundary
    where practical.
-   Treat nullable fields as truly nullable; do not render literal
    `null` or `undefined`.
-   Do not infer a sensor ID from a sensor name or vice versa.
-   Do not infer missing data from an absent response field.
-   For actions, use the returned incident object as the canonical
    updated state.

### 7.6 Polling and streaming

The OpenAPI file does not define WebSocket routes, event names, message
schemas, authentication, reconnect rules, or heartbeat behavior. The API
description says these are defined in the project PRD, which has not
been included in this API-only input.

Therefore: - Implement explicit refresh first. - If polling is added,
make the interval configurable, avoid overlapping requests, stop or
reduce polling when the tab is inactive, and show the last successful
refresh time. - Do not call the dashboard "real-time" unless a
documented update mechanism and its latency expectations are
confirmed. - Do not implement a WebSocket client until the final PRD
supplies its contract.

------------------------------------------------------------------------

## 8. Frontend Technical Architecture

### 8.1 Proposed stack

These are implementation recommendations, not requirements established
by the API file. Adjust if the team has already selected a stack.

  -----------------------------------------------------------------------
  Concern                 Proposed choice         Reason
  ----------------------- ----------------------- -----------------------
  Framework               React                   Mature component model
                                                  for a multi-page
                                                  dashboard

  Language                TypeScript              Helps preserve API
                                                  schema and enum
                                                  correctness

  Build tool              Vite                    Lightweight local
                                                  development and
                                                  production build

  Routing                 React Router            Route-level pages and
                                                  deep links

  Styling                 Tailwind CSS or         Consistent tokens and
                          existing project        responsive layouts
                          styling system          

  UI primitives           Accessible component    Consistent interaction
                          primitives / existing   and keyboard support
                          component library       

  Data fetching           TanStack Query or a     Loading, caching,
                          small typed API/query   refetching, and
                          layer                   mutation state

  Forms                   React Hook Form or      Useful for optional
                          native controlled forms resolution note and
                          for simple inputs       conditional ingestion
                                                  UI

  Charts                  A maintained React      Time-series
                          chart library           visualization; isolate
                                                  chart implementation

  Testing                 Vitest + React Testing  Unit, component, and
                          Library; Playwright for end-to-end coverage
                          critical flows          
  -----------------------------------------------------------------------

Do not introduce multiple overlapping state-management libraries. Server
data should live in the query/cache layer; local UI state should remain
local unless it must be shared.

### 8.2 Suggested folder structure

``` text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
  config/
    env.ts
  api/
    client.ts
    errors.ts
    health.ts
    assets.ts
    telemetry.ts
    incidents.ts
    system.ts
  components/
    layout/
      MarketingLayout.tsx
      DashboardLayout.tsx
      Sidebar.tsx
      Topbar.tsx
      Breadcrumbs.tsx
    feedback/
      LoadingState.tsx
      EmptyState.tsx
      ErrorState.tsx
      ConnectionState.tsx
      ToastRegion.tsx
    data-display/
      StatusBadge.tsx
      SeverityBadge.tsx
      Timestamp.tsx
      DataTable.tsx
      Pagination.tsx
  features/
    landing/
      pages/
      components/
    dashboard/
      pages/
      components/
      queries.ts
    assets/
      pages/
      components/
      queries.ts
      types.ts
    telemetry/
      components/
      queries.ts
      charts/
    incidents/
      pages/
      components/
      queries.ts
      mutations.ts
    system/
      pages/
      components/
      queries.ts
  hooks/
  lib/
    dates.ts
    formatting.ts
    queryKeys.ts
  styles/
    tokens.css
    global.css
  test/
```

The final folder structure can differ, but API calls must not be
scattered through presentational components. Feature modules should own
feature-specific query and mutation logic, while shared layout and
feedback components remain reusable.

### 8.3 Data-flow model

1.  Route/page loads.
2.  Feature query requests data through the shared API client.
3.  API client applies the configured base URL, request headers,
    response parsing, and error normalization.
4.  Feature query validates/normalizes data if necessary.
5.  Components render loading, success, empty, or error state.
6.  User-triggered mutations call the appropriate endpoint.
7.  Successful mutations update or invalidate the related cached query.
8.  UI presents the API-confirmed result.

The browser must not access the database, SCADA, PLCs, sensors, or local
AI runtime directly. Those responsibilities remain behind the backend
boundary.

### 8.4 Type safety

Create frontend types corresponding to the OpenAPI schemas. Prefer
generated types from the YAML if the build workflow supports generation;
otherwise maintain manually defined types and add contract tests.
Preserve the API enum values exactly: - Asset status: `normal`,
`warning`, `critical`, `unknown` - Incident status: `open`,
`acknowledged`, `resolved` - Severity: `low`, `medium`, `high`,
`critical` - System status: `healthy`, `degraded`, `unavailable` -
Database: `ready`, `unavailable` - Ingestion: `ready`, `stopped`,
`error` - Detector: `ready`, `unavailable`, `not_configured` - LLM:
`ready`, `unavailable`, `disabled`, `not_configured`

Do not silently rename API values in the data layer. UI labels can be
human-readable mappings while the underlying values remain unchanged.

------------------------------------------------------------------------

## 9. Design System and Visual Direction

Use the supplied Figma files as design references. The implementation
agent should inspect the actual frames and reusable components before
deciding final spacing, typography, color tokens, table styles, cards,
and responsive behavior. The links alone are references; this document
does not claim that specific Figma frames have already been inspected.

### 9.1 Visual direction

-   Industrial, high-trust, technical, restrained.
-   Clear contrast and typography; prioritize data density without
    crowding.
-   Consistent spacing and alignment.
-   Use color semantically for statuses and severity, not as decoration.
-   Avoid excessive gradients, glassmorphism, oversized empty cards,
    meaningless charts, and generic AI imagery.
-   Use visual hierarchy to distinguish system status, active incidents,
    asset health, and telemetry.
-   Keep animation subtle and functional.

### 9.2 Semantic state palette

The exact colors should be derived from the Figma references and checked
for contrast. Semantics must remain consistent: - Normal/ready/healthy:
positive state. - Warning/degraded: caution state. -
Critical/unavailable/error: urgent/problem state. - Unknown/not
configured/empty: neutral or informational state. -
Open/acknowledged/resolved: distinct lifecycle labels, not
interchangeable with severity.

Always include a text label or accessible name alongside a color
indicator.

### 9.3 Responsive behavior

-   Desktop: persistent sidebar and multi-column overview.
-   Tablet: compact/collapsible navigation and reduced grid columns.
-   Mobile: navigation drawer or compact navigation, stacked summary
    sections, horizontally scrollable data tables only where
    unavoidable.
-   Critical incident information and action controls must remain
    accessible on small screens.
-   Charts must resize without clipping axes or legends.
-   Avoid horizontal page overflow.

### 9.4 Accessibility

-   Use semantic headings and landmarks.
-   All interactive controls must be keyboard reachable and have visible
    focus states.
-   Do not rely on color alone for status or severity.
-   Provide labels for form controls and icon-only buttons.
-   Use accessible dialog behavior for confirmations.
-   Announce important mutation results and errors through an
    appropriate live region.
-   Respect reduced-motion preferences.
-   Ensure text and controls meet WCAG AA contrast targets where
    applicable.

------------------------------------------------------------------------

## 10. Data Freshness, Time, and Formatting

-   Store and transmit API timestamps as ISO date-time strings.
-   Display timestamps in a consistent human-readable format, ideally
    with a clear timezone convention. If local browser time is used,
    make the timezone visible where operationally important.
-   History requests use UTC timestamps, inclusive `start`, exclusive
    `end`.
-   Never use the browser clock as a substitute for `last_telemetry_at`,
    `last_seen_at`, or incident timestamps.
-   A missing timestamp should display "Not available" or another clear
    neutral label.
-   Show "Last updated" only from the frontend's last successful fetch
    time, not as a claim about when telemetry was measured.
-   Distinguish telemetry measurement time (`timestamp`) from backend
    receipt time (`received_at`).
-   For telemetry rows, consider showing measurement time prominently
    and receipt time in details where useful.

------------------------------------------------------------------------

## 11. State Management and Failure Behavior

Every data-backed section must define the following states:

  -----------------------------------------------------------------------
  State                               Expected behavior
  ----------------------------------- -----------------------------------
  Initial loading                     Skeletons or a concise loading
                                      indicator; avoid layout shift

  Success                             Render API-backed data

  Empty                               Explain that the request succeeded
                                      but no matching records exist

  Error                               Show concise explanation and retry
                                      action

  Partial failure                     Keep successful sections usable and
                                      identify the failed section

  Stale cached data                   If shown, visibly indicate that it
                                      may be stale

  Mutation pending                    Disable duplicate action and show
                                      progress

  Mutation success                    Confirm result and refresh/update
                                      API-backed state

  Mutation conflict                   Explain that the server state has
                                      changed and refresh data

  API unavailable                     Show connection state; do not
                                      fabricate operational values
  -----------------------------------------------------------------------

Do not convert errors into empty arrays without preserving the error
state. "No incidents" and "failed to load incidents" are materially
different outcomes.

------------------------------------------------------------------------

## 12. Security and Operational Constraints

-   Frontend must use the backend as the only data boundary.
-   Do not embed API secrets in frontend environment variables or
    shipped code.
-   Do not render arbitrary HTML from incident descriptions or evidence.
-   Escape or safely format all API-provided text.
-   Do not send industrial write commands.
-   Do not assume authentication exists or invent a token mechanism. If
    authentication is added later, integrate it according to a
    documented backend contract.
-   Avoid logging full telemetry payloads or sensitive operational data
    to the browser console in production builds.
-   For local deployments, document the configured API base URL and any
    browser/CORS setup required by the backend.
-   Do not expose internal stack traces to operators.

------------------------------------------------------------------------

## 13. Performance Requirements

These are proposed frontend targets and should be validated on the
intended demo machine.

-   Landing page should load quickly without a large animation or video
    blocking initial content.
-   Dashboard sections should render progressively as their independent
    API requests finish.
-   Use pagination for lists rather than attempting to render unlimited
    assets/incidents.
-   Use chart downsampling or a bounded query range if telemetry history
    becomes large; do not invent server aggregation.
-   Avoid unnecessary refetches and duplicate requests.
-   Keep the interface usable on a typical laptop used for an industrial
    demo.
-   Reserve space for charts/tables to minimize layout shifts.
-   Lazy-load non-critical landing-page visuals where practical.

------------------------------------------------------------------------

## 14. Testing Strategy

### 14.1 Unit tests

-   API URL construction and query parameter encoding.
-   Error-envelope parsing.
-   Date-range validation (`end` later than `start`).
-   Status/severity label mappings.
-   Timestamp formatting and null handling.
-   Pagination calculations.
-   Telemetry series ordering and unit separation.

### 14.2 Component tests

-   Status and severity badges include text labels.
-   Empty, loading, error, and partial-failure states render correctly.
-   Incident filters preserve valid enum values.
-   Acknowledge/resolve buttons disable while pending.
-   Resolve form enforces the 1000-character note limit.
-   Telemetry chart shows correct units and handles no readings.

### 14.3 Integration tests

-   Overview loads each section from the correct endpoint.
-   Asset list pagination uses the correct limit/offset.
-   Asset detail loads asset, sensors, latest telemetry, and history.
-   Incident filters map to the correct query parameters.
-   Acknowledge and resolve mutations use the correct endpoints and
    update from the response.
-   `404`, `409`, `422`, and `503` produce appropriate UI feedback.
-   API health and component status can display independently.

### 14.4 End-to-end acceptance flows

1.  Open landing page and navigate to dashboard.
2.  Load dashboard when every endpoint succeeds.
3.  Load dashboard when one endpoint fails but others succeed.
4.  Open an asset and query telemetry history for a valid time range.
5.  Submit an invalid history range and verify clear feedback.
6.  Filter incidents by status and severity.
7.  Acknowledge an eligible incident.
8.  Resolve an active incident with and without a note.
9.  Attempt an action on an already-resolved incident and handle `409`.
10. Simulate API outage and verify no fake healthy state is shown.
11. Verify mobile/tablet navigation and key actions.

------------------------------------------------------------------------

## 15. Implementation Sequence

Implement in vertical slices; do not build the entire UI before
connecting the API.

### Phase 1 --- Foundation

-   Inspect both supplied Figma references and identify the relevant
    frames/components.
-   Confirm the frontend stack already present in the repository before
    adding dependencies.
-   Set up routing, global styles/tokens, responsive shell, environment
    configuration, and API client.
-   Define API types and normalized error handling.
-   Add global loading/error/empty-state primitives.

### Phase 2 --- System visibility

-   Implement `/health` and `/system/status` queries.
-   Build the system status component and `/system` page.
-   Validate process health versus component health behavior.

### Phase 3 --- Asset and telemetry views

-   Build asset list and pagination.
-   Build asset detail and sensor list.
-   Add latest telemetry table and historical time-range/chart flow.
-   Test null timestamps, no sensors, empty readings, and API errors.

### Phase 4 --- Incident workflow

-   Build incident list, filters, pagination, and detail.
-   Implement acknowledge and resolve actions.
-   Add conflict handling, confirmation, pending states, and mutation
    feedback.

### Phase 5 --- Operations overview

-   Compose the dashboard from the completed feature modules.
-   Add recent telemetry and incident sections.
-   Ensure summary counts are not misleading when data is paginated.
-   Validate partial failure and refresh behavior.

### Phase 6 --- Landing page

-   Implement the landing page using the supplied SaaS landing-page
    reference.
-   Use real application screenshots or explicitly labeled demo visuals.
-   Ensure all CTA destinations work and claims are approved.

### Phase 7 --- Hardening

-   Complete accessibility, responsive, performance, and end-to-end
    checks.
-   Test against a real backend and a controlled set of error responses.
-   Remove placeholders, unused routes, fake metrics, and dead controls.
-   Document environment configuration and local run steps.

------------------------------------------------------------------------

## 16. Definition of Done

The frontend is ready for the MVP demo when:

-   [ ] Landing page and dashboard both exist and use the intended
    design references.
-   [ ] All implemented backend calls match the uploaded OpenAPI
    contract.
-   [ ] The frontend uses a configurable API base URL.
-   [ ] API types and enum values match the schema.
-   [ ] Dashboard overview, assets, asset details, telemetry history,
    incidents, incident details, and system status are implemented to
    the agreed MVP scope.
-   [ ] Incident acknowledgement and resolution use the documented
    mutation endpoints.
-   [ ] The optional ingestion UI is omitted unless confirmed by the
    full PRD.
-   [ ] Loading, empty, error, partial-failure, and unavailable states
    are present.
-   [ ] The interface never presents fabricated telemetry or operational
    status as real.
-   [ ] No direct browser connection to SCADA, industrial devices, or
    local AI runtime exists.
-   [ ] No unsupported backend capabilities are exposed as functional
    controls.
-   [ ] Responsive layouts and keyboard interaction are tested.
-   [ ] Core API flows have automated tests.
-   [ ] Local setup and API configuration are documented.
-   [ ] No placeholder links, dead buttons, or unresolved TODOs remain
    in the demo path.

------------------------------------------------------------------------

## 17. Open Questions / Dependencies

These items are not answered by the uploaded API YAML and must be
confirmed against the full INDUX PRD or backend team:

1.  What exact anomaly categories and evidence fields will appear in
    `latest_evidence`?
2.  What is the expected telemetry sampling frequency and volume?
3.  Is the dashboard intended to use polling or WebSocket events? If
    WebSocket, what are the URL, event schemas, reconnection policy, and
    freshness expectations?
4.  Which assets should be visible in the MVP demo, and how will demo
    data be seeded?
5.  Is manual telemetry ingestion a required user workflow or only a
    backend integration endpoint?
6.  Should dashboard summary counts represent all records? If so, will
    the backend provide aggregate endpoints, or should the frontend page
    through all records?
7.  What is the final approved local deployment architecture and API
    base URL for the demo environment?
8.  Is authentication intentionally out of scope for the MVP?
9.  What exact copy, supported claims, and sourced statistics are
    approved for the landing page?
10. Which frames/components in the supplied Figma files are the
    preferred references for the landing page and dashboard?
11. Does the full PRD require an AI explanation or recommendation panel?
    If yes, what documented endpoint and response schema support it?
12. What browser/device environment will be used for the judging/demo
    round?

------------------------------------------------------------------------

## 18. Source and Confidence Notes

### Source-derived facts

-   The API is OpenAPI 3.1.0, version 0.1.0, with local demo base URL
    `http://127.0.0.1:8000/api/v1`.
-   The API defines system health/status, asset and sensor reads,
    telemetry ingestion/latest/history, and incident
    list/detail/acknowledge/resolve operations.
-   Industrial integrations are described as read-only.
-   Telemetry ingestion supports batches up to 500 readings and can
    return per-reading acceptance/rejection results.
-   The API defines the status/severity enums and structured error
    envelope documented above.
-   The API description states that WebSocket events are described in
    the project PRD, not in the OpenAPI document.

### Proposed frontend decisions

-   The route map, React/TypeScript stack, folder structure, dashboard
    composition, page layout, polling guidance, test strategy, and
    performance targets are frontend recommendations that need to be
    aligned with the repository and full PRD.
-   Landing page copy, statistics, screenshots, user roles, and any
    AI-specific interface must be validated against the final product
    requirements.

**Confidence:** High for endpoint/schema alignment with the uploaded
YAML; medium for proposed frontend architecture and page composition
pending the full INDUX PRD and repository inspection.
