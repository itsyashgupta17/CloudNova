import os
import boto3
from botocore.exceptions import BotoCoreError, ClientError

AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

AWS_ENABLED = os.getenv("AWS_ENABLED", "false").lower() == "true"


def get_ec2_client():
    if not AWS_ENABLED:
        return None

    return boto3.client(
        "ec2",
        region_name=AWS_REGION
    )


def get_ec2_status():
    if not AWS_ENABLED:
        return {
            "mode": "development",
            "provider": "AWS EC2",
            "connected": False,
            "message": "Simulation mode active. No AWS resources are being used."
        }

    try:
        ec2 = get_ec2_client()
        response = ec2.describe_regions(
            RegionNames=[AWS_REGION]
        )

        return {
            "mode": "live",
            "provider": "AWS EC2",
            "connected": True,
            "region": AWS_REGION,
            "message": "AWS connection successful."
        }

    except (BotoCoreError, ClientError) as error:
        return {
            "mode": "live",
            "provider": "AWS EC2",
            "connected": False,
            "message": str(error)
        }