from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.core.websockets import ws_manager

router = APIRouter(tags=["WebSockets"])


@router.websocket("/ws/shows/{show_id}")
async def show_seat_status_ws(websocket: WebSocket, show_id: int):
    """
    Real-time seat map status WebSocket connection.
    Broadcasts hold events, booking confirmations, cancellations, and releases to connected clients.
    """
    await ws_manager.connect(show_id, websocket)
    try:
        while True:
            # Keep connection open and handle any client ping/messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(show_id, websocket)
    except Exception:
        ws_manager.disconnect(show_id, websocket)
