"""Live HTTP + WebSocket checks. Run with backend/.venv/Scripts/python."""

import json
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import httpx
from websockets.sync.client import connect

API = "http://127.0.0.1:8000/api/v1"


def main():
    with httpx.Client(timeout=90) as client:
        status = client.get(f"{API}/system/status").json()
        assert status["detector"] == status["llm"] == "ready", status
        timestamp = datetime.now(UTC)
        batch = {
            "source_id": f"integration-smoke-{uuid4()}",
            "readings": [{
                "asset_id": "pump-01", "sensor_id": "temperature", "value": 96.5,
                "unit": "degC", "timestamp": timestamp.isoformat(),
            }],
        }
        with connect("ws://127.0.0.1:8000/api/v1/events", origin="http://127.0.0.1:5173") as ws:
            response = client.post(f"{API}/telemetry/ingest", json=batch,
                                   headers={"Origin": "http://127.0.0.1:5173"})
            response.raise_for_status()
            assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"
            assert response.json()["accepted"] == 1, response.text
            received = []
            while len(received) < 20:
                event = json.loads(ws.recv(timeout=10))
                received.append(event["type"])
                if any(name.startswith("incident.") for name in received) and "telemetry.updated" in received:
                    break
            else:
                raise AssertionError(received)
        duplicate = client.post(f"{API}/telemetry/ingest", json=batch).json()
        assert duplicate["accepted"] == 0
        assert duplicate["results"][0]["code"] == "DUPLICATE_READING"
        history = client.get(f"{API}/telemetry/history", params={
            "asset_id": "pump-01", "start": (timestamp - timedelta(seconds=1)).isoformat(),
            "end": (timestamp + timedelta(seconds=1)).isoformat(),
        }).json()
        assert any(r["source_id"] == batch["source_id"] for r in history["items"])
        incidents = client.get(f"{API}/incidents", params={"asset_id": "pump-01", "status": "open"}).json()
        incident = next(i for i in incidents["items"] if i["anomaly_category"] == "high_temperature")
        evidence = incident["latest_evidence"]
        assert evidence["detector"] == "ai_service"
        assert evidence["analysis_source"] == "ollama", evidence
        assert evidence["reading_id"] == response.json()["results"][0]["reading_id"]
        print(json.dumps({"result": "PASS", "checks": ["CORS", "WebSocket events", "ingestion",
            "duplicate rejection", "history persistence", "AI evidence"], "model": evidence["model"],
            "incident_id": incident["id"], "explanation": evidence["explanation"]}, indent=2))


if __name__ == "__main__":
    main()
