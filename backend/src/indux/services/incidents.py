import json
from uuid import uuid4

from indux.detectors.base import Detection
from indux.errors import ApiError
from indux.services.assets import require_asset
from indux.storage.database import Database
from indux.time import utc_now

SEVERITY_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}


def incident_dict(row):
    result = dict(row)
    result["latest_evidence"] = json.loads(result["latest_evidence"])
    return result


def require_incident(db, incident_id):
    row = db.execute("SELECT * FROM incidents WHERE id = ?", (incident_id,)).fetchone()
    if row is None:
        raise ApiError(404, "NOT_FOUND", "Incident was not found.")
    return incident_dict(row)


class IncidentService:
    def __init__(self, database: Database):
        self.database = database

    def record(self, detections: list[Detection]):
        events = []
        with self.database.connection(write=True) as db:
            for detection in detections:
                if not db.execute(
                    "SELECT 1 FROM sensors WHERE asset_id = ? AND id = ?",
                    (detection.asset_id, detection.sensor_id),
                ).fetchone():
                    raise ValueError("Detector returned an unknown asset/sensor")
                evidence = json.dumps(
                    {
                        **detection.evidence,
                        "sensor_id": detection.sensor_id,
                        "score": detection.score,
                    },
                    allow_nan=False,
                )
                now = utc_now()
                row = db.execute(
                    "SELECT * FROM incidents WHERE asset_id = ? AND anomaly_category = ? "
                    "AND status IN ('open', 'acknowledged')",
                    (detection.asset_id, detection.anomaly_category),
                ).fetchone()
                if row:
                    incident_id = row["id"]
                    # Keep the newest evidence and highest severity for this active incident.
                    newest = detection.observed_at >= row["last_observed_at"]
                    severity = max((row["severity"], detection.severity), key=SEVERITY_RANK.get)
                    db.execute(
                        "UPDATE incidents SET last_observed_at = ?, updated_at = ?, "
                        "occurrence_count = occurrence_count + 1, latest_evidence = ?, "
                        "severity = ? WHERE id = ?",
                        (
                            max(row["last_observed_at"], detection.observed_at),
                            now,
                            evidence if newest else row["latest_evidence"],
                            severity,
                            incident_id,
                        ),
                    )
                    event_type = "incident.updated"
                else:
                    incident_id = str(uuid4())
                    db.execute(
                        "INSERT INTO incidents (id, asset_id, anomaly_category, title, "
                        "description, "
                        "severity, status, created_at, last_observed_at, updated_at, "
                        "occurrence_count, latest_evidence) VALUES (?, ?, ?, ?, ?, ?, 'open', "
                        "?, ?, ?, 1, ?)",
                        (
                            incident_id,
                            detection.asset_id,
                            detection.anomaly_category,
                            detection.anomaly_category.replace("_", " ").capitalize(),
                            "Anomaly detected. Review evidence and follow site procedures.",
                            detection.severity,
                            now,
                            detection.observed_at,
                            now,
                            evidence,
                        ),
                    )
                    event_type = "incident.created"
                events.append(
                    (event_type, {"incident_id": incident_id, "asset_id": detection.asset_id})
                )
        return events

    def get(self, incident_id):
        with self.database.connection() as db:
            return require_incident(db, incident_id)

    def list(self, status, asset_id, severity, limit, offset):
        clauses, params = [], []
        for column, value in (("status", status), ("asset_id", asset_id), ("severity", severity)):
            if value is not None:
                clauses.append(f"{column} = ?")
                params.append(value)
        where = " WHERE " + " AND ".join(clauses) if clauses else ""
        with self.database.connection() as db:
            if asset_id is not None:
                require_asset(db, asset_id)
            total = db.execute("SELECT COUNT(*) FROM incidents" + where, params).fetchone()[0]
            items = [
                incident_dict(row)
                for row in db.execute(
                    "SELECT * FROM incidents"
                    + where
                    + " ORDER BY updated_at DESC, id LIMIT ? OFFSET ?",
                    [*params, limit, offset],
                )
            ]
            return {"items": items, "total": total, "limit": limit, "offset": offset}

    def transition(self, incident_id: str, action: str, note: str | None = None):
        with self.database.connection(write=True) as db:
            incident = require_incident(db, incident_id)
            if incident["status"] == "resolved":
                raise ApiError(409, "INVALID_STATE", "Incident is already resolved.")
            if action == "acknowledge" and incident["status"] == "acknowledged":
                return incident, []
            now = utc_now()
            if action == "acknowledge":
                db.execute(
                    "UPDATE incidents SET status = 'acknowledged', acknowledged_at = ?, "
                    "updated_at = ? WHERE id = ?",
                    (now, now, incident_id),
                )
            else:
                db.execute(
                    "UPDATE incidents SET status = 'resolved', resolved_at = ?, "
                    "updated_at = ?, resolution_note = ? WHERE id = ?",
                    (now, now, note, incident_id),
                )
            result = require_incident(db, incident_id)
        return result, [
            ("incident.updated", {"incident_id": incident_id, "asset_id": incident["asset_id"]})
        ]
