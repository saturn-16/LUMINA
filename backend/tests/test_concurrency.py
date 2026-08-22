import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest.mark.asyncio
async def test_simultaneous_seat_hold_concurrency():
    """
    Simulate two customers sending simultaneous hold requests for the exact same seat.
    Assert that exactly ONE request succeeds with HTTP 201, and the other fails safely with HTTP 409 Conflict.
    """
    transport1 = ASGITransport(app=app)
    transport2 = ASGITransport(app=app)

    async with AsyncClient(transport=transport1, base_url="http://test") as client1, \
               AsyncClient(transport=transport2, base_url="http://test") as client2:
        
        # 1. Login user 1 & user 2
        login1 = await client1.post("/api/auth/login", json={"email": "cust1@test.com", "password": "cust123"})
        login2 = await client2.post("/api/auth/login", json={"email": "cust2@test.com", "password": "cust123"})
        token1 = login1.json()["access_token"]
        token2 = login2.json()["access_token"]

        # Target seat 5 in show 1
        target_seat_id = 5

        # 2. Fire simultaneous hold requests
        async def try_hold(client, token):
            return await client.post(
                "/api/holds",
                json={"show_id": 1, "show_seat_ids": [target_seat_id]},
                headers={"Authorization": f"Bearer {token}"},
            )

        res1, res2 = await asyncio.gather(
            try_hold(client1, token1),
            try_hold(client2, token2),
        )

        status_codes = [res1.status_code, res2.status_code]
        
        # Exactly one must succeed (201) and one must receive conflict (409)
        assert 201 in status_codes, f"Expected one 201, got {status_codes}"
        assert 409 in status_codes, f"Expected one 409, got {status_codes}"
        assert status_codes.count(201) == 1
        assert status_codes.count(409) == 1
