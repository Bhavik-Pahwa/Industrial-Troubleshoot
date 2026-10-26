import logging
import sqlite3

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

logger = logging.getLogger(__name__)


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str, details: list | None = None):
        self.status, self.code, self.message = status, code, message
        self.details = details or []


def error_response(status: int, code: str, message: str, details: list | None = None):
    return JSONResponse(
        status_code=status,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details or [],
            }
        },
    )


def install_handlers(app: FastAPI):
    @app.exception_handler(ApiError)
    async def domain_error(request: Request, exc: ApiError):
        return error_response(exc.status, exc.code, exc.message, exc.details)

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError):
        errors = exc.errors()
        status = 400 if all(e["loc"][0] in ("query", "path") for e in errors) else 422
        details = [{"location": list(e["loc"]), "message": e["msg"]} for e in errors]
        return error_response(status, "INVALID_REQUEST", "Request validation failed.", details)

    @app.exception_handler(sqlite3.Error)
    async def database_error(request: Request, exc: sqlite3.Error):
        logger.error("Database operation failed", exc_info=exc)
        return error_response(503, "DATABASE_UNAVAILABLE", "The database is unavailable.")

    @app.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException):
        return error_response(
            exc.status_code,
            "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR",
            str(exc.detail),
        )

    @app.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception):
        logger.error("Unexpected backend error", exc_info=exc)
        return error_response(500, "INTERNAL_ERROR", "An unexpected server error occurred.")
