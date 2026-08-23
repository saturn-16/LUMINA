# LUMINA — System Design: Seat Hold, Concurrency, and Waitlist Engine

## 1. Seat Hold & TTL Mechanism

When a customer selects seats for a show, the backend does not immediately book them — it places a **temporary hold**. Each hold is represented by a `SeatHolds` row containing `show_seat_id`, `user_id`, a unique `hold_token`, an `expires_at` timestamp set to `now() + 600s`, and a `status` field (`ACTIVE`, `EXPIRED`, `CONVERTED`). The corresponding `ShowSeats.status` transitions from `AVAILABLE` to `HELD` in the same transaction.

This TTL model exists because ticketing systems must reserve inventory long enough for a user to complete payment, without letting abandoned carts permanently lock out real demand. Ten minutes balances checkout friction against seat starvation.

Expiry is enforced by an **asynchronous background worker** (`run_expiry_cleanup_loop`) that runs on a 15-second cycle. It queries for holds where `expires_at < now()` and `status = ACTIVE`, flips them to `EXPIRED`, reverts the associated `ShowSeats.status` back to `AVAILABLE` (or triggers waitlist reallocation — see §3), and broadcasts a `SEATS_RELEASED` event over WebSockets so every connected client's seat map updates instantly, with zero polling and zero page refresh.

---

## 2. Concurrency Prevention

The core failure mode LUMINA is designed against is **double-booking**: two users clicking the same seat within milliseconds of each other during a high-demand drop. A naive read-then-write pattern (check `status == AVAILABLE`, then update) is unsafe under concurrency — both requests can pass the check before either commits, resulting in two confirmed holds on one seat.

LUMINA solves this with **pessimistic row-level locking** at the database layer:

```python
stmt = select(ShowSeat).where(...).with_for_update()
```

`with_for_update()` acquires an exclusive row lock the instant the seat row is read inside a transaction. Any second transaction attempting to select the same row for update is forced to block until the first transaction commits or rolls back. Once the first transaction commits the seat as `HELD`, the second transaction re-reads the now-updated state and correctly finds the seat unavailable, returning **HTTP 409 Conflict** to the losing client.

This approach was chosen over alternatives for concrete reasons:
- **Optimistic locking** (version-column compare-and-swap) would work but forces the losing client to retry blindly against a rapidly changing seat map — poor UX during a surge, and wasteful under high contention.
- **Application-level mutexes** (e.g., an in-memory lock) fail the moment the API is horizontally scaled across multiple processes or containers, since locks wouldn't be shared across instances.
- **Database-level pessimistic locking** is correct by construction, requires no coordination service, and scales naturally with PostgreSQL's own transaction isolation — the tradeoff is that it's optimized for short-lived critical sections, which the seat-hold transaction is.

The lock is held only for the duration of the status-check-and-flip transaction (milliseconds), not for the full 10-minute hold window, so contention windows stay small even under load.

---

## 3. Waitlist Auto-Assignment Flow

When a seat category sells out, users can join a **FIFO waitlist** — a `Waitlist` row with `status = QUEUED` and a `position` value ordered by join time, scoped to `(show_id, category_id)`.

On booking cancellation, the same transaction that reverts the seat to available also checks for the oldest `QUEUED` entry in that category. If one exists:
1. The seat is **not** returned to public inventory. Instead it's provisionally reserved for that waitlisted user.
2. The waitlist entry transitions to `OFFERED`, stamped with `offered_at` and `expires_at = now() + 600s`.
3. A time-limited claim offer email is dispatched via Resend with a direct checkout link.

If no queue exists for that category, the seat reverts straight to `AVAILABLE` and a `SEATS_RELEASED` WebSocket event fires as normal.

---

## 4. Time-Limited Offer Handling

An `OFFERED` waitlist entry is itself governed by the same 15-second expiry sweep that manages seat holds. If the offered user completes checkout within the 10-minute window, the entry transitions to `CONVERTED` and the seat moves to `BOOKED`. If the window lapses, the entry transitions to `EXPIRED`, the seat is released back to `HELD`-eligible `AVAILABLE` status, and the system automatically advances to the **next** `QUEUED` entry in FIFO order, repeating the offer cycle. This guarantees that a single unresponsive user never permanently blocks inventory, while still preserving strict first-come-first-served fairness for everyone else in line.
