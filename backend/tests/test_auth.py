
import pytest
from fastapi.testclient import TestClient
import main


@pytest.fixture
def client(tmp_path, monkeypatch):
    # Use a temporary database for testing
    test_db = tmp_path / "test_cloudnova.db"
    monkeypatch.setattr(main, "DB_PATH", test_db)

    # Initialize the temporary database
    main.init_db()

    return TestClient(main.app)


def test_signup_login_and_profile(client):
    # 1. Signup
    signup_response = client.post(
        "/signup",
        json={
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "CloudNova123"
        }
    )

    assert signup_response.status_code == 201

    signup_data = signup_response.json()

    assert signup_data["message"] == "Account created successfully"
    assert signup_data["user"]["email"] == "testuser@example.com"

    # 2. Login
    login_response = client.post(
        "/login",
        json={
            "email": "testuser@example.com",
            "password": "CloudNova123"
        }
    )

    assert login_response.status_code == 200

    login_data = login_response.json()

    assert login_data["token_type"] == "bearer"
    assert "access_token" in login_data

    token = login_data["access_token"]

    # 3. Access profile without token
    unauthorized_response = client.get("/me")

    assert unauthorized_response.status_code == 401

    # 4. Access profile with token
    profile_response = client.get(
        "/me",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert profile_response.status_code == 200

    profile_data = profile_response.json()

    assert profile_data["message"] == "Authenticated successfully"
    assert profile_data["user"]["email"] == "testuser@example.com"


def test_duplicate_signup(client):
    user_data = {
        "name": "Test User",
        "email": "duplicate@example.com",
        "password": "CloudNova123"
    }

    first_response = client.post("/signup", json=user_data)
    second_response = client.post("/signup", json=user_data)

    assert first_response.status_code == 201
    assert second_response.status_code == 409


def test_invalid_signup_password(client):
    response = client.post(
        "/signup",
        json={
            "name": "Test User",
            "email": "weakpassword@example.com",
            "password": "weak"
        }
    )

    assert response.status_code == 422
