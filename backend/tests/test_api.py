
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_home_endpoint():
    response = client.get("/")

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Welcome to CloudNova API"
    assert data["status"] == "Online"


def test_status_endpoint():
    response = client.get("/status")

    assert response.status_code == 200

    data = response.json()

    assert data["server"] == "CloudNova"
    assert data["status"] == "Online"
