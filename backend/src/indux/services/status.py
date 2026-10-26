import sqlite3
import time

from indux.storage.database import Database


class StatusService:
    def __init__(self, database: Database, detector_status: str, detector=None):
        self.database = database
        self.detector = detector_status
        self.ingestion = "ready"
        self.last_telemetry_at = None
        self.health_check = getattr(detector, "health", None)
        self.last_health_check = float("-inf")
        self.llm = "disabled"

    def get(self):
        if self.health_check and time.monotonic() - self.last_health_check >= 5:
            self.last_health_check = time.monotonic()
            try:
                health = self.health_check()
                self.detector = "ready" if health["status"] == "ok" else "unavailable"
                self.llm = "ready" if health["model_available"] else "unavailable"
            except Exception:
                self.detector = "unavailable"
                self.llm = "unavailable"
        database = "ready"
        try:
            self.last_telemetry_at = self.database.last_telemetry()
        except sqlite3.Error:
            database = "unavailable"
        status = (
            "unavailable"
            if database == "unavailable"
            else "healthy"
            if self.ingestion == "ready" and self.detector == "ready" and self.llm != "unavailable"
            else "degraded"
        )
        return {
            "status": status,
            "database": database,
            "ingestion": self.ingestion,
            "detector": self.detector,
            "llm": self.llm,
            "last_telemetry_at": self.last_telemetry_at,
        }
