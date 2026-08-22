from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class SeatHold(Base):
    """
    Temporary hold on a specific seat for a show with a strict Time-to-Live (TTL).
    Prevents double-booking during checkout abandonment.
    """
    __tablename__ = "seat_holds"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id", ondelete="CASCADE"), nullable=False, index=True)
    show_seat_id = Column(Integer, ForeignKey("show_seats.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    hold_token = Column(String(64), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(String(30), default="ACTIVE", nullable=False)  # ACTIVE, EXPIRED, RELEASED, CONVERTED

    # Relationships
    show = relationship("Show", back_populates="holds")
    show_seat = relationship("ShowSeat", back_populates="holds")
    user = relationship("User", back_populates="holds")
