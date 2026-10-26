"""HTTP bridge to the separately running AI service (no equipment control)."""

import json
import os
from collections import defaultdict
from urllib.request import Request, urlopen

from indux.detectors.base import Detection
from indux.storage.database import Database


class AIDetector:
    def __init__(self, database: Database):
        self.database = database
        self.base_url = os.getenv("INDUX_AI_URL", "http://127.0.0.1:8001").rstrip("/")
        self.timeout = float(os.getenv("INDUX_AI_TIMEOUT", "45"))

    def health(self):
        with urlopen(f"{self.base_url}/ai/health", timeout=3) as response:
            return json.load(response)

    def detect(self, readings):
        grouped = defaultdict(list)
        for reading in readings:
            grouped[reading.asset_id].append(reading)
        detections = []
        for asset_id, asset_readings in grouped.items():
            with self.database.connection() as db:
                asset = db.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
                sensors = {
                    row["id"]: dict(row)
                    for row in db.execute("SELECT * FROM sensors WHERE asset_id = ?", (asset_id,))
                }
            payload = {
                "asset_id": asset_id,
                "asset_type": asset["asset_type"],
                "readings": [
                    {
                        "sensor_id": r.sensor_id,
                        "name": sensors[r.sensor_id]["name"],
                        "value": r.value,
                        "unit": r.unit,
                        "timestamp": r.timestamp,
                        # These are the existing demo limits, not industrial safety limits.
                        "configured_max": {"temperature": 80, "vibration": 7}.get(
                            sensors[r.sensor_id]["sensor_type"]
                        ),
                    }
                    for r in asset_readings
                ],
            }
            request = Request(
                f"{self.base_url}/ai/analyze",
                data=json.dumps(payload).encode(),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(request, timeout=self.timeout) as response:
                result = json.load(response)
            if result["asset_id"] != asset_id:
                raise ValueError("AI returned a different asset")
            for anomaly in result["anomalies"]:
                reading = asset_readings[anomaly["reading_index"]]
                if anomaly["sensor_id"] != reading.sensor_id:
                    raise ValueError("AI returned a different sensor")
                detections.append(
                    Detection(
                        asset_id=asset_id,
                        sensor_id=reading.sensor_id,
                        anomaly_category=anomaly["category"],
                        severity=anomaly["severity"],
                        observed_at=reading.timestamp,
                        evidence={
                            **anomaly,
                            "reading_id": reading.id,
                            "detector": "ai_service",
                            "explanation": result["explanation"],
                            "recommended_action": result["recommended_action"],
                            "analysis_source": result["analysis_source"],
                            "model": result["model"],
                            "limitations": result["limitations"],
                        },
                    )
                )
        return detections
