# CloudNova – Cloud Management Dashboard

CloudNova is a full-stack cloud management dashboard built using React, FastAPI, and SQLite. It provides a unified interface for managing simulated cloud resources, monitoring infrastructure metrics, previewing cloud configurations, and managing user authentication.

---

## 🌐 Live Deployments

- **Frontend Application (Vercel)**: [https://cloud-nova-five.vercel.app/](https://cloud-nova-five.vercel.app/)
- **Backend API (Render)**: [https://cloudnova-api.onrender.com](https://cloudnova-api.onrender.com)
- **API Documentation (Swagger UI)**: [https://cloudnova-api.onrender.com/docs](https://cloudnova-api.onrender.com/docs)

---

## 🚀 Features

- **Authentication System**: User Signup, Login, and secure session management via JWT (JSON Web Tokens) with rate limiting and password hashing (Scrypt).
- **Dashboard Overview**: Resource overview cards (Virtual Machines, Storage, Databases, Monthly Billing), real-time AWS connection indicator, and system operational statuses.
- **Compute (Virtual Machines)**: VM management supporting state changes (Running/Stopped), deletion, and EC2 configuration generation.
- **Storage Management**: Cloud storage bucket creation, capacity tracking, and deletion.
- **Databases Management**: Dedicated MongoDB database provisioning and live connection management, engine validation, and active/inactive status toggling.
- **Networking Management**: Virtual Private Cloud (VPC) / Network creation with strict CIDR block validation (e.g., `10.0.0.0/16`), region assignment, and status controls.
- **Monitoring Dashboard**: Real-time simulated metrics for CPU usage, memory utilization, network traffic, and system uptime.
- **Billing & Cost Estimation**: Service-by-service cost breakdown and monthly expenditure estimations in INR (₹).
- **AWS Integration (Simulation Mode)**: Safe EC2 instance preview and configuration saving without unintended live cloud expenditure. Includes fallback handling and boto3 integration.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + Vite 8
- **Language**: JavaScript (ES Modules)
- **Styling**: Modern CSS / Flexbox / Grid
- **Linter**: OxLint

### Backend
- **Framework**: FastAPI (Python 3.15+)
- **Server**: Uvicorn
- **Database**: SQLite 3 with WAL mode & foreign keys enabled
- **Security**: JWT (`python-jose`), Scrypt password hashing, rate limiting
- **Cloud SDK**: Boto3 & Botocore
- **Testing**: Pytest, Starlette TestClient, Pytest-Cov

---

## 📁 Project Structure

```text
CloudNova/
├── backend/
│   ├── tests/
│   │   ├── test_api.py           # API root & health check tests
│   │   ├── test_auth.py          # Signup, login, JWT & profile tests
│   │   ├── test_aws_service.py   # AWS simulation & client tests
│   │   ├── test_databases.py     # Database CRUD & engine validation tests
│   │   ├── test_networks.py      # Network CIDR validation & CRUD tests
│   │   └── test_storage.py       # Storage bucket management tests
│   ├── venv/                     # Python virtual environment
│   ├── aws_service.py            # AWS EC2 integration & simulation logic
│   ├── cloudnova.db              # SQLite application database
│   └── main.py                   # FastAPI application & REST API routes
├── frontend/
│   ├── dist/                     # Optimized production build
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── App.jsx               # Main application controller & dashboard layout
│   │   ├── AWSStatus.jsx         # AWS EC2 live/simulation status widget
│   │   ├── BackendStatus.jsx     # Backend health indicator
│   │   ├── Billing.jsx           # Estimated cost breakdown & billing UI
│   │   ├── Databases.jsx         # Database management panel
│   │   ├── Login.jsx             # User login component
│   │   ├── Monitoring.jsx        # Resource monitoring & telemetry graphs
│   │   ├── Networking.jsx        # Network management & CIDR configuration
│   │   ├── Signup.jsx            # User registration component
│   │   └── Storage.jsx           # Storage bucket management
│   ├── package.json              # Frontend scripts & dependencies
│   └── vite.config.js            # Vite configuration
├── database/                     # Database migrations & schemas
├── documentation/                # Architecture docs & reference manuals
├── infrastructure/               # IaC & deployment configuration
└── README.md                     # Root project documentation
```

---

## ⚙️ Installation and Setup

### 1. Prerequisites
- **Python**: 3.10+ installed
- **Node.js**: v18+ and npm installed

### 2. Backend Setup

Open a terminal and execute:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- **Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Alternative ReDoc**: `http://127.0.0.1:8000/redoc`

### 3. Frontend Setup

Open a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

- **Frontend Application**: `http://localhost:5173`

---

## 🧪 Running Automated Tests

CloudNova includes a comprehensive automated test suite with **23 passed tests** across all core modules:

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest tests -v --cov=. --cov-report=term-missing
```

### Test Coverage Highlights:
- `test_api.py`: Root `/` and `/status` endpoints.
- `test_auth.py`: User registration, duplicate email rejection, password complexity, and JWT authenticated profile fetching (`/me`).
- `test_storage.py`: Authentication enforcement, bucket creation, list, and deletion.
- `test_databases.py`: Dedicated MongoDB engine validation, rejection of non-MongoDB engines (PostgreSQL, MySQL, SQLite), status toggles, deletion, and live MongoDB integration tests.
- `test_networks.py`: Strict CIDR validation (e.g., rejecting invalid IP masks), network creation, and status management.
- `test_aws_service.py`: AWS simulation mode, boto3 client error handling, and mock connection testing.

---

## 📦 Production Build

To verify and create an optimized production build for the frontend:

```powershell
cd frontend
npm run build
```

Artifacts will be output to `frontend/dist/`.

---

## 🔒 Security & Architecture Notes

- **Password Security**: Passwords are saved with custom salts using cryptographic Scrypt hashing.
- **Login Rate Limiter**: Implements an in-memory sliding window rate limiter locking out brute-force attempts after 5 consecutive failures.
- **AWS Simulation Safeguard**: Live AWS credentials and infrastructure provisioning are disabled by default (`AWS_ENABLED=false`). All EC2 operations safely mock interactions in development mode.
