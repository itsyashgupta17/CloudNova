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
            "name": "Network Tester",
            "email": "network@example.com",
            "password": "CloudNova123"
        }
    )

    response = client.post(
        "/login",
        json={
            "email": "network@example.com",
            "password": "CloudNova123"
        }
    )

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_networks_require_authentication(client):
    response = client.get("/networks")
    assert response.status_code == 401


def test_create_and_list_network(client):
    headers = get_auth_headers(client)

    create_response = client.post(
        "/networks",
        json={
            "name": "test-vpc",
            "cidr": "10.0.0.0/16",
            "region": "ap-south-1"
        },
        headers=headers
    )

    assert create_response.status_code == 201
    assert create_response.json()["name"] == "test-vpc"
    assert create_response.json()["cidr"] == "10.0.0.0/16"
    assert create_response.json()["status"] == "Active"

    list_response = client.get("/networks", headers=headers)

    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["name"] == "test-vpc"


def test_reject_invalid_network_cidr(client):
    headers = get_auth_headers(client)

    response = client.post(
        "/networks",
        json={
            "name": "invalid-vpc",
            "cidr": "not-a-valid-cidr",
            "region": "ap-south-1"
        },
        headers=headers
    )

    assert response.status_code == 400


def test_update_network_status(client):
    headers = get_auth_headers(client)

    create_response = client.post(
        "/networks",
        json={
            "name": "status-vpc",
            "cidr": "192.168.0.0/16",
            "region": "ap-south-1"
        },
        headers=headers
    )

    network_id = create_response.json()["id"]

    update_response = client.patch(
        f"/networks/{network_id}",
        json={"status": "Inactive"},
        headers=headers
    )

    assert update_response.status_code == 200
    assert update_response.json()["status"] == "Inactive"


def test_delete_network(client):
    headers = get_auth_headers(client)

    create_response = client.post(
        "/networks",
        json={
            "name": "delete-vpc",
            "cidr": "172.16.0.0/16",
            "region": "ap-south-1"
        },
        headers=headers
    )

    network_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/networks/{network_id}",
        headers=headers
    )

    assert delete_response.status_code == 200

    list_response = client.get("/networks", headers=headers)
    assert list_response.json() == []