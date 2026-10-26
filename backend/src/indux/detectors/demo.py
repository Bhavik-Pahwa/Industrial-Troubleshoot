from collections.abc import Sequence

from indux.detectors.base import Detection
from indux.models import Reading


class DemoDetector:
    """Deterministic demo thresholds, not a trained model or safety assessment."""

    def detect(self, readings: Sequence[Reading]) -> list[Detection]:
        detections = []
        for reading in readings:
            rule = {"degC": (80, 100, "high_temperature"), "mm/s": (7, 12, "high_vibration")}.get(
                reading.unit
            )
            if rule is None or reading.value < rule[0]:
                continue
            warning, critical, category = rule
            detections.append(
                Detection(
                    asset_id=reading.asset_id,
                    sensor_id=reading.sensor_id,
                    anomaly_category=category,
                    severity="critical" if reading.value >= critical else "high",
                    observed_at=reading.timestamp,
                    evidence={
                        "reading_id": reading.id,
                        "value": reading.value,
                        "unit": reading.unit,
                        "warning_threshold": warning,
                        "critical_threshold": critical,
                        "detector": "demo_threshold",
                    },
                )
            )
        return detections
