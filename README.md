# TicketBox — Ticket Booking System for Movies & Concerts

A ticket booking platform for movies and concerts built with **React**, **FastAPI**, **SQLAlchemy**, and **PostgreSQL**. Features an interactive visual 2D seat map with real-time status updates, deterministic concurrency protection on temporary seat holds with Time-to-Live (TTL), automated First-In-First-Out (FIFO) waitlist reallocation on cancellations, and server-side QR ticket delivery.

---

## Key Features

- **Interactive 2D Visual Seat Map**: Rendered dynamically from venue geometry and show inventory with category tiers (Standard, Premium, VIP) and real-time status indicators (Available, Held, Selected, Booked, Waitlist Hold).
- **Deterministic Concurrency Protection**: Eliminates double-booking via database transactions and row-level locking (`SELECT ... FOR UPDATE`).
- **Temporary Seat Holds with TTL**: 10-minute hold countdown timer during checkout, with automated release on abandonment via background worker & lazy checks.
- **Automated Waitlist Reallocation**: Category-specific FIFO queues for sold-out events. Cancelling a booking instantly locks the released seat in `RESERVED_FOR_WAITLIST` and issues a time-limited offer to the next waitlisted customer.
- **Server-Side QR Code Tickets**: Secure verification payloads generated as QR codes and embedded on ticket passes; dispatched via email.
- **Real-Time WebSocket Updates**: Pushes seat status transitions instantly across all connected clients viewing a show.
- **Role-Based Portals**: Dedicated interfaces for Customers (browse, book, tickets, waitlist), Organisers (create listings, schedule shows, pricing, analytics), and Administrators (venue auditoriums, seat tiers, system stats).

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios, Native WebSockets.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, PyJWT, `passlib[bcrypt]`, `qrcode[pil]`.
- **Database**: PostgreSQL (Production) / SQLite (Zero-setup local development & testing).
- **Testing**: `pytest`, `pytest-asyncio`, `httpx`.

---

## Project Structure

```
ticket-booking/
├── backend/
│   ├── app/
│   │   ├── api/             # API routes (auth, events, shows, holds, bookings, waitlist, organiser, admin, ws)
│   │   ├── core/            # Config, database engine, security/JWT, websockets, utils
│   │   ├── models/          # SQLAlchemy relational models
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   ├── services/        # Business logic (seat holds, booking, waitlist, QR, email)
│   │   ├── workers/         # Background expiry reconciliation loop
│   │   └── main.py          # FastAPI application entrypoint & lifespan
│   ├── tests/               # Pytest suite (auth, holds, genuine concurrency, bookings, cancellation)
│   ├── requirements.txt     # Python backend dependencies
│   └── seed_data.py         # Realistic demo seeder (venues, movies, concerts, shows)
├── frontend/
│   ├── src/
│   │   ├── components/      # SeatMap, TicketCard, HoldTimer, Navbar, ProtectedRoute
│   │   ├── context/         # AuthContext
│   │   ├── pages/           # Home, EventDetail, SeatSelection, Checkout, Confirmation, Dashboard, Organiser, Admin, Login, Register
│   │   ├── services/        # API client & WebSocket connector
│   │   ├── App.jsx          # Route configuration
│   │   └── main.jsx         # App bootstrapping
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── system-design.md     # System design write-up (capped at 800 words, Mermaid diagram)
│   └── database-schema.md   # ER diagram, table schemas, and concurrency analysis
├── details.md               # Architecture deep-dive engineering document
├── .env.example             # Documented environment configuration
├── pytest.ini               # Pytest async configuration
└── README.md
```

---

## Local Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### 1. Backend Setup
```bash
# Navigate to workspace root
cd "ticket-booking"

# Install backend dependencies
pip install -r backend/requirements.txt

# Copy environment variables
cp .env.example .env

# Seed database with demo accounts, venues, and shows
python -m backend.seed_data
```

### 2. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Build or start development server
npm run dev
```

The frontend will run at `http://localhost:5173`.

### 3. Start Backend Server
```bash
# Run FastAPI server from workspace root
uvicorn backend.app.main:app --reload --port 8000
```
API Documentation (Swagger UI) is available at `http://localhost:8000/docs`.

---

## Demo Accounts

The database seeder preconfigures 3 role accounts:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@ticketbooking.com` | `customer123` | Book tickets, view QR passes, monitor waitlists |
| **Organiser** | `organiser@ticketbooking.com` | `organiser123` | Create events, schedule showtimes, tier pricing, revenue stats |
| **Admin** | `admin@ticketbooking.com` | `admin123` | Configure venues, row/column grids, system metrics |

*(Quick-login buttons are also provided on the Login page).*

---

## Running the Automated Test Suite

Run the full `pytest` suite including the **genuine concurrency test** simulating simultaneous seat hold attempts:

```bash
python -m pytest backend/tests/ -v
```

### Test Coverage Highlights:
- `test_auth.py`: Registration, duplicate prevention, JWT login, and RBAC endpoint guards.
- `test_holds.py`: Single/multi-seat holds, duplicate hold rejection, manual release.
- `test_concurrency.py`: **Spawns simultaneous async requests for the exact same seat; asserts exactly 1 succeeds (201) and all others receive clean HTTP 409 Conflict without data corruption.**
- `test_bookings.py`: Checkout from hold, server-side price calculation, converted hold reuse prevention, and QR generation.
- `test_cancellation_waitlist.py`: Booking cancellation, FIFO waitlist queue allocation, time-limited offer token creation, and offer conversion to booking.

---

## API Endpoints Overview

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new account | Public |
| `POST` | `/api/auth/login` | Authenticate & issue JWT | Public |
| `GET` | `/api/auth/me` | Current profile | Authenticated |
| `GET` | `/api/events` | Browse & search movies/concerts | Public |
| `GET` | `/api/events/{id}` | Event details & showtimes | Public |
| `GET` | `/api/shows/{id}/seats` | Real-time seat map with statuses | Public |
| `POST` | `/api/holds` | Acquire temporary hold on seats (TTL) | Customer |
| `POST` | `/api/holds/release` | Release active seat hold | Customer |
| `POST` | `/api/bookings` | Complete booking from hold token | Customer |
| `GET` | `/api/bookings` | List customer booking history | Customer |
| `GET` | `/api/bookings/{ref}` | Get booking & QR ticket pass | Customer / Admin |
| `POST` | `/api/bookings/{id}/cancel` | Cancel booking & trigger waitlist | Customer / Admin |
| `POST` | `/api/waitlist/join` | Join FIFO waitlist for sold-out show | Customer |
| `GET` | `/api/waitlist` | List user's waitlist entries & offers | Customer |
| `POST` | `/api/waitlist/claim` | Claim & book time-limited waitlist offer | Customer |
| `POST` | `/api/organiser/events` | Create new event listing | Organiser / Admin |
| `POST` | `/api/organiser/shows` | Schedule show & tier pricing | Organiser / Admin |
| `GET` | `/api/organiser/analytics`| Revenue, bookings, occupancy stats | Organiser / Admin |
| `POST` | `/api/admin/venues` | Create venue & generate physical seat grid | Admin |
| `GET` | `/api/admin/stats` | System-wide administrative stats | Admin |
| `WS` | `/ws/shows/{id}` | Real-time seat status subscription | Public |

---

## Deployment Guide

1. **Frontend (Vercel / Netlify)**:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Set environment variable `VITE_API_URL` to your hosted backend URL.

2. **Backend (Render / Railway / Fly.io)**:
   - Root Directory: `.`
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - Set environment variables (`DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`, `FRONTEND_URL`).
