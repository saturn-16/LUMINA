# Engineering Deep-Dive & Architecture Specification (`details.md`)

This document provides a comprehensive technical reference for the Ticket Booking System for Movies and Concerts, explaining the architectural decisions, database models, concurrency guarantees, lifecycle state transitions, and background reconciliation mechanisms implemented in the codebase.

---

## 1. Objective & Implemented Requirements

High-demand events (e.g. blockbuster movie premieres, stadium concert tours) face two severe operational bottlenecks:
1. **Concurrency Collisions**: Multiple buyers trying to checkout the exact same seat at the same millisecond.
2. **Inventory Waste on Cancellations**: Seats released late go unutilized while waitlisted fans have no automated mechanism to claim them.

### Implemented Capabilities
- **Decoupled Relational Seating Model**: Separation between static physical venue geometry (`venue_seats`) and per-show dynamic inventory (`show_seats`).
- **Deterministic Concurrency & Row-Level Locking**: Atomic holds and bookings governed by `SELECT ... FOR UPDATE` transactions at the database level.
- **Configurable Hold TTL & Dual Expiry**: 10-minute hold window enforced via async background worker (every 15s) and lazy validation on every access.
- **Category-Specific FIFO Waitlists**: Sold-out shows allow queueing by seat tier (e.g. VIP, Premium, Standard).
- **Automated Waitlist Reallocation**: Booking cancellations immediately lock released seats in `RESERVED_FOR_WAITLIST` state and issue time-limited exclusive offer tokens to the top waitlisted user.
- **Server-Side QR Code Tickets**: Base64 PNG QR generation encoding secure verification payloads; instant email dispatch with dev fallback.
- **Real-Time WebSocket Synchronization**: Broadcasts seat state transitions across all connected client maps.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `CUSTOMER`, `ORGANISER`, and `ADMIN` enforced server-side on every endpoint.

---

## 2. System Architecture

```
                                +--------------------------------------+
                                |        React + Vite Frontend         |
                                | (Tailwind CSS, SeatMap, HoldTimer)   |
                                +--------------------------------------+
                                            |               ^
                         REST API Requests  |               | Real-Time WS
                         (Axios + JWT Auth) |               | Broadcasts
                                            v               |
                                +--------------------------------------+
                                |           FastAPI Backend            |
                                |  (Auth, Seat, Booking, Waitlist)     |
                                +--------------------------------------+
                                  |              |                   |
                     Row-Level    |              | Async Expiry      | Ticket & Offer
                     Locks & CRUD |              | Background Loop   | SMTP / Dev Dispatch
                                  v              v                   v
                    +--------------------+ +-------------+ +--------------------+
                    |  PostgreSQL /      | | Expiry Loop | |  Email Service     |
                    |  Relational DB     | | (Every 15s) | |  & QR Generator    |
                    +--------------------+ +-------------+ +--------------------+
```

### Component Breakdown
1. **Frontend (`frontend/`)**: React 18 SPA built with Vite and Tailwind CSS. Contains the interactive visual 2D seat map, live hold countdown timers, ticket pass renderer, and role-aware dashboards.
2. **Backend Gateway (`backend/app/main.py`)**: Python FastAPI application exposing modular routers under `/api` and WebSocket endpoints under `/ws`.
3. **Database Layer (`backend/app/core/database.py`)**: SQLAlchemy 2.0 async engine with connection pooling and support for both PostgreSQL and SQLite.
4. **Background Expiry Worker (`backend/app/workers/expiry_worker.py`)**: Async task running in the application lifespan that periodically sweeps expired holds and offers.
5. **Real-time WebSockets Manager (`backend/app/core/websockets.py`)**: Channel manager maintaining active socket connections grouped by `show_id`.

---

## 3. Database Modeling & The Seat Lifecycle

### 3.1 Why Physical Seats and Show Seats are Decoupled
A common architectural flaw in naive ticketing systems is adding a `status` column directly onto a physical seat table. In reality, a physical chair in an auditorium exists permanently, while its availability is unique to a specific showtime.

- **`venue_seats`**: Static physical geometry belonging to a `venue` (`row_label`, `seat_number`, `grid_row`, `grid_col`, `category_id`).
- **`show_seats`**: Per-show inventory instantiated when an organiser schedules a show. Carries `(show_id, venue_seat_id, status, version)`.

