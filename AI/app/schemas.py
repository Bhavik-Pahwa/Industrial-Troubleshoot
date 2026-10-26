from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


class SensorReading(BaseModel):
    sensor_id: str
    name: str
    value: float | None = None
    unit: str = "C"
    timestamp: datetime | None = None
    configured_max: float | None = None
    configured_min: float | None = None

    @field_validator("value")
    @classmethod
    def validate_value(cls, value: Any) -> Any:
        if value is None:
            return value
        if isinstance(value, str):
            try:
                return float(value)
            except ValueError as exc:
                raise ValueError("value must be numeric or null") from exc
        if isinstance(value, (int, float)):
            return float(value)
        raise ValueError("value must be numeric or null")


class AnalysisRequest(BaseModel):
    asset_id: str = Field(..., min_length=1)
    asset_type: str = Field(default="industrial_motor")
    readings: list[SensorReading] = Field(..., min_length=1)
