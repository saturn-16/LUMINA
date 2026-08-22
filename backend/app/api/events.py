from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import joinedload, selectinload

from backend.app.core.database import get_db
from backend.app.models.event import Event
from backend.app.models.show import Show, ShowPricing
from backend.app.models.venue import Venue
from backend.app.schemas.event import EventResponse
from backend.app.schemas.show import ShowResponse, ShowPricingResponse

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=List[EventResponse])
async def list_events(
    query: Optional[str] = None,
    event_type: Optional[str] = None,
    city: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Public event discovery. Browse movies and concerts with optional title search,
    type filtering (MOVIE / CONCERT), and city filtering.
    """
    stmt = (
        select(Event)
        .options(
            joinedload(Event.organiser),
            selectinload(Event.shows).joinedload(Show.venue),
            selectinload(Event.shows).selectinload(Show.pricing),
        )
        .order_by(Event.created_at.desc())
    )

    if event_type:
        stmt = stmt.where(Event.event_type == event_type.upper())

    if query:
        search_pattern = f"%{query}%"
        stmt = stmt.where(
            or_(
                Event.title.ilike(search_pattern),
                Event.description.ilike(search_pattern),
            )
        )

    result = await db.execute(stmt)
    events = result.scalars().unique().all()

    response_list = []
    for evt in events:
        # Filter by city if requested
        if city:
            matching_shows = [s for s in evt.shows if s.venue and city.lower() in s.venue.city.lower()]
            if not matching_shows:
                continue

        # Calculate price range across shows
        all_prices = []
        for show in evt.shows:
            for pricing in show.pricing:
                all_prices.append(pricing.price)

        min_p = min(all_prices) if all_prices else None
        max_p = max(all_prices) if all_prices else None

        response_list.append(
            EventResponse(
                id=evt.id,
                organiser_id=evt.organiser_id,
                title=evt.title,
                description=evt.description,
                event_type=evt.event_type,
                banner_url=evt.banner_url,
                duration_minutes=evt.duration_minutes,
                created_at=evt.created_at,
                organiser=evt.organiser,
                min_price=min_p,
                max_price=max_p,
                total_shows=len(evt.shows),
            )
        )

    return response_list


@router.get("/{event_id}")
async def get_event_details(event_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve details for a single event along with its scheduled shows and venues."""
    stmt = (
        select(Event)
        .where(Event.id == event_id)
        .options(
            joinedload(Event.organiser),
            selectinload(Event.shows).joinedload(Show.venue).selectinload(Venue.categories),
            selectinload(Event.shows).selectinload(Show.pricing).joinedload(ShowPricing.category),
            selectinload(Event.shows).selectinload(Show.seats),
        )
    )
    result = await db.execute(stmt)
    evt = result.scalar_one_or_none()

    if not evt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    shows_data = []
    for s in evt.shows:
        total_seats = len(s.seats)
        avail_seats = sum(1 for seat in s.seats if seat.status == "AVAILABLE")
        is_sold_out = (total_seats > 0 and avail_seats == 0)

        pricing_list = [
            {
                "id": p.id,
                "category_id": p.category_id,
                "price": p.price,
                "category": {
                    "id": p.category.id,
                    "venue_id": p.category.venue_id,
                    "name": p.category.name,
                    "color_code": p.category.color_code,
                    "tier_level": p.category.tier_level,
                } if p.category else None,
            }
            for p in s.pricing
        ]

        shows_data.append({
            "id": s.id,
            "event_id": s.event_id,
            "venue_id": s.venue_id,
            "venue_name": s.venue.name if s.venue else "Unknown Venue",
            "venue_city": s.venue.city if s.venue else "Unknown City",
            "venue_address": s.venue.address if s.venue else "",
            "start_time": s.start_time,
            "end_time": s.end_time,
            "status": s.status,
            "created_at": s.created_at,
            "pricing": pricing_list,
            "available_seats_count": avail_seats,
            "total_seats_count": total_seats,
            "is_sold_out": is_sold_out,
        })

    return {
        "id": evt.id,
        "organiser_id": evt.organiser_id,
        "title": evt.title,
        "description": evt.description,
        "event_type": evt.event_type,
        "banner_url": evt.banner_url,
        "duration_minutes": evt.duration_minutes,
        "created_at": evt.created_at,
        "organiser": {
            "id": evt.organiser.id,
            "email": evt.organiser.email,
            "full_name": evt.organiser.full_name,
            "role": evt.organiser.role,
            "created_at": evt.organiser.created_at,
        } if evt.organiser else None,
        "shows": shows_data,
    }
