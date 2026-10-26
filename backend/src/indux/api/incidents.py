from fastapi import APIRouter, Request

from indux.api.dependencies import Limit, Offset, mutate
from indux.models import Incident, IncidentStatus, Page, ResolveRequest, Severity

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("", response_model=Page[Incident], operation_id="listIncidents")
def list_incidents(
    request: Request,
    status: IncidentStatus | None = None,
    asset_id: str | None = None,
    severity: Severity | None = None,
    limit: Limit = 50,
    offset: Offset = 0,
):
    return request.app.state.incidents.list(status, asset_id, severity, limit, offset)


@router.get("/{incident_id}", response_model=Incident, operation_id="getIncident")
def get_incident(request: Request, incident_id: str):
    return request.app.state.incidents.get(incident_id)


@router.post(
    "/{incident_id}/acknowledge", response_model=Incident, operation_id="acknowledgeIncident"
)
async def acknowledge(request: Request, incident_id: str):
    return await mutate(request, request.app.state.incidents.transition, incident_id, "acknowledge")


@router.post("/{incident_id}/resolve", response_model=Incident, operation_id="resolveIncident")
async def resolve(request: Request, incident_id: str, body: ResolveRequest | None = None):
    return await mutate(
        request,
        request.app.state.incidents.transition,
        incident_id,
        "resolve",
        body.note if body else None,
    )
