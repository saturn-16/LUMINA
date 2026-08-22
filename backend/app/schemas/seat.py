from typing import List, Optional
from pydantic import BaseModel
from backend.app.schemas.venue import SeatCategoryResponse


class ShowSeatMapItem(BaseModel):
    show_seat_id: int
    venue_seat_id: int
    row_label: str
    seat_number: int
    grid_row: int
    grid_col: int
    category_id: int
    category_name: str
    category_color: str
    price: float
    status: str  # AVAILABLE, HELD, BOOKED, RESERVED_FOR_WAITLIST
    is_active: bool = True
    held_by_current_user: bool = False
    hold_expires_at: Optional[str] = None


class ShowSeatMapResponse(BaseModel):
    show_id: int
    event_id: int
    event_title: str
    venue_id: int
    venue_name: str
    total_rows: int
    total_cols: int
    categories: List[SeatCategoryResponse]
    seats: List[ShowSeatMapItem]
