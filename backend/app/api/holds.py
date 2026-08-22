from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import get_db
from backend.app.models.user import User
from backend.app.schemas.hold import SeatHoldCreate, SeatHoldResponse, SeatHoldReleaseRequest
from backend.app.services.seat_service import SeatService
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/holds", tags=["Holds"])


@router.post("", response_model=SeatHoldResponse, status_code=status.HTTP_201_CREATED)
async def create_seat_hold(
    payload: SeatHoldCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Acquire a temporary hold on selected seats with configurable TTL (e.g. 10 minutes).
    Protected against race conditions via row-level locks.
    """
    hold_result = await SeatService.create_seat_hold(
        db=db,
        show_id=payload.show_id,
        show_seat_ids=payload.show_seat_ids,
        user_id=current_user.id,
    )
    return hold_result


@router.post("/release")
async def release_seat_hold(
    payload: SeatHoldReleaseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually release an active seat hold (e.g., checkout abandoned or back clicked).
    """
    released = await SeatService.release_seat_hold(
        db=db,
        hold_token=payload.hold_token,
        user_id=current_user.id,
    )
    if not released:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active hold not found or already released.",
        )
    return {"message": "Seat hold released successfully."}
