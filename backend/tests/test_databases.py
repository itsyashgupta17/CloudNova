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
            "name": "Database Tester",
            "email": "database@example.com",
            "password": "CloudNova123"
        }
    )

    response = client.post(
        "/login",
        json={
            "email": "database@example.com",
            "password": "CloudNova123"
        }
    )

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_databases_require_authentication(client):
    response = client.get("/databases")
    assert response.status_code == 401


def test_create_and_list_database(client):
    headers = get_auth_headers(client)

    create_response = client.post(
        "/databases",
        json={
            "name": "test-mongodb",
            "engine": "MongoDB"
        },
        headers=headers
    )

    assert create_response.status_code == 200
    assert create_response.json()["name"] == "test-mongodb"
    assert create_response.json()["engine"] == "MongoDB"
    assert create_response.json()["status"] == "Active"

    list_response = client.get("/databases", headers=headers)

    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["name"] == "test-mongodb"


def test_reject_unsupported_database_engine(client):
    headers = get_auth_headers(client)

    # All engines other than MongoDB must be rejected
    for unsupported in ["PostgreSQL", "MySQL", "SQLite", "UnsupportedDB"]:
        response = client.post(
            "/databases",
            json={
                "name": f"invalid-db-{unsupported.lower()}",
                "engine": unsupported
            },
            headers=headers
        )
        assert response.status_code == 400
        assert "Only MongoDB is supported" in response.json()["detail"]


def test_update_database_status(client):
    headers = get_auth_headers(client)

    create_response = client.post(
        "/databases",
        json={
            "name": "status-database",
            "engine": "MongoDB"
        },
        headers=headers
    )

    database_id = create_response.json()["id"]

    update_response = client.patch(
        f"/databases/{database_id}?status=Inactive",
        headers=headers
    )

    assert update_response.status_code == 200
    assert update_response.json()["status"] == "Inactive"


def test_delete_database(client):
    headers = get_auth_headers(client)

    create_response = client.post(
        "/databases",
        json={
            "name": "delete-database",
            "engine": "MongoDB"
        },
        headers=headers
    )

    database_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/databases/{database_id}",
        headers=headers
    )

    assert delete_response.status_code == 200

    list_response = client.get("/databases", headers=headers)
    assert list_response.json() == []


def test_mongodb_status_endpoint(client):
    headers = get_auth_headers(client)
    response = client.get("/databases/mongodb/status", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "connected" in data
    assert "configured" in data


def test_create_mongodb_database(client):
    headers = get_auth_headers(client)
    response = client.post(
        "/databases",
        json={
            "name": "my-mongodb-cluster",
            "engine": "MongoDB"
        },
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "my-mongodb-cluster"
    assert data["engine"] == "MongoDB"
    assert "mongo" in data


def test_mongodb_test_connection_invalid(client):
    headers = get_auth_headers(client)
    response = client.post(
        "/databases/mongodb/test",
        json={"uri": "mongodb://invalid-host-cloudnova-test:27017"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["connected"] is False
