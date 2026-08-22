import json
from typing import Dict, Set
from fastapi import WebSocket


class ShowConnectionManager:
    """Manages active WebSocket connections grouped by show_id."""
    
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, show_id: int, websocket: WebSocket):
        await websocket.accept()
        if show_id not in self.active_connections:
            self.active_connections[show_id] = set()
        self.active_connections[show_id].add(websocket)

    def disconnect(self, show_id: int, websocket: WebSocket):
        if show_id in self.active_connections:
            self.active_connections[show_id].discard(websocket)
            if not self.active_connections[show_id]:
                del self.active_connections[show_id]

    async def broadcast_show_update(self, show_id: int, message: dict):
        """Broadcast a message to all active WebSocket connections for a given show."""
        if show_id not in self.active_connections:
            return
            
        dead_connections = set()
        for connection in list(self.active_connections[show_id]):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.add(connection)
                
        for dead in dead_connections:
            self.active_connections[show_id].discard(dead)


ws_manager = ShowConnectionManager()
