from typing import Annotated

from fastapi import Query, Request
from fastapi.concurrency import run_in_threadpool

Limit = Annotated[int, Query(ge=1, le=200)]
Offset = Annotated[int, Query(ge=0)]


async def mutate(request: Request, operation, *args):
    # Serialize writes/detection in one process without blocking health checks or sockets.
    async with request.app.state.mutation_lock:
        try:
            result, events = await run_in_threadpool(operation, *args)
            for event_type, data in events:
                request.app.state.events.publish(event_type, data)
            return result
        finally:
            await request.app.state.publish_status()
