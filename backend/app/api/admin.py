from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.models.venue import Venue
from backend.app.models.seat import SeatCategory, VenueSeat
from backend.app.models.event import Event
from backend.app.models.show import Show
from backend.app.models.booking import Booking
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

    # Map categories by tier to assign rows (e.g. front rows VIP/Premium, back rows Standard)
    # Default layout: top 20% rows VIP, next 30% Premium, remainder Standard
    created_categories.sort(key=lambda c: c.tier_level, reverse=True)
    num_cats = len(created_categories)

    # Generate physical seats (A-Z rows)
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    for r in range(payload.total_rows):
        row_letter = alphabet[r % len(alphabet)] if r < 26 else f"{alphabet[(r // 26) - 1]}{alphabet[r % 26]}"
        
        # Determine category for row
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

    return {
        "total_users": total_users,
        "total_events": total_events,
        "total_shows": total_shows,
        "total_venues": total_venues,
        "total_confirmed_bookings": confirmed_bookings,
        "total_revenue": round(total_revenue, 2),
    }
