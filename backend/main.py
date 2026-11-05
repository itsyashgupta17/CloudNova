import os
import sqlite3
import hashlib
import secrets
import hmac
import time
import threading
import ipaddress
from aws_service import get_ec2_status

from collections import defaultdict, deque
from pathlib import Path
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field, field_validator
from jose import jwt, JWTError


# =====================================
# APP CONFIGURATION
# =====================================

app = FastAPI(title="CloudNova API")

cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://cloud-nova-five.vercel.app",
]
if cors_origins_env:
    for origin in cors_origins_env.split(","):
        origin_clean = origin.strip()
        if origin_clean and origin_clean not in allowed_origins:
            allowed_origins.append(origin_clean)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = Path(__file__).with_name("cloudnova.db")

ENVIRONMENT = os.getenv("CLOUDNOVA_ENV", "development").lower()

SECRET_KEY = os.getenv("CLOUDNOVA_SECRET_KEY")

if not SECRET_KEY:
    if ENVIRONMENT == "production":
        raise RuntimeError("CLOUDNOVA_SECRET_KEY must be configured")
    SECRET_KEY = secrets.token_urlsafe(32)

if ENVIRONMENT == "production" and len(SECRET_KEY) < 32:
    raise RuntimeError("Production SECRET_KEY must contain at least 32 characters")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


# =====================================
# DATABASE CONNECTION
# =====================================

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


# =====================================
# LOGIN RATE LIMITING
# =====================================

MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 15 * 60
LOGIN_LOCK_SECONDS = 15 * 60

login_attempts = defaultdict(deque)
login_locks = {}
login_rate_lock = threading.Lock()


def check_login_rate_limit(client_ip: str, email: str):
    now = time.monotonic()
    key = (client_ip, email.lower())

    with login_rate_lock:
        locked_until = login_locks.get(key)

        if locked_until and now < locked_until:
            raise HTTPException(
                status_code=429,
                detail="Too many login attempts. Try again later."
            )

        if locked_until:
            login_locks.pop(key, None)

        attempts = login_attempts[key]

        while attempts and now - attempts[0] > LOGIN_WINDOW_SECONDS:
            attempts.popleft()

        if len(attempts) >= MAX_LOGIN_ATTEMPTS:
            login_locks[key] = now + LOGIN_LOCK_SECONDS
            raise HTTPException(
                status_code=429,
                detail="Too many login attempts. Try again later."
            )


def record_failed_login(client_ip: str, email: str):
    now = time.monotonic()
    key = (client_ip, email.lower())

    with login_rate_lock:
        attempts = login_attempts[key]

        while attempts and now - attempts[0] > LOGIN_WINDOW_SECONDS:
            attempts.popleft()

        attempts.append(now)

        if len(attempts) >= MAX_LOGIN_ATTEMPTS:
            login_locks[key] = now + LOGIN_LOCK_SECONDS


def clear_login_attempts(client_ip: str, email: str):
    key = (client_ip, email.lower())

    with login_rate_lock:
        login_attempts.pop(key, None)
        login_locks.pop(key, None)


# =====================================
# PASSWORD SECURITY
# =====================================

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    password_hash = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=16384,
        r=8,
        p=1
    )

    return salt.hex() + ":" + password_hash.hex()


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, hash_hex = stored_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(hash_hex)

        actual_hash = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=16384,
            r=8,
            p=1
        )

        return hmac.compare_digest(actual_hash, expected_hash)

    except (ValueError, TypeError):
        return False


# =====================================
# JWT AUTHENTICATION
# =====================================

