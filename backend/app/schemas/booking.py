from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class BookingCreate(BaseModel):
    hold_token: str


class BookingSeatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    show_seat_id: int
    row_label: str
    seat_number: int
    category_name: str
    price_paid: float


class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_reference: str
    show_id: int
    event_title: str
    event_type: str
    event_id: Optional[int] = None
    event_banner_url: Optional[str] = None
    venue_name: str
    venue_city: str
    show_start_time: datetime
    total_amount: float
    status: str
    created_at: datetime
    cancelled_at: Optional[datetime] = None
    seats: List[BookingSeatResponse] = []
    qr_code_data: Optional[str] = None


class BookingDetailResponse(BookingResponse):
    customer_name: str
    customer_email: str


class BookingCancelResponse(BaseModel):
    message: str
    booking_reference: str
    status: str
    cancelled_at: datetime
