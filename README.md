# INDUX local stack

React frontend -> FastAPI backend + SQLite -> AI service -> local Ollama.
The backend owns ingestion and incidents; only the backend calls the AI service.

## Windows setup

Prerequisites: Python 3.13 (`py -3.13`), Node.js/npm, and Ollama for generated assessments.
From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
ollama pull qwen2.5:3b
powershell -ExecutionPolicy Bypass -File scripts/start.ps1
```

Ollama must be running (its desktop app or `ollama serve`). The start script starts
all three application services in the background, waits for readiness, and keeps
logs and process identifiers in `.runtime/`. It refuses occupied ports instead of
silently connecting to unrelated services. Existing SQLite data is preserved.

| Service | URL |
| --- | --- |
| Frontend dashboard | http://127.0.0.1:5173/dashboard |
| Telemetry ingestion tool | http://127.0.0.1:5173/ingest |
| Backend API docs | http://127.0.0.1:8000/docs |
| AI API docs | http://127.0.0.1:8001/docs |
| Backend readiness | http://127.0.0.1:8000/api/v1/system/status |
| AI/model health | http://127.0.0.1:8001/ai/health |

Stop the managed application services (Ollama is left running):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/stop.ps1
```

To use another installed model, pass `-Model 'model:tag'` to `start.ps1`.
The launcher selects `INDUX_DETECTOR=ai`, `INDUX_AI_URL=http://127.0.0.1:8001`,
and the live frontend API URL. Starting the backend alone still defaults to its
original demo detector. The AI service also supports `OLLAMA_MODEL` (legacy alias
`GEMMA_MODEL`), `OLLAMA_URL`, and `OLLAMA_TIMEOUT` (30 seconds); the backend's
`INDUX_AI_TIMEOUT` defaults to 45 seconds per asset.

## Try the integration

1. Open the ingestion tool and confirm **Backend API Live**.
2. Load and submit the normal pump preset: two readings should be accepted.
3. Load and submit the motor thermal-excursion preset: two readings should be accepted.
4. Open the incident queue, inspect an incident's **AI Assessment**, then acknowledge
   and resolve it. The evidence records its originating reading and analysis model.
5. Submit the invalid-reading preset: one reading is accepted and one rejected.

The seeded equipment is `pump-01` and `motor-01`; both have `temperature` (`degC`)
and `vibration` (`mm/s`) sensors. Detection uses illustrative limits of 80 degC and
7 mm/s. This is threshold detection with an optional generated explanation, not a
trained fault classifier or an equipment safety assessment. Asset status becomes
`unknown` after 15 seconds without fresh readings; this does not indicate a broken
service. Use the ingest tool or `backend/.venv/Scripts/python -m indux.simulator`
to supply fresh synthetic readings.

If Ollama is unavailable, threshold detection still works and assessments explicitly
say `threshold_fallback`; health reports the language model unavailable. If the AI
service itself is down, valid telemetry is still stored and detector health degrades.
New accepted batches resume detection after recovery; old batches are not replayed.

## Verification

```powershell
backend/.venv/Scripts/python -m pytest backend/tests -q
AI/.venv/Scripts/python -m pytest AI/tests -q
backend/.venv/Scripts/python -m ruff check backend/src backend/tests
backend/.venv/Scripts/python scripts/smoke.py
cd FRONTEND
npm test
npm run build
npm run test:e2e
```

The browser test requires the running stack, Microsoft Edge, and the default
`qwen2.5:3b` model. It sends actual HTTP requests, verifies generated AI evidence,
tests incident acknowledgement/resolution and partial rejection, checks for browser
errors, and saves screenshots in `.runtime/`. It adds labeled synthetic telemetry
and incidents to the local demo database. Backend/AI unit tests use isolated data and
controlled service responses, including AI outages and recovery.
The live smoke script checks browser CORS, WebSocket notifications, duplicate
rejection, stored history, and generated AI evidence against the running services.

The canonical REST contract is [FRONTEND/INDUX_backend_api.yaml](FRONTEND/INDUX_backend_api.yaml).
