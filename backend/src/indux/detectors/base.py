from collections.abc import Sequence
from typing import Any, Protocol

from pydantic import BaseModel, ConfigDict, Field, field_validator

from indux.models import Reading, Severity
from indux.time import normalize_timestamp


class Detection(BaseModel):
    model_config = ConfigDict(strict=True, allow_inf_nan=False)
    asset_id: str
    sensor_id: str
    anomaly_category: str = Field(min_length=1)
    score: float | None = None
    severity: Severity
    observed_at: str
    evidence: dict[str, Any]

    @field_validator("observed_at")
    @classmethod
    def timestamp_utc(cls, value: str) -> str:
        return normalize_timestamp(value)


class Detector(Protocol):
    def detect(self, readings: Sequence[Reading]) -> Sequence[Detection]: ...
