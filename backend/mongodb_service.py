import os
import re
from datetime import datetime, timezone
from pathlib import Path
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError, ServerSelectionTimeoutError

ENV_PATH = Path(__file__).resolve().parent / ".env"
ROOT_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"


def _load_env_uri() -> str:
    """Read MONGODB_URI from environment or local .env file."""
    uri = os.getenv("MONGODB_URI", "").strip()
    if uri:
        return uri

    for p in (ENV_PATH, ROOT_ENV_PATH):
        if p.exists():
            try:
                for line in p.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if line.startswith("MONGODB_URI="):
                        val = line.split("=", 1)[1].strip().strip("\"'")
                        if val:
                            return val
            except Exception:
                pass
    return ""


def get_mongodb_uri() -> str:
    """Return currently configured MongoDB URI."""
    return _load_env_uri()


def mask_uri(uri: str) -> str:
    """Mask credentials in MongoDB connection string for safe UI display."""
    if not uri:
        return ""
    # Matches ://user:password@
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", uri)


def test_connection(uri: str | None = None) -> dict:
    """
    Test MongoDB connectivity.
    If uri is None, uses the configured MONGODB_URI.
    """
    target_uri = (uri or get_mongodb_uri()).strip()

    if not target_uri:
        return {
            "connected": False,
            "configured": False,
            "error": "MONGODB_URI is not configured. Please provide a MongoDB connection string.",
            "uri_masked": ""
        }

    client = None
    try:
        client = MongoClient(target_uri, serverSelectionTimeoutMS=4000, connectTimeoutMS=4000)
        # Force a command to test connection
        client.admin.command("ping")
        server_info = client.server_info()
        version = server_info.get("version", "unknown")

        try:
            db_names = client.list_database_names()
        except Exception:
            db_names = []

        return {
            "connected": True,
            "configured": True,
            "uri_masked": mask_uri(target_uri),
            "version": version,
            "databases": db_names,
            "message": "Connected successfully to MongoDB!"
        }
    except (ServerSelectionTimeoutError, ConnectionFailure) as e:
        return {
            "connected": False,
            "configured": True,
            "uri_masked": mask_uri(target_uri),
            "error": f"Connection timeout: Could not connect to MongoDB server. {str(e)}",
        }
    except ConfigurationError as e:
        return {
            "connected": False,
            "configured": True,
            "uri_masked": mask_uri(target_uri),
            "error": f"Invalid MongoDB URI configuration: {str(e)}",
        }
    except Exception as e:
        return {
            "connected": False,
            "configured": True,
            "uri_masked": mask_uri(target_uri),
            "error": f"MongoDB error: {str(e)}",
        }
    finally:
        if client:
            client.close()


def get_mongodb_database():
    """Return MongoClient database instance if configured, else None."""
    uri = get_mongodb_uri()
    if not uri:
        return None, None
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=3000)
        client.admin.command("ping")
        db_name = os.getenv("MONGODB_DATABASE_NAME", "cloudnova")
        return client, client[db_name]
    except Exception:
        return None, None


def save_database_to_mongodb(name: str, user_id: int) -> dict:
    """Save a database entry directly into MongoDB."""
    client, db = get_mongodb_database()
    if db is None:
        return {
            "stored_in_mongo": False,
            "message": "MongoDB is not connected; stored in SQLite."
        }

    try:
        doc = {
            "name": name,
            "engine": "MongoDB",
            "status": "Active",
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        # Upsert by name + user_id
        res = db["databases"].update_one(
            {"name": name, "user_id": user_id},
            {"$set": doc},
            upsert=True
        )

        # Also initialize a dedicated collection with a system init document
        # so this database is immediately visible and usable in MongoDB Compass / Atlas
        if name not in db.client.list_database_names():
            user_db = db.client[name]
            user_db["_cloudnova_meta"].update_one(
                {"_id": "meta"},
                {"$set": {
                    "created_by_user_id": user_id,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "status": "Active",
                    "engine": "MongoDB"
                }},
                upsert=True
            )

        return {
            "stored_in_mongo": True,
            "mongo_database": os.getenv("MONGODB_DATABASE_NAME", "cloudnova"),
            "dedicated_database": name,
            "message": f"Successfully stored in MongoDB (Database: '{name}')!"
        }
    except Exception as e:
        return {
            "stored_in_mongo": False,
            "error": str(e),
            "message": f"Failed writing to MongoDB: {str(e)}"
        }
    finally:
        if client:
            client.close()


def delete_database_from_mongodb(name: str, user_id: int) -> dict:
    """Delete a database entry from MongoDB."""
    client, db = get_mongodb_database()
    if db is None:
        return {"deleted_from_mongo": False}

    try:
        db["databases"].delete_one({"name": name, "user_id": user_id})
        return {"deleted_from_mongo": True}
    except Exception as e:
        return {"deleted_from_mongo": False, "error": str(e)}
    finally:
        if client:
            client.close()
