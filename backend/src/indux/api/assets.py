from fastapi import APIRouter, Request

from indux.api.dependencies import Limit, Offset
from indux.models import Asset, Page, Sensor

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get("", response_model=Page[Asset], operation_id="listAssets")
def list_assets(request: Request, limit: Limit = 50, offset: Offset = 0):
    return request.app.state.assets.list(limit, offset)


@router.get("/{asset_id}", response_model=Asset, operation_id="getAsset")
def get_asset(request: Request, asset_id: str):
    return request.app.state.assets.get(asset_id)


@router.get("/{asset_id}/sensors", response_model=Page[Sensor], operation_id="listAssetSensors")
def list_sensors(request: Request, asset_id: str, limit: Limit = 50, offset: Offset = 0):
    return request.app.state.assets.sensors(asset_id, limit, offset)