def create_access_token(user_id: int):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_error = HTTPException(
        status_code=401,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id = int(payload.get("sub"))

    except (JWTError, ValueError, TypeError):
        raise credentials_error

    conn = get_connection()

    try:
        user = conn.execute(
            "SELECT id, name, email FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()

        if user is None:
            raise credentials_error

        return dict(user)

    finally:
        conn.close()


# =====================================
# DATABASE INITIALIZATION
# =====================================

def init_db():
    conn = get_connection()

    try:
        # Users
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Virtual Machines
        conn.execute("""
            CREATE TABLE IF NOT EXISTS vms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                size TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Running',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER REFERENCES users(id)
            )
        """)

        # Storage
        conn.execute("""
            CREATE TABLE IF NOT EXISTS storage_buckets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                size_gb INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER REFERENCES users(id)
            )
        """)

        # Databases
        conn.execute("""
            CREATE TABLE IF NOT EXISTS databases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                engine TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER REFERENCES users(id)
            )
        """)

        # Networks
        conn.execute("""
            CREATE TABLE IF NOT EXISTS networks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                cidr TEXT NOT NULL,
                region TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER REFERENCES users(id)
            )
        """)

        # EC2 Configurations (saved locally; no AWS instance is launched)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS ec2_instances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                region TEXT NOT NULL,
                operating_system TEXT NOT NULL,
                instance_type TEXT NOT NULL,
                volume_gb INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER REFERENCES users(id)
            )
        """)

        # Migrate older database schemas
        tables = [
            "vms",
            "storage_buckets",
            "databases",
            "networks",
            "ec2_instances"
        ]

        for table in tables:
            columns = [
                row["name"]
                for row in conn.execute(
                    f"PRAGMA table_info({table})"
                ).fetchall()
            ]

            if "user_id" not in columns:
                conn.execute(
                    f"ALTER TABLE {table} ADD COLUMN user_id INTEGER REFERENCES users(id)"
                )

        # Assign legacy resources to first registered user
        first_user = conn.execute(
            "SELECT id FROM users ORDER BY id LIMIT 1"
        ).fetchone()

        if first_user:
            owner_id = first_user["id"]

            for table in tables:
                conn.execute(
                    f"UPDATE {table} SET user_id = ? WHERE user_id IS NULL",
                    (owner_id,)
                )

            # Seed demo VMs if none exist
            vm_count = conn.execute(
                "SELECT COUNT(*) FROM vms"
            ).fetchone()[0]

            if vm_count == 0:
                initial_vms = [
                    ("cloud-server-01", "2 vCPU / 4 GB", "Running", owner_id),
                    ("cloud-server-02", "4 vCPU / 8 GB", "Running", owner_id),
                    ("test-server", "1 vCPU / 2 GB", "Stopped", owner_id)
                ]

                conn.executemany(
                    """
                    INSERT INTO vms (name, size, status, user_id)
                    VALUES (?, ?, ?, ?)
                    """,
                    initial_vms
                )

        conn.commit()

    finally:
        conn.close()


init_db()


# =====================================
# REQUEST MODELS
# =====================================

class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if value != value.strip():
            raise ValueError("Password cannot start or end with spaces")

        if not any(char.islower() for char in value):
            raise ValueError("Password must contain a lowercase letter")

        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain an uppercase letter")

        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain a number")

        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class VMCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    size: str = Field(min_length=1, max_length=100)


class VMUpdate(BaseModel):
    status: str

class EC2Config(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    region: str = "ap-south-1"
    operating_system: str = "Ubuntu Server 24.04 LTS"
    instance_type: str = "t3.micro"
    volume_gb: int = Field(default=8, ge=8, le=100)

class BucketCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    size_gb: int = Field(gt=0)


class DatabaseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    engine: str


class NetworkCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    cidr: str = Field(min_length=1, max_length=50)
    region: str = Field(min_length=1, max_length=50)


class NetworkUpdate(BaseModel):
    status: str



# =====================================
# HOME AND STATUS APIs
# =====================================

@app.get("/")
def home():
    return {
        "message": "Welcome to CloudNova API",
        "status": "Online"
    }


@app.get("/status")
def check_status():
    return {
        "server": "CloudNova",
        "status": "Online"
    }


# =====================================
# AUTHENTICATION APIs
# =====================================

@app.post("/signup", status_code=201)
def signup(user: SignupRequest):
    name = user.name.strip()
    email = user.email.strip().lower()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty"
        )

    password_hash = hash_password(user.password)
    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES (?, ?, ?)
            """,
            (name, email, password_hash)
        )

        conn.commit()

        return {
            "message": "Account created successfully",
            "user": {
                "id": cursor.lastrowid,
                "name": name,
                "email": email
            }
        }

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Email is already registered"
        )

    finally:
        conn.close()