### 3.2 ShowSeat State Machine

```
              +-------------------------------------------------------+
              |                                                       |
              v                                                       |
       [ AVAILABLE ]  <---------------+                               |
              |                       | (Hold Expired / Released)     | (Offer Expired &
              | (POST /api/holds)     |                               |  Queue Empty)
              v                       |                               |
          [ HELD ] -------------------+                               |
              |                                                       |
              | (POST /api/bookings)                                  |
              v                                                       |
         [ BOOKED ]                                                   |
              |                                                       |
              | (POST /api/bookings/{id}/cancel)                      |
              v                                                       |
   [ Booking Cancelled ]                                              |
              |                                                       |
              +---> [ Has Waitlist Customer? ]                        |
                           |                 |                        |
                   Yes     |                 | No                     |
                           v                 v                        |
             [ RESERVED_FOR_WAITLIST ]   [ AVAILABLE ]                |
                     |           |                                    |
     (Customer Claims) |           | (Offer Expired -> Reallocate)     |
                     v           +------------------------------------+
                 [ BOOKED ]
```

---

## 4. Concurrency & Transaction Guarantees

### 4.1 Step-by-Step Hold Race Condition Resolution

Consider two customers, **Alice** and **Bob**, who click on seat **A1** at the exact same millisecond:

```
Alice Request (Thread 1)                      Bob Request (Thread 2)
----------------------------------------      ----------------------------------------
1. POST /api/holds (Seat A1)                  1. POST /api/holds (Seat A1)
2. BEGIN TRANSACTION                          2. BEGIN TRANSACTION
3. SELECT show_seats WHERE id=A1 FOR UPDATE   3. SELECT show_seats WHERE id=A1 FOR UPDATE
   --> Locks Row A1 exclusively                  --> BLOCKED by Database Engine (waits)
4. Checks status == 'AVAILABLE' (True)            | (Waiting on lock...)
5. Sets status = 'HELD'                           | (Waiting on lock...)
6. Inserts seat_holds (expires in 10m)            | (Waiting on lock...)
7. COMMIT TRANSACTION                             | (Waiting on lock...)
   --> Releases exclusive lock on A1          4. Lock acquired! Reads Row A1
                                              5. Checks status == 'AVAILABLE' (False, it is 'HELD')
                                              6. ROLLBACK TRANSACTION
                                              7. Returns HTTP 409 Conflict: "Seat A1 is no longer available."
```

### 4.2 Why Double-Booking is Structurally Impossible
1. **Pessimistic Row-Level Locks**: `SELECT ... FOR UPDATE` forces serialized evaluation of seat availability within database transactions.
2. **Server-Side Expiry Authority**: Even if a malicious or lagging client attempts checkout, the server evaluates `expires_at <= now()` within the locked transaction.
3. **Database Unique Constraints**: `UNIQUE(show_id, venue_seat_id)` guarantees single instantiation of inventory, and `UNIQUE(booking_id, show_seat_id)` prevents multi-association.

---

## 5. Waitlist FIFO Queue & Time-Limited Offers

### 5.1 Joining the Waitlist
When a show or seat category sells out, customers submit `POST /api/waitlist/join`. The system validates that the customer is not already active in the queue, inserts a `waitlist_entries` record with `status = 'WAITING'` and records `created_at = utc_now()`. Ordering is strictly FIFO ($T_1 < T_2 < T_3$).

### 5.2 Cancellation Auto-Reallocation Pipeline
1. When a booking is cancelled (`POST /api/bookings/{id}/cancel`), the transaction locks the booking and released `show_seats`.
2. For each released seat, the service queries:
   ```sql
   SELECT * FROM waitlist_entries 
   WHERE show_id = :show_id AND category_id = :category_id AND status = 'WAITING'
   ORDER BY created_at ASC 
   LIMIT 1 
   FOR UPDATE;
   ```
3. If an eligible entry exists:
   - `show_seats.status` is set to `RESERVED_FOR_WAITLIST`.
   - `waitlist_entries.status` is set to `OFFERED`.
   - A `waitlist_offers` record is inserted with a unique `offer_token` and `expires_at = now() + 600s`.
   - An email is dispatched with the claim URL: `/waitlist/claim?token={offer_token}`.
4. If no waitlist entries exist:
   - `show_seats.status` transitions to `AVAILABLE`.

### 5.3 Offer Expiry Cascade
If the recipient fails to claim the offer within 10 minutes:
- The background worker marks the offer `EXPIRED` and the waitlist entry `EXPIRED`.
- It immediately invokes `process_released_seat()`, querying the next FIFO customer in line and issuing a new offer.
- If the waitlist queue is exhausted, the seat is returned to `AVAILABLE`.

---

## 6. Server-Side QR Tickets & Email Delivery

### 6.1 QR Code Security Design
Raw database credentials or personal customer data are never embedded in the QR payload. Instead, the server encodes a structured JSON document:
```json
{
  "ref": "TKT-20260822-A8B9C2D1",
  "event": "Interstellar: 10th Anniversary IMAX 70mm",
  "venue": "Grand Cinema Dolby Hall",
  "show_time": "2026-08-23T20:00:00Z",
  "customer": "customer@ticketbooking.com",
  "seats": ["A1", "A2"],
  "total_amount": 76.00
}
```
The QR code is generated server-side as a PNG byte buffer and stored as a base64 Data URI on the `Booking` record.

### 6.2 Email Dispatch with Dev Logging Fallback
- In production, emails are delivered over SMTP with TLS encryption via `smtplib` and MIME multipart formatting.
- In local development or test environments without SMTP credentials, the email service logs the full email subject, recipient, and formatted HTML body to `stdout`, allowing end-to-end verification without external dependencies.

---

## 7. Role-Based Access Control (RBAC)

| Endpoint Group | `CUSTOMER` | `ORGANISER` | `ADMIN` |
| :--- | :---: | :---: | :---: |
| Browse Events & Shows (`GET /api/events`, `GET /api/shows`) | Allowed | Allowed | Allowed |
| Place Holds & Book Tickets (`POST /api/holds`, `POST /api/bookings`) | Allowed | Allowed | Allowed |
| View / Cancel Own Bookings (`GET /api/bookings`, `POST /api/bookings/{id}/cancel`) | Own Only | Own Only | All |
| Join & Claim Waitlist (`POST /api/waitlist/join`, `POST /api/waitlist/claim`) | Allowed | Allowed | Allowed |
| Create Events & Schedule Shows (`POST /api/organiser/events`, `POST /api/organiser/shows`) | Blocked (403) | Own Events | All |
| Organiser Revenue Analytics (`GET /api/organiser/analytics`) | Blocked (403) | Own Events | All |
| Configure Venues & Physical Layouts (`POST /api/admin/venues`) | Blocked (403) | Blocked (403) | Allowed |
| System Stats (`GET /api/admin/stats`) | Blocked (403) | Blocked (403) | Allowed |

---

## 8. Testing & Validation Strategy

The backend includes a comprehensive test suite executed with `pytest` and `httpx.AsyncClient`:
1. **`test_auth.py`**: Validates registration, duplicate email rejection, JWT creation, profile lookups, and RBAC endpoint guards.
2. **`test_holds.py`**: Validates single/multi-seat holds, duplicate hold rejections, and manual release.
3. **`test_concurrency.py`**: Executes simultaneous asynchronous requests (`asyncio.gather`) competing for the exact same seat, asserting that exactly 1 request succeeds (`201`) and all others receive `409 Conflict`.
4. **`test_bookings.py`**: Validates checkout from hold, server-side price calculation, converted hold reuse prevention, and QR generation.
5. **`test_cancellation_waitlist.py`**: Validates booking cancellation, automatic FIFO waitlist queue detection, offer token creation, and waitlist claim conversion to confirmed booking.

---

## 9. Deployment Architecture

- **Frontend**: Static SPA deployment on Vercel, Netlify, or Cloudflare Pages.
- **Backend**: FastAPI container deployed on Render, Railway, Fly.io, or AWS ECS with Uvicorn workers.
- **Database**: Managed PostgreSQL on Supabase, Render Postgres, or Neon.
