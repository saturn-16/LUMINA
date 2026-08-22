import asyncio
from datetime import datetime, timezone, timedelta
from backend.app.core.database import async_engine, AsyncSessionLocal, Base
from backend.app.core.security import get_password_hash
from backend.app.models.user import User
from backend.app.models.venue import Venue
from backend.app.models.seat import SeatCategory, VenueSeat, ShowSeat
from backend.app.models.event import Event
from backend.app.models.show import Show, ShowPricing
from backend.app.models.booking import Booking, BookingSeat
from backend.app.services.qr_service import generate_qr_code_data_uri


async def seed_database():
    print("Initializing database tables...")
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print("Creating users & organisers...")
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
            full_name="Lumina Live India",
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
            full_name="Alice Sharma",
            role="CUSTOMER",
            created_at=datetime.now(timezone.utc),
        )
        db.add_all([admin, organiser, customer1, customer2])
        await db.flush()

        print("Creating 12 real Indian venues & auditoriums...")
        venues_config = [
            {"name": "PVR INOX IMAX Grand", "address": "Bandra Kurla Complex", "city": "Mumbai", "rows": 6, "cols": 8},
            {"name": "Jio World Garden Arena", "address": "BKC Avenue", "city": "Mumbai", "rows": 8, "cols": 10},
            {"name": "NCPA Tata Theatre", "address": "Nariman Point", "city": "Mumbai", "rows": 6, "cols": 8},
            {"name": "PVR Director's Cut", "address": "Ambience Mall, Vasant Kunj", "city": "Delhi", "rows": 6, "cols": 8},
            {"name": "Jawaharlal Nehru Stadium", "address": "Pragati Vihar", "city": "Delhi", "rows": 8, "cols": 10},
            {"name": "PVR Forum IMAX", "address": "Koramangala", "city": "Bengaluru", "rows": 6, "cols": 8},
            {"name": "Manpho Convention Grounds", "address": "Hebbal Outer Ring Rd", "city": "Bengaluru", "rows": 8, "cols": 10},
            {"name": "Prasad's Large Screen Multiplex", "address": "NTR Gardens, Necklace Rd", "city": "Hyderabad", "rows": 6, "cols": 8},
            {"name": "GMR Live Arena", "address": "Shamshabad", "city": "Hyderabad", "rows": 8, "cols": 10},
            {"name": "INOX Phoenix Marketcity", "address": "Viman Nagar", "city": "Pune", "rows": 6, "cols": 8},
            {"name": "Vagator Festival Grounds", "address": "Vagator Beach", "city": "Goa", "rows": 8, "cols": 10},
            {"name": "Sathyam Cinemas IMAX", "address": "Royapettah", "city": "Chennai", "rows": 6, "cols": 8},
            {"name": "South City INOX Luxe", "address": "Prince Anwar Shah Rd", "city": "Kolkata", "rows": 6, "cols": 8},
            {"name": "Raj Mandir Heritage Cinema", "address": "Bhagwan Das Rd", "city": "Jaipur", "rows": 6, "cols": 8},
            {"name": "Kochi Marine Drive Arena", "address": "Marine Drive", "city": "Kochi", "rows": 8, "cols": 10},
            {"name": "Narendra Modi Arena Stadium", "address": "Motera", "city": "Ahmedabad", "rows": 8, "cols": 10},
            {"name": "Elante INOX Luxe", "address": "Industrial Area Phase 1", "city": "Chandigarh", "rows": 6, "cols": 8},
            {"name": "Lucknow Heritage Auditorium", "address": "Gomti Nagar", "city": "Lucknow", "rows": 6, "cols": 8},
        ]

        venues_map = {}
        alphabet = "ABCDEFGH"

        for vc in venues_config:
            venue = Venue(
                name=vc["name"],
                address=vc["address"],
                city=vc["city"],
                total_rows=vc["rows"],
                total_cols=vc["cols"],
                created_at=datetime.now(timezone.utc),
            )
            db.add(venue)
            await db.flush()

            # Categories
            cat_std = SeatCategory(venue_id=venue.id, name="Standard", color_code="#3B82F6", tier_level=1)
            cat_prem = SeatCategory(venue_id=venue.id, name="Premium", color_code="#8B5CF6", tier_level=2)
            cat_vip = SeatCategory(venue_id=venue.id, name="VIP Recliner / Front Row", color_code="#F59E0B", tier_level=3)
            db.add_all([cat_std, cat_prem, cat_vip])
            await db.flush()

            # Seats
            seats = []
            for r in range(vc["rows"]):
                row_char = alphabet[r]
                cat = cat_vip if r < 2 else (cat_prem if r < 4 else cat_std)
                for c in range(vc["cols"]):
                    v_seat = VenueSeat(
                        venue_id=venue.id,
                        category_id=cat.id,
                        row_label=row_char,
                        seat_number=c + 1,
                        grid_row=r,
                        grid_col=c,
                        is_active=True,
                    )
                    db.add(v_seat)
                    seats.append(v_seat)

            await db.flush()
            venues_map[vc["name"]] = {
                "venue": venue,
                "categories": [cat_std, cat_prem, cat_vip],
                "seats": seats,
            }

        print("Creating 28 rich Indian events across Movies, Concerts, Theatre & Sports...")
        events_data = [
            # 1. Movies (12 Events) - Official TMDB 4K/IMAX Backdrops
            {
                "title": "Interstellar: 10th Anniversary IMAX 70mm",
                "type": "MOVIE",
                "city_venue": "PVR INOX IMAX Grand",
                "duration": 169,
                "banner": "https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
                "desc": "Christopher Nolan's masterpiece returns to the big screen in stunning 70mm IMAX. Journey through space and time to save human civilization.",
                "prices": [399.0, 599.0, 899.0],
            },
            {
                "title": "Inception: Ultimate Nolan 4K Experience",
                "type": "MOVIE",
                "city_venue": "PVR Director's Cut",
                "duration": 148,
                "banner": "https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
                "desc": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
                "prices": [349.0, 499.0, 799.0],
            },
            {
                "title": "Oppenheimer: The 70mm Screenings",
                "type": "MOVIE",
                "city_venue": "PVR INOX IMAX Grand",
                "duration": 180,
                "banner": "https://image.tmdb.org/t/p/w1280/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg",
                "desc": "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
                "prices": [450.0, 650.0, 950.0],
            },
            {
                "title": "Dune: Part Two (IMAX Special Edition)",
                "type": "MOVIE",
                "city_venue": "PVR Forum IMAX",
                "duration": 166,
                "banner": "https://image.tmdb.org/t/p/w1280/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
                "desc": "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
                "prices": [399.0, 599.0, 899.0],
            },
            {
                "title": "The Dark Knight: Trilogy Night",
                "type": "MOVIE",
                "city_venue": "Prasad's Large Screen Multiplex",
                "duration": 152,
                "banner": "https://image.tmdb.org/t/p/w1280/dqK9Hag1054tghRQSqLSfrkvQnA.jpg",
                "desc": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological tests of his ability to fight injustice.",
                "prices": [299.0, 449.0, 699.0],
            },
            {
                "title": "Avatar: The Way of Water 3D HFR",
                "type": "MOVIE",
                "city_venue": "Sathyam Cinemas IMAX",
                "duration": 192,
                "banner": "https://image.tmdb.org/t/p/w1280/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg",
                "desc": "Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na'vi race.",
                "prices": [349.0, 499.0, 750.0],
            },
            {
                "title": "Whiplash: 10th Anniversary Director's Cut",
                "type": "MOVIE",
                "city_venue": "INOX Phoenix Marketcity",
                "duration": 107,
                "banner": "https://image.tmdb.org/t/p/w1280/eSVvx8xys2NuFhl8fevXt41wX7v.jpg",
                "desc": "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student's potential.",
                "prices": [249.0, 399.0, 599.0],
            },
            {
                "title": "The Grand Budapest Hotel: Curated Screening",
                "type": "MOVIE",
                "city_venue": "South City INOX Luxe",
                "duration": 99,
                "banner": "https://image.tmdb.org/t/p/w1280/9udCLTxTFl28RxnK8Q05E154ZGa.jpg",
                "desc": "A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy in the hotel's glorious years under an exceptional concierge.",
                "prices": [249.0, 399.0, 599.0],
            },
            {
                "title": "Spirited Away: Studio Ghibli Festival",
                "type": "MOVIE",
                "city_venue": "Raj Mandir Heritage Cinema",
                "duration": 125,
                "banner": "https://image.tmdb.org/t/p/original/mSDsSDwaP3E7dEfUPWy4J0djt4O.jpg",
                "desc": "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits, and where humans are changed into beasts.",
                "prices": [249.0, 349.0, 499.0],
            },
            {
                "title": "The Shawshank Redemption: Remastered 4K",
                "type": "MOVIE",
                "city_venue": "Kochi Marine Drive Arena",
                "duration": 142,
                "banner": "https://image.tmdb.org/t/p/w1280/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
                "desc": "A banker convicted of uxoricide forms a friendship over a quarter of a century with a hardened convict, while maintaining his innocence and trying to remain hopeful through simple compassion.",
                "prices": [199.0, 299.0, 499.0],
            },
            {
                "title": "Blade Runner 2049: Cyberpunk IMAX Night",
                "type": "MOVIE",
                "city_venue": "Narendra Modi Arena Stadium",
                "duration": 164,
                "banner": "https://image.tmdb.org/t/p/w1280/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
                "desc": "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
                "prices": [299.0, 499.0, 799.0],
            },
            {
                "title": "Spider-Man: Across the Spider-Verse Live in Concert",
                "type": "MOVIE",
                "city_venue": "PVR INOX IMAX Grand",
                "duration": 140,
                "banner": "https://image.tmdb.org/t/p/w1280/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
                "desc": "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
                "prices": [399.0, 599.0, 899.0],
            },

            # 2. Concerts & Music Festivals (10 Events)
            {
                "title": "Arijit Singh Live: India Arena Tour",
                "type": "CONCERT",
                "city_venue": "Jio World Garden Arena",
                "duration": 180,
                "banner": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80",
                "desc": "India's undisputed voice of emotion performs his biggest romantic anthems and soul-stirring melodies with a 50-piece grand symphony orchestra.",
                "prices": [999.0, 1999.0, 3999.0],
            },
            {
                "title": "Coldplay: Music of the Spheres India Tour",
                "type": "CONCERT",
                "city_venue": "Narendra Modi Arena Stadium",
                "duration": 150,
                "banner": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&auto=format&fit=crop&q=80",
                "desc": "Experience Coldplay's spectacular stadium show featuring global hits, sustainable stage design, immersive LED wristbands, and special guests.",
                "prices": [1499.0, 2999.0, 6499.0],
            },
            {
                "title": "Hans Zimmer Live: World of Symphonic Cinema",
                "type": "CONCERT",
                "city_venue": "Manpho Convention Grounds",
                "duration": 140,
                "banner": "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80",
                "desc": "A breathtaking musical journey performing iconic scores from Gladiator, Inception, The Dark Knight, Dune, and The Lion King with a full orchestra.",
                "prices": [1299.0, 2499.0, 4999.0],
            },
            {
                "title": "Sunburn Festival Goa 2026",
                "type": "CONCERT",
                "city_venue": "Vagator Festival Grounds",
                "duration": 360,
                "banner": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
                "desc": "Asia's premier electronic music festival returns to Vagator Beach featuring 4 massive stages, world-class DJs, fire pyrotechnics, and coastal sunset vibes.",
                "prices": [1999.0, 3499.0, 7999.0],
            },
            {
                "title": "Bacardi NH7 Weekender: Multi-Genre Festival",
                "type": "CONCERT",
                "city_venue": "INOX Phoenix Marketcity",
                "duration": 300,
                "banner": "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&auto=format&fit=crop&q=80",
                "desc": "The happiest music festival featuring indie singer-songwriters, rock legends, hip-hop collectives, and immersive art installations.",
                "prices": [1499.0, 2499.0, 4499.0],
            },
            {
                "title": "Prateek Kuhad: Silhouettes India Tour",
                "type": "CONCERT",
                "city_venue": "Jawaharlal Nehru Stadium",
                "duration": 120,
                "banner": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&auto=format&fit=crop&q=80",
                "desc": "An intimate evening with Prateek Kuhad performing poetic acoustic hits like 'Cold/mess', 'Kasoor', and brand-new songs under open skies.",
                "prices": [799.0, 1499.0, 2499.0],
            },
            {
                "title": "Diljit Dosanjh: Dil-Luminati India Tour",
                "type": "CONCERT",
                "city_venue": "Elante INOX Luxe",
                "duration": 150,
                "banner": "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&auto=format&fit=crop&q=80",
                "desc": "High-octane Punjabi energy, iconic beats, and unmatched charisma. Join Diljit Dosanjh in an electrifying live concert.",
                "prices": [1299.0, 2499.0, 5999.0],
            },
            {
                "title": "Sufi & Qawwali Night with Rahat Fateh Ali Khan",
                "type": "CONCERT",
                "city_venue": "Lucknow Heritage Auditorium",
                "duration": 180,
                "banner": "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&auto=format&fit=crop&q=80",
                "desc": "Immerse your spirit in transcendent Sufi melodies, classical harmonies, and timeless Qawwalis in the historic heart of Lucknow.",
                "prices": [699.0, 1299.0, 2999.0],
            },
            {
                "title": "Anuv Jain: Guldasta Acoustic Tour",
                "type": "CONCERT",
                "city_venue": "Raj Mandir Heritage Cinema",
                "duration": 120,
                "banner": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&auto=format&fit=crop&q=80",
                "desc": "Sing along to 'Baarishein', 'Alag Aasmaan', and 'Husn' with Anuv Jain in a warm acoustic candlelit setting.",
                "prices": [599.0, 999.0, 1899.0],
            },
            {
                "title": "EDM Arena with Martin Garrix & Friends",
                "type": "CONCERT",
                "city_venue": "GMR Live Arena",
                "duration": 240,
                "banner": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
                "desc": "World No. 1 DJ Martin Garrix brings progressive house bangers, state-of-the-art laser arrays, and relentless festival energy to Hyderabad.",
                "prices": [1499.0, 2499.0, 4999.0],
            },

            # 3. Theatre & Performing Arts (3 Shows)
            {
                "title": "Mughal-e-Azam: The Grand Broadway-Style Musical",
                "type": "THEATRE",
                "city_venue": "NCPA Tata Theatre",
                "duration": 150,
                "banner": "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&auto=format&fit=crop&q=80",
                "desc": "Directed by Feroz Abbas Khan with Manish Malhotra costumes and live Kathak dancers performing the immortal saga of Salim and Anarkali.",
                "prices": [750.0, 1500.0, 3500.0],
            },
            {
                "title": "The Phantom of the Opera: West End Premiere",
                "type": "THEATRE",
                "city_venue": "NCPA Tata Theatre",
                "duration": 160,
                "banner": "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=1200&auto=format&fit=crop&q=80",
                "desc": "Andrew Lloyd Webber's timeless masterpiece featuring the iconic falling chandelier, lavish sets, and hauntingly beautiful vocal performances.",
                "prices": [999.0, 1999.0, 4500.0],
            },
            {
                "title": "Zakir Khan Live: Tathastu & New Specials",
                "type": "THEATRE",
                "city_venue": "South City INOX Luxe",
                "duration": 90,
                "banner": "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&auto=format&fit=crop&q=80",
                "desc": "The 'Sakht Launda' returns with his signature heartwarming humor, relatable storytelling, and sharp comedic observations.",
                "prices": [499.0, 899.0, 1499.0],
            },

            # 4. Sports & Live Stadiums (3 Events)
            {
                "title": "T20 Championship Grand Final: India vs Australia",
                "type": "SPORTS",
                "city_venue": "Narendra Modi Arena Stadium",
                "duration": 220,
                "banner": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80",
                "desc": "The biggest cricket clash of the year! 100,000 roaring fans witnessing high-intensity sixes, yorkers, and trophy glory under stadium floodlights.",
                "prices": [799.0, 1999.0, 4999.0],
            },
            {
                "title": "Indian Super League Championship Final",
                "type": "SPORTS",
                "city_venue": "Kochi Marine Drive Arena",
                "duration": 120,
                "banner": "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80",
                "desc": "Electric football fever! Watch India's top football clubs battle for the prestigious championship trophy.",
                "prices": [299.0, 699.0, 1499.0],
            },
            {
                "title": "Pro Kabaddi League: All-Stars Mega Clash",
                "type": "SPORTS",
                "city_venue": "Sathyam Cinemas IMAX",
                "duration": 90,
                "banner": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&auto=format&fit=crop&q=80",
                "desc": "Fast-paced raids, bone-crushing tackles, and pure athletic intensity in this high-stakes league clash.",
                "prices": [249.0, 499.0, 999.0],
            },
        ]

        now = datetime.now(timezone.utc)

        for i, ed in enumerate(events_data):
            event = Event(
                organiser_id=organiser.id,
                title=ed["title"],
                description=ed["desc"],
                event_type=ed["type"],
                banner_url=ed["banner"],
                duration_minutes=ed["duration"],
                created_at=now - timedelta(days=i * 2),
            )
            db.add(event)
            await db.flush()

            venue_info = venues_map.get(ed["city_venue"]) or list(venues_map.values())[0]
            venue_obj = venue_info["venue"]
            cats = venue_info["categories"]
            seats = venue_info["seats"]

            # Schedule 2 upcoming showtimes for each event (e.g. today, tomorrow, next week)
            for s_idx in range(2):
                show_start = now + timedelta(days=1 + (i % 7) + (s_idx * 3), hours=14 + (s_idx * 4))
                show = Show(
                    event_id=event.id,
                    venue_id=venue_obj.id,
                    start_time=show_start,
                    end_time=show_start + timedelta(minutes=ed["duration"]),
                    status="SCHEDULED",
                    created_at=now,
                )
                db.add(show)
                await db.flush()

                # Pricing
                for cat_idx, cat in enumerate(cats):
                    price_val = ed["prices"][min(cat_idx, len(ed["prices"]) - 1)]
                    db.add(ShowPricing(show_id=show.id, category_id=cat.id, price=price_val))

                # Inventory
                # For event index 3 (Dune) & 15 (Sunburn) make show 1 sold out or few seats left for demo realism
                is_sold_out_demo = (i == 15 and s_idx == 0)
                is_few_seats_demo = (i == 3 and s_idx == 0)

                created_show_seats = []
                for s_num, vs in enumerate(seats):
                    seat_status = "AVAILABLE"
                    if is_sold_out_demo:
                        seat_status = "BOOKED"
                    elif is_few_seats_demo and s_num > 5:
                        seat_status = "BOOKED"

                    ss = ShowSeat(show_id=show.id, venue_seat_id=vs.id, status=seat_status, version=1)
                    db.add(ss)
                    created_show_seats.append(ss)

                await db.flush()

                # For event 12 (Arijit Singh) and event 0 (Interstellar), book first 2 seats for customer1 demo account
                if (i == 12 or i == 0) and s_idx == 0:
                    created_show_seats[0].status = "BOOKED"
                    created_show_seats[1].status = "BOOKED"
                    ref_code = f"LMN-{'ARJ7' if i == 12 else 'INT9'}-8F92"
                    qr_uri = generate_qr_code_data_uri({
                        "booking_reference": ref_code,
                        "event_title": ed["title"],
                        "venue": ed["city_venue"],
                        "seats": ["A1", "A2"],
                        "holder": customer1.full_name,
                    })
                    demo_booking = Booking(
                        booking_reference=ref_code,
                        user_id=customer1.id,
                        show_id=show.id,
                        total_amount=round(ed["prices"][2] * 2, 2),
                        status="CONFIRMED",
                        qr_code_data=qr_uri,
                        created_at=now - timedelta(days=2),
                    )
                    db.add(demo_booking)
                    await db.flush()

                    db.add_all([
                        BookingSeat(booking_id=demo_booking.id, show_seat_id=created_show_seats[0].id, price_paid=ed["prices"][2]),
                        BookingSeat(booking_id=demo_booking.id, show_seat_id=created_show_seats[1].id, price_paid=ed["prices"][2]),
                    ])

        await db.commit()
        print("Database successfully seeded with 28 India-wide events across Movies, Concerts, Theatre, and Sports!")


if __name__ == "__main__":
    asyncio.run(seed_database())