@app.post("/login")
def login(credentials: LoginRequest, request: Request):
    email = credentials.email.strip().lower()
    client_ip = request.client.host if request.client else "unknown"

    check_login_rate_limit(client_ip, email)

    conn = get_connection()

    try:
        user = conn.execute(
            """
            SELECT id, name, email, password_hash
            FROM users
            WHERE email = ?
            """,
            (email,)
        ).fetchone()

        if user is None or not verify_password(
            credentials.password,
            user["password_hash"]
        ):
            record_failed_login(client_ip, email)

            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password"
            )

        clear_login_attempts(client_ip, email)

        access_token = create_access_token(user["id"])

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }

    finally:
        conn.close()


@app.get("/me")
def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "message": "Authenticated successfully",
        "user": current_user
    }


# =====================================
# VIRTUAL MACHINE APIs
# =====================================

@app.get("/vms")
def get_vms(current_user: dict = Depends(get_current_user)):
    conn = get_connection()

    try:
        rows = conn.execute(
            "SELECT * FROM vms WHERE user_id = ? ORDER BY id",
            (current_user["id"],)
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        conn.close()


@app.post("/vms")
def create_vm(vm: VMCreate, current_user: dict = Depends(get_current_user)):
    name = vm.name.strip()
    size = vm.size.strip()

    if not name or not size:
        raise HTTPException(status_code=400, detail="VM name and size cannot be empty")

    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            INSERT INTO vms (name, size, status, user_id)
            VALUES (?, ?, ?, ?)
            """,
            (name, size, "Running", current_user["id"])
        )

        conn.commit()

        row = conn.execute(
            "SELECT * FROM vms WHERE id = ? AND user_id = ?",
            (cursor.lastrowid, current_user["id"])
        ).fetchone()

        return dict(row)

    finally:
        conn.close()


@app.patch("/vms/{vm_id}")
def update_vm(
    vm_id: int,
    update: VMUpdate,
    current_user: dict = Depends(get_current_user)
):
    if update.status not in ["Running", "Stopped"]:
        raise HTTPException(status_code=400, detail="Invalid VM status")

    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            UPDATE vms SET status = ?
            WHERE id = ? AND user_id = ?
            """,
            (update.status, vm_id, current_user["id"])
        )

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="VM not found")

        conn.commit()

        row = conn.execute(
            "SELECT * FROM vms WHERE id = ? AND user_id = ?",
            (vm_id, current_user["id"])
        ).fetchone()

        return dict(row)

    finally:
        conn.close()


@app.delete("/vms/{vm_id}")
def delete_vm(vm_id: int, current_user: dict = Depends(get_current_user)):
    conn = get_connection()

    try:
        cursor = conn.execute(
            "DELETE FROM vms WHERE id = ? AND user_id = ?",
            (vm_id, current_user["id"])
        )

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="VM not found")

        conn.commit()
        return {"message": "VM deleted successfully"}

    finally:
        conn.close()


# =====================================
# STORAGE MANAGEMENT APIs
# =====================================

