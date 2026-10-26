import sqlite3
from contextlib import contextmanager
from pathlib import Path

from indux.time import utc_now


class Database:
    def __init__(self, path: Path):
        self.path = Path(path)

    @contextmanager
    def connection(self, *, write: bool = False):
        # Open and close in the calling worker thread; never share connections across threads.
        connection = sqlite3.connect(self.path, timeout=5, isolation_level=None)
        connection.row_factory = sqlite3.Row
        try:
            connection.execute("PRAGMA foreign_keys = ON")
            connection.execute("BEGIN IMMEDIATE" if write else "BEGIN")
            yield connection
            connection.commit()
        except BaseException:
            connection.rollback()
            raise
        finally:
            connection.close()

    def initialize(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connection(write=True) as db:
            # execute one statement at a time to preserve this transaction.
            for statement in Path(__file__).with_name("schema.sql").read_text().split(";"):
                if statement.strip():
                    db.execute(statement)
            if db.execute("SELECT COUNT(*) FROM assets").fetchone()[0] == 0:
                now = utc_now()
                db.executemany(
                    "INSERT INTO assets VALUES (?, ?, ?, ?, ?)",
                    [
                        ("pump-01", "Cooling Water Pump", "pump", "Demo line A", now),
                        ("motor-01", "Conveyor Motor", "motor", "Demo line A", now),
                    ],
                )
                db.executemany(
                    "INSERT INTO sensors VALUES (?, ?, ?, ?, ?, ?)",
                    [
                        (asset, sensor, name, unit, kind, now)
                        for asset in ("pump-01", "motor-01")
                        for sensor, name, unit, kind in (
                            ("temperature", "Bearing Temperature", "degC", "temperature"),
                            ("vibration", "RMS Vibration", "mm/s", "vibration"),
                        )
                    ],
                )

    def last_telemetry(self):
        with self.connection() as db:
            return db.execute("SELECT MAX(received_at) FROM telemetry_readings").fetchone()[0]
