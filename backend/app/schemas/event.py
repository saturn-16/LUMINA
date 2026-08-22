from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.auth import UserResponse


class EventBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    event_type: str = Field(..., pattern="^(MOVIE|CONCERT)$")
    banner_url: Optional[str] = None
    duration_minutes: int = Field(120, ge=1)


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    banner_url: Optional[str] = None
    duration_minutes: Optional[int] = None


class EventResponse(EventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organiser_id: int
    created_at: datetime
    organiser: Optional[UserResponse] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    total_shows: Optional[int] = 0
