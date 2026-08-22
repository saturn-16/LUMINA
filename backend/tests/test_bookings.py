import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_booking_checkout_flow(client: AsyncClient):
    # 1. Login
    login_res = await client.post(
        "/api/auth/login",
        json={"email": "cust1@test.com", "password": "cust123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Place hold on seat 2 (VIP seat, price 100.0)
    hold_res = await client.post(
        "/api/holds",
        json={"show_id": 1, "show_seat_ids": [2]},
        headers=headers,
    )
    assert hold_res.status_code == 201
    hold_token = hold_res.json()["hold_token"]

    # 3. Complete checkout
    book_res = await client.post(
        "/api/bookings",
        json={"hold_token": hold_token},
        headers=headers,
    )
    assert book_res.status_code == 201
    booking_data = book_res.json()
    assert "booking_reference" in booking_data
    assert booking_data["status"] == "CONFIRMED"
    assert booking_data["total_amount"] == 100.0
    assert booking_data["qr_code_data"].startswith("data:image/png;base64,")

    # 4. Fetch booking details by reference
    ref = booking_data["booking_reference"]
    detail_res = await client.get(f"/api/bookings/{ref}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["customer_email"] == "cust1@test.com"

    # 5. Booking history contains this booking
    history_res = await client.get("/api/bookings", headers=headers)
    assert history_res.status_code == 200
    assert any(b["booking_reference"] == ref for b in history_res.json())

    # 6. Attempting to book again with the same converted hold should fail
    dup_book = await client.post(
        "/api/bookings",
        json={"hold_token": hold_token},
        headers=headers,
    )
    assert dup_book.status_code == 404
