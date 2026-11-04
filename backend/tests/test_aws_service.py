import aws_service
from botocore.exceptions import ClientError


def test_development_mode_returns_simulation_status(monkeypatch):
    monkeypatch.setattr(aws_service, "AWS_ENABLED", False)

    response = aws_service.get_ec2_status()

    assert response["mode"] == "development"
    assert response["provider"] == "AWS EC2"
    assert response["connected"] is False
    assert "Simulation mode active" in response["message"]


def test_get_ec2_client_returns_none_in_development_mode(monkeypatch):
    monkeypatch.setattr(aws_service, "AWS_ENABLED", False)

    client = aws_service.get_ec2_client()

    assert client is None


def test_live_mode_returns_successful_connection(monkeypatch):
    class FakeEC2:
        def describe_regions(self, **kwargs):
            return {"Regions": [{"RegionName": "ap-south-1"}]}

    monkeypatch.setattr(aws_service, "AWS_ENABLED", True)
    monkeypatch.setattr(aws_service, "AWS_REGION", "ap-south-1")
    monkeypatch.setattr(aws_service, "get_ec2_client", lambda: FakeEC2())

    response = aws_service.get_ec2_status()

    assert response["mode"] == "live"
    assert response["connected"] is True
    assert response["region"] == "ap-south-1"
    assert response["message"] == "AWS connection successful."


def test_live_mode_handles_aws_client_error(monkeypatch):
    class FakeEC2:
        def describe_regions(self, **kwargs):
            raise ClientError(
                {
                    "Error": {
                        "Code": "AccessDenied",
                        "Message": "Access denied"
                    }
                },
                "DescribeRegions"
            )

    monkeypatch.setattr(aws_service, "AWS_ENABLED", True)
    monkeypatch.setattr(aws_service, "get_ec2_client", lambda: FakeEC2())

    response = aws_service.get_ec2_status()

    assert response["mode"] == "live"
    assert response["connected"] is False
    assert "AccessDenied" in response["message"]