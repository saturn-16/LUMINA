import asyncio
from datetime import datetime, timezone, timedelta
from backend.app.core.database import async_engine, AsyncSessionLocal, Base
from backend.app.core.security import get_password_hash
from backend.app.models.user import User
from backend.app.models.venue import Venue
from backend.app.models.seat import SeatCategory, VenueSeat, ShowSeat
from backend.app.models.event import Event
from backend.app.models.show import Show, ShowPricing


async def seed_database():
    print("Initializing tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("Creating users...")
        admin = User(
            email="admin@ticketbooking.com",
            password_hash=get_password_hash("admin123"),
            full_name="System Admin",
            role="ADMIN",
            created_at=datetime.now(timezone.utc),
        )
        organiser = User(
            email="organiser@ticketbooking.com",
            password_hash=get_password_hash("organiser123"),
            full_name="Apex Live Events",
            role="ORGANISER",
            created_at=datetime.now(timezone.utc),
        )
        customer1 = User(
            email="customer@ticketbooking.com",
            password_hash=get_password_hash("customer123"),
            full_name="Gaurav Kumar",
            role="CUSTOMER",
            created_at=datetime.now(timezone.utc),
        )
        customer2 = User(
            email="alice@example.com",
            password_hash=get_password_hash("password123"),
            full_name="Alice Smith",
            role="CUSTOMER",
            created_at=datetime.now(timezone.utc),
        )
        customer3 = User(
            email="bob@example.com",
            password_hash=get_password_hash("password123"),
            full_name="Bob Wilson",
            role="CUSTOMER",
            created_at=datetime.now(timezone.utc),
        )
        db.add_all([admin, organiser, customer1, customer2, customer3])
        await db.flush()

        print("Creating venues & seat layouts...")
        # Venue 1: Grand Dolby Cinema
        venue1 = Venue(
            name="Grand Cinema Dolby Hall",
            address="100 Market St, Financial District",
            city="San Francisco",
            total_rows=6,
            total_cols=8,
            created_at=datetime.now(timezone.utc),
        )
        # Venue 2: Metropolis Concert Arena
        venue2 = Venue(
            name="Metropolis Concert Arena",
            address="450 7th Ave, Manhattan",
            city="New York",
            total_rows=8,
            total_cols=10,
            created_at=datetime.now(timezone.utc),
        )
        db.add_all([venue1, venue2])
        await db.flush()

        # Categories for Venue 1
        v1_std = SeatCategory(venue_id=venue1.id, name="Standard", color_code="#3B82F6", tier_level=1)
        v1_prem = SeatCategory(venue_id=venue1.id, name="Premium", color_code="#8B5CF6", tier_level=2)
        v1_vip = SeatCategory(venue_id=venue1.id, name="VIP Recliner", color_code="#F59E0B", tier_level=3)
        db.add_all([v1_std, v1_prem, v1_vip])

        # Categories for Venue 2
        v2_std = SeatCategory(venue_id=venue2.id, name="General Standard", color_code="#3B82F6", tier_level=1)
        v2_prem = SeatCategory(venue_id=venue2.id, name="Premium Floor", color_code="#8B5CF6", tier_level=2)
        v2_vip = SeatCategory(venue_id=venue2.id, name="VIP Front Stage", color_code="#F59E0B", tier_level=3)
        db.add_all([v2_std, v2_prem, v2_vip])
        await db.flush()

        # Generate Seats for Venue 1 (6 rows x 8 cols = 48 seats)
        # Rows A-B (VIP), C-D (Premium), E-F (Standard)
        alphabet = "ABCDEFGH"
        v1_seats = []
        for r in range(6):
            row_char = alphabet[r]
            cat = v1_vip if r < 2 else (v1_prem if r < 4 else v1_std)
            for c in range(8):
                v_seat = VenueSeat(
                    venue_id=venue1.id,
                    category_id=cat.id,
                    row_label=row_char,
                    seat_number=c + 1,
                    grid_row=r,
                    grid_col=c,
                    is_active=True,
                )
                db.add(v_seat)
                v1_seats.append(v_seat)

        # Generate Seats for Venue 2 (8 rows x 10 cols = 80 seats)
        v2_seats = []
        for r in range(8):
            row_char = alphabet[r]
            cat = v2_vip if r < 2 else (v2_prem if r < 5 else v2_std)
            for c in range(10):
                v_seat = VenueSeat(
                    venue_id=venue2.id,
                    category_id=cat.id,
                    row_label=row_char,
                    seat_number=c + 1,
                    grid_row=r,
                    grid_col=c,
                    is_active=True,
                )
                db.add(v_seat)
                v2_seats.append(v_seat)

        await db.flush()

        print("Creating events...")
        event1 = Event(
            organiser_id=organiser.id,
            title="Interstellar: 10th Anniversary IMAX 70mm",
            description="Christopher Nolan's masterpiece returns to the big screen in stunning 70mm IMAX. Journey through space and time to save human civilization.",
            event_type="MOVIE",
            banner_url="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
            duration_minutes=169,
            created_at=datetime.now(timezone.utc),
        )
        event2 = Event(
            organiser_id=organiser.id,
            title="Coldplay: Music of the Spheres World Tour",
            description="Experience Coldplay's spectacular stadium show featuring global hits, sustainable stage design, immersive LED wristbands, and special guests.",
            event_type="CONCERT",
            banner_url="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
            duration_minutes=150,
            created_at=datetime.now(timezone.utc),
        )
        event3 = Event(
            organiser_id=organiser.id,
            title="Hans Zimmer Live Symphony Tour",
            description="A breathtaking musical journey performing iconic scores from Gladiator, Inception, The Dark Knight, Dune, and The Lion King with a full orchestra.",
            event_type="CONCERT",
            banner_url="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop&q=80",
            duration_minutes=140,
            created_at=datetime.now(timezone.utc),
        )
        db.add_all([event1, event2, event3])
        await db.flush()

        print("Scheduling shows & generating per-show seat inventory...")
        now = datetime.now(timezone.utc)
        
        # Show 1: Interstellar tonight
        show1 = Show(
            event_id=event1.id,
            venue_id=venue1.id,
            start_time=now + timedelta(days=1, hours=4),
            end_time=now + timedelta(days=1, hours=7),
            status="SCHEDULED",
            created_at=now,
        )
        # Show 2: Interstellar tomorrow afternoon
        show2 = Show(
            event_id=event1.id,
            venue_id=venue1.id,
            start_time=now + timedelta(days=2, hours=2),
            end_time=now + timedelta(days=2, hours=5),
            status="SCHEDULED",
            created_at=now,
        )
        # Show 3: Coldplay at Metropolis Arena
        show3 = Show(
            event_id=event2.id,
            venue_id=venue2.id,
            start_time=now + timedelta(days=3, hours=5),
            end_time=now + timedelta(days=3, hours=8),
            status="SCHEDULED",
            created_at=now,
        )
        # Show 4: Hans Zimmer Symphony
        show4 = Show(
            event_id=event3.id,
            venue_id=venue2.id,
            start_time=now + timedelta(days=5, hours=4),
            end_time=now + timedelta(days=5, hours=7),
            status="SCHEDULED",
            created_at=now,
        )
        db.add_all([show1, show2, show3, show4])
        await db.flush()

        # Pricing for Show 1 & 2 (Dolby Cinema)
        for s in [show1, show2]:
            db.add_all([
                ShowPricing(show_id=s.id, category_id=v1_std.id, price=18.50),
                ShowPricing(show_id=s.id, category_id=v1_prem.id, price=26.00),
                ShowPricing(show_id=s.id, category_id=v1_vip.id, price=38.00),
            ])
            for vs in v1_seats:
                db.add(ShowSeat(show_id=s.id, venue_seat_id=vs.id, status="AVAILABLE", version=1))

        # Pricing for Show 3 & 4 (Metropolis Arena)
        for s in [show3, show4]:
            db.add_all([
                ShowPricing(show_id=s.id, category_id=v2_std.id, price=65.00),
                ShowPricing(show_id=s.id, category_id=v2_prem.id, price=120.00),
                ShowPricing(show_id=s.id, category_id=v2_vip.id, price=250.00),
            ])
            for vs in v2_seats:
                db.add(ShowSeat(show_id=s.id, venue_seat_id=vs.id, status="AVAILABLE", version=1))

        await db.commit()
        print("Database successfully seeded with demo accounts, venues, and shows!")


if __name__ == "__main__":
    asyncio.run(seed_database())
