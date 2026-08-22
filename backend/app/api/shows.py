from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload

from backend.app.core.database import get_db
from backend.app.models.show import Show, ShowPricing
from backend.app.models.venue import Venue
from backend.app.models.user import User
from backend.app.schemas.seat import ShowSeatMapResponse
from backend.app.services.seat_service import SeatService
from backend.app.api.deps import get_current_user_optional

router = APIRouter(prefix="/shows", tags=["Shows"])


@router.get("/{show_id}")
async def get_show_details(show_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve details, venue, and category pricing for a specific show."""
    stmt = (
        select(Show)
        .where(Show.id == show_id)
        .options(
            joinedload(Show.event),
            joinedload(Show.venue).selectinload(Venue.categories),
            selectinload(Show.pricing).joinedload(ShowPricing.category),
            selectinload(Show.seats),
        )
    )
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()

    if not show:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Show not found.")

    total_seats = len(show.seats)
    avail_seats = sum(1 for s in show.seats if s.status == "AVAILABLE")

    return {
        "id": show.id,
        "event_id": show.event_id,
        "event_title": show.event.title,
        "event_type": show.event.event_type,
        "event_description": show.event.description,
        "event_banner_url": show.event.banner_url,
        "venue_id": show.venue_id,
        "venue_name": show.venue.name,
        "venue_city": show.venue.city,
        "venue_address": show.venue.address,
        "total_rows": show.venue.total_rows,
        "total_cols": show.venue.total_cols,
        "start_time": show.start_time,
        "end_time": show.end_time,
        "status": show.status,
        "pricing": [
            {
                "id": p.id,
                "category_id": p.category_id,
                "price": p.price,
                "category": {
                    "id": p.category.id,
                    "name": p.category.name,
                    "color_code": p.category.color_code,
                    "tier_level": p.category.tier_level,
                } if p.category else None,
            }
            for p in show.pricing
        ],
        "available_seats_count": avail_seats,
        "total_seats_count": total_seats,
        "is_sold_out": (total_seats > 0 and avail_seats == 0),
    }


@router.get("/{show_id}/seats", response_model=ShowSeatMapResponse)
async def get_show_seat_map(
    show_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Get interactive visual seat map with real-time seat status for a show.
    Executes lazy hold expiry check to guarantee freshness.
    """
    current_user_id = current_user.id if current_user else None
    seat_map = await SeatService.get_show_seat_map(db, show_id, current_user_id)
    return seat_map
