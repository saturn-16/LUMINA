import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_, delete
from sqlalchemy.orm import selectinload, joinedload
from fastapi import HTTPException, status

from backend.app.core.config import settings
from backend.app.core.utils import utc_now, ensure_utc, is_expired
from backend.app.core.websockets import ws_manager
from backend.app.models.seat import ShowSeat, VenueSeat, SeatCategory
from backend.app.models.show import Show, ShowPricing
from backend.app.models.hold import SeatHold
from backend.app.models.venue import Venue
from backend.app.models.event import Event


class SeatService:
    @staticmethod
    async def cleanup_expired_holds(db: AsyncSession) -> List[int]:
        """
        Background/lazy cleanup of expired seat holds.
        Finds ACTIVE holds where expires_at <= current UTC time.
        Reverts ShowSeat.status back to 'AVAILABLE' and marks hold as 'EXPIRED'.
        Returns list of affected show_ids.
        """
        stmt = (
            select(SeatHold)
            .where(SeatHold.status == "ACTIVE")
            .with_for_update()
        )
        result = await db.execute(stmt)
        active_holds = result.scalars().all()
        
        expired_holds = [h for h in active_holds if is_expired(h.expires_at)]
        if not expired_holds:
            return []

        affected_show_ids = set()
        affected_seat_ids = []

        for hold in expired_holds:
            hold.status = "EXPIRED"
            affected_show_ids.add(hold.show_id)
            affected_seat_ids.append(hold.show_seat_id)

        if affected_seat_ids:
            seat_update_stmt = (
                update(ShowSeat)
                .where(
                    and_(
                        ShowSeat.id.in_(affected_seat_ids),
                        ShowSeat.status == "HELD",
                    )
                )
                .values(status="AVAILABLE")
            )
            await db.execute(seat_update_stmt)

        await db.commit()

        # Broadcast real-time update for all affected shows
        for show_id in affected_show_ids:
            await ws_manager.broadcast_show_update(
                show_id,
                {"type": "SEATS_RELEASED", "reason": "HOLD_EXPIRED"}
            )

        return list(affected_show_ids)

    @classmethod
    async def get_show_seat_map(
        cls, db: AsyncSession, show_id: int, current_user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Retrieve complete seat map for a show with real-time dynamic seat states.
        Runs lazy hold cleanup first to guarantee fresh availability state.
        """
        await cls.cleanup_expired_holds(db)

        # Fetch show with event, venue, and pricing
        show_stmt = (
            select(Show)
            .where(Show.id == show_id)
            .options(
                joinedload(Show.event),
                joinedload(Show.venue).selectinload(Venue.categories),
                selectinload(Show.pricing),
            )
        )
        show_result = await db.execute(show_stmt)
        show = show_result.scalar_one_or_none()
        if not show:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Show not found")

        pricing_map = {p.category_id: p.price for p in show.pricing}

        # Fetch all show_seats joined with venue_seats and category
        seats_stmt = (
            select(ShowSeat)
            .where(ShowSeat.show_id == show_id)
            .options(
                joinedload(ShowSeat.venue_seat).joinedload(VenueSeat.category),
                selectinload(ShowSeat.holds),
            )
        )
        seats_result = await db.execute(seats_stmt)
        show_seats = seats_result.scalars().all()

        seat_items = []

        for ss in show_seats:
            vs = ss.venue_seat
            cat = vs.category
            price = pricing_map.get(cat.id, 0.0)

            held_by_current_user = False
            hold_expires_at_str = None

            if ss.status == "HELD":
                for h in ss.holds:
                    if h.status == "ACTIVE" and not is_expired(h.expires_at):
                        if current_user_id and h.user_id == current_user_id:
                            held_by_current_user = True
                            hold_expires_at_str = ensure_utc(h.expires_at).isoformat()
                        break

            seat_items.append({
                "show_seat_id": ss.id,
                "venue_seat_id": vs.id,
                "row_label": vs.row_label,
                "seat_number": vs.seat_number,
                "grid_row": vs.grid_row,
                "grid_col": vs.grid_col,
                "category_id": cat.id,
                "category_name": cat.name,
                "category_color": cat.color_code,
                "price": price,
                "status": ss.status,
                "is_active": vs.is_active,
                "held_by_current_user": held_by_current_user,
                "hold_expires_at": hold_expires_at_str,
            })

        # Sort seats by row and seat number for consistent grid layout
        seat_items.sort(key=lambda s: (s["grid_row"], s["grid_col"]))

        categories_data = [
            {
                "id": c.id,
                "venue_id": c.venue_id,
                "name": c.name,
                "color_code": c.color_code,
                "tier_level": c.tier_level,
            }
            for c in show.venue.categories
        ]

        return {
            "show_id": show.id,
            "event_id": show.event.id,
            "event_title": show.event.title,
            "venue_id": show.venue.id,
            "venue_name": show.venue.name,
            "total_rows": show.venue.total_rows,
            "total_cols": show.venue.total_cols,
            "categories": categories_data,
            "seats": seat_items,
        }

    @classmethod
    async def create_seat_hold(
        cls, db: AsyncSession, show_id: int, show_seat_ids: List[int], user_id: int
    ) -> Dict[str, Any]:
        """
        Atomically place a temporary hold on requested seats for a show.
        Guarantees concurrency safety using row-level locking (SELECT ... FOR UPDATE).
        """
        if not show_seat_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No seats selected")

        # 1. Clean up any expired holds first
        await cls.cleanup_expired_holds(db)

        # 2. Lock target ShowSeat records using row locking
        stmt = (
            select(ShowSeat)
            .where(
                and_(
                    ShowSeat.show_id == show_id,
                    ShowSeat.id.in_(show_seat_ids),
                )
            )
            .options(
                joinedload(ShowSeat.venue_seat).joinedload(VenueSeat.category),
            )
            .with_for_update()
        )
        result = await db.execute(stmt)
        locked_seats = result.scalars().all()

        if len(locked_seats) != len(show_seat_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more selected seats were not found for this show."
            )

        # 3. Validate that every requested seat is currently AVAILABLE
        for ss in locked_seats:
            if ss.status != "AVAILABLE":
                seat_label = f"{ss.venue_seat.row_label}{ss.venue_seat.seat_number}"
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Seat {seat_label} is no longer available (currently {ss.status.lower()})."
                )

        # 4. Fetch pricing for the show
        pricing_stmt = select(ShowPricing).where(ShowPricing.show_id == show_id)
        pricing_result = await db.execute(pricing_stmt)
        pricings = pricing_result.scalars().all()
        pricing_map = {p.category_id: p.price for p in pricings}

        # 5. Generate hold token and expiration
        hold_token = str(uuid.uuid4())
        now = utc_now()
        expires_at = now + timedelta(seconds=settings.HOLD_TTL_SECONDS)

        total_amount = 0.0
        held_seat_items = []

        # 6. Apply state transitions
        for ss in locked_seats:
            ss.status = "HELD"
            cat_id = ss.venue_seat.category_id
            price = pricing_map.get(cat_id, 0.0)
            total_amount += price

            new_hold = SeatHold(
                show_id=show_id,
                show_seat_id=ss.id,
                user_id=user_id,
                hold_token=hold_token,
                created_at=now,
                expires_at=expires_at,
                status="ACTIVE",
            )
            db.add(new_hold)

            held_seat_items.append({
                "show_seat_id": ss.id,
                "row_label": ss.venue_seat.row_label,
                "seat_number": ss.venue_seat.seat_number,
                "category_name": ss.venue_seat.category.name,
                "price": price,
            })

        # 7. Commit atomic transaction
        await db.commit()

        # 8. Broadcast update to all clients viewing this show
        await ws_manager.broadcast_show_update(
            show_id,
            {
                "type": "SEATS_HELD",
                "seat_ids": show_seat_ids,
                "expires_at": expires_at.isoformat(),
            }
        )

        return {
            "hold_token": hold_token,
            "show_id": show_id,
            "expires_at": expires_at,
            "ttl_seconds": settings.HOLD_TTL_SECONDS,
            "total_amount": round(total_amount, 2),
            "seats": held_seat_items,
        }

    @classmethod
    async def release_seat_hold(
        cls, db: AsyncSession, hold_token: str, user_id: int
    ) -> bool:
        """
        Manually release an active seat hold.
        """
        stmt = (
            select(SeatHold)
            .where(
                and_(
                    SeatHold.hold_token == hold_token,
                    SeatHold.user_id == user_id,
                    SeatHold.status == "ACTIVE",
                )
            )
            .with_for_update()
        )
        result = await db.execute(stmt)
        holds = result.scalars().all()

        if not holds:
            return False

        show_id = holds[0].show_id
        seat_ids = []

        for h in holds:
            h.status = "RELEASED"
            seat_ids.append(h.show_seat_id)

        # Set seats back to AVAILABLE
        seat_update = (
            update(ShowSeat)
            .where(
                and_(
                    ShowSeat.id.in_(seat_ids),
                    ShowSeat.status == "HELD",
                )
            )
            .values(status="AVAILABLE")
        )
        await db.execute(seat_update)
        await db.commit()

        # Broadcast update
        await ws_manager.broadcast_show_update(
            show_id,
            {
                "type": "SEATS_RELEASED",
                "seat_ids": seat_ids,
                "reason": "USER_RELEASED",
            }
        )
        return True