@app.get("/storage/buckets")
def get_buckets(current_user: dict = Depends(get_current_user)):
    conn = get_connection()

    try:
        rows = conn.execute(
            """
            SELECT * FROM storage_buckets
            WHERE user_id = ?
            ORDER BY id
            """,
            (current_user["id"],)
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        conn.close()


@app.post("/storage/buckets")
def create_bucket(
    bucket: BucketCreate,
    current_user: dict = Depends(get_current_user)
):
    name = bucket.name.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Bucket name cannot be empty")

    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            INSERT INTO storage_buckets (name, size_gb, user_id)
            VALUES (?, ?, ?)
            """,
            (name, bucket.size_gb, current_user["id"])
        )

        conn.commit()

        return {
            "id": cursor.lastrowid,
            "name": name,
            "size_gb": bucket.size_gb,
            "message": "Storage bucket created successfully"
        }

    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Bucket name already exists")

    finally:
        conn.close()


@app.delete("/storage/buckets/{bucket_id}")
def delete_bucket(
    bucket_id: int,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            DELETE FROM storage_buckets
            WHERE id = ? AND user_id = ?
            """,
            (bucket_id, current_user["id"])
        )

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Storage bucket not found")

        conn.commit()
        return {"message": "Storage bucket deleted successfully"}

    finally:
        conn.close()


# =====================================
# DATABASE MANAGEMENT APIs
# =====================================

ALLOWED_ENGINES = [
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "SQLite"
]


@app.get("/databases")
def get_databases(current_user: dict = Depends(get_current_user)):
    conn = get_connection()

    try:
        rows = conn.execute(
            """
            SELECT * FROM databases
            WHERE user_id = ?
            ORDER BY id
            """,
            (current_user["id"],)
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        conn.close()


@app.post("/databases")
def create_database(
    database: DatabaseCreate,
    current_user: dict = Depends(get_current_user)
):
    name = database.name.strip()

    if not name:
        raise HTTPException(status_code=400, detail="Database name cannot be empty")

    if database.engine not in ALLOWED_ENGINES:
        raise HTTPException(status_code=400, detail="Unsupported database engine")

    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            INSERT INTO databases (name, engine, status, user_id)
            VALUES (?, ?, 'Active', ?)
            """,
            (name, database.engine, current_user["id"])
        )

        conn.commit()

        return {
            "id": cursor.lastrowid,
            "name": name,
            "engine": database.engine,
            "status": "Active",
            "message": "Database created successfully"
        }

    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Database name already exists")

    finally:
        conn.close()


@app.patch("/databases/{database_id}")
def update_database(
    database_id: int,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    if status not in ["Active", "Inactive"]:
        raise HTTPException(status_code=400, detail="Invalid database status")

    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            UPDATE databases SET status = ?
            WHERE id = ? AND user_id = ?
            """,
            (status, database_id, current_user["id"])
        )

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Database not found")

        conn.commit()

        return {
            "message": "Database status updated successfully",
            "id": database_id,
            "status": status
        }

    finally:
        conn.close()


@app.delete("/databases/{database_id}")
def delete_database(
    database_id: int,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            DELETE FROM databases
            WHERE id = ? AND user_id = ?
            """,
            (database_id, current_user["id"])
        )

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Database not found")

        conn.commit()
        return {"message": "Database deleted successfully"}

    finally:
        conn.close()


# =====================================
# NETWORK MANAGEMENT APIs
# =====================================

@app.get("/networks")
def get_networks(current_user: dict = Depends(get_current_user)):
    conn = get_connection()

    try:
        rows = conn.execute(
            """
            SELECT * FROM networks
            WHERE user_id = ?
            ORDER BY id
            """,
            (current_user["id"],)
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        conn.close()


@app.post("/networks", status_code=201)
def create_network(
    network: NetworkCreate,
    current_user: dict = Depends(get_current_user)
):
    name = network.name.strip()
    region = network.region.strip()

    if not name or not region:
        raise HTTPException(
            status_code=400,
            detail="Network name and region cannot be empty"
        )

    try:
        # Validate and normalize the CIDR address
        cidr = str(ipaddress.ip_network(network.cidr.strip(), strict=False))

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid CIDR address. Example: 10.0.0.0/16"
        )

    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            INSERT INTO networks (name, cidr, region, status, user_id)
            VALUES (?, ?, ?, 'Active', ?)
            """,
            (name, cidr, region, current_user["id"])
        )

        conn.commit()

        row = conn.execute(
            "SELECT * FROM networks WHERE id = ? AND user_id = ?",
            (cursor.lastrowid, current_user["id"])
        ).fetchone()

        return dict(row)

    finally:
        conn.close()


