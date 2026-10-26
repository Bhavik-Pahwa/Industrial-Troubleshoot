from fastapi.testclient import TestClient
import pytest
import requests

from AI.app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def offline_model(monkeypatch):
    def unavailable(*args, **kwargs):
        raise requests.ConnectionError("Test model is offline")

    monkeypatch.setattr("AI.app.service.requests.post", unavailable)
    monkeypatch.setattr("AI.app.service.requests.get", unavailable)


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
    assert "No threshold breaches" in body["explanation"]
    assert body["analysis_source"] == "threshold_fallback"
    assert body["model"] is None


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
    assert body["model_available"] is False


def test_generated_explanation_is_labeled(monkeypatch):
    monkeypatch.setenv("OLLAMA_MODEL", "test-model")
    monkeypatch.setattr(
        "AI.app.service.generate_analysis", lambda prompt: "Temperature is elevated."
    )
    response = client.post(
        "/ai/analyze",
        json={
            "asset_id": "pump-01",
            "readings": [
                {
                    "sensor_id": "temperature",
                    "name": "temperature",
                    "value": 100,
                    "configured_max": 80,
                }
            ],
        },
    )
    assert response.status_code == 200
    assert response.json()["analysis_source"] == "ollama"
    assert response.json()["model"] == "test-model"
    assert response.json()["explanation"] == "Temperature is elevated."
    assert response.json()["anomalies"][0]["reading_index"] == 0


def test_invalid_numeric_value_returns_validation_error():
    response = client.post(
        "/ai/analyze",
        json={
            "asset_id": "pump-01",
            "readings": [
                {"sensor_id": "temperature", "name": "temperature", "value": "invalid"}
            ],
        },
    )
    assert response.status_code == 400
