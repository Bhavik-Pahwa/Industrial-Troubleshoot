from fastapi import APIRouter, Request

from indux.api.dependencies import Limit, Offset, mutate
from indux.models import IngestResult, LatestReadings, Page, Reading, TelemetryBatch

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.post(
    "/ingest",
    response_model=IngestResult,
    response_model_exclude_none=True,
    operation_id="ingestTelemetry",
)
async def ingest(request: Request, batch: TelemetryBatch):
    return await mutate(request, request.app.state.telemetry.ingest, batch)


@router.get("/latest", response_model=LatestReadings, operation_id="getLatestTelemetry")
def latest(request: Request, asset_id: str | None = None, limit: Limit = 50):
    return request.app.state.telemetry.latest(asset_id, limit)


@router.get("/history", response_model=Page[Reading], operation_id="getTelemetryHistory")
def history(
    request: Request, asset_id: str, start: str, end: str, limit: Limit = 50, offset: Offset = 0
):
    return request.app.state.telemetry.history(asset_id, start, end, limit, offset)
