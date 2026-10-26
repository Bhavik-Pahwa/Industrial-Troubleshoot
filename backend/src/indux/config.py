import os
from dataclasses import dataclass, field
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Settings:
    database_path: Path = field(
        default_factory=lambda: Path(
            os.getenv("INDUX_DATABASE_PATH", str(BACKEND_DIR / "data" / "indux.sqlite3"))
        )
    )
    freshness_seconds: float = field(
        default_factory=lambda: float(os.getenv("INDUX_FRESHNESS_SECONDS", "15"))
    )
    detector: str = field(default_factory=lambda: os.getenv("INDUX_DETECTOR", "demo"))
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: tuple(
            origin.strip()
            for origin in os.getenv(
                "INDUX_CORS_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173,"
                "http://localhost:3000,http://127.0.0.1:3000",
            ).split(",")
            if origin.strip()
        )
    )

    def __post_init__(self):
        import math

        if not math.isfinite(self.freshness_seconds) or self.freshness_seconds <= 0:
            raise ValueError("INDUX_FRESHNESS_SECONDS must be positive and finite")
