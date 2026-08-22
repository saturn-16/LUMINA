import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # 1. Register new customer
    reg_res = await client.post(
        "/api/auth/register",
        json={
            "email": "newuser@test.com",
            "password": "secretpassword",
            "full_name": "New User",
            "role": "CUSTOMER",
        },
    )
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["email"] == "newuser@test.com"
    assert data["role"] == "CUSTOMER"

    # 2. Duplicate registration should return 409
    dup_res = await client.post(
        "/api/auth/register",
        json={
            "email": "newuser@test.com",
            "password": "secretpassword",
            "full_name": "New User",
        },
    )
    assert dup_res.status_code == 409

    # 3. Login with correct credentials
    login_res = await client.post(
        "/api/auth/login",
        json={"email": "newuser@test.com", "password": "secretpassword"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 4. Access protected profile route
    me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "newuser@test.com"

    # 5. Login with invalid password
    bad_login = await client.post(
        "/api/auth/login",
        json={"email": "newuser@test.com", "password": "wrongpassword"},
    )
    assert bad_login.status_code == 401


@pytest.mark.asyncio
async def test_role_authorization_guards(client: AsyncClient):
    # Login as Customer
    cust_res = await client.post(
        "/api/auth/login",
        json={"email": "cust1@test.com", "password": "cust123"},
    )
    cust_token = cust_res.json()["access_token"]

    # Customer attempting Admin route should be rejected with 403 Forbidden
    admin_res = await client.get(
        "/api/admin/stats",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert admin_res.status_code == 403

    # Customer attempting Organiser route should be rejected with 403 Forbidden
    org_res = await client.get(
        "/api/organiser/analytics",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert org_res.status_code == 403
