from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Show(Base):
    __tablename__ = "shows"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    venue_id = Column(Integer, ForeignKey("venues.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(30), default="SCHEDULED", nullable=False)  # SCHEDULED, CANCELLED, COMPLETED
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    event = relationship("Event", back_populates="shows")
    venue = relationship("Venue", back_populates="shows")
    pricing = relationship("ShowPricing", back_populates="show", cascade="all, delete-orphan")
    seats = relationship("ShowSeat", back_populates="show", cascade="all, delete-orphan")
    holds = relationship("SeatHold", back_populates="show", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="show", cascade="all, delete-orphan")
    waitlist_entries = relationship("WaitlistEntry", back_populates="show", cascade="all, delete-orphan")


class ShowPricing(Base):
    """
    Per-show per-category pricing.
    Allows organisers to specify unique prices for each seat tier on a specific showtime.
    """
    __tablename__ = "show_pricing"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("seat_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    price = Column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint("show_id", "category_id", name="uq_show_category_pricing"),
    )

    # Relationships
    show = relationship("Show", back_populates="pricing")
    category = relationship("SeatCategory", back_populates="pricing")
