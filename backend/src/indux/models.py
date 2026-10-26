from typing import Annotated, Any, Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field, WithJsonSchema, field_validator

from indux.time import normalize_timestamp

Severity = Literal["low", "medium", "high", "critical"]
IncidentStatus = Literal["open", "acknowledged", "resolved"]


class ReadingInput(BaseModel):
    model_config = ConfigDict(strict=True, allow_inf_nan=False)
    asset_id: str
    sensor_id: str
    value: float
    unit: str
    timestamp: str = Field(json_schema_extra={"format": "date-time"})

    @field_validator("timestamp")
    @classmethod
    def timestamp_utc(cls, value: str) -> str:
        return normalize_timestamp(value)


class Reading(ReadingInput):
    id: int
    source_id: str
    received_at: str


class TelemetryBatch(BaseModel):
    model_config = ConfigDict(strict=True)
    source_id: str
    # Items deliberately remain unvalidated until the service performs partial acceptance.
    readings: list[Annotated[Any, WithJsonSchema(ReadingInput.model_json_schema())]] = Field(
        min_length=1, max_length=500
    )


class ResolveRequest(BaseModel):
    model_config = ConfigDict(strict=True)
    note: str = Field(default="", max_length=1000)


class Asset(BaseModel):
    id: str
    name: str
    asset_type: str
    location: str | None
    status: Literal["normal", "warning", "critical", "unknown"]
    last_seen_at: str | None
    created_at: str


class Sensor(BaseModel):
    id: str
    asset_id: str
    name: str
    unit: str
    sensor_type: str | None


class Incident(BaseModel):
    id: str
    asset_id: str
    anomaly_category: str
    title: str
    description: str | None
    severity: Severity
    status: IncidentStatus
    created_at: str
    last_observed_at: str
    updated_at: str
    acknowledged_at: str | None
    resolved_at: str | None
    resolution_note: str | None
    occurrence_count: int
    latest_evidence: dict[str, Any]


class SystemStatus(BaseModel):
    status: Literal["healthy", "degraded", "unavailable"]
    database: Literal["ready", "unavailable"]
    ingestion: Literal["ready", "stopped", "error"]
    detector: Literal["ready", "unavailable", "not_configured"]
    llm: Literal["ready", "unavailable", "disabled", "not_configured"]
    last_telemetry_at: str | None


T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int


class ReadingResult(BaseModel):
    index: int
    status: Literal["accepted", "rejected"]
    code: str | None = None
    message: str | None = None
    reading_id: int | None = None


class IngestResult(BaseModel):
    accepted: int
    rejected: int
    results: list[ReadingResult]


class LatestReadings(BaseModel):
    items: list[Reading]
