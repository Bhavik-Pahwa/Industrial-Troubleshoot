from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from .schemas import AnalysisRequest
from .service import build_result, model_health

app = FastAPI(title="INDUX AI Service", version="0.1.0")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content=jsonable_encoder(
            {"detail": "invalid request", "errors": exc.errors()},
            custom_encoder={ValueError: str},
        ),
    )


@app.get("/ai/health")
def health():
    return model_health()


@app.post("/ai/analyze")
def analyze(payload: AnalysisRequest):
    try:
        result = build_result(payload.asset_id, payload.asset_type, payload.readings)
        return result
    except Exception as exc:  # pragma: no cover - safety net for runtime errors
        raise HTTPException(
            status_code=503, detail=f"model unavailable: {exc}"
        ) from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8001)
