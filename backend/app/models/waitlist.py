from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class WaitlistEntry(Base):
    """
    Queue entry for a sold-out show and specific seat category.
    Orders waitlisted customers strictly FIFO by created_at.
    """
    __tablename__ = "waitlist_entries"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("seat_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), default="WAITING", nullable=False)  # WAITING, OFFERED, FULFILLED, EXPIRED, CANCELLED
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    show = relationship("Show", back_populates="waitlist_entries")
    category = relationship("SeatCategory", back_populates="waitlist_entries")
    user = relationship("User", back_populates="waitlist_entries")
    offers = relationship("WaitlistOffer", back_populates="waitlist_entry", cascade="all, delete-orphan")


class WaitlistOffer(Base):
    """
    Time-limited exclusive offer given to the top FIFO waitlisted customer upon booking cancellation.
    Locks the released seat in RESERVED_FOR_WAITLIST state until accepted or expired.
    """
    __tablename__ = "waitlist_offers"

    id = Column(Integer, primary_key=True, index=True)
    waitlist_entry_id = Column(Integer, ForeignKey("waitlist_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    show_seat_id = Column(Integer, ForeignKey("show_seats.id", ondelete="CASCADE"), nullable=False, index=True)
    offer_token = Column(String(64), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(String(30), default="PENDING", nullable=False)  # PENDING, ACCEPTED, EXPIRED, DECLINED

    # Relationships
    waitlist_entry = relationship("WaitlistEntry", back_populates="offers")
    show_seat = relationship("ShowSeat", back_populates="waitlist_offers")
