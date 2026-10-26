from typing import Literal

from fastapi import APIRouter, Request, WebSocket

from indux.models import SystemStatus

router = APIRouter(tags=["System"])


@router.get("/health", operation_id="getHealth")
async def health() -> dict[str, Literal["ok"]]:
    return {"status": "ok"}


@router.get("/system/status", response_model=SystemStatus, operation_id="getSystemStatus")
def system_status(request: Request):
    return request.app.state.status.get()


@router.websocket("/events")
async def events(websocket: WebSocket):
    origin = websocket.headers.get("origin")
    if origin and origin not in websocket.app.state.settings.cors_origins:
        await websocket.close(code=1008)
        return
    await websocket.app.state.events.connect(websocket)
