from datetime import datetime

from indux.errors import ApiError
from indux.storage.database import Database
from indux.time import utc_now


def require_asset(db, asset_id: str):
    row = db.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
    if row is None:
        raise ApiError(404, "NOT_FOUND", "Asset was not found.")
    return dict(row)


class AssetService:
    def __init__(self, database: Database, freshness_seconds: float):
        self.database, self.freshness_seconds = database, freshness_seconds

    def _with_status(self, db, asset: dict, now: str):
        latest = db.execute(
            "SELECT MAX(timestamp) FROM telemetry_readings WHERE asset_id = ? AND timestamp <= ?",
            (asset["id"], now),
        ).fetchone()[0]
        asset["last_seen_at"] = latest
        status = "unknown"
        if (
            latest
            and (datetime.fromisoformat(now) - datetime.fromisoformat(latest)).total_seconds()
            <= self.freshness_seconds
        ):
            severities = {
                r[0]
                for r in db.execute(
                    "SELECT severity FROM incidents WHERE asset_id = ? AND status != 'resolved'",
                    (asset["id"],),
                )
            }
            status = (
                "critical"
                if "critical" in severities
                else "warning"
                if severities & {"high", "medium"}
                else "normal"
            )
        asset["status"] = status
        return asset

    def list(self, limit: int, offset: int):
        with self.database.connection() as db:
            now = utc_now()
            items = [
                self._with_status(db, dict(row), now)
                for row in db.execute(
                    "SELECT * FROM assets ORDER BY id LIMIT ? OFFSET ?",
                    (limit, offset),
                ).fetchall()
            ]
            total = db.execute("SELECT COUNT(*) FROM assets").fetchone()[0]
            return {"items": items, "total": total, "limit": limit, "offset": offset}

    def get(self, asset_id: str):
        with self.database.connection() as db:
            return self._with_status(db, require_asset(db, asset_id), utc_now())

    def sensors(self, asset_id: str, limit: int, offset: int):
        with self.database.connection() as db:
            require_asset(db, asset_id)
            items = [
                dict(row)
                for row in db.execute(
                    "SELECT * FROM sensors WHERE asset_id = ? ORDER BY id LIMIT ? OFFSET ?",
                    (asset_id, limit, offset),
                )
            ]
            total = db.execute(
                "SELECT COUNT(*) FROM sensors WHERE asset_id = ?", (asset_id,)
            ).fetchone()[0]
            return {"items": items, "total": total, "limit": limit, "offset": offset}
