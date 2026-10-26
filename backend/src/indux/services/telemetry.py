import logging
import sqlite3

from pydantic import ValidationError

from indux.detectors.base import Detection, Detector
from indux.errors import ApiError
from indux.models import Reading, ReadingInput, TelemetryBatch
from indux.services.assets import require_asset
from indux.services.incidents import IncidentService
from indux.services.status import StatusService
from indux.storage.database import Database
from indux.time import normalize_timestamp, utc_now

logger = logging.getLogger(__name__)


class TelemetryService:
    def __init__(
        self,
        database: Database,
        detector: Detector | None,
        incidents: IncidentService,
        status: StatusService,
    ):
        self.database, self.detector = database, detector
        self.incidents, self.status = incidents, status

    def ingest(self, batch: TelemetryBatch):
        results, accepted = [], []
        try:
            with self.database.connection(write=True) as db:
                for index, item in enumerate(batch.readings):
                    try:
                        reading = ReadingInput.model_validate(item)
                        require_asset(db, reading.asset_id)
                        sensor = db.execute(
                            "SELECT unit FROM sensors WHERE asset_id = ? AND id = ?",
                            (reading.asset_id, reading.sensor_id),
                        ).fetchone()
                        if sensor is None:
                            raise ApiError(400, "UNKNOWN_SENSOR", "Sensor was not found for asset.")
                        if sensor["unit"] != reading.unit:
                            raise ApiError(400, "UNIT_MISMATCH", f"Expected unit {sensor['unit']}.")
                        received_at = utc_now()
                        cursor = db.execute(
                            "INSERT INTO telemetry_readings (source_id, asset_id, sensor_id, "
                            "value, "
                            "unit, timestamp, received_at) VALUES (?, ?, ?, ?, ?, ?, ?) "
                            "ON CONFLICT(source_id, asset_id, sensor_id, timestamp) DO NOTHING",
                            (
                                batch.source_id,
                                reading.asset_id,
                                reading.sensor_id,
                                reading.value,
                                reading.unit,
                                reading.timestamp,
                                received_at,
                            ),
                        )
                        if cursor.rowcount == 0:
                            raise ApiError(400, "DUPLICATE_READING", "Reading already exists.")
                        accepted.append(
                            Reading(
                                **reading.model_dump(),
                                id=cursor.lastrowid,
                                source_id=batch.source_id,
                                received_at=received_at,
                            )
                        )
                        results.append(
                            {"index": index, "status": "accepted", "reading_id": cursor.lastrowid}
                        )
                    except ValidationError as exc:
                        message = "; ".join(
                            f"{'.'.join(map(str, e['loc'])) or 'reading'}: {e['msg']}"
                            for e in exc.errors()
                        )
                        results.append(
                            {
                                "index": index,
                                "status": "rejected",
                                "code": "INVALID_READING",
                                "message": message,
                            }
                        )
                    except ApiError as exc:
                        results.append(
                            {
                                "index": index,
                                "status": "rejected",
                                "code": "UNKNOWN_ASSET" if exc.code == "NOT_FOUND" else exc.code,
                                "message": exc.message,
                            }
                        )
            self.status.ingestion = "ready"
        except sqlite3.Error:
            self.status.ingestion = "error"
            logger.exception("Telemetry ingestion failed; batch rolled back")
            raise

        events = []
        if accepted:
            events.append(
                (
                    "telemetry.updated",
                    {
                        "asset_ids": sorted({reading.asset_id for reading in accepted}),
                        "accepted": len(accepted),
                    },
                )
            )
            if self.detector is not None:
                try:
                    detections = [
                        Detection.model_validate(d) for d in self.detector.detect(accepted)
                    ]
                    events.extend(self.incidents.record(detections))
                    self.status.detector = "ready"
                except Exception:
                    # Telemetry is already committed. Detector failure must not lose that data
                    # or invite a caller to retry a batch that has successfully been stored.
                    self.status.detector = "unavailable"
                    logger.exception("Detection/incident processing failed for stored telemetry")
        return {
            "accepted": len(accepted),
            "rejected": len(results) - len(accepted),
            "results": results,
        }, events

    def latest(self, asset_id: str | None, limit: int):
        with self.database.connection() as db:
            if asset_id is not None:
                require_asset(db, asset_id)
            where, params = ("WHERE asset_id = ?", [asset_id]) if asset_id is not None else ("", [])
            rows = db.execute(
                "SELECT id, source_id, asset_id, sensor_id, value, unit, timestamp, "
                "received_at FROM "
                "(SELECT *, ROW_NUMBER() OVER (PARTITION BY asset_id, sensor_id "
                "ORDER BY timestamp DESC, id DESC) AS rank FROM telemetry_readings " + where + ") "
                "WHERE rank = 1 ORDER BY asset_id, sensor_id LIMIT ?",
                [*params, limit],
            )
            return {"items": [dict(row) for row in rows]}

    def history(self, asset_id: str, start: str, end: str, limit: int, offset: int):
        try:
            start, end = normalize_timestamp(start), normalize_timestamp(end)
        except ValueError as exc:
            raise ApiError(400, "INVALID_TIME_RANGE", str(exc)) from exc
        if start >= end:
            raise ApiError(400, "INVALID_TIME_RANGE", "end must be later than start.")
        with self.database.connection() as db:
            require_asset(db, asset_id)
            where = " WHERE asset_id = ? AND timestamp >= ? AND timestamp < ?"
            params = (asset_id, start, end)
            total = db.execute(
                "SELECT COUNT(*) FROM telemetry_readings" + where, params
            ).fetchone()[0]
            items = [
                dict(row)
                for row in db.execute(
                    "SELECT * FROM telemetry_readings"
                    + where
                    + " ORDER BY timestamp, id LIMIT ? OFFSET ?",
                    (*params, limit, offset),
                )
            ]
            return {"items": items, "total": total, "limit": limit, "offset": offset}
