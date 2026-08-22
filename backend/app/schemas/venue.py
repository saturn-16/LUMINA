from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class SeatCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color_code: str = "#3B82F6"
    tier_level: int = 1


class SeatCategoryCreate(SeatCategoryBase):
    pass


class SeatCategoryResponse(SeatCategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    venue_id: int


class VenueSeatBase(BaseModel):
    row_label: str
    seat_number: int
    grid_row: int
    grid_col: int
    category_id: int
    is_active: bool = True


class VenueSeatResponse(VenueSeatBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    venue_id: int


class VenueBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    address: str
    city: str
    total_rows: int = Field(10, ge=1, le=50)
    total_cols: int = Field(12, ge=1, le=50)


class VenueCreate(VenueBase):
    categories: Optional[List[SeatCategoryCreate]] = None


class VenueUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    total_rows: Optional[int] = None
    total_cols: Optional[int] = None


class VenueResponse(VenueBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    categories: List[SeatCategoryResponse] = []


class VenueDetailResponse(VenueResponse):
    model_config = ConfigDict(from_attributes=True)

    seats: List[VenueSeatResponse] = []
