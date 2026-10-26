import asyncio
from dataclasses import replace

import pytest
from conftest import ContractClient, ingest, reading
from starlette.websockets import WebSocketDisconnect

from indux.events import EventBus
from indux.main import create_app


@pytest.mark.parametrize(
    "mode,expected", [("disabled", "not_configured"), ("nonexistent_model:factory", "unavailable")]
)
def test_optional_components_do_not_block_ingest(settings, mode, expected):
    with ContractClient(create_app(replace(settings, detector=mode))) as client:
        assert client.get("/api/v1/health").status_code == 200
        status = client.get("/api/v1/system/status").json()
        assert status["status"] == "degraded"
        assert status["detector"] == expected
        assert status["llm"] == "disabled"
        assert ingest(client, [reading(value=105)]).json()["accepted"] == 1
        assert client.get("/api/v1/incidents").json()["total"] == 0


def test_database_failure_leaves_health_and_status_available(settings, tmp_path):
    # A directory cannot be opened as a SQLite file, on Windows or POSIX.
    with ContractClient(create_app(replace(settings, database_path=tmp_path))) as client:
        assert client.get("/api/v1/health").status_code == 200
        assert client.get("/api/v1/system/status").json()["database"] == "unavailable"
        assert client.get("/api/v1/assets").status_code == 503
        assert ingest(client).status_code == 503
        assert client.get("/api/v1/system/status").json()["ingestion"] == "error"


def test_ingestion_transaction_rolls_back_on_db_failure(client):
    with client.app.state.database.connection(write=True) as db:
        db.execute(
            "CREATE TRIGGER reject_second BEFORE INSERT ON telemetry_readings "
            "WHEN NEW.value = 99 BEGIN SELECT RAISE(ABORT, 'simulated failure'); END"
        )
    assert ingest(client, [reading(), reading(value=99)]).status_code == 503
    assert client.get("/api/v1/telemetry/latest").json()["items"] == []
    assert client.get("/api/v1/system/status").json()["ingestion"] == "error"
    assert ingest(client).status_code == 200
    assert client.get("/api/v1/system/status").json()["ingestion"] == "ready"


def test_websocket_events_lifecycle_and_reconnect(client):
    with client.websocket_connect("/api/v1/events") as socket:
        ingest(client, [reading(value=105)])
        messages = [socket.receive_json() for _ in range(3)]
        assert {m["type"] for m in messages} == {
            "telemetry.updated",
            "incident.created",
            "system.status_changed",
        }
        assert all(set(m) == {"id", "type", "timestamp", "data"} for m in messages)
        incident_id = next(
            m["data"]["incident_id"] for m in messages if m["type"] == "incident.created"
        )
        client.post(f"/api/v1/incidents/{incident_id}/acknowledge")
        assert socket.receive_json()["type"] == "incident.updated"
        client.post(f"/api/v1/incidents/{incident_id}/resolve")
        assert socket.receive_json()["type"] == "incident.updated"
    with client.websocket_connect("/api/v1/events") as reconnected:
        assert client.get(f"/api/v1/incidents/{incident_id}").json()["status"] == "resolved"
        ingest(client)
        assert reconnected.receive_json()["type"] in {"telemetry.updated", "system.status_changed"}


def test_websocket_broadcast_multiple_clients_and_disallowed_origin(client):
    with client.websocket_connect("/api/v1/events") as a:
        with client.websocket_connect("/api/v1/events") as b:
            ingest(client)
            assert a.receive_json() == b.receive_json()
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect("/api/v1/events", headers={"origin": "https://example.com"}):
            pass


def test_slow_client_queue_is_bounded():
    bus = EventBus(queue_size=1)
    queue = asyncio.Queue(maxsize=1)
    bus.clients.add(queue)
    bus.publish("telemetry.updated", {})
    bus.publish("telemetry.updated", {})
    assert queue.qsize() == 1
    assert queue.get_nowait() is None
    assert queue not in bus.clients


def test_unexpected_error_is_sanitized(client, monkeypatch):
    def broken(*args):
        raise RuntimeError("private internal detail")

    monkeypatch.setattr(client.app.state.assets, "list", broken)
    with ContractClient(client.app, raise_server_exceptions=False) as external:
        monkeypatch.setattr(external.app.state.assets, "list", broken)
        response = external.get("/api/v1/assets")
    assert response.status_code == 500
    assert "private" not in response.text


def test_freshness_configuration(settings, monkeypatch):
    from datetime import UTC, datetime, timedelta

    from indux.time import serialize

    with ContractClient(create_app(replace(settings, freshness_seconds=60))) as client:
        ingest(client)
        monkeypatch.setattr(
            "indux.services.assets.utc_now",
            lambda: serialize(datetime.now(UTC) + timedelta(seconds=30)),
        )
        assert client.get("/api/v1/assets/pump-01").json()["status"] == "normal"


def test_slow_detector_does_not_block_health(settings):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Event

    started, release = Event(), Event()

    class SlowDetector:
        def detect(self, readings):
            started.set()
            assert release.wait(timeout=5), "Test never released detector"
            return []

    with ContractClient(create_app(settings, SlowDetector())) as client:
        with ThreadPoolExecutor(max_workers=2) as pool:
            ingestion = pool.submit(ingest, client)
            try:
                assert started.wait(timeout=2)
                health = pool.submit(client.get, "/api/v1/health")
                assert health.result(timeout=2).json() == {"status": "ok"}
                # Committed data can already be queried during model execution.
                assert len(client.get("/api/v1/telemetry/latest").json()["items"]) == 1
            finally:
                release.set()
            assert ingestion.result(timeout=2).json()["accepted"] == 1


def test_invalid_detector_output_rolls_back_incidents_only(settings):
    class BadDetector:
        def detect(self, readings):
            first = readings[0]
            valid = {
                "asset_id": first.asset_id,
                "sensor_id": first.sensor_id,
                "anomaly_category": "custom",
                "severity": "critical",
                "observed_at": first.timestamp,
                "evidence": {"value": first.value},
            }
            return [valid, {**valid, "sensor_id": "nonexistent"}]

    with ContractClient(create_app(settings, BadDetector())) as client:
        assert ingest(client).json()["accepted"] == 1
        assert client.get("/api/v1/incidents").json()["total"] == 0
        assert client.get("/api/v1/system/status").json()["detector"] == "unavailable"


def test_timestamp_extremes_are_per_item_rejections(client):
    result = ingest(
        client,
        [
            reading(timestamp="0001-01-01T00:00:00+05:30"),
            reading(timestamp="9999-12-31T23:59:59-05:30"),
            reading(timestamp="2026-10-26T00:00:00+01:99"),
            reading(timestamp="2026-10-26t00:00:00.123456789z"),
        ],
    ).json()
    assert result["accepted"] == 1
    assert result["rejected"] == 3
