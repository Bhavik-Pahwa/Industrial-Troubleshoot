import asyncio
from uuid import uuid4

import anyio
from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect

from indux.time import utc_now


class EventBus:
    """Single-process notifications with bounded queues and slow-client disconnection."""

    def __init__(self, queue_size: int = 128):
        self.queue_size = queue_size
        self.clients: set[asyncio.Queue] = set()

    def publish(self, event_type: str, data: dict):
        event = {"id": str(uuid4()), "type": event_type, "timestamp": utc_now(), "data": data}
        for queue in tuple(self.clients):
            if queue.full():
                # Force a REST resync instead of silently losing notifications indefinitely.
                self.clients.discard(queue)
                while not queue.empty():
                    queue.get_nowait()
                queue.put_nowait(None)
            else:
                queue.put_nowait(event)

    async def connect(self, websocket: WebSocket):
        queue = asyncio.Queue(maxsize=self.queue_size)
        await websocket.accept()
        self.clients.add(queue)

        async def sender():
            while True:
                event = await queue.get()
                if event is None:
                    await websocket.close(code=1013, reason="Refresh REST data and reconnect")
                    return
                await asyncio.wait_for(websocket.send_json(event), timeout=5)

        async def receiver():
            while True:
                message = await websocket.receive()
                if message["type"] == "websocket.disconnect":
                    return

        try:
            async with anyio.create_task_group() as group:

                async def run(action):
                    try:
                        await action()
                    except (WebSocketDisconnect, OSError, RuntimeError, TimeoutError):
                        pass
                    finally:
                        group.cancel_scope.cancel()

                group.start_soon(run, sender)
                group.start_soon(run, receiver)
        finally:
            self.clients.discard(queue)
