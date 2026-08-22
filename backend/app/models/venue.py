from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    total_rows = Column(Integer, nullable=False, default=10)
    total_cols = Column(Integer, nullable=False, default=12)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    categories = relationship("SeatCategory", back_populates="venue", cascade="all, delete-orphan")
    seats = relationship("VenueSeat", back_populates="venue", cascade="all, delete-orphan")
    shows = relationship("Show", back_populates="venue", cascade="all, delete-orphan")
