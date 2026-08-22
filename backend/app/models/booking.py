from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Booking(Base):
    """
    Confirmed booking containing reference code, total verified amount, and server-generated QR payload.
    """
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_reference = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    status = Column(String(30), default="CONFIRMED", nullable=False)  # CONFIRMED, CANCELLED
    qr_code_data = Column(Text, nullable=True)  # Base64 data URL for QR code
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="bookings")
    show = relationship("Show", back_populates="bookings")
    seats = relationship("BookingSeat", back_populates="booking", cascade="all, delete-orphan")


class BookingSeat(Base):
    """
    Mapping between confirmed booking and individual seats booked, recording historical unit price paid.
    """
    __tablename__ = "booking_seats"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    show_seat_id = Column(Integer, ForeignKey("show_seats.id", ondelete="CASCADE"), nullable=False, index=True)
    price_paid = Column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint("booking_id", "show_seat_id", name="uq_booking_seat"),
    )

    # Relationships
    booking = relationship("Booking", back_populates="seats")
    show_seat = relationship("ShowSeat", back_populates="booking_seats")
