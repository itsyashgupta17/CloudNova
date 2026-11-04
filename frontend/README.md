 # CloudNova – Cloud Management Dashboard

CloudNova is a full-stack cloud management dashboard built using React, FastAPI and SQLite. It provides a unified interface for managing simulated cloud resources.

## Features

- User Signup and Login with JWT Authentication
- Dashboard Overview
- Virtual Machine Management
- Storage Bucket Management
- Database Management
- Network Management with CIDR Validation
- Monitoring Dashboard
- Estimated Billing Dashboard
- AWS Integration in Simulation Mode
- EC2 Configuration Preview and Management

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- SQLite
- JWT Authentication
- Boto3

## Project Structure

```text
CloudNova/
├── backend/
│   ├── main.py
│   ├── aws_service.py
│   └── cloudnova.db
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── database/
├── documentation/
└── infrastructure/
```

## Installation and Setup

### 1. Start Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload
```

Backend URL: http://127.0.0.1:8000

API Documentation: http://127.0.0.1:8000/docs

### 2. Start Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: http://localhost:5173

## Production Build

```powershell
cd frontend
npm run build
```

The production build is generated inside the `dist` folder.

## Important Notes

- Monitoring currently uses simulated demo metrics.
- Billing displays estimated demo costs, not actual cloud charges.
- AWS integration uses simulation mode.
- EC2 preview does not launch real AWS instances.
- Live AWS provisioning is not enabled by default.

## Project Status

CloudNova includes a working React frontend, FastAPI backend, authentication, resource management modules and AWS simulation features.

Further production hardening, automated testing and deployment configuration can be added in future development.

---

**CloudNova – One Dashboard. Multiple Cloud Resources.**