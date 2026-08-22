import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cancellation_and_waitlist_auto_reallocation(client: AsyncClient):
    # 1. Login Cust1 (Customer One) and Cust2 (Customer Two)
    login1 = await client.post("/api/auth/login", json={"email": "cust1@test.com", "password": "cust123"})
    login2 = await client.post("/api/auth/login", json={"email": "cust2@test.com", "password": "cust123"})
    token1 = login1.json()["access_token"]
    token2 = login2.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 2. Cust1 holds and books Seat 3 (VIP, category_id = 2)
    hold_res = await client.post("/api/holds", json={"show_id": 1, "show_seat_ids": [3]}, headers=headers1)
    assert hold_res.status_code == 201
    hold_token = hold_res.json()["hold_token"]

    book_res = await client.post("/api/bookings", json={"hold_token": hold_token}, headers=headers1)
    assert book_res.status_code == 201
    booking_id = book_res.json()["id"]

    # 3. Cust2 joins waitlist for Show 1, VIP category (id = 2)
    wl_res = await client.post(
        "/api/waitlist/join",
        json={"show_id": 1, "category_id": 2},
        headers=headers2,
    )
    assert wl_res.status_code == 201
    assert wl_res.json()["status"] == "WAITING"

    # 4. Cust1 cancels their booking
    cancel_res = await client.post(f"/api/bookings/{booking_id}/cancel", headers=headers1)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

    # 5. Cust2 queries their waitlist status; system should have auto-assigned an active offer
    my_wl_res = await client.get("/api/waitlist", headers=headers2)
    assert my_wl_res.status_code == 200
    entries = my_wl_res.json()
    assert len(entries) >= 1
    target_entry = next(e for e in entries if e["show_id"] == 1 and e["category_id"] == 2)
    assert target_entry["status"] == "OFFERED"
    assert target_entry["active_offer"] is not None
    offer_token = target_entry["active_offer"]["offer_token"]

    # 6. Cust2 claims the time-limited waitlist offer
    claim_res = await client.post(
        "/api/waitlist/claim",
        json={"offer_token": offer_token},
        headers=headers2,
    )
    assert claim_res.status_code == 200
    claimed_booking = claim_res.json()
    assert claimed_booking["status"] == "CONFIRMED"
    assert claimed_booking["seats"][0]["show_seat_id"] == 3
    assert claimed_booking["qr_code_data"] is not None
