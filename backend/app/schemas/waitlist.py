from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class WaitlistJoinRequest(BaseModel):
    show_id: int
    category_id: int


class WaitlistOfferInfo(BaseModel):
    offer_token: str
    show_seat_id: int
    row_label: str
    seat_number: int
    category_name: str
    price: float
    expires_at: datetime
    ttl_seconds_remaining: int


class WaitlistEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    show_id: int
    event_title: str
    venue_name: str
    show_start_time: datetime
    category_id: int
    category_name: str
    status: str  # WAITING, OFFERED, FULFILLED, EXPIRED, CANCELLED
    created_at: datetime
    active_offer: Optional[WaitlistOfferInfo] = None


class WaitlistClaimRequest(BaseModel):
    offer_token: str
