<div align="center">

# 🎟️ LUMINA
### Enterprise-Grade, High-Concurrency Live Experience & Ticketing Engine

[![Live Demo](https://img.shields.io/badge/Live_Demo-lumina--woad--eta.vercel.app-6366F1?style=for-the-badge&logo=vercel&logoColor=white)](https://lumina-woad-eta.vercel.app)
[![API Docs](https://img.shields.io/badge/Swagger_Docs-lumina--16hr.onrender.com-10B981?style=for-the-badge&logo=fastapi&logoColor=white)](https://lumina-16hr.onrender.com/docs)
[![Python 3.11](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](LICENSE)

<p align="center">
  <b>Deterministic Concurrency Control</b> • <b>10-Minute TTL Seat Holds</b> • <b>Real-Time WebSockets</b> • <b>FIFO Waitlist Reallocation</b> • <b>Server-Side Gate QR Delivery</b>
</p>

---

</div>

## 📌 Table of Contents
- [Why LUMINA Exists](#-why-lumina-exists)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Deep Dive: Concurrency & Atomicity Engine](#-deep-dive-concurrency--atomicity-engine)
- [FIFO Waitlist & Cancellation Reallocation Flow](#-fifo-waitlist--cancellation-reallocation-flow)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Database Schema (ERD)](#-database-schema-erd)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
  - [Environment Variables](#environment-variables-reference)
- [Automated Testing Suite](#-automated-testing-suite)
- [API Reference](#-api-reference)
- [Deployment Topology](#-deployment-topology)
- [Repository Structure](#-repository-structure)
- [Roadmap](#-roadmap)
- [Contributing & License](#-contributing--license)

---

## ⚡ Why LUMINA Exists

When high-demand events (e.g., stadium concert tours, film festival premieres) go on sale, naive ticketing architectures catastrophically fail in three distinct ways:

1. **Race Conditions & Double-Booking**: Hundreds of concurrent HTTP requests read `status = AVAILABLE` for the same front-row seat at the exact same millisecond. Without rigorous database transaction isolation, multiple payment transactions succeed for a single physical seat.
2. **Phantom Holds & Inventory Freezes**: Users hoard seats in checkout carts and abandon them, creating artificial sellouts while seats remain unsold.
3. **Queue Injustice**: When a customer cancels a ticket 10 minutes before showtime, scalper bots immediately snipe the inventory before genuine fans can even refresh the page.

**LUMINA** was built to solve these distributed systems challenges deterministically:
- **Zero double-booking** guaranteed via ACID-compliant row-level pessimistic locking (`SELECT ... FOR UPDATE`).
- **Temporary Seat Holds with 10-Minute TTL** enforced by background reconciliation loops and lazy state sweeps.
- **Real-Time Seat Grid Synchronization** over WebSockets with zero-polling overhead.
- **Algorithmic FIFO Waitlist Auto-Reallocation** granting exclusive 10-minute claim tokens to queued customers on cancellation.
- **Server-Side QR Gate Passes** dispatched via transactional email pipelines (Resend API) directly to attendees.

---

## 📐 System Architecture

```mermaid
graph TD
    subgraph Client ["Client Layer (React 18 + Vite SPA)"]
        UI["Customer / Organiser / Admin Portals"]
        WS_Client["WebSocket Real-Time Listener"]
        Auth_Client["Firebase Google Auth + JWT State"]
    end

    subgraph CDN ["Edge & Routing"]
        Vercel["Vercel Edge Global CDN"]
    end

    subgraph Backend ["Application Layer (FastAPI ASGI Engine)"]
        API["RESTful Endpoints & RBAC Guards"]
        WS_Manager["WebSocket Connection Hub"]
        Worker["Async Background Expiry Worker (15s Tick)"]
        QR_Engine["Server-Side QR Generator"]
    end

    subgraph Concurrency ["Transactional Data Layer (SQLAlchemy 2.0 AsyncIO)"]
        DB[("PostgreSQL / Async AioSQLite")]
        PessimisticLock["SELECT ... FOR UPDATE Row Locks"]
    end

    subgraph External ["Third-Party Delivery & Auth"]
        FirebaseAuth["Firebase Authentication"]
        ResendAPI["Resend HTTPS Email API"]
        UniversalCDN["QR Image Delivery CDN"]
    end

    Vercel --> UI
    UI <-->|HTTPS REST API| API
    UI <-->|WSS Events| WS_Manager
    UI <-->|1-Click OAuth| FirebaseAuth
    FirebaseAuth -->|Token Exchange| API
    API --> PessimisticLock
    PessimisticLock --> DB
    Worker -->|Sweeps Expired Holds| DB
    Worker -->|Broadcasts State| WS_Manager
    WS_Manager -->|Push Updates| WS_Client
    API --> QR_Engine
    QR_Engine --> ResendAPI
    ResendAPI -->|Delivers Ticket Passcards| External
    UniversalCDN -->|Renders QR in Gmail/Outlook| External
```

---

## ✨ Key Features

### 💺 Dynamic Visual 2D Seat Map & Tier Pricing
- Interactive SVG-driven venue seating layout rendering exact physical rows and columns.
- Dynamic color-coded seat tiers:
  - 🟡 **VIP Tier** (`#F59E0B`) — Premium stage proximity, exclusive access.
  - 🟣 **Premium Tier** (`#6366F1`) — Optimal acoustics and sightlines.
  - 🟢 **Standard Tier** (`#10B981`) — Accessible general admission.
- Real-time status states: `AVAILABLE`, `HELD`, `BOOKED`, and `WAITLIST_RESERVED`.

### ⏱️ Concurrency-Safe Seat Holds (10-Minute TTL)
- Real-time countdown timer tracking hold expiration to the millisecond.
- Client state persistence survives page refreshes during checkout.
- Automated release back to public pool upon timer expiration.

### 🛡️ First-In-First-Out (FIFO) Waitlist Engine
- When a seating tier sells out, customers join an ordered queue.
- If a booking is cancelled, the released seat is instantly locked for the next waitlisted user (`position = 1`).
- An exclusive 10-minute claim token and email alert are dispatched; if unclaimed, the system automatically escalates to the next queued fan.

### 📱 Server-Side QR Passcard & Direct Email Delivery
- Server-side cryptographic payload encoding booking reference, event title, venue geometry, seat assignments, and timestamp.
- Responsive dark luxury HTML email passcard with universal HTTPS QR rendering across Gmail, Apple Mail, and Outlook.
- Downloadable `[REF]_entry_qr.png` file attached to transactional confirmation emails.

### 📊 Organiser & Admin Control Towers
- **Organiser Portal**: Create events, configure auditoriums, customize tiered pricing, and track live gross revenue and seat occupancy rates.
- **Admin Command Center**: System health diagnostics, global user management, and emergency inventory overrides.

---

## 🔬 Deep Dive: Concurrency & Atomicity Engine

### The Problem: Why Naive Approaches Fail Under Load
- **Optimistic Locking (`version` columns)**: Under high contention (e.g., 200 users clicking seat `A-1` at `00:00:01`), 199 requests fail after full round-trip execution, creating massive database CPU churn and terrible user experience.
- **Application-Level Mutexes (Python `asyncio.Lock`)**: Fails completely in horizontally scaled environments with multiple worker processes (`uvicorn --workers 4`) or multi-instance containers, because locks are not shared across processes.
- **Distributed Redis Locks (Redlock)**: Adds operational complexity, network latency hops, and dual-state synchronization failure modes between cache and SQL store.

### The LUMINA Solution: Pessimistic Row-Level Database Locking
LUMINA uses **database-native row-level pessimistic locking** (`SELECT ... FOR UPDATE`) within isolated async transactions. The database engine itself serializes contending requests at the disk/page row level.

```python
# backend/app/services/seat_service.py

@classmethod
async def create_seat_hold(
    cls, db: AsyncSession, show_id: int, show_seat_ids: List[int], user_id: int
) -> Dict[str, Any]:
    # 1. Clean up any expired holds before evaluating state
    await cls.cleanup_expired_holds(db)

    # 2. Acquire exclusive pessimistic row locks on requested seat records
    stmt = (
        select(ShowSeat)
        .where(
            and_(
                ShowSeat.show_id == show_id,
                ShowSeat.id.in_(show_seat_ids),
            )
        )
        .options(
            joinedload(ShowSeat.venue_seat).joinedload(VenueSeat.category)
        )
        .with_for_update()  # <-- Forces PostgreSQL to lock candidate rows
    )
    result = await db.execute(stmt)
    locked_seats = result.scalars().all()

    # 3. Assert all requested seats exist
    if len(locked_seats) != len(show_seat_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or more selected seats were not found."
        )

    # 4. Strict state validation under lock
    for ss in locked_seats:
        if ss.status != "AVAILABLE":
            seat_label = f"{ss.venue_seat.row_label}{ss.venue_seat.seat_number}"
            # Contending request safely rejected with HTTP 409 Conflict
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Seat {seat_label} is no longer available (currently {ss.status.lower()})."
            )

    # 5. Atomically transition state to HELD with 10-minute TTL
    now = utc_now()
    expires_at = now + timedelta(seconds=settings.HOLD_TTL_SECONDS)
    hold_token = str(uuid.uuid4())

    for ss in locked_seats:
        ss.status = "HELD"
        new_hold = SeatHold(
            show_id=show_id,
            show_seat_id=ss.id,
            user_id=user_id,
            hold_token=hold_token,
            created_at=now,
            expires_at=expires_at,
            status="ACTIVE",
        )
        db.add(new_hold)

    # 6. Atomic Commit releases locks and guarantees consistency
    await db.commit()

    # 7. Broadcast real-time availability shift over WebSockets
    await ws_manager.broadcast_show_update(
        show_id,
        {"type": "SEATS_HELD", "seats": [s.id for s in locked_seats]}
    )
    return {"hold_token": hold_token, "expires_at": expires_at.isoformat()}
```

---

## 🔄 FIFO Waitlist & Cancellation Reallocation Flow

When high-demand tickets are cancelled, LUMINA executes an automated fair-reallocation pipeline:

```mermaid
sequenceDiagram
    autonumber
    actor Customer_A as Customer A
    participant API as FastAPI Backend Engine
    participant DB as Relational Database
    participant Worker as Expiry Background Worker
    actor Waitlist_User as Next Waitlisted Customer
    participant Email as Resend Email Service

    Customer_A ->> API: POST /api/bookings/{id}/cancel
    API ->> DB: Begin Transaction
    API ->> DB: Update Booking status = CANCELLED
    API ->> DB: Check Waitlist Queue for Show + Category (FIFO)

    alt Waitlist Queue is Active (User Found)
        API ->> DB: Mark Seat status = HELD (RESERVED_FOR_WAITLIST)
        API ->> DB: Create Claim Token (10-Min Expiry) for Waitlist_User
        API ->> DB: Commit Transaction
        API ->> Email: Dispatch "⚡ Seat Available from Waitlist" with Claim URL
        Email -->> Waitlist_User: Delivers 10-Minute Exclusive Claim Email
        
        alt User Claims Within 10 Minutes
            Waitlist_User ->> API: POST /api/waitlist/claim (with Token)
            API ->> DB: Convert to CONFIRMED Booking
            API ->> Email: Send Official Gate QR Passcard
        else Claim Window Expires (> 600s)
            Worker ->> DB: Sweep Expired Waitlist Offer
            Worker ->> DB: Escalate to Next Fan in Queue (Pos: 2)
            Worker ->> Email: Dispatch Alert to Next Waitlisted Customer
        end

    else Waitlist Queue is Empty
        API ->> DB: Revert Seat status = AVAILABLE
        API ->> DB: Commit Transaction
        API ->> API: Broadcast SEATS_RELEASED over WebSocket
    end
```

---

## 👥 Role-Based Access Control (RBAC)

LUMINA implements strict role-based separation enforced at both the API dependency layer (`deps.py`) and UI routing layer (`ProtectedRoute.jsx`):

| Capability / Resource | `CUSTOMER` | `ORGANISER` | `ADMIN` |
| :--- | :---: | :---: | :---: |
| Browse Live Catalogue & Search Events | ✅ | ✅ | ✅ |
| View Interactive 2D Seat Maps | ✅ | ✅ | ✅ |
| Place 10-Minute Seat Holds & Checkout | ✅ | ❌ | ❌ |
| Personal Ticket Wallet with Gate QR Codes | ✅ | ❌ | ✅ |
| Join & Claim FIFO Waitlist Positions | ✅ | ❌ | ❌ |
| Cancel Bookings & Trigger Auto-Reallocation | ✅ (Own) | ❌ | ✅ (All) |
| Create Events, Venues & Schedule Shows | ❌ | ✅ | ✅ |
| Configure Tiered Seat Pricing (VIP/Prem/Std) | ❌ | ✅ | ✅ |
| View Sales Analytics, Revenue & Capacity | ❌ | ✅ | ✅ |
| Platform-Wide User & Role Administration | ❌ | ❌ | ✅ |
| System Health Diagnostics & Overrides | ❌ | ❌ | ✅ |

---

## 🗄️ Database Schema (ERD)

```mermaid
erDiagram
    USERS ||--o{ EVENTS : organizes
    USERS ||--o{ BOOKINGS : places
    USERS ||--o{ SEAT_HOLDS : holds
    USERS ||--o{ WAITLIST : queues
    
    VENUES ||--o{ SEAT_CATEGORIES : defines
    VENUES ||--o{ VENUE_SEATS : contains
    SEAT_CATEGORIES ||--o{ VENUE_SEATS : categorizes
    
    EVENTS ||--o{ SHOWS : schedules
    VENUES ||--o{ SHOWS : hosts
    
    SHOWS ||--o{ SHOW_PRICING : prices
    SEAT_CATEGORIES ||--o{ SHOW_PRICING : sets_rate
    
    SHOWS ||--o{ SHOW_SEATS : instantiates
    VENUE_SEATS ||--o{ SHOW_SEATS : maps_to
    
    SHOW_SEATS ||--o{ SEAT_HOLDS : locked_by
    SHOWS ||--o{ BOOKINGS : books_for
    
    BOOKINGS ||--o{ BOOKING_SEATS : itemizes
    SHOW_SEATS ||--o{ BOOKING_SEATS : reserves
    
    SHOWS ||--o{ WAITLIST : queues_for
    SEAT_CATEGORIES ||--o{ WAITLIST : targets

    USERS {
        int id PK
        string email UK
        string full_name
        string role "CUSTOMER | ORGANISER | ADMIN"
        string hashed_password
        datetime created_at
    }

    EVENTS {
        int id PK
        string title
        string description
        string category "CONCERT | MOVIE | THEATRE"
        int duration_minutes
        string banner_url
        int organiser_id FK
    }

    VENUES {
        int id PK
        string name
        string address
        string city
        int total_rows
        int total_cols
    }

    SEAT_CATEGORIES {
        int id PK
        int venue_id FK
        string name "VIP | PREMIUM | STANDARD"
        string color_code
        float base_price
    }

    VENUE_SEATS {
        int id PK
        int venue_id FK
        int category_id FK
        string row_label
        int seat_number
        int grid_row
        int grid_col
    }

    SHOWS {
        int id PK
        int event_id FK
        int venue_id FK
        datetime start_time
        datetime end_time
    }

    SHOW_SEATS {
        int id PK
        int show_id FK
        int venue_seat_id FK
        string status "AVAILABLE | HELD | BOOKED"
    }

    SEAT_HOLDS {
        int id PK
        int show_id FK
        int show_seat_id FK
        int user_id FK
        string hold_token UK
        datetime expires_at
        string status "ACTIVE | EXPIRED | CONVERTED"
    }

    BOOKINGS {
        int id PK
        string booking_reference UK
        int user_id FK
        int show_id FK
        float total_amount
        string status "CONFIRMED | CANCELLED"
        string qr_code_data
        datetime created_at
    }

    BOOKING_SEATS {
        int id PK
        int booking_id FK
        int show_seat_id FK
        float price_paid
    }

    WAITLIST {
        int id PK
        int show_id FK
        int category_id FK
        int user_id FK
        string status "QUEUED | OFFERED | EXPIRED | CONVERTED"
        int position
        string claim_token UK
        datetime expires_at
    }
```

---

## 🛠️ Tech Stack

| Layer | Technologies | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, Vite | High-performance SPA with optimized DOM diffing and instant HMR. |
| **Styling & Motion** | Tailwind CSS, Framer Motion | High-contrast dark luxury aesthetic with fluid seat selection physics. |
| **Icons & UI Kit** | Lucide React | Lightweight, tree-shakeable iconography. |
| **Backend API** | Python 3.11, FastAPI (ASGI) | Async I/O throughput, automatic OpenAPI documentation, strict Pydantic v2 validation. |
| **ORM & Database** | SQLAlchemy 2.0 AsyncIO, PostgreSQL / AioSQLite | Native async database driver with explicit row locking (`with_for_update`). |
| **Authentication** | Firebase Authentication + PyJWT (`HS256`) | 1-Click Google Popup Authentication with custom signed RBAC tokens. |
| **Real-Time Layer** | Native ASGI WebSockets | Push-based updates (`SEATS_HELD`, `SEATS_BOOKED`) with zero polling latency. |
| **Email & Delivery** | Resend API, Python `qrcode` | Direct transactional HTTPS API delivery of HTML passcards with embedded QR codes. |
| **Testing** | Pytest, Pytest-AsyncIO, HTTPX | Async unit and end-to-end concurrency simulation test suite. |

---

## 🚀 Getting Started

### Prerequisites
- **Python**: `>= 3.11`
- **Node.js**: `>= 18.0.0` & **npm**: `>= 9.0.0`
- **Git**

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/saturn-16/LUMINA.git
cd LUMINA

# Create and activate virtual environment
python -m venv .venv

# On Linux/macOS:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Create local environment configuration
cp .env.example .env

# Run database migrations and seed realistic demo catalogue
python -m backend.seed_data

# Start FastAPI ASGI server
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
Backend API will be live at `http://localhost:8000`. Interactive Swagger UI available at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

```bash
# In a new terminal window, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Client application will be running at `http://localhost:5173`.

---

### Environment Variables Reference

#### Backend Configuration (`.env`)
```ini
# Application
PROJECT_NAME="Lumina Live Experiences"
SECRET_KEY="your-secure-random-secret-key-min-32-chars"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Connection (PostgreSQL for production, SQLite for local dev)
DATABASE_URL="sqlite+aiosqlite:///./ticket_booking.db"
SYNC_DATABASE_URL="sqlite:///./ticket_booking.db"

# Business Logic TTL (Seconds)
HOLD_TTL_SECONDS=600               # 10-minute temporary seat hold
WAITLIST_OFFER_TTL_SECONDS=600      # 10-minute waitlist claim window
EXPIRY_CLEANUP_INTERVAL_SECONDS=15 # Background reconciliation tick

# CORS & Client Origins
CORS_ORIGINS="http://localhost:5173,http://localhost:3000,https://lumina-woad-eta.vercel.app"
FRONTEND_URL="https://lumina-woad-eta.vercel.app"

# Email Delivery (Resend API)
RESEND_API_KEY="re_your_api_key_here"
RESEND_FROM_EMAIL="Lumina Tickets <onboarding@resend.dev>"

# Optional SMTP Fallback (Gmail / Brevo)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_TLS=True
SMTP_USER=""
SMTP_PASSWORD=""
```

#### Frontend Configuration (`frontend/.env`)
```ini
VITE_API_URL="https://lumina-16hr.onrender.com"

# Firebase Client Authentication
VITE_FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

---

## 🧪 Automated Testing Suite

LUMINA includes an automated asynchronous test suite verifying role authorization, transaction integrity, server-side pricing, and **genuine high-concurrency race condition simulations**:

```bash
# Run the entire test suite
pytest -v

# Run concurrency stress test specifically
pytest backend/tests/test_concurrency.py -v
```

### Concurrency Stress Test Validation
The concurrency test (`test_concurrency.py`) spawns parallel asynchronous clients attempting to hold the exact same seat within the exact same event loop cycle. It verifies:
- Exactly **ONE** client acquires the lock and receives **HTTP 201 Created**.
- All competing clients receive a clean **HTTP 409 Conflict** with descriptive error payloads.
- Zero state corruption or double-hold generation occurs in the underlying storage layer.

---

## 📡 API Reference

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register customer, organiser, or admin | Public |
| `POST` | `/api/auth/login` | Authenticate with email & password for JWT | Public |
| `POST` | `/api/auth/firebase-login` | Synchronize & provision Firebase Google accounts | Public |
| `GET` | `/api/events` | Browse and filter active live experiences | Public |
| `GET` | `/api/events/{id}` | Retrieve event details and scheduled showtimes | Public |
| `GET` | `/api/shows/{id}/seats` | Real-time seat map grid with dynamic statuses | Public |
| `POST` | `/api/holds` | Acquire atomic 10-minute hold on seats (`TTL`) | `CUSTOMER` |
| `POST` | `/api/holds/release` | Explicitly release active hold back to available | `CUSTOMER` |
| `POST` | `/api/bookings/confirm` | Finalize booking and dispatch QR ticket email | `CUSTOMER` |
| `GET` | `/api/bookings/my` | List authenticated user's digital ticket wallet | `CUSTOMER` |
| `POST` | `/api/bookings/{ref}/resend-email` | Re-dispatch ticket passcard and QR code to inbox | `CUSTOMER` / `ADMIN` |
| `POST` | `/api/bookings/{id}/cancel` | Cancel booking and trigger FIFO waitlist offer | `CUSTOMER` / `ADMIN` |
| `POST` | `/api/waitlist/join` | Join FIFO waitlist queue for sold-out category | `CUSTOMER` |
| `POST` | `/api/waitlist/claim` | Claim and book time-limited waitlist offer | `CUSTOMER` |
| `POST` | `/api/organiser/events` | Create new live experience listing | `ORGANISER` / `ADMIN` |
| `POST` | `/api/organiser/shows` | Schedule showtime and configure tier pricing | `ORGANISER` / `ADMIN` |
| `GET` | `/api/organiser/analytics` | View revenue, tickets sold, and capacity rates | `ORGANISER` / `ADMIN` |
| `GET` | `/api/test-email` | Live transactional email pipeline diagnostics | Public / Admin |
| `WS` | `/ws/shows/{id}` | Real-time seat status WebSocket stream | Public |

---

## ☁️ Deployment Topology

LUMINA is deployed across a decoupled multi-cloud architecture:

```
[ Frontend (Vercel Global Edge) ] ── HTTPS/REST ──> [ Backend API (Render Web Service) ]
                                  ── WebSockets  ──> [ Native ASGI WS Hub ]
                                  ── Auth State ───> [ Firebase Google Auth ]
                                                       │
                                                       ├── Database: PostgreSQL
                                                       └── Delivery: Resend HTTPS API
```

1. **Frontend (Vercel)**:
   - Configured with SPA rewrite rules in `vercel.json` to route client-side deep links (`/shows/:id/seats`, `/confirmation`) seamlessly.
2. **Backend (Render Web Service)**:
   - Hosted as an asynchronous Python ASGI web service executing `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`.
   - Continuous integration automatically triggers deployments on push to `main`.
3. **WebSockets (Render Native ASGI)**:
   - Client directly connects to persistent WebSockets (`wss://lumina-16hr.onrender.com/ws/shows/{id}`) to bypass serverless connection limitations.

---

## 📂 Repository Structure

```
LUMINA/
├── backend/
│   ├── app/
│   │   ├── api/             # REST routing & WebSocket controllers
│   │   │   ├── admin.py     # Administrative diagnostics & user management
│   │   │   ├── auth.py      # Registration, login & Firebase synchronization
│   │   │   ├── bookings.py  # Checkout, cancellation & email resend
│   │   │   ├── deps.py      # JWT validation & RBAC permission guards
│   │   │   ├── events.py    # Public event catalogue & search
│   │   │   ├── holds.py     # Concurrency-safe seat hold endpoints
│   │   │   ├── organiser.py # Organiser event creation & sales analytics
│   │   │   ├── shows.py     # Showtime retrieval & seat map endpoints
│   │   │   ├── waitlist.py  # FIFO queue management & offer claims
│   │   │   └── websocket.py # Native WebSocket broadcasting hub
│   │   ├── core/            # System configuration, security & DB engine
│   │   │   ├── config.py    # Pydantic Settings schema & env loader
│   │   │   ├── database.py  # SQLAlchemy async engine & sessionmaker
│   │   │   ├── security.py  # Password hashing (bcrypt) & JWT issuance
│   │   │   └── websockets.py# In-memory WebSocket connection manager
│   │   ├── models/          # Relational SQLAlchemy ORM schemas
│   │   ├── schemas/         # Pydantic v2 request/response validation schemas
│   │   ├── services/        # Core business logic engines
│   │   │   ├── booking_service.py   # Atomic checkout & cancellation pipelines
│   │   │   ├── email_service.py     # Resend API & SMTP delivery engine
│   │   │   ├── qr_service.py        # Server-side QR generator
│   │   │   ├── seat_service.py      # Pessimistic row locking & hold engine
│   │   │   └── waitlist_service.py  # FIFO queue & auto-reallocation engine
│   │   ├── workers/         # Background reconciliation processes
│   │   │   └── expiry_worker.py     # 15s interval seat hold & waitlist cleaner
│   │   └── main.py          # FastAPI application entrypoint & lifecycle
│   ├── tests/               # Pytest async test suite
│   ├── requirements.txt     # Python backend dependencies
│   └── seed_data.py         # Realistic demo seeder (events, venues, shows)
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (SeatMap, Navbar, Footer, Timer)
│   │   ├── context/         # AuthContext (Firebase + JWT synchronization)
│   │   ├── pages/           # Client views (SeatSelection, Checkout, Portals)
│   │   ├── services/        # Axios API client & WebSocket connector
│   │   ├── App.jsx          # React Router route tree with RBAC guards
│   │   └── main.jsx         # Client bootstrapping
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── vercel.json              # Vercel SPA routing rewrite rules
├── pytest.ini               # Pytest async configuration
├── .env.example             # Documented environment template
└── README.md                # Comprehensive project documentation
```

---

## 🗺️ Roadmap

- [ ] **Distributed Lock Engine (Redis / Redlock)**: Offload hold locking to distributed Redis clusters for horizontal multi-region scaling.
- [ ] **Payment Gateway Integration**: Direct Stripe & Razorpay webhook reconciliation with idempotent payment intent verification.
- [ ] **Dynamic Surge Pricing Algorithm**: ML-driven demand-based seat pricing adjustments based on real-time hold velocity and waitlist depth.
- [ ] **Apple Wallet & Google Wallet Passes**: Generate signed `.pkpass` files alongside existing HTML/QR passcards.

---

## 🤝 Contributing & License

Contributions, issues, and feature requests are welcome. Feel free to open a pull request or file an issue on GitHub.

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">

Built with engineering rigor by **[Gaurav Kumar (saturn-16)](https://github.com/saturn-16)**

[![GitHub](https://img.shields.io/badge/GitHub-saturn--16-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/saturn-16)

</div>
