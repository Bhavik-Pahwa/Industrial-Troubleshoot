from __future__ import annotations

import math
from typing import Any


def analyze_readings(readings: list[Any]) -> dict[str, Any]:
    anomalies: list[dict[str, Any]] = []
    limitations: list[str] = []

    for reading_index, reading in enumerate(readings):
        name = str(reading.name or "").lower()
        sensor_id = reading.sensor_id
        value = reading.value

        if value is None or not isinstance(value, (int, float)) or math.isnan(float(value)):
            anomalies.append(
                {
                    "reading_index": reading_index,
                    "sensor_id": sensor_id,
                    "category": "insufficient_data",
                    "observed_value": None,
                    "threshold": None,
                    "unit": reading.unit,
                    "severity": "medium",
                }
            )
            limitations.append(f"{sensor_id} did not provide a valid reading.")
            continue

        configured_max = reading.configured_max
        if configured_max is not None:
            if value > configured_max:
                if "temp" in name:
                    category = "high_temperature"
                elif "vib" in name:
                    category = "high_vibration"
                else:
                    category = "high_value"
                anomalies.append(
                    {
                        "reading_index": reading_index,
                        "sensor_id": sensor_id,
                        "category": category,
                        "observed_value": float(value),
                        "threshold": float(configured_max),
                        "unit": reading.unit,
                        "severity": "high" if value > configured_max * 1.2 else "medium",
                    }
                )
        else:
            limitations.append(
                f"{sensor_id} ({name}) cannot be evaluated because no configured limit was supplied."
            )

    return {
        "anomalies": anomalies,
        "limitations": limitations,
        "anomaly_detected": bool(anomalies),
    }
