import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from sqlalchemy.orm import joinedload, selectinload
from fastapi import HTTPException, status

from backend.app.core.config import settings
from backend.app.core.utils import utc_now, ensure_utc, is_expired
from backend.app.core.websockets import ws_manager
from backend.app.models.booking import Booking, BookingSeat
from backend.app.models.hold import SeatHold
from backend.app.models.seat import ShowSeat, VenueSeat, SeatCategory
from backend.app.models.show import Show, ShowPricing
from backend.app.models.user import User
from backend.app.services.email_service import EmailService
from backend.app.services.qr_service import generate_qr_code_data_uri, generate_qr_code_bytes
from backend.app.services.waitlist_service import WaitlistService


class BookingService:
    @classmethod
    async def create_booking_from_hold(
        cls, db: AsyncSession, hold_token: str, user_id: int
    ) -> Dict[str, Any]:
        """
        Complete a booking from an active, non-expired seat hold.
        Guarantees concurrency safety, server-side price calculation, and server-side QR generation.
        """
        # 1. Lock and retrieve active holds for this hold_token
        hold_stmt = (
            select(SeatHold)
            .where(
                and_(
                    SeatHold.hold_token == hold_token,
                    SeatHold.status == "ACTIVE",
                )
            )
            .options(
                joinedload(SeatHold.show).joinedload(Show.event),
                joinedload(SeatHold.show).joinedload(Show.venue),
                joinedload(SeatHold.user),
            )
            .with_for_update()
        )
        hold_result = await db.execute(hold_stmt)
        holds = hold_result.scalars().all()

        if not holds:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active hold not found or already processed."
            )

        # 2. Check hold ownership
        if holds[0].user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot book seats held by another customer."
            )

        # 3. Check hold expiration
        if is_expired(holds[0].expires_at):
            for h in holds:
                h.status = "EXPIRED"
            seat_ids = [h.show_seat_id for h in holds]
            await db.execute(
                update(ShowSeat)
                .where(and_(ShowSeat.id.in_(seat_ids), ShowSeat.status == "HELD"))
                .values(status="AVAILABLE")
            )
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Seat hold has expired. Please select your seats again."
            )

        show = holds[0].show
        user = holds[0].user
        show_seat_ids = [h.show_seat_id for h in holds]

        # 4. Lock the corresponding ShowSeats
        seat_stmt = (
            select(ShowSeat)
            .where(ShowSeat.id.in_(show_seat_ids))
            .options(
                joinedload(ShowSeat.venue_seat).joinedload(VenueSeat.category),
            )
            .with_for_update()
        )
        seat_result = await db.execute(seat_stmt)
        locked_seats = seat_result.scalars().all()

        # 5. Fetch verified server-side show pricing
        pricing_stmt = select(ShowPricing).where(ShowPricing.show_id == show.id)
        pricing_res = await db.execute(pricing_stmt)
        pricings = pricing_res.scalars().all()
        pricing_map = {p.category_id: p.price for p in pricings}

        # 6. Recalculate total price & update seat states
        total_amount = 0.0
        booking_seats_data = []
        seat_descriptions = []

        for ss in locked_seats:
            if ss.status != "HELD":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Seat {ss.venue_seat.row_label}{ss.venue_seat.seat_number} is no longer in held status."
                )
            
            vs = ss.venue_seat
            cat_id = vs.category_id
            price = pricing_map.get(cat_id, 0.0)
            total_amount += price
            
            ss.status = "BOOKED"
            seat_descriptions.append(f"{vs.row_label}{vs.seat_number} ({vs.category.name})")

            booking_seats_data.append({
                "show_seat": ss,
                "price": price,
                "row_label": vs.row_label,
                "seat_number": vs.seat_number,
                "category_name": vs.category.name,
            })

        # Mark holds converted
        for h in holds:
            h.status = "CONVERTED"

        # 7. Generate unique booking reference and server QR code
        ref_suffix = uuid.uuid4().hex[:8].upper()
        booking_ref = f"TKT-{datetime.now().strftime('%Y%m%d')}-{ref_suffix}"

        now = utc_now()
        qr_payload = {
            "ref": booking_ref,
            "event": show.event.title,
            "venue": show.venue.name,
            "show_time": show.start_time.isoformat(),
            "customer": user.email,
            "seats": [f"{item['row_label']}{item['seat_number']}" for item in booking_seats_data],
            "total_amount": round(total_amount, 2),
        }
        qr_data_uri = generate_qr_code_data_uri(qr_payload)
        qr_png_bytes = generate_qr_code_bytes(qr_payload)

        # 8. Insert Booking & BookingSeats
        booking = Booking(
            booking_reference=booking_ref,
            user_id=user_id,
            show_id=show.id,
            total_amount=round(total_amount, 2),
            status="CONFIRMED",
            qr_code_data=qr_data_uri,
            created_at=now,
        )
        db.add(booking)
        await db.flush()

        result_seats = []
        for item in booking_seats_data:
            bs = BookingSeat(
                booking_id=booking.id,
                show_seat_id=item["show_seat"].id,
                price_paid=item["price"],
            )
            db.add(bs)
            await db.flush()
            result_seats.append({
                "id": bs.id,
                "show_seat_id": item["show_seat"].id,
                "row_label": item["row_label"],
                "seat_number": item["seat_number"],
                "category_name": item["category_name"],
                "price_paid": item["price"],
            })

        await db.commit()

        # 9. Send confirmation email directly to registered address
        EmailService.send_booking_confirmation(
            to_email=user.email,
            customer_name=user.full_name,
            booking_reference=booking_ref,
            event_title=show.event.title,
            venue_name=show.venue.name,
            show_time_str=show.start_time.strftime("%a, %b %d, %Y at %I:%M %p"),
            seats_str=", ".join(seat_descriptions),
            total_amount=round(total_amount, 2),
            qr_code_data_uri=qr_data_uri,
            qr_png_bytes=qr_png_bytes,
        )

        # 10. Broadcast real-time update
        await ws_manager.broadcast_show_update(
            show.id,
            {
                "type": "SEATS_BOOKED",
                "seat_ids": show_seat_ids,
            }
        )

        return {
            "id": booking.id,
            "booking_reference": booking.booking_reference,
            "show_id": show.id,
            "event_title": show.event.title,
            "event_type": show.event.event_type,
            "event_id": show.event_id,
            "event_banner_url": show.event.banner_url,
            "venue_name": show.venue.name,
            "venue_city": show.venue.city,
            "show_start_time": show.start_time,
            "total_amount": booking.total_amount,
            "status": booking.status,
            "created_at": booking.created_at,
            "qr_code_data": booking.qr_code_data,
            "seats": result_seats,
        }

    @classmethod
    async def cancel_booking(
        cls, db: AsyncSession, booking_id: int, user_id: int, is_admin: bool = False
    ) -> Dict[str, Any]:
        """
        Cancel a confirmed booking, release seats, and automatically trigger waitlist reallocation.
        """
        # 1. Lock and retrieve booking
        stmt = (
            select(Booking)
            .where(Booking.id == booking_id)
            .options(
                joinedload(Booking.show).joinedload(Show.event),
                joinedload(Booking.show).joinedload(Show.venue),
                selectinload(Booking.seats).joinedload(BookingSeat.show_seat).joinedload(ShowSeat.venue_seat),
            )
            .with_for_update()
        )
        result = await db.execute(stmt)
        booking = result.scalar_one_or_none()

        if not booking:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

        if not is_admin and booking.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to cancel this booking."
            )

        if booking.status != "CONFIRMED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Booking cannot be cancelled because its status is {booking.status.lower()}."
            )

        # 2. Mark booking cancelled
        now = utc_now()
        booking.status = "CANCELLED"
        booking.cancelled_at = now

        show = booking.show
        released_seats = []

        # 3. For each released seat, check for waitlist customers
        for bs in booking.seats:
            ss = bs.show_seat
            vs = ss.venue_seat
            category_id = vs.category_id

            await WaitlistService.process_released_seat(db, show.id, ss, category_id)
            released_seats.append(ss.id)

        await db.commit()

        # 4. Broadcast update to show viewers
        await ws_manager.broadcast_show_update(
            show.id,
            {
                "type": "BOOKING_CANCELLED",
                "seat_ids": released_seats,
            }
        )

        return {
            "message": "Booking successfully cancelled and seats reallocated.",
            "booking_reference": booking.booking_reference,
            "status": booking.status,
            "cancelled_at": booking.cancelled_at,
        }

    @classmethod
    async def get_user_bookings(cls, db: AsyncSession, user_id: int) -> List[Dict[str, Any]]:
        """Retrieve all bookings for a user, ordered newest first."""
        stmt = (
            select(Booking)
            .where(Booking.user_id == user_id)
            .options(
                joinedload(Booking.show).joinedload(Show.event),
                joinedload(Booking.show).joinedload(Show.venue),
                selectinload(Booking.seats).joinedload(BookingSeat.show_seat).joinedload(ShowSeat.venue_seat).joinedload(VenueSeat.category),
            )
            .order_by(Booking.created_at.desc())
        )
        result = await db.execute(stmt)
        bookings = result.scalars().all()

        items = []
        for b in bookings:
            seats_data = [
                {
                    "id": bs.id,
                    "show_seat_id": bs.show_seat_id,
                    "row_label": bs.show_seat.venue_seat.row_label,
                    "seat_number": bs.show_seat.venue_seat.seat_number,
                    "category_name": bs.show_seat.venue_seat.category.name,
                    "price_paid": bs.price_paid,
                }
                for bs in b.seats
            ]
            items.append({
                "id": b.id,
                "booking_reference": b.booking_reference,
                "show_id": b.show_id,
                "event_id": b.show.event_id if b.show else None,
                "event_title": b.show.event.title if b.show and b.show.event else "Event",
                "event_type": b.show.event.event_type if b.show and b.show.event else "EVENT",
                "event_banner_url": b.show.event.banner_url if b.show and b.show.event else None,
                "venue_name": b.show.venue.name if b.show and b.show.venue else "Venue",
                "venue_city": b.show.venue.city if b.show and b.show.venue else "City",
                "show_start_time": b.show.start_time if b.show else b.created_at,
                "total_amount": b.total_amount,
                "status": b.status,
                "created_at": b.created_at,
                "cancelled_at": b.cancelled_at,
                "qr_code_data": b.qr_code_data,
                "seats": seats_data,
            })
        return items

    @classmethod
    async def get_booking_by_reference(
        cls, db: AsyncSession, booking_reference: str, user: User
    ) -> Dict[str, Any]:
        """Fetch single booking details by reference code."""
        stmt = (
            select(Booking)
            .where(Booking.booking_reference == booking_reference)
            .options(
                joinedload(Booking.user),
                joinedload(Booking.show).joinedload(Show.event),
                joinedload(Booking.show).joinedload(Show.venue),
                selectinload(Booking.seats).joinedload(BookingSeat.show_seat).joinedload(ShowSeat.venue_seat).joinedload(VenueSeat.category),
            )
        )
        result = await db.execute(stmt)
        b = result.scalar_one_or_none()

        if not b:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found.")

        if user.role != "ADMIN" and b.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        seats_data = [
            {
                "id": bs.id,
                "show_seat_id": bs.show_seat_id,
                "row_label": bs.show_seat.venue_seat.row_label,
                "seat_number": bs.show_seat.venue_seat.seat_number,
                "category_name": bs.show_seat.venue_seat.category.name,
                "price_paid": bs.price_paid,
            }
            for bs in b.seats
        ]

        return {
            "id": b.id,
            "booking_reference": b.booking_reference,
            "show_id": b.show_id,
            "event_id": b.show.event_id if b.show else None,
            "event_title": b.show.event.title if b.show and b.show.event else "Event",
            "event_type": b.show.event.event_type if b.show and b.show.event else "EVENT",
            "event_banner_url": b.show.event.banner_url if b.show and b.show.event else None,
            "venue_name": b.show.venue.name if b.show and b.show.venue else "Venue",
            "venue_city": b.show.venue.city if b.show and b.show.venue else "City",
            "show_start_time": b.show.start_time if b.show else b.created_at,
            "total_amount": b.total_amount,
            "status": b.status,
            "created_at": b.created_at,
            "cancelled_at": b.cancelled_at,
            "qr_code_data": b.qr_code_data,
            "customer_name": b.user.full_name,
            "customer_email": b.user.email,
            "seats": seats_data,
        }

    @classmethod
    async def resend_booking_confirmation(
        cls, db: AsyncSession, booking_reference: str, user: User
    ) -> Dict[str, Any]:
        """Resend booking confirmation ticket email with QR code to the registered email."""
        booking_data = await cls.get_booking_by_reference(db, booking_reference, user)
        
        seat_descs = [
            f"{s['row_label']}{s['seat_number']} ({s['category_name']})"
            for s in booking_data["seats"]
        ]
        
        qr_payload = {
            "ref": booking_data["booking_reference"],
            "event": booking_data["event_title"],
            "venue": booking_data["venue_name"],
            "show_time": booking_data["show_start_time"].isoformat() if hasattr(booking_data["show_start_time"], "isoformat") else str(booking_data["show_start_time"]),
            "customer": booking_data["customer_email"],
            "seats": [f"{s['row_label']}{s['seat_number']}" for s in booking_data["seats"]],
            "total_amount": round(booking_data["total_amount"], 2),
        }
        qr_png_bytes = generate_qr_code_bytes(qr_payload)

        show_time_str = (
            booking_data["show_start_time"].strftime("%a, %b %d, %Y at %I:%M %p")
            if hasattr(booking_data["show_start_time"], "strftime")
            else str(booking_data["show_start_time"])
        )

        EmailService.send_booking_confirmation(
            to_email=booking_data["customer_email"],
            customer_name=booking_data["customer_name"],
            booking_reference=booking_data["booking_reference"],
            event_title=booking_data["event_title"],
            venue_name=booking_data["venue_name"],
            show_time_str=show_time_str,
            seats_str=", ".join(seat_descs),
            total_amount=round(booking_data["total_amount"], 2),
            qr_code_data_uri=booking_data["qr_code_data"],
            qr_png_bytes=qr_png_bytes,
        )

        return {
            "message": f"Confirmation email successfully re-dispatched to {booking_data['customer_email']}",
            "booking_reference": booking_reference,
            "recipient": booking_data["customer_email"],
        }
