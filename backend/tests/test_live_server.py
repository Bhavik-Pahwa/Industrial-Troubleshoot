"""Exercise an actual Uvicorn process, HTTP simulator, and WebSocket transport."""

import json
import os
import socket
import subprocess
import sys
import time

import httpx
from websockets.sync.client import connect


def test_live_server_simulator_and_websocket(tmp_path):
    with socket.socket() as reservation:
        reservation.bind(("127.0.0.1", 0))
        port = reservation.getsockname()[1]
    env = {
        **os.environ,
        "INDUX_DATABASE_PATH": str(tmp_path / "live.sqlite3"),
        "INDUX_DETECTOR": "demo",
    }
    flags = subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
    with (tmp_path / "server.log").open("w+") as output:
        process = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "indux.main:app",
                "--host",
                "127.0.0.1",
                "--port",
                str(port),
            ],
            env=env,
            stdout=output,
            stderr=subprocess.STDOUT,
            creationflags=flags,
        )
        try:
            base = f"http://127.0.0.1:{port}"
            with httpx.Client(base_url=base, timeout=3, trust_env=False) as client:
                deadline = time.monotonic() + 10
                while time.monotonic() < deadline:
                    assert process.poll() is None, "Server exited during startup"
                    try:
                        if client.get("/api/v1/health").status_code == 200:
                            break
                    except httpx.TransportError:
                        time.sleep(0.05)
                else:
                    raise AssertionError("Server did not become healthy")
                with connect(f"ws://127.0.0.1:{port}/api/v1/events", proxy=None) as websocket:
                    simulator = subprocess.run(
                        [
                            sys.executable,
                            "-m",
                            "indux.simulator",
                            "--url",
                            base,
                            "--anomaly",
                            "--count",
                            "4",
                            "--interval",
                            "0",
                        ],
                        env=env,
                        capture_output=True,
                        text=True,
                        timeout=15,
                        creationflags=flags,
                    )
                    assert simulator.returncode == 0, simulator.stderr
                    batches = [json.loads(line) for line in simulator.stdout.splitlines()]
                    assert len(batches) == 4
                    assert all(b["accepted"] == 4 and b["rejected"] == 0 for b in batches)
                    kinds = set()
                    for _ in range(12):
                        kinds.add(json.loads(websocket.recv(timeout=3))["type"])
                        if {
                            "telemetry.updated",
                            "incident.created",
                            "system.status_changed",
                        } <= kinds:
                            break
                    assert "incident.created" in kinds
                    incidents = client.get("/api/v1/incidents").json()
                    assert incidents["total"] == 4
                    asset = client.get("/api/v1/assets/pump-01").json()
                    assert asset["status"] == "critical"
                    incident_id = incidents["items"][0]["id"]
                    path = f"/api/v1/incidents/{incident_id}"
                    assert client.post(path + "/acknowledge").json()["status"] == "acknowledged"
                    assert client.post(path + "/resolve").json()["status"] == "resolved"
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
