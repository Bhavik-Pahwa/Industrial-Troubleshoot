from fastapi.testclient import TestClient

from AI.app.main import app

client = TestClient(app)


def test_analysis_detects_threshold_breach():
    payload = {
        "asset_id": "MACHINE-001",
        "asset_type": "industrial_motor",
        "readings": [
            {
                "sensor_id": "TEMP-01",
                "name": "temperature",
                "value": 96.5,
                "unit": "C",
                "timestamp": "2026-10-26T08:30:00Z",
                "configured_max": 85,
            }
        ],
    }

    response = client.post("/ai/analyze", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["asset_id"] == "MACHINE-001"
    assert body["anomaly_detected"] is True
    assert body["anomalies"][0]["category"] == "high_temperature"
    assert body["severity"] in {"low", "medium", "high", "critical"}
    assert body["confidence"] > 0
    assert body["explanation"]


def test_analysis_ignores_normal_reading():
    payload = {
        "asset_id": "MACHINE-002",
        "asset_type": "industrial_motor",
        "readings": [
            {
                "sensor_id": "TEMP-02",
                "name": "temperature",
                "value": 64,
                "unit": "C",
                "timestamp": "2026-10-26T08:45:00Z",
                "configured_max": 85,
            }
        ],
    }

    response = client.post("/ai/analyze", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["anomaly_detected"] is False
    assert body["anomalies"] == []


def test_invalid_payload_is_rejected():
    response = client.post(
        "/ai/analyze",
        json={
            "asset_type": "industrial_motor",
            "readings": [],
        },
    )
    assert response.status_code == 400


def test_health_endpoint_reports_model_status():
    response = client.get("/ai/health")
    assert response.status_code == 200
    body = response.json()
    assert "status" in body
    assert "model_available" in body
    assert isinstance(body["model_available"], bool)
