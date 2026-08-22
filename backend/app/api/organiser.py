from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import joinedload, selectinload

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.event import Event
from backend.app.models.show import Show, ShowPricing
from backend.app.models.venue import Venue
from backend.app.models.seat import VenueSeat, ShowSeat, SeatCategory
from backend.app.models.booking import Booking, BookingSeat
from backend.app.schemas.event import EventCreate, EventUpdate, EventResponse
from backend.app.schemas.show import ShowCreate, ShowResponse
from backend.app.api.deps import require_role

router = APIRouter(prefix="/organiser", tags=["Organiser"])


@router.get("/events", response_model=List[EventResponse])
async def list_organiser_events(
    current_user: User = Depends(require_role(["ORGANISER", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    """List all events created by the authenticated organiser."""
    if current_user.role == "ADMIN":
        stmt = (
            select(Event)
            .options(
                selectinload(Event.shows).joinedload(Show.venue),
                selectinload(Event.shows).selectinload(Show.pricing),
            )
            .order_by(Event.created_at.desc())
        )
    else:
        stmt = (
            select(Event)
            .where(Event.organiser_id == current_user.id)
            .options(
                selectinload(Event.shows).joinedload(Show.venue),
                selectinload(Event.shows).selectinload(Show.pricing),
            )
            .order_by(Event.created_at.desc())
        )
    result = await db.execute(stmt)
    events = result.scalars().all()

    items = []
    for evt in events:
        all_prices = []
        for s in evt.shows:
            for p in s.pricing:
                all_prices.append(p.price)

        items.append(
            EventResponse(
                id=evt.id,
                organiser_id=evt.organiser_id,
                title=evt.title,
                description=evt.description,
                event_type=evt.event_type,
                banner_url=evt.banner_url,
                duration_minutes=evt.duration_minutes,
                created_at=evt.created_at,
                min_price=min(all_prices) if all_prices else None,
                max_price=max(all_prices) if all_prices else None,
                total_shows=len(evt.shows),
            )
        )
    return items


@router.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    current_user: User = Depends(require_role(["ORGANISER", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    """Create a new movie or concert listing."""
    evt = Event(
        organiser_id=current_user.id,
        title=payload.title.strip(),
        description=payload.description,
        event_type=payload.event_type.upper(),
        banner_url=payload.banner_url,
        duration_minutes=payload.duration_minutes,
        created_at=datetime.now(timezone.utc),
    )
    db.add(evt)
    await db.commit()
    await db.refresh(evt)

    return EventResponse(
        id=evt.id,
        organiser_id=evt.organiser_id,
        title=evt.title,
        description=evt.description,
        event_type=evt.event_type,
        banner_url=evt.banner_url,
        duration_minutes=evt.duration_minutes,
        created_at=evt.created_at,
        min_price=None,
        max_price=None,
        total_shows=0,
    )


@router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    payload: EventUpdate,
    current_user: User = Depends(require_role(["ORGANISER", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    """Update event details."""
    stmt = select(Event).where(Event.id == event_id)
    result = await db.execute(stmt)
    evt = result.scalar_one_or_none()

    if not evt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if current_user.role != "ADMIN" and evt.organiser_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    if payload.title is not None:
        evt.title = payload.title.strip()
    if payload.description is not None:
        evt.description = payload.description
    if payload.event_type is not None:
        evt.event_type = payload.event_type.upper()
    if payload.banner_url is not None:
        evt.banner_url = payload.banner_url
    if payload.duration_minutes is not None:
        evt.duration_minutes = payload.duration_minutes

    await db.commit()
    await db.refresh(evt)
    return evt


@router.delete("/events/{event_id}", status_code=status.HTTP_200_OK)
async def delete_event(
    event_id: int,
    current_user: User = Depends(require_role(["ORGANISER", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    """Delete an organiser event and associated shows/seats."""
    stmt = select(Event).where(Event.id == event_id)
    res = await db.execute(stmt)
    evt = res.scalar_one_or_none()

    if not evt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")

    if current_user.role != "ADMIN" and evt.organiser_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    await db.delete(evt)
    await db.commit()
    return {"message": f"Event '{evt.title}' deleted successfully."}


@router.post("/shows", status_code=status.HTTP_201_CREATED)
async def create_show(
    payload: ShowCreate,
    current_user: User = Depends(require_role(["ORGANISER", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Schedule a new show for an event at a venue with per-category pricing.
    Automatically generates per-show seat inventory (`show_seats`) from the venue's active seats.
    """
    # 1. Verify event belongs to organiser
    evt_stmt = select(Event).where(Event.id == payload.event_id)
    evt_res = await db.execute(evt_stmt)
    evt = evt_res.scalar_one_or_none()
    if not evt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    if current_user.role != "ADMIN" and evt.organiser_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # 2. Verify venue
    venue_stmt = (
        select(Venue)
        .where(Venue.id == payload.venue_id)
        .options(
            selectinload(Venue.categories),
            selectinload(Venue.seats),
        )
    )
    venue_res = await db.execute(venue_stmt)
    venue = venue_res.scalar_one_or_none()
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")

    if not venue.seats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot schedule show: venue has no configured seats.",
        )

    # 3. Verify pricing covers venue categories
    venue_cat_ids = {c.id for c in venue.categories}
    pricing_cat_ids = {p.category_id for p in payload.pricing}
    missing_cats = venue_cat_ids - pricing_cat_ids
    if missing_cats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pricing is required for all venue categories. Missing category IDs: {list(missing_cats)}",
        )

    # 4. Create Show
    show = Show(
        event_id=payload.event_id,
        venue_id=payload.venue_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status="SCHEDULED",
        created_at=datetime.now(timezone.utc),
    )
    db.add(show)
    await db.flush()

    # 5. Add ShowPricing
    for p in payload.pricing:
        pricing = ShowPricing(
            show_id=show.id,
            category_id=p.category_id,
            price=p.price,
        )
        db.add(pricing)

    # 6. Generate per-show seat inventory (ShowSeat)
    for vs in venue.seats:
        if vs.is_active:
            ss = ShowSeat(
                show_id=show.id,
                venue_seat_id=vs.id,
                status="AVAILABLE",
                version=1,
            )
            db.add(ss)

    await db.commit()

    return {"message": "Show created successfully", "show_id": show.id}


@router.get("/analytics")
async def get_organiser_analytics(
    current_user: User = Depends(require_role(["ORGANISER", "ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve booking summaries and revenue metrics per event and show for the organiser.
    """
    # Fetch organiser's events with shows, bookings, and seats
    if current_user.role == "ADMIN":
        stmt = (
            select(Event)
            .options(
                selectinload(Event.shows).joinedload(Show.venue),
                selectinload(Event.shows).selectinload(Show.seats),
                selectinload(Event.shows).selectinload(Show.bookings).selectinload(Booking.seats),
            )
        )
    else:
        stmt = (
            select(Event)
            .where(Event.organiser_id == current_user.id)
            .options(
                selectinload(Event.shows).joinedload(Show.venue),
                selectinload(Event.shows).selectinload(Show.seats),
                selectinload(Event.shows).selectinload(Show.bookings).selectinload(Booking.seats),
            )
        )
    result = await db.execute(stmt)
    events = result.scalars().all()

    total_revenue = 0.0
    total_bookings_count = 0
    total_tickets_sold = 0

    events_summary = []

    for evt in events:
        evt_revenue = 0.0
        evt_bookings = 0
        evt_tickets = 0
        shows_data = []

        for s in evt.shows:
            show_rev = 0.0
            show_b_count = 0
            show_t_count = 0

            for b in s.bookings:
                if b.status == "CONFIRMED":
                    show_rev += b.total_amount
                    show_b_count += 1
                    show_t_count += len(b.seats)

            evt_revenue += show_rev
            evt_bookings += show_b_count
            evt_tickets += show_t_count

            total_seats = len(s.seats)
            occupancy_pct = (show_t_count / total_seats * 100) if total_seats > 0 else 0

            shows_data.append({
                "show_id": s.id,
                "venue_name": s.venue.name if s.venue else "N/A",
                "start_time": s.start_time,
                "status": s.status,
                "revenue": round(show_rev, 2),
                "bookings_count": show_b_count,
                "tickets_sold": show_t_count,
                "total_seats": total_seats,
                "occupancy_rate": round(occupancy_pct, 1),
            })

        total_revenue += evt_revenue
        total_bookings_count += evt_bookings
        total_tickets_sold += evt_tickets

        events_summary.append({
            "event_id": evt.id,
            "title": evt.title,
            "event_type": evt.event_type,
            "total_revenue": round(evt_revenue, 2),
            "total_bookings": evt_bookings,
            "tickets_sold": evt_tickets,
            "shows": shows_data,
        })

    return {
        "total_revenue": round(total_revenue, 2),
        "total_bookings": total_bookings_count,
        "total_tickets_sold": total_tickets_sold,
        "events": events_summary,
    }
