import sqlite3

from indux.storage.database import Database


class StatusService:
    def __init__(self, database: Database, detector_status: str):
        self.database = database
        self.detector = detector_status
        self.ingestion = "ready"
        self.last_telemetry_at = None

    def get(self):
        database = "ready"
        try:
            self.last_telemetry_at = self.database.last_telemetry()
        except sqlite3.Error:
            database = "unavailable"
        status = (
            "unavailable"
            if database == "unavailable"
            else "healthy"
            if self.ingestion == "ready" and self.detector == "ready"
            else "degraded"
        )
        return {
            "status": status,
            "database": database,
            "ingestion": self.ingestion,
            "detector": self.detector,
            "llm": "disabled",
            "last_telemetry_at": self.last_telemetry_at,
        }
