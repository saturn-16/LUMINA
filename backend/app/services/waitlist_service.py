import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_
from sqlalchemy.orm import joinedload, selectinload
from fastapi import HTTPException, status

from backend.app.core.config import settings
from backend.app.core.utils import utc_now, ensure_utc, is_expired
from backend.app.core.websockets import ws_manager
from backend.app.models.waitlist import WaitlistEntry, WaitlistOffer
from backend.app.models.seat import ShowSeat, VenueSeat, SeatCategory
from backend.app.models.show import Show, ShowPricing
from backend.app.models.user import User
from backend.app.models.booking import Booking, BookingSeat
from backend.app.services.email_service import EmailService
from backend.app.services.qr_service import generate_qr_code_data_uri


class WaitlistService:
    @classmethod
    async def join_waitlist(
        cls, db: AsyncSession, show_id: int, category_id: int, user_id: int
    ) -> Dict[str, Any]:
        """
        Customer joins a waitlist for a specific seat category on a show.
        Enforces FIFO order by recording created_at timestamp.
        """
        # 1. Verify show exists
        show_stmt = select(Show).where(Show.id == show_id).options(joinedload(Show.event), joinedload(Show.venue))
        show_res = await db.execute(show_stmt)
        show = show_res.scalar_one_or_none()
        if not show:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Show not found")

        # 2. Verify category exists for venue
        cat_stmt = select(SeatCategory).where(
            and_(SeatCategory.id == category_id, SeatCategory.venue_id == show.venue_id)
        )
        cat_res = await db.execute(cat_stmt)
        category = cat_res.scalar_one_or_none()
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seat category not found for this venue")

        # 3. Check if user already has an active waitlist entry for this show & category
        existing_stmt = select(WaitlistEntry).where(
            and_(
                WaitlistEntry.show_id == show_id,
                WaitlistEntry.category_id == category_id,
                WaitlistEntry.user_id == user_id,
                WaitlistEntry.status.in_(["WAITING", "OFFERED"]),
            )
        )
        existing_res = await db.execute(existing_stmt)
        if existing_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You are already on the active waitlist for this seat category."
            )

        # 4. Insert waitlist entry
        now = utc_now()
        entry = WaitlistEntry(
            show_id=show_id,
            category_id=category_id,
            user_id=user_id,
            status="WAITING",
            created_at=now,
        )
        db.add(entry)
        await db.commit()
        await db.refresh(entry)

        return {
            "id": entry.id,
            "show_id": show_id,
            "event_title": show.event.title,
            "venue_name": show.venue.name,
            "show_start_time": show.start_time,
            "category_id": category.id,
            "category_name": category.name,
            "status": entry.status,
            "created_at": entry.created_at,
        }

    @classmethod
    async def get_user_waitlists(cls, db: AsyncSession, user_id: int) -> List[Dict[str, Any]]:
        """Retrieve all waitlist entries and active offers for a user."""
        await cls.cleanup_expired_offers(db)

        stmt = (
            select(WaitlistEntry)
            .where(WaitlistEntry.user_id == user_id)
            .options(
                joinedload(WaitlistEntry.show).joinedload(Show.event),
                joinedload(WaitlistEntry.show).joinedload(Show.venue),
                joinedload(WaitlistEntry.category),
                selectinload(WaitlistEntry.offers).joinedload(WaitlistOffer.show_seat).joinedload(ShowSeat.venue_seat),
            )
            .order_by(WaitlistEntry.created_at.desc())
        )
        result = await db.execute(stmt)
        entries = result.scalars().all()

        now = utc_now()
        items = []

        for e in entries:
            active_offer_info = None
            for offer in e.offers:
                if offer.status == "PENDING" and not is_expired(offer.expires_at):
                    ss = offer.show_seat
                    vs = ss.venue_seat
                    
                    pricing_stmt = select(ShowPricing).where(
                        and_(ShowPricing.show_id == e.show_id, ShowPricing.category_id == e.category_id)
                    )
                    pr_res = await db.execute(pricing_stmt)
                    pr = pr_res.scalar_one_or_none()
                    price = pr.price if pr else 0.0

                    expiry_utc = ensure_utc(offer.expires_at)
                    ttl_remaining = max(0, int((expiry_utc - now).total_seconds()))
                    active_offer_info = {
                        "offer_token": offer.offer_token,
                        "show_seat_id": ss.id,
                        "row_label": vs.row_label,
                        "seat_number": vs.seat_number,
                        "category_name": e.category.name,
                        "price": price,
                        "expires_at": expiry_utc,
                        "ttl_seconds_remaining": ttl_remaining,
                    }
                    break

            items.append({
                "id": e.id,
                "show_id": e.show_id,
                "event_title": e.show.event.title,
                "venue_name": e.show.venue.name,
                "show_start_time": e.show.start_time,
                "category_id": e.category_id,
                "category_name": e.category.name,
                "status": e.status,
                "created_at": e.created_at,
                "active_offer": active_offer_info,
            })

        return items

    @classmethod
    async def process_released_seat(
        cls, db: AsyncSession, show_id: int, show_seat: ShowSeat, category_id: int
    ) -> bool:
        """
        When a seat is released, find the next FIFO eligible customer in waitlist_entries for (show_id, category_id).
        If found, create a time-limited offer; otherwise return seat to AVAILABLE.
        """
        waitlist_stmt = (
            select(WaitlistEntry)
            .where(
                and_(
                    WaitlistEntry.show_id == show_id,
                    WaitlistEntry.category_id == category_id,
                    WaitlistEntry.status == "WAITING",
                )
            )
            .options(
                joinedload(WaitlistEntry.user),
                joinedload(WaitlistEntry.show).joinedload(Show.event),
                joinedload(WaitlistEntry.show).joinedload(Show.venue),
                joinedload(WaitlistEntry.category),
            )
            .order_by(WaitlistEntry.created_at.asc())
            .limit(1)
            .with_for_update()
        )
        waitlist_res = await db.execute(waitlist_stmt)
        next_entry = waitlist_res.scalar_one_or_none()

        if next_entry:
            show_seat.status = "RESERVED_FOR_WAITLIST"
            next_entry.status = "OFFERED"

            offer_token = str(uuid.uuid4())
            now = utc_now()
            expires_at = now + timedelta(seconds=settings.WAITLIST_OFFER_TTL_SECONDS)

            offer = WaitlistOffer(
                waitlist_entry_id=next_entry.id,
                show_seat_id=show_seat.id,
                offer_token=offer_token,
                created_at=now,
                expires_at=expires_at,
                status="PENDING",
            )
            db.add(offer)

            pricing_stmt = select(ShowPricing).where(
                and_(ShowPricing.show_id == show_id, ShowPricing.category_id == category_id)
            )
            pr_res = await db.execute(pricing_stmt)
            pr = pr_res.scalar_one_or_none()
            price = pr.price if pr else 0.0

            claim_url = f"{settings.FRONTEND_URL}/waitlist/claim?token={offer_token}"
            vs = show_seat.venue_seat
            seat_desc = f"{vs.row_label}{vs.seat_number} ({next_entry.category.name})"
            
            EmailService.send_waitlist_offer(
                to_email=next_entry.user.email,
                customer_name=next_entry.user.full_name,
                event_title=next_entry.show.event.title,
                venue_name=next_entry.show.venue.name,
                show_time_str=next_entry.show.start_time.strftime("%a, %b %d, %Y at %I:%M %p"),
                seat_desc=seat_desc,
                price=price,
                claim_url=claim_url,
                expiry_minutes=settings.WAITLIST_OFFER_TTL_SECONDS // 60,
            )
            return True
        else:
            show_seat.status = "AVAILABLE"
            return False

    @classmethod
    async def cleanup_expired_offers(cls, db: AsyncSession) -> List[int]:
        """
        Background/lazy check for expired waitlist offers.
        If expired: marks offer and entry EXPIRED, then offers seat to next in line.
        """
        stmt = (
            select(WaitlistOffer)
            .where(WaitlistOffer.status == "PENDING")
            .options(
                joinedload(WaitlistOffer.waitlist_entry),
                joinedload(WaitlistOffer.show_seat).joinedload(ShowSeat.venue_seat),
            )
            .with_for_update()
        )
        result = await db.execute(stmt)
        all_pending_offers = result.scalars().all()

        expired_offers = [o for o in all_pending_offers if is_expired(o.expires_at)]
        if not expired_offers:
            return []

        affected_show_ids = set()

        for offer in expired_offers:
            offer.status = "EXPIRED"
            entry = offer.waitlist_entry
            entry.status = "EXPIRED"

            show_seat = offer.show_seat
            show_id = entry.show_id
            category_id = entry.category_id
            affected_show_ids.add(show_id)

            await cls.process_released_seat(db, show_id, show_seat, category_id)

        await db.commit()

        for sid in affected_show_ids:
            await ws_manager.broadcast_show_update(
                sid,
                {"type": "WAITLIST_OFFER_EXPIRED"}
            )

        return list(affected_show_ids)

    @classmethod
    async def claim_waitlist_offer(
        cls, db: AsyncSession, offer_token: str, user_id: int
    ) -> Dict[str, Any]:
        """
        Customer claims and completes booking for their time-limited waitlist offer.
        Guarantees backend validation of expiry and ownership.
        """
        await cls.cleanup_expired_offers(db)

        stmt = (
            select(WaitlistOffer)
            .where(WaitlistOffer.offer_token == offer_token)
            .options(
                joinedload(WaitlistOffer.waitlist_entry).joinedload(WaitlistEntry.user),
                joinedload(WaitlistOffer.waitlist_entry).joinedload(WaitlistEntry.show).joinedload(Show.event),
                joinedload(WaitlistOffer.waitlist_entry).joinedload(WaitlistEntry.show).joinedload(Show.venue),
                joinedload(WaitlistOffer.show_seat).joinedload(ShowSeat.venue_seat).joinedload(VenueSeat.category),
            )
            .with_for_update()
        )
        result = await db.execute(stmt)
        offer = result.scalar_one_or_none()

        if not offer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Waitlist offer not found or invalid token.")

        if offer.status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This offer is no longer valid (status: {offer.status.lower()})."
            )

        if is_expired(offer.expires_at):
            offer.status = "EXPIRED"
            offer.waitlist_entry.status = "EXPIRED"
            await cls.process_released_seat(db, offer.waitlist_entry.show_id, offer.show_seat, offer.waitlist_entry.category_id)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="This waitlist offer has expired and the seat has been reallocated."
            )

        entry = offer.waitlist_entry
        if entry.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to claim this offer."
            )

        show_seat = offer.show_seat
        vs = show_seat.venue_seat
        show = entry.show

        pricing_stmt = select(ShowPricing).where(
            and_(ShowPricing.show_id == show.id, ShowPricing.category_id == vs.category_id)
        )
        pr_res = await db.execute(pricing_stmt)
        pricing = pr_res.scalar_one_or_none()
        price = pricing.price if pricing else 0.0

        offer.status = "ACCEPTED"
        entry.status = "FULFILLED"
        show_seat.status = "BOOKED"

        ref_suffix = uuid.uuid4().hex[:8].upper()
        booking_ref = f"TKT-{datetime.now().strftime('%Y%m%d')}-{ref_suffix}"

        now = utc_now()
        qr_payload = {
            "ref": booking_ref,
            "event": show.event.title,
            "venue": show.venue.name,
            "show_time": show.start_time.isoformat(),
            "customer": entry.user.email,
            "seats": [f"{vs.row_label}{vs.seat_number}"],
        }
        qr_data_uri = generate_qr_code_data_uri(qr_payload)

        booking = Booking(
            booking_reference=booking_ref,
            user_id=user_id,
            show_id=show.id,
            total_amount=price,
            status="CONFIRMED",
            qr_code_data=qr_data_uri,
            created_at=now,
        )
        db.add(booking)
        await db.flush()

        booking_seat = BookingSeat(
            booking_id=booking.id,
            show_seat_id=show_seat.id,
            price_paid=price,
        )
        db.add(booking_seat)
        await db.commit()

        seat_desc = f"{vs.row_label}{vs.seat_number} ({vs.category.name})"
        EmailService.send_booking_confirmation(
            to_email=entry.user.email,
            customer_name=entry.user.full_name,
            booking_reference=booking_ref,
            event_title=show.event.title,
            venue_name=show.venue.name,
            show_time_str=show.start_time.strftime("%a, %b %d, %Y at %I:%M %p"),
            seats_str=seat_desc,
            total_amount=price,
            qr_code_data_uri=qr_data_uri,
        )

        await ws_manager.broadcast_show_update(
            show.id,
            {
                "type": "SEAT_BOOKED_FROM_WAITLIST",
                "seat_id": show_seat.id,
            }
        )

        return {
            "id": booking.id,
            "booking_reference": booking.booking_reference,
            "show_id": show.id,
            "event_title": show.event.title,
            "event_type": show.event.event_type,
            "venue_name": show.venue.name,
            "venue_city": show.venue.city,
            "show_start_time": show.start_time,
            "total_amount": booking.total_amount,
            "status": booking.status,
            "created_at": booking.created_at,
            "qr_code_data": booking.qr_code_data,
            "seats": [
                {
                    "id": booking_seat.id,
                    "show_seat_id": show_seat.id,
                    "row_label": vs.row_label,
                    "seat_number": vs.seat_number,
                    "category_name": vs.category.name,
                    "price_paid": price,
                }
            ],
        }
