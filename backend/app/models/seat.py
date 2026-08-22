from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class SeatCategory(Base):
    __tablename__ = "seat_categories"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(Integer, ForeignKey("venues.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)  # e.g. 'Standard', 'Premium', 'VIP'
    color_code = Column(String(50), default="#3B82F6", nullable=False)
    tier_level = Column(Integer, default=1, nullable=False)  # Higher is higher tier

    # Relationships
    venue = relationship("Venue", back_populates="categories")
    seats = relationship("VenueSeat", back_populates="category", cascade="all, delete-orphan")
    pricing = relationship("ShowPricing", back_populates="category", cascade="all, delete-orphan")
    waitlist_entries = relationship("WaitlistEntry", back_populates="category", cascade="all, delete-orphan")


class VenueSeat(Base):
    __tablename__ = "venue_seats"

    id = Column(Integer, primary_key=True, index=True)
    venue_id = Column(Integer, ForeignKey("venues.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("seat_categories.id", ondelete="CASCADE"), nullable=False)
    row_label = Column(String(10), nullable=False)  # e.g. 'A', 'B'
    seat_number = Column(Integer, nullable=False)  # e.g. 1, 2
    grid_row = Column(Integer, nullable=False)  # 0-indexed row position
    grid_col = Column(Integer, nullable=False)  # 0-indexed col position
    is_active = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("venue_id", "row_label", "seat_number", name="uq_venue_seat_row_num"),
    )

    # Relationships
    venue = relationship("Venue", back_populates="seats")
    category = relationship("SeatCategory", back_populates="seats")
    show_seats = relationship("ShowSeat", back_populates="venue_seat", cascade="all, delete-orphan")


class ShowSeat(Base):
    """
    Per-show seat inventory.
    Decouples physical venue geometry from the dynamic availability state of a seat in a specific show.
    """
    __tablename__ = "show_seats"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False, index=True)
    venue_seat_id = Column(Integer, ForeignKey("venue_seats.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), default="AVAILABLE", nullable=False)  # AVAILABLE, HELD, BOOKED, RESERVED_FOR_WAITLIST
    version = Column(Integer, default=1, nullable=False)

    __table_args__ = (
        UniqueConstraint("show_id", "venue_seat_id", name="uq_show_seat_inventory"),
    )

    # Relationships
    show = relationship("Show", back_populates="seats")
    venue_seat = relationship("VenueSeat", back_populates="show_seats")
    holds = relationship("SeatHold", back_populates="show_seat", cascade="all, delete-orphan")
    booking_seats = relationship("BookingSeat", back_populates="show_seat", cascade="all, delete-orphan")
    waitlist_offers = relationship("WaitlistOffer", back_populates="show_seat", cascade="all, delete-orphan")
