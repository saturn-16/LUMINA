from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.venue import VenueResponse, SeatCategoryResponse


class ShowPricingCreate(BaseModel):
    category_id: int
    price: float = Field(..., gt=0)


class ShowPricingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    price: float
    category: Optional[SeatCategoryResponse] = None


class ShowBase(BaseModel):
    event_id: int
    venue_id: int
    start_time: datetime
    end_time: datetime


class ShowCreate(ShowBase):
    pricing: List[ShowPricingCreate]


class ShowResponse(ShowBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    created_at: datetime
    pricing: List[ShowPricingResponse] = []
    available_seats_count: Optional[int] = 0
    total_seats_count: Optional[int] = 0
    is_sold_out: Optional[bool] = False


class ShowDetailResponse(ShowResponse):
    model_config = ConfigDict(from_attributes=True)

    event_title: Optional[str] = None
    event_type: Optional[str] = None
    venue_name: Optional[str] = None
    venue_city: Optional[str] = None
    venue_address: Optional[str] = None
