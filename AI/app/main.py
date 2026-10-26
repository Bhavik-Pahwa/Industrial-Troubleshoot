from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .schemas import AnalysisRequest
from .service import build_result

app = FastAPI(title="INDUX AI Service", version="0.1.0")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"detail": "invalid request", "errors": exc.errors()})


@app.get("/ai/health")
def health():
    try:
        from .service import generate_analysis

        # Probe only the local fallback/model path; the service intentionally stays lightweight.
        _ = generate_analysis("health check")
        model_available = True
        status = "ok"
    except Exception:
        model_available = False
        status = "degraded"

    return {"status": status, "model_available": model_available}


@app.post("/ai/analyze")
def analyze(payload: AnalysisRequest):
    try:
        result = build_result(payload.asset_id, payload.asset_type, payload.readings)
        return result
    except Exception as exc:  # pragma: no cover - safety net for runtime errors
        raise HTTPException(status_code=503, detail=f"model unavailable: {exc}") from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
