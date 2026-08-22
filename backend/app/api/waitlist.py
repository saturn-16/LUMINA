from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.waitlist import (
    WaitlistJoinRequest,
    WaitlistEntryResponse,
    WaitlistClaimRequest,
)
from backend.app.schemas.booking import BookingResponse
from backend.app.services.waitlist_service import WaitlistService
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/waitlist", tags=["Waitlist"])


@router.post("/join", response_model=WaitlistEntryResponse, status_code=status.HTTP_201_CREATED)
async def join_show_waitlist(
    payload: WaitlistJoinRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Join category-specific waitlist for a show. Maintains strict FIFO queue ordering.
    """
    entry = await WaitlistService.join_waitlist(
        db=db,
        show_id=payload.show_id,
        category_id=payload.category_id,
        user_id=current_user.id,
    )
    return entry


@router.get("", response_model=List[WaitlistEntryResponse])
async def list_user_waitlists(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List user's active waitlist queue positions and time-limited offers.
    """
    entries = await WaitlistService.get_user_waitlists(db=db, user_id=current_user.id)
    return entries


@router.post("/claim", response_model=BookingResponse)
async def claim_waitlist_offer(
    payload: WaitlistClaimRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Claim and book a time-limited waitlist offer before its expiration TTL.
    """
    booking = await WaitlistService.claim_waitlist_offer(
        db=db,
        offer_token=payload.offer_token,
        user_id=current_user.id,
    )
    return booking
