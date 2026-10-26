import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest
from conftest import ingest, reading
from fastapi.testclient import TestClient

from indux.config import Settings
from indux.main import create_app


@pytest.fixture
def ai_server(monkeypatch):
    state = {"available": True, "requests": []}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def do_GET(self):
            self.reply({"status": "ok", "model_available": True})

        def do_POST(self):
            payload = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            state["requests"].append(payload)
            self.reply(
                {
                    "asset_id": payload["asset_id"],
                    "anomalies": [
                        {
                            "sensor_id": r["sensor_id"],
                            "reading_index": i,
                            "category": "high_temperature",
                            "severity": "high",
                        }
                        for i, r in enumerate(payload["readings"])
                        if r["value"] > r["configured_max"]
                    ],
                    "explanation": "Measured temperature exceeds the demo threshold.",
                    "recommended_action": "Review the reading.",
                    "analysis_source": "ollama",
                    "model": "test-model",
                    "limitations": [],
                }
            )

        def reply(self, body):
            self.send_response(200 if state["available"] else 503)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(body).encode())

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    monkeypatch.setenv("INDUX_AI_URL", f"http://127.0.0.1:{server.server_port}")
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield state
    server.shutdown()
    server.server_close()
    thread.join()


def test_ai_http_bridge_preserves_reading_identity_and_evidence(tmp_path, ai_server):
    settings = Settings(database_path=tmp_path / "ai.sqlite3", detector="ai")
    with TestClient(create_app(settings)) as client:
        readings = [reading(value=90), reading(value=105), reading(asset_id="motor-01", value=50)]
        result = ingest(client, readings).json()
        assert result["accepted"] == 3
        incidents = client.get("/api/v1/incidents").json()["items"]
        assert len(incidents) == 1
        assert incidents[0]["occurrence_count"] == 2
        assert incidents[0]["latest_evidence"]["reading_id"] == result["results"][1]["reading_id"]
        assert incidents[0]["latest_evidence"]["analysis_source"] == "ollama"
        assert len(ai_server["requests"]) == 2
        assert ai_server["requests"][0]["asset_type"] == "pump"
        assert ai_server["requests"][0]["readings"][0]["configured_max"] == 80
        assert client.get("/api/v1/system/status").json()["llm"] == "ready"


def test_ai_outage_keeps_telemetry_and_recovers_on_new_batch(tmp_path, ai_server):
    settings = Settings(database_path=tmp_path / "ai.sqlite3", detector="ai")
    with TestClient(create_app(settings)) as client:
        ai_server["available"] = False
        result = ingest(client, [reading(value=100)]).json()
        assert result["accepted"] == 1
        assert client.get("/api/v1/telemetry/latest").json()["items"][0]["value"] == 100
        assert client.get("/api/v1/system/status").json()["detector"] == "unavailable"
        assert client.get("/api/v1/incidents").json()["items"] == []
        ai_server["available"] = True
        assert ingest(client, [reading(value=110)]).json()["accepted"] == 1
        assert client.get("/api/v1/system/status").json()["detector"] == "ready"
        assert len(client.get("/api/v1/incidents").json()["items"]) == 1
