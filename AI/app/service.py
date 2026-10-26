from __future__ import annotations

import json
import os
from typing import Any

import requests

from .detector import analyze_readings


def _extract_severity(anomalies: list[dict[str, Any]]) -> str:
    if not anomalies:
        return "low"
    if any(
        a["category"] in {"insufficient_data", "high_temperature", "high_vibration"}
        for a in anomalies
    ):
        return "high"
    return "medium"


def _generate_mock_explanation(
    asset_id: str, anomalies: list[dict[str, Any]], limitations: list[str]
) -> tuple[str, str, str]:
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
        title = "Elevated temperature"
    elif category == "high_vibration":
        explanation = f"The vibration reading at {sensor_id} exceeded the configured threshold. The asset should be checked for imbalance, looseness, or bearing issues."
        title = "High vibration alert"
    else:
        explanation = f"The reading from {sensor_id} requires attention because the data is incomplete or outside the expected range."
        title = "Inspection required"

    if limitations:
        explanation += " " + " ".join(limitations[:2])

    recommendation = "Inspect the affected sensor and the nearby asset condition before continuing normal operation."
    return explanation, title, recommendation


def model_name() -> str:
    return os.getenv("OLLAMA_MODEL", os.getenv("GEMMA_MODEL", "gemma3:4b"))


def model_health() -> dict[str, Any]:
    available = False
    try:
        response = requests.get(
            os.getenv("OLLAMA_URL", "http://127.0.0.1:11434") + "/api/tags", timeout=2
        )
        response.raise_for_status()
        available = model_name() in {
            model["name"] for model in response.json()["models"]
        }
    except (requests.RequestException, ValueError, KeyError):
        pass
    return {"status": "ok", "model_available": available, "model": model_name()}


def generate_analysis(prompt: str) -> str | None:
    try:
        response = requests.post(
            os.getenv("OLLAMA_URL", "http://127.0.0.1:11434") + "/api/generate",
            json={
                "model": model_name(),
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.2, "num_predict": 160},
            },
            timeout=float(os.getenv("OLLAMA_TIMEOUT", "30")),
        )
        if response.status_code == 200:
            payload = response.json()
            text = payload.get("response", "")
            if text:
                return text.strip()
    except (requests.RequestException, ValueError):
        pass

    # Fallback for local demo environments where the model is not installed yet.
    return None


def build_result(asset_id: str, asset_type: str, readings: list[Any]) -> dict[str, Any]:
    detection = analyze_readings(readings)
    anomalies = detection["anomalies"]
    limitations = detection["limitations"]

    if anomalies:
        severity = _extract_severity(anomalies)
        explanation, title, recommendation = _generate_mock_explanation(
            asset_id, anomalies, limitations
        )
        confidence = 0.95
    else:
        severity = "low"
        explanation, title, recommendation = _generate_mock_explanation(
            asset_id, anomalies, limitations
        )
        confidence = 0.9

    # Give the model a factual verdict instead of asking it to reclassify readings.
    facts = (
        "Threshold breaches detected: "
        + "; ".join(
            f"{a['sensor_id']}: measured {a['observed_value']} {a['unit']}, "
            f"upper limit {a['threshold']} {a['unit']} ({a['category']})"
            for a in anomalies
        )
        if anomalies
        else "No threshold breaches were detected in the supplied readings."
    )
    prompt = (
        f"Asset: {asset_id}\nAsset type: {asset_type}\n"
        f"Verified detector result: {facts}\n"
        f"Limitations: {json.dumps(limitations)}\n"
        "Summarize these verified sensor findings in two sentences for a monitoring dashboard. "
        "Preserve the result exactly; do not recalculate or change the findings and do not "
        "infer a cause. Recommend human review of any threshold breaches."
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
        "analysis_source": "ollama" if model_text else "threshold_fallback",
        "model": model_name() if model_text else None,
        "limitations": limitations
        or ["Assessment is based on the supplied reading and configured threshold."],
    }
    return result
