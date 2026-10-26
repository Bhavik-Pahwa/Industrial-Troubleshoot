import json
import sqlite3
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta

import pytest
from conftest import CONTRACT, ContractClient, ingest, reading

from indux.detectors.base import Detection
from indux.main import create_app
from indux.time import serialize, utc_now


def test_startup_health_assets_sensors_and_openapi(client):
    assert client.get("/api/v1/health").json() == {"status": "ok"}
    assert client.get("/api/v1/system/status").json() == {
        "status": "healthy",
        "database": "ready",
        "ingestion": "ready",
        "detector": "ready",
        "llm": "disabled",
        "last_telemetry_at": None,
    }
    assets = client.get("/api/v1/assets").json()
    assert assets["total"] == 2
    assert all(a["status"] == "unknown" for a in assets["items"])
    assert client.get("/api/v1/assets", params={"limit": 1, "offset": 1}).json()["items"] == [
        assets["items"][1]
    ]
    for asset in assets["items"]:
        assert client.get(f"/api/v1/assets/{asset['id']}").json() == asset
        sensors = client.get(f"/api/v1/assets/{asset['id']}/sensors").json()
        assert sensors["total"] == 2
        assert {s["id"] for s in sensors["items"]} == {"temperature", "vibration"}
    generated = client.get("/openapi.json").json()
    for path, methods in CONTRACT["paths"].items():
        for method, operation in methods.items():
            assert (
                generated["paths"]["/api/v1" + path][method]["operationId"]
                == operation["operationId"]
            )


def test_partial_acceptance_and_deduplication(client):
    valid = reading()
    items = [
        valid,
        reading(asset_id="missing"),
        reading(sensor_id="missing"),
        reading(unit="F"),
        reading(value="50"),
        reading(value=True),
        reading(value=None),
        reading(timestamp="not-a-date"),
        {},
        None,
        [],
        valid,
        reading(asset_id="motor-01"),
    ]
    response = ingest(client, items)
    assert response.status_code == 200
    result = response.json()
    assert (result["accepted"], result["rejected"]) == (2, 11)
    assert [r["index"] for r in result["results"]] == list(range(len(items)))
    assert [r.get("code") for r in result["results"][1:4]] == [
        "UNKNOWN_ASSET",
        "UNKNOWN_SENSOR",
        "UNIT_MISMATCH",
    ]
    assert result["results"][11]["code"] == "DUPLICATE_READING"
    assert ingest(client, [valid]).json()["accepted"] == 0
    assert ingest(client, [valid], source="another").json()["accepted"] == 1
    assert len(client.get("/api/v1/telemetry/latest").json()["items"]) == 2


