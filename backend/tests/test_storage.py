
import pytest
from fastapi.testclient import TestClient
import main


@pytest.fixture
def client(tmp_path, monkeypatch):
    test_db = tmp_path / "test_cloudnova.db"
    monkeypatch.setattr(main, "DB_PATH", test_db)
    main.init_db()
    return TestClient(main.app)


def get_auth_headers(client):
    client.post(
        "/signup",
        json={
            "name": "Storage Tester",
            "email": "storage@example.com",
            "password": "CloudNova123"
        }
    )

    response = client.post(
        "/login",
        json={
            "email": "storage@example.com",
            "password": "CloudNova123"
        }
    )

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_storage_requires_authentication(client):
    response = client.get("/storage/buckets")
    assert response.status_code == 401


def test_create_and_list_storage_bucket(client):
    headers = get_auth_headers(client)

    create_response = client.post(
        "/storage/buckets",
        json={
            "name": "test-bucket",
            "size_gb": 20
        },
        headers=headers
    )

    assert create_response.status_code == 200
    assert create_response.json()["name"] == "test-bucket"
    assert create_response.json()["size_gb"] == 20

    list_response = client.get(
        "/storage/buckets",
        headers=headers
    )

    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["name"] == "test-bucket"


def test_delete_storage_bucket(client):
    headers = get_auth_headers(client)

    create_response = client.post(
        "/storage/buckets",
        json={
            "name": "delete-bucket",
            "size_gb": 10
        },
        headers=headers
    )

    bucket_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/storage/buckets/{bucket_id}",
        headers=headers
    )

    assert delete_response.status_code == 200

    list_response = client.get(
        "/storage/buckets",
        headers=headers
    )

    assert list_response.json() == []


def test_invalid_storage_bucket_size(client):
    headers = get_auth_headers(client)

    response = client.post(
        "/storage/buckets",
        json={
            "name": "invalid-bucket",
            "size_gb": 0
        },
        headers=headers
    )

    assert response.status_code == 422
