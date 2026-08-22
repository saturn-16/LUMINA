import pytest_asyncio
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from backend.app.core.config import settings
from backend.app.core.database import Base, get_db
from backend.app.main import app

# Test database URL (file-based or shared memory)
TEST_DB_URL = "sqlite+aiosqlite:///./test_suite.db"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    future=True,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    from backend.app.core.security import get_password_hash
    from backend.app.models.user import User
    from backend.app.models.venue import Venue
    from backend.app.models.seat import SeatCategory, VenueSeat, ShowSeat
    from backend.app.models.event import Event
    from backend.app.models.show import Show, ShowPricing
    from datetime import datetime, timezone, timedelta

    async with TestingSessionLocal() as db:
        admin = User(
            email="admin@test.com",
            password_hash=get_password_hash("admin123"),
            full_name="Admin User",
            role="ADMIN",
        )
        organiser = User(
            email="organiser@test.com",
            password_hash=get_password_hash("organiser123"),
            full_name="Organiser User",
            role="ORGANISER",
        )
        cust1 = User(
            email="cust1@test.com",
            password_hash=get_password_hash("cust123"),
            full_name="Customer One",
            role="CUSTOMER",
        )
        cust2 = User(
            email="cust2@test.com",
            password_hash=get_password_hash("cust123"),
            full_name="Customer Two",
            role="CUSTOMER",
        )
        db.add_all([admin, organiser, cust1, cust2])
        await db.flush()

        venue = Venue(
            name="Test Arena",
            address="123 Test St",
            city="Test City",
            total_rows=3,
            total_cols=3,
        )
        db.add(venue)
        await db.flush()

        cat_std = SeatCategory(venue_id=venue.id, name="Standard", color_code="#3B82F6", tier_level=1)
        cat_vip = SeatCategory(venue_id=venue.id, name="VIP", color_code="#F59E0B", tier_level=2)
        db.add_all([cat_std, cat_vip])
        await db.flush()

        # 3x3 seats: Row A = VIP (3 seats), Rows B-C = Standard (6 seats)
        v_seats = []
        rows = ["A", "B", "C"]
        for r in range(3):
            cat = cat_vip if r == 0 else cat_std
            for c in range(3):
                vs = VenueSeat(
                    venue_id=venue.id,
                    category_id=cat.id,
                    row_label=rows[r],
                    seat_number=c + 1,
                    grid_row=r,
                    grid_col=c,
                )
                db.add(vs)
                v_seats.append(vs)
        await db.flush()

        event = Event(
            organiser_id=organiser.id,
            title="Test Symphony Live",
            description="Test concert description",
            event_type="CONCERT",
            duration_minutes=120,
        )
        db.add(event)
        await db.flush()

        now = datetime.now(timezone.utc)
        show = Show(
            event_id=event.id,
            venue_id=venue.id,
            start_time=now + timedelta(days=2),
            end_time=now + timedelta(days=2, hours=2),
            status="SCHEDULED",
        )
        db.add(show)
        await db.flush()

        db.add_all([
            ShowPricing(show_id=show.id, category_id=cat_std.id, price=50.0),
            ShowPricing(show_id=show.id, category_id=cat_vip.id, price=100.0),
        ])

        for vs in v_seats:
            db.add(ShowSeat(show_id=show.id, venue_seat_id=vs.id, status="AVAILABLE"))

        await db.commit()

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