@app.patch("/networks/{network_id}")
def update_network(
    network_id: int,
    update: NetworkUpdate,
    current_user: dict = Depends(get_current_user)
):
    if update.status not in ["Active", "Inactive"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid network status"
        )

    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            UPDATE networks SET status = ?
            WHERE id = ? AND user_id = ?
            """,
            (update.status, network_id, current_user["id"])
        )

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Network not found")

        conn.commit()

        row = conn.execute(
            "SELECT * FROM networks WHERE id = ? AND user_id = ?",
            (network_id, current_user["id"])
        ).fetchone()

        return dict(row)

    finally:
        conn.close()


@app.delete("/networks/{network_id}")
def delete_network(
    network_id: int,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            DELETE FROM networks
            WHERE id = ? AND user_id = ?
            """,
            (network_id, current_user["id"])
        )

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Network not found")

        conn.commit()

        return {"message": "Network deleted successfully"}

    finally:
        conn.close()

@app.get("/aws/status")
def aws_status(current_user: dict = Depends(get_current_user)):
    return get_ec2_status()

@app.post("/aws/ec2/preview")
def preview_ec2_instance(
    config: EC2Config,
    current_user: dict = Depends(get_current_user)
):
    return {
        "success": True,
        "mode": "simulation",
        "message": "EC2 configuration validated. No AWS instance was launched.",
        "configuration": {
            "name": config.name,
            "region": config.region,
            "operating_system": config.operating_system,
            "instance_type": config.instance_type,
            "volume_gb": config.volume_gb
        },
        "estimated_cost": "Not calculated — simulation only"
    }


# =====================================
# AWS EC2 CONFIGURATION APIs
# =====================================

@app.get("/aws/ec2/configurations")
def get_ec2_configurations(
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()

    try:
        rows = conn.execute(
            """
            SELECT * FROM ec2_instances
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (current_user["id"],)
        ).fetchall()

        return [dict(row) for row in rows]

    finally:
        conn.close()


@app.post("/aws/ec2/configurations", status_code=201)
def save_ec2_configuration(
    config: EC2Config,
    current_user: dict = Depends(get_current_user)
):
    name = config.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Instance name cannot be empty"
        )

    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            INSERT INTO ec2_instances (
                name,
                region,
                operating_system,
                instance_type,
                volume_gb,
                user_id
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                config.region,
                config.operating_system,
                config.instance_type,
                config.volume_gb,
                current_user["id"]
            )
        )

        conn.commit()

        row = conn.execute(
            """
            SELECT * FROM ec2_instances
            WHERE id = ? AND user_id = ?
            """,
            (cursor.lastrowid, current_user["id"])
        ).fetchone()

        return {
            "success": True,
            "message": "EC2 configuration saved successfully",
            "configuration": dict(row),
            "mode": "simulation"
        }

    finally:
        conn.close()


@app.delete("/aws/ec2/configurations/{config_id}")
def delete_ec2_configuration(
    config_id: int,
    current_user: dict = Depends(get_current_user)
):
    conn = get_connection()

    try:
        cursor = conn.execute(
            """
            DELETE FROM ec2_instances
            WHERE id = ? AND user_id = ?
            """,
            (config_id, current_user["id"])
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="EC2 configuration not found"
            )

        conn.commit()

        return {
            "success": True,
            "message": "EC2 configuration deleted successfully"
        }

    finally:
        conn.close()
