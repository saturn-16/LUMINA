from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.venue import Venue
from backend.app.models.seat import SeatCategory, VenueSeat
from backend.app.models.event import Event
from backend.app.models.show import Show, ShowPricing
from backend.app.models.booking import Booking, BookingSeat
from backend.app.models.waitlist import WaitlistEntry
from backend.app.schemas.venue import VenueCreate, VenueResponse, VenueDetailResponse
from backend.app.api.deps import require_role

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/venues", response_model=List[VenueResponse])
async def list_venues(
    current_user: User = Depends(require_role(["ADMIN", "ORGANISER"])),
    db: AsyncSession = Depends(get_db),
):
    """List all venues with their seat categories."""
    stmt = select(Venue).options(selectinload(Venue.categories)).order_by(Venue.name.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/venues", response_model=VenueResponse, status_code=status.HTTP_201_CREATED)
async def create_venue(
    payload: VenueCreate,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new venue with customizable row/column dimensions and seat tiers.
    Automatically generates the physical venue seat grid (e.g. Rows A-J, Seats 1-12).
    """
    venue = Venue(
        name=payload.name.strip(),
        address=payload.address.strip(),
        city=payload.city.strip(),
        total_rows=payload.total_rows,
        total_cols=payload.total_cols,
        created_at=datetime.now(timezone.utc),
    )
    db.add(venue)
    await db.flush()

    # Create Categories
    categories_input = payload.categories or [
        {"name": "Standard", "color_code": "#3B82F6", "tier_level": 1},
        {"name": "Premium", "color_code": "#8B5CF6", "tier_level": 2},
        {"name": "VIP", "color_code": "#F59E0B", "tier_level": 3},
    ]

    created_categories = []
    for cat_data in categories_input:
        cat_dict = cat_data.dict() if hasattr(cat_data, "dict") else cat_data
        cat = SeatCategory(
            venue_id=venue.id,
            name=cat_dict["name"],
            color_code=cat_dict.get("color_code", "#3B82F6"),
            tier_level=cat_dict.get("tier_level", 1),
        )
        db.add(cat)
        created_categories.append(cat)

    await db.flush()

    # Assign categories by tier
    created_categories.sort(key=lambda c: c.tier_level, reverse=True)
    num_cats = len(created_categories)

    # Generate physical seats (A-Z rows)
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    for r in range(payload.total_rows):
        row_letter = alphabet[r % len(alphabet)] if r < 26 else f"{alphabet[(r // 26) - 1]}{alphabet[r % 26]}"
        cat_idx = min(r * num_cats // payload.total_rows, num_cats - 1)
        assigned_cat = created_categories[cat_idx]

        for c in range(payload.total_cols):
            v_seat = VenueSeat(
                venue_id=venue.id,
                category_id=assigned_cat.id,
                row_label=row_letter,
                seat_number=c + 1,
                grid_row=r,
                grid_col=c,
                is_active=True,
            )
            db.add(v_seat)

    await db.commit()

    # Re-fetch venue with categories
    stmt = select(Venue).where(Venue.id == venue.id).options(selectinload(Venue.categories))
    res = await db.execute(stmt)
    return res.scalar_one()


@router.delete("/venues/{venue_id}", status_code=status.HTTP_200_OK)
async def delete_venue(
    venue_id: int,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    """Delete a venue and associated seats if no active shows exist."""
    venue = (await db.execute(select(Venue).where(Venue.id == venue_id))).scalar_one_or_none()
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")
    
    # Check if shows exist
    shows_count = (await db.execute(select(func.count(Show.id)).where(Show.venue_id == venue_id))).scalar_one()
    if shows_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete venue '{venue.name}' because {shows_count} show(s) are currently scheduled here.",
        )

    await db.delete(venue)
    await db.commit()
    return {"message": f"Venue '{venue.name}' deleted successfully."}


@router.get("/venues/{venue_id}", response_model=VenueDetailResponse)
async def get_venue_details(
    venue_id: int,
    current_user: User = Depends(require_role(["ADMIN", "ORGANISER"])),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve detailed venue configuration and its seat layout."""
    stmt = (
        select(Venue)
        .where(Venue.id == venue_id)
        .options(
            selectinload(Venue.categories),
            selectinload(Venue.seats),
        )
    )
    result = await db.execute(stmt)
    venue = result.scalar_one_or_none()
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found.")
    return venue


@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    """System-wide administration metrics and overview."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    total_events = (await db.execute(select(func.count(Event.id)))).scalar_one()
    total_shows = (await db.execute(select(func.count(Show.id)))).scalar_one()
    total_venues = (await db.execute(select(func.count(Venue.id)))).scalar_one()
    
    booking_stats = await db.execute(
        select(
            func.count(Booking.id),
            func.coalesce(func.sum(Booking.total_amount), 0.0),
        ).where(Booking.status == "CONFIRMED")
    )
    confirmed_bookings, total_revenue = booking_stats.one()

    # Active waitlist entries
    active_waitlist = (await db.execute(
        select(func.count(WaitlistEntry.id)).where(WaitlistEntry.status == "WAITING")
    )).scalar_one() or 0

    return {
        "total_users": total_users,
        "total_events": total_events,
        "total_shows": total_shows,
        "total_venues": total_venues,
        "total_confirmed_bookings": confirmed_bookings,
        "total_revenue": round(total_revenue, 2),
        "active_waitlist_count": active_waitlist,
    }


@router.get("/bookings")
async def list_admin_bookings(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    """List all bookings with associated customer and event metadata."""
    stmt = (
        select(Booking)
        .options(
            selectinload(Booking.user),
            selectinload(Booking.show).selectinload(Show.event),
            selectinload(Booking.show).selectinload(Show.venue),
            selectinload(Booking.seats),
        )
        .order_by(desc(Booking.created_at))
        .limit(100)
    )
    res = await db.execute(stmt)
    bookings = res.scalars().all()

    output = []
    for b in bookings:
        output.append({
            "id": b.id,
            "booking_reference": b.booking_reference,
            "customer_name": b.user.full_name if b.user else "Guest",
            "customer_email": b.user.email if b.user else "N/A",
            "event_title": b.show.event.title if b.show and b.show.event else "Event",
            "venue_name": b.show.venue.name if b.show and b.show.venue else "Auditorium",
            "city": b.show.venue.city if b.show and b.show.venue else "India",
            "show_time": b.show.start_time.isoformat() if b.show and b.show.start_time else None,
            "seats_count": len(b.seats) if b.seats else 0,
            "total_amount": b.total_amount,
            "status": b.status,
            "created_at": b.created_at.isoformat() if b.created_at else None,
        })
    return output


@router.get("/users")
async def list_admin_users(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    """List registered users, organisers, and administrators."""
    stmt = select(User).order_by(desc(User.created_at)).limit(100)
    res = await db.execute(stmt)
    users = res.scalars().all()

    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.get("/waitlist")
async def list_admin_waitlist(
    current_user: User = Depends(require_role(["ADMIN"])),
    db: AsyncSession = Depends(get_db),
):
    """List system waitlist queues."""
    stmt = (
        select(WaitlistEntry)
        .options(
            selectinload(WaitlistEntry.user),
            selectinload(WaitlistEntry.show).selectinload(Show.event),
            selectinload(WaitlistEntry.show).selectinload(Show.venue),
            selectinload(WaitlistEntry.category),
        )
        .order_by(desc(WaitlistEntry.created_at))
        .limit(100)
    )
    res = await db.execute(stmt)
    entries = res.scalars().all()

    return [
        {
            "id": w.id,
            "customer_name": w.user.full_name if w.user else "User",
            "customer_email": w.user.email if w.user else "N/A",
            "event_title": w.show.event.title if w.show and w.show.event else "Event",
            "venue_name": w.show.venue.name if w.show and w.show.venue else "Venue",
            "city": w.show.venue.city if w.show and w.show.venue else "India",
            "category_name": w.category.name if w.category else "Standard",
            "status": w.status,
            "created_at": w.created_at.isoformat() if w.created_at else None,
        }
        for w in entries
    ]