@pytest.mark.parametrize("value", [float("nan"), float("inf"), -float("inf")])
def test_nonfinite_readings_rejected_individually(client, value):
    response = client.post(
        "/api/v1/telemetry/ingest",
        content=json.dumps(
            {
                "source_id": "test",
                "readings": [reading(value=value), reading()],
            }
        ),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 200
    assert response.json()["accepted"] == 1
    assert response.json()["rejected"] == 1


@pytest.mark.parametrize(
    "body",
    [
        None,
        [],
        {},
        {"readings": [reading()]},
        {"source_id": 3, "readings": [reading()]},
        {"source_id": "x", "readings": []},
        {"source_id": "x", "readings": {}},
        {"source_id": "x", "readings": [reading()] * 501},
    ],
)
def test_invalid_envelopes_store_nothing(client, body):
    assert client.post("/api/v1/telemetry/ingest", json=body).status_code == 422
    assert client.get("/api/v1/telemetry/latest").json() == {"items": []}


def test_malformed_json(client):
    response = client.post(
        "/api/v1/telemetry/ingest", content="{broken", headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422


def test_batch_limit_boundary(client):
    base = datetime.now(UTC)
    items = [reading(timestamp=serialize(base - timedelta(microseconds=i))) for i in range(500)]
    assert ingest(client, items).json()["accepted"] == 500


def test_timestamps_offsets_dedup_and_history_order(client):
    items = [
        reading(timestamp="2026-10-26T12:00:02Z"),
        reading(timestamp="2026-10-26T12:00:00Z"),
        reading(timestamp="2026-10-26T12:00:01Z"),
        reading(timestamp="2026-10-26T17:30:01+05:30"),
        reading(timestamp="2026-10-26T12:00:00"),
        reading(timestamp="2026-02-30T12:00:00Z"),
    ]
    assert ingest(client, items).json()["accepted"] == 3
    same_time = reading(timestamp="2026-10-26T12:00:01Z")
    assert ingest(client, [same_time], source="second").json()["accepted"] == 1
    query = {
        "asset_id": "pump-01",
        "start": "2026-10-26T12:00:00Z",
        "end": "2026-10-26T12:00:02Z",
        "limit": 2,
        "offset": 1,
    }
    result = client.get("/api/v1/telemetry/history", params=query).json()
    assert result["total"] == 3
    assert len(result["items"]) == 2
    assert [r["source_id"] for r in result["items"]] == ["test", "second"]
    assert result["items"][0]["id"] < result["items"][1]["id"]
    latest = client.get("/api/v1/telemetry/latest", params={"asset_id": "pump-01"}).json()
    assert latest["items"][0]["id"] == 1
    assert latest["items"][0]["timestamp"] == "2026-10-26T12:00:02.000000Z"


@pytest.mark.parametrize(
    "path",
    [
        "/assets/missing",
        "/assets/missing/sensors",
        "/incidents/missing",
        "/telemetry/latest?asset_id=missing",
    ],
)
def test_not_found(client, path):
    assert client.get("/api/v1" + path).status_code == 404


@pytest.mark.parametrize(
    "path",
    [
        "/assets?limit=0",
        "/assets?limit=201",
        "/assets?offset=-1",
        "/assets?limit=nope",
        "/incidents?status=bad",
        "/incidents?severity=bad",
        "/telemetry/history?asset_id=pump-01",
        "/telemetry/history?asset_id=pump-01&start=nope&end=nope",
        "/telemetry/history?asset_id=pump-01&start=2026-10-26T12:00:00Z&end=2026-10-26T12:00:00Z",
    ],
)
def test_query_errors(client, path):
    assert client.get("/api/v1" + path).status_code == 400


def test_incident_lifecycle_grouping_filters_and_restart(client, settings):
    ingest(client, [reading(value=105)])
    original = client.get("/api/v1/incidents").json()["items"][0]
    incident_id = original["id"]
    endpoint = f"/api/v1/incidents/{incident_id}"
    acknowledged = client.post(endpoint + "/acknowledge").json()
    assert acknowledged["status"] == "acknowledged"
    assert client.post(endpoint + "/acknowledge").json() == acknowledged
    ingest(client, [reading(value=85), reading(sensor_id="vibration", unit="mm/s", value=9)])
    updated = client.get(endpoint).json()
    assert updated["occurrence_count"] == 2
    assert updated["status"] == "acknowledged"
    assert updated["acknowledged_at"] == acknowledged["acknowledged_at"]
    assert updated["severity"] == "critical"
    assert updated["latest_evidence"]["value"] == 85
    assert client.get("/api/v1/incidents").json()["total"] == 2
    filtered = client.get(
        "/api/v1/incidents",
        params={
            "status": "acknowledged",
            "asset_id": "pump-01",
            "severity": "critical",
        },
    ).json()
    assert filtered["total"] == 1
    assert filtered["items"][0]["id"] == incident_id
    ingest(client)  # Normal telemetry must not resolve the incident.
    assert client.get(endpoint).json()["status"] == "acknowledged"
    assert client.post(endpoint + "/resolve", json={"note": "x" * 1001}).status_code == 422
    resolved = client.post(endpoint + "/resolve", json={"note": "Inspected by operator"}).json()
    assert resolved["status"] == "resolved"
    assert resolved["resolution_note"] == "Inspected by operator"
    assert client.post(endpoint + "/resolve").status_code == 409
    assert client.post(endpoint + "/acknowledge").status_code == 409
    ingest(client, [reading(value=105)])
    assert client.get("/api/v1/incidents").json()["total"] == 3
    with ContractClient(create_app(settings)) as restarted:
        assert restarted.get(endpoint).json() == resolved
        assert restarted.get("/api/v1/incidents").json()["total"] == 3
        assert restarted.get("/api/v1/system/status").json()["last_telemetry_at"] is not None


def test_resolve_without_body_and_missing_incident(client):
    assert client.post("/api/v1/incidents/missing/acknowledge").status_code == 404
    assert client.post("/api/v1/incidents/missing/resolve").status_code == 404
    ingest(client, [reading(value=90)])
    incident_id = client.get("/api/v1/incidents").json()["items"][0]["id"]
    assert client.post(f"/api/v1/incidents/{incident_id}/resolve").json()["status"] == "resolved"


def test_equipment_status_precedence_and_freshness(client, monkeypatch):
    assert client.get("/api/v1/assets/pump-01").json()["status"] == "unknown"
    ingest(client)
    assert client.get("/api/v1/assets/pump-01").json()["status"] == "normal"
    ingest(client, [reading(value=85)])
    assert client.get("/api/v1/assets/pump-01").json()["status"] == "warning"
    ingest(client, [reading(value=105)])
    assert client.get("/api/v1/assets/pump-01").json()["status"] == "critical"
    monkeypatch.setattr(
        "indux.services.assets.utc_now",
        lambda: serialize(datetime.now(UTC) + timedelta(seconds=16)),
    )
    assert client.get("/api/v1/assets/pump-01").json()["status"] == "unknown"
    assert client.get("/api/v1/incidents?status=open&severity=critical").json()["total"] == 1


def test_out_of_order_detection_preserves_latest_evidence(client):
    newest = utc_now()
    ingest(client, [reading(value=105, timestamp=newest)])
    ingest(client, [reading(value=90, timestamp="2000-01-01T00:00:00Z")])
    incident = client.get("/api/v1/incidents").json()["items"][0]
    assert incident["last_observed_at"] == newest
    assert incident["latest_evidence"]["value"] == 105
    assert incident["occurrence_count"] == 2


def test_concurrent_duplicate_batches_and_grouping(client):
    sample = reading(value=105)
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = list(executor.map(lambda _: ingest(client, [sample]).json(), range(8)))
    assert sum(r["accepted"] for r in results) == 1
    with ThreadPoolExecutor(max_workers=8) as executor:
        list(executor.map(lambda _: ingest(client, [reading(value=105)]), range(8)))
    incidents = client.get("/api/v1/incidents").json()
    assert incidents["total"] == 1
    assert incidents["items"][0]["occurrence_count"] == 9


def test_foreign_keys_and_schema_indexes(client):
    with client.app.state.database.connection(write=True) as db:
        with pytest.raises(sqlite3.IntegrityError):
            db.execute(
                "INSERT INTO sensors VALUES ('missing', 'x', 'x', 'x', NULL, ?)", (utc_now(),)
            )
        indexes = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type = 'index'")}
        assert {
            "telemetry_asset_time",
            "telemetry_sensor_time",
            "incidents_active_group",
            "incidents_status_severity_updated",
        } <= indexes


def test_cors(client):
    response = client.options(
        "/api/v1/telemetry/ingest",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


class CustomDetector:
    def __init__(self):
        self.severity = "medium"
        self.fail = False
        self.calls = 0

    def detect(self, readings):
        self.calls += 1
        if self.fail:
            raise RuntimeError("Model unavailable")
        return [
            Detection(
                asset_id=r.asset_id,
                sensor_id=r.sensor_id,
                anomaly_category="custom",
                severity=self.severity,
                observed_at=r.timestamp,
                evidence={"reading_id": r.id},
            )
            for r in readings
        ]


def test_detector_boundary_failure_recovery_and_low_medium_status(settings):
    detector = CustomDetector()
    detector.severity = "low"
    with ContractClient(create_app(settings, detector)) as client:
        ingest(client)
        assert client.get("/api/v1/assets/pump-01").json()["status"] == "normal"
        detector.severity = "medium"
        ingest(client)
        assert client.get("/api/v1/assets/pump-01").json()["status"] == "warning"
        detector.fail = True
        response = ingest(client)
        assert response.json()["accepted"] == 1
        assert client.get("/api/v1/system/status").json()["detector"] == "unavailable"
        assert client.get("/api/v1/health").json()["status"] == "ok"
        for _ in range(3):
            client.get("/api/v1/incidents")
            client.get("/api/v1/telemetry/latest")
        assert detector.calls == 3
        detector.fail = False
        ingest(client)
        assert client.get("/api/v1/system/status").json()["detector"] == "ready"
