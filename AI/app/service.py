from __future__ import annotations

import json
import os
from typing import Any

import requests

from .detector import analyze_readings


def _extract_severity(anomalies: list[dict[str, Any]]) -> str:
    if not anomalies:
        return "low"
    if any(a["category"] in {"insufficient_data", "high_temperature", "high_vibration"} for a in anomalies):
        return "high"
    return "medium"


def _generate_mock_explanation(asset_id: str, anomalies: list[dict[str, Any]], limitations: list[str]) -> tuple[str, str, str]:
    if not anomalies:
        return (
            f"No threshold breaches were observed for {asset_id}. The supplied readings are within the configured operating limits.",
            f"Normal readings for {asset_id}",
            "Check the sensor trend over time and confirm the operating envelope before escalating.",
        )

    first = anomalies[0]
    sensor_id = first["sensor_id"]
    category = first["category"]
    threshold = first.get("threshold")
    observed = first.get("observed_value")
    if category == "high_temperature":
        if observed is not None and threshold is not None:
            delta = observed - threshold
            explanation = (
                f"The measured temperature at {sensor_id} is {delta:.1f} {first['unit']} above the configured limit. "
                "This indicates a temperature excursion that warrants inspection."
            )
        else:
            explanation = f"The temperature reading at {sensor_id} exceeds the configured threshold and requires review."
        title = "Elevated motor temperature"
    elif category == "high_vibration":
        explanation = (
            f"The vibration reading at {sensor_id} exceeded the configured threshold. The asset should be checked for imbalance, looseness, or bearing issues."
        )
        title = "High vibration alert"
    else:
        explanation = (
            f"The reading from {sensor_id} requires attention because the data is incomplete or outside the expected range."
        )
        title = "Inspection required"

    if limitations:
        explanation += " " + " ".join(limitations[:2])

    recommendation = "Inspect the affected sensor and the nearby asset condition before continuing normal operation."
    return explanation, title, recommendation


def generate_analysis(prompt: str) -> str:
    model_name = os.getenv("GEMMA_MODEL", "gemma3:4b")
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": model_name, "prompt": prompt, "stream": False, "options": {"temperature": 0.2}},
            timeout=2,
        )
        if response.status_code == 200:
            payload = response.json()
            text = payload.get("response", "")
            if text:
                return text.strip()
    except Exception:
        pass

    # Fallback for local demo environments where the model is not installed yet.
    return (
        "The supplied telemetry indicates a threshold deviation, and the reading should be reviewed with the asset condition in mind. "
        "The assessment is based on the recorded sensor values and configured limits only."
    )


def build_result(asset_id: str, asset_type: str, readings: list[Any]) -> dict[str, Any]:
    detection = analyze_readings(readings)
    anomalies = detection["anomalies"]
    limitations = detection["limitations"]

    if anomalies:
        severity = _extract_severity(anomalies)
        explanation, title, recommendation = _generate_mock_explanation(asset_id, anomalies, limitations)
        confidence = 0.95
    else:
        severity = "low"
        explanation, title, recommendation = _generate_mock_explanation(asset_id, anomalies, limitations)
        confidence = 0.9

    # The model text is intentionally short and deterministic to keep the demo stable.
    prompt = (
        f"Asset: {asset_id}\nAsset type: {asset_type}\n"
        f"Anomalies: {json.dumps(anomalies, default=str)}\n"
        f"Limitations: {json.dumps(limitations)}\n"
        "Write a concise industrial assessment in one paragraph."
    )
    model_text = generate_analysis(prompt)
    if model_text:
        explanation = model_text

    result = {
        "asset_id": asset_id,
        "anomaly_detected": detection["anomaly_detected"],
        "anomalies": anomalies,
        "severity": severity,
        "title": title,
        "explanation": explanation,
        "recommended_action": recommendation,
        "confidence": confidence,
        "limitations": limitations or ["Assessment is based on the supplied reading and configured threshold."],
    }
    return result
