from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class SeatHoldCreate(BaseModel):
    show_id: int
    show_seat_ids: List[int] = Field(..., min_length=1, max_length=10)


class SeatHoldItemResponse(BaseModel):
    show_seat_id: int
    row_label: str
    seat_number: int
    category_name: str
    price: float


class SeatHoldResponse(BaseModel):
    hold_token: str
    show_id: int
    expires_at: datetime
    ttl_seconds: int
    total_amount: float
    seats: List[SeatHoldItemResponse]


class SeatHoldReleaseRequest(BaseModel):
    hold_token: str
