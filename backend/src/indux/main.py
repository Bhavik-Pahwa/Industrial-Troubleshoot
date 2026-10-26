import asyncio
import importlib
import logging
import sqlite3
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware

from indux.api import assets, incidents, system, telemetry
from indux.config import Settings
from indux.detectors.ai import AIDetector
from indux.detectors.base import Detector
from indux.detectors.demo import DemoDetector
from indux.errors import install_handlers
from indux.events import EventBus
from indux.services.assets import AssetService
from indux.services.incidents import IncidentService
from indux.services.status import StatusService
from indux.services.telemetry import TelemetryService
from indux.storage.database import Database

logger = logging.getLogger(__name__)


def load_detector(name: str) -> Detector | None:
    if name == "disabled":
        return None
    if name == "demo":
        return DemoDetector()
    module, factory = name.split(":", maxsplit=1)
    detector = getattr(importlib.import_module(module), factory)()
    if not callable(getattr(detector, "detect", None)):
        raise TypeError("Detector factory must return an object with detect(readings)")
    return detector


def create_app(settings: Settings | None = None, detector: Detector | None = None) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        database = Database(settings.database_path)
        app.state.database = database
        app.state.settings = settings
        app.state.events = EventBus()
        app.state.mutation_lock = asyncio.Lock()
        status_lock = asyncio.Lock()
        database_ready = True
        try:
            await run_in_threadpool(database.initialize)
        except (sqlite3.Error, OSError):
            database_ready = False
            logger.exception("Database initialization failed; health/status remain available")
        configured_detector = detector
        detector_status = "ready"
        try:
            if configured_detector is None:
                if settings.detector == "ai":
                    configured_detector = AIDetector(database)
                else:
                    configured_detector = await run_in_threadpool(load_detector, settings.detector)
            if configured_detector is None:
                detector_status = "not_configured"
        except Exception:
            detector_status = "unavailable"
            logger.exception("Detector initialization failed; telemetry remains available")
        app.state.status = StatusService(database, detector_status, configured_detector)
        if not database_ready:
            app.state.status.ingestion = "error"
        app.state.assets = AssetService(database, settings.freshness_seconds)
        app.state.incidents = IncidentService(database)
        app.state.telemetry = TelemetryService(
            database,
            configured_detector,
            app.state.incidents,
            app.state.status,
        )
        previous_status = await run_in_threadpool(app.state.status.get)

        async def publish_status():
            nonlocal previous_status
            async with status_lock:
                current = await run_in_threadpool(app.state.status.get)
                if current != previous_status:
                    previous_status = current
                    app.state.events.publish("system.status_changed", current)

        app.state.publish_status = publish_status

        async def monitor_status():
            while True:
                await asyncio.sleep(1)
                await publish_status()

        monitor = asyncio.create_task(monitor_status())
        try:
            yield
        finally:
            monitor.cancel()
            with suppress(asyncio.CancelledError):
                await monitor
            app.state.status.ingestion = "stopped"

    app = FastAPI(title="INDUX Backend MVP API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    install_handlers(app)
    for router in (system.router, assets.router, telemetry.router, incidents.router):
        app.include_router(router, prefix="/api/v1")
    return app


app = create_app()
