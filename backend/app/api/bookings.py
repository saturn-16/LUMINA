from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.booking import (
    BookingCreate,
    BookingResponse,
    BookingDetailResponse,
    BookingCancelResponse,
)
from backend.app.services.booking_service import BookingService
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
@router.post("/confirm", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def complete_booking(
    payload: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Complete booking from an active, non-expired seat hold.
    Generates server-side QR ticket and dispatches confirmation email.
    """
    booking = await BookingService.create_booking_from_hold(
        db=db,
        hold_token=payload.hold_token,
        user_id=current_user.id,
    )
    return booking


@router.get("", response_model=List[BookingResponse])
async def list_user_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all confirmed and cancelled bookings for the authenticated customer."""
    bookings = await BookingService.get_user_bookings(db=db, user_id=current_user.id)
    return bookings


@router.get("/{booking_reference}", response_model=BookingDetailResponse)
async def get_booking_details(
    booking_reference: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full ticket and booking details with QR code by booking reference."""
    booking = await BookingService.get_booking_by_reference(
        db=db,
        booking_reference=booking_reference,
        user=current_user,
    )
    return booking


@router.post("/{booking_id}/cancel", response_model=BookingCancelResponse)
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Cancel a confirmed booking.
    Automatically reallocates released seats to waitlisted customers (FIFO) or returns them to available.
    """
    is_admin = (current_user.role == "ADMIN")
    result = await BookingService.cancel_booking(
        db=db,
        booking_id=booking_id,
        user_id=current_user.id,
        is_admin=is_admin,
    )
    return result
