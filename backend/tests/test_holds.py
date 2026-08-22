import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_seat_hold_and_release_flow(client: AsyncClient):
    # 1. Login customer
    login_res = await client.post(
        "/api/auth/login",
        json={"email": "cust1@test.com", "password": "cust123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get seat map for show 1
    map_res = await client.get("/api/shows/1/seats", headers=headers)
    assert map_res.status_code == 200
    seat_map = map_res.json()
    assert len(seat_map["seats"]) == 9
    first_seat = seat_map["seats"][0]
    assert first_seat["status"] == "AVAILABLE"

    # 3. Create hold on seat 1
    hold_res = await client.post(
        "/api/holds",
        json={"show_id": 1, "show_seat_ids": [first_seat["show_seat_id"]]},
        headers=headers,
    )
    assert hold_res.status_code == 201
    hold_data = hold_res.json()
    assert "hold_token" in hold_data
    assert hold_data["ttl_seconds"] > 0
    hold_token = hold_data["hold_token"]

    # 4. Another customer attempting to hold the same seat should receive 409 Conflict
    cust2_res = await client.post(
        "/api/auth/login",
        json={"email": "cust2@test.com", "password": "cust123"},
    )
    cust2_token = cust2_res.json()["access_token"]
    cust2_headers = {"Authorization": f"Bearer {cust2_token}"}

    conflict_res = await client.post(
        "/api/holds",
        json={"show_id": 1, "show_seat_ids": [first_seat["show_seat_id"]]},
        headers=cust2_headers,
    )
    assert conflict_res.status_code == 409
    assert "no longer available" in conflict_res.json()["detail"].lower()

    # 5. Customer 1 manually releases the hold
    rel_res = await client.post(
        "/api/holds/release",
        json={"hold_token": hold_token},
        headers=headers,
    )
    assert rel_res.status_code == 200

    # 6. Now Customer 2 can successfully hold the released seat
    retry_res = await client.post(
        "/api/holds",
        json={"show_id": 1, "show_seat_ids": [first_seat["show_seat_id"]]},
        headers=cust2_headers,
    )
    assert retry_res.status_code == 201
