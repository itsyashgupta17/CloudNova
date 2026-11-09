# CloudNova — Comprehensive Services User Manual

**Version**: 1.0.0  
**Application URL**: [https://cloud-nova-five.vercel.app/](https://cloud-nova-five.vercel.app/)  
**API Documentation**: [https://cloudnova-api.onrender.com/docs](https://cloudnova-api.onrender.com/docs)  
**Target Audience**: Developers, System Administrators, Cloud Architects, Students, and Evaluators

---

## Table of Contents

1. [Platform Overview & Architecture](#1-platform-overview--architecture)
2. [Service 1: Authentication & Identity Management (IAM)](#2-service-1-authentication--identity-management-iam)
3. [Service 2: Compute & Virtual Machines (EC2 Engine)](#3-service-2-compute--virtual-machines-ec2-engine)
4. [Service 3: Cloud Object Storage (Buckets)](#4-service-3-cloud-object-storage-buckets)
5. [Service 4: MongoDB Database Provisioning](#5-service-4-mongodb-database-provisioning)
6. [Service 5: VPC Virtual Networking & IP Routing](#6-service-5-vpc-virtual-networking--ip-routing)
7. [Service 6: Infrastructure Monitoring & Telemetry](#7-service-6-infrastructure-monitoring--telemetry)
8. [Service 7: FinOps, Billing & Cost Estimation](#8-service-7-finops-billing--cost-estimation)
9. [Service 8: AWS EC2 Simulation & Cloud Gateway](#9-service-8-aws-ec2-simulation--cloud-gateway)
10. [Troubleshooting & FAQ](#10-troubleshooting--faq)

---

## 1. Platform Overview & Architecture

CloudNova is an all-in-one cloud infrastructure management and simulation platform. It gives organizations and learners a unified control plane to manage compute workloads, storage capacity, database clusters, virtual networks, and cost forecasts.

### Architecture Summary
- **Frontend**: React 19 Single Page Application (SPA) built with Vite 8.
- **Backend**: Asynchronous Python FastAPI REST API running on Uvicorn.
- **Database**: SQLite 3 with Write-Ahead Logging (WAL) and strict foreign key enforcement.
- **Cloud Interface**: Boto3 SDK with zero-cost simulation safeguards.

---

## 2. Service 1: Authentication & Identity Management (IAM)

### 2.1 Description & Purpose
Provides secure identity management, registration, session persistence, and brute-force protection. Every cloud resource created on CloudNova is strictly mapped to the authenticated user ID.

### 2.2 Specifications & Parameters
| Field | Type | Validation Rules | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | 1–100 characters | User's full legal or display name |
| `email` | String (EmailStr) | Valid email format, case-insensitive, unique | Primary login credential |
| `password` | String | Minimum 8 characters | Plaintext password hashed via Scrypt |

### 2.3 Security Features
- **Scrypt Cryptographic Hashing**: Passwords stored as `salt_hex:hash_hex` using CPU/memory-hard Scrypt (`n=16384, r=8, p=1`).
- **Sliding-Window Brute Force Rate Limiter**: 5 consecutive failed attempts trigger an automatic 15-minute lockout for that IP/email pair (`HTTP 429 Too Many Requests`).
- **JWT Stateless Authentication**: HS256 signed bearer token with 30-minute expiration window.

### 2.4 How to Use
1. **Sign Up**: Navigate to the login screen, click **"Sign Up"**, enter Name, Email, and Password, then click **"Sign Up"**.
2. **Login**: Enter registered Email and Password, click **"Login"**.
3. **Session Check**: The app automatically requests `GET /me` with the `Authorization: Bearer <token>` header on page refresh.

### 2.5 REST API Reference
- `POST /signup` — Register new user account.
- `POST /login` — Authenticate and receive JWT access token.
- `GET /me` — Retrieve current authenticated user profile.

---

## 3. Service 2: Compute & Virtual Machines (EC2 Engine)

### 3.1 Description & Purpose
Manages virtual machines and cloud compute instances. Users can track running resources, simulate instance provisioning, toggle lifecycle states, and generate AWS EC2 instance deployment plans.

### 3.2 Configuration Parameters (EC2 Preview Generator)
| Parameter | Permitted Values | Default | Purpose |
| :--- | :--- | :--- | :--- |
| `name` | String (Alpha-numeric, hyphens) | Required | Friendly identifier for the instance |
| `region` | `ap-south-1`, `ap-south-2`, `us-east-1` | `ap-south-1` | Target AWS geographic region |
| `operating_system` | `Ubuntu Server 24.04 LTS` | Ubuntu 24.04 | Base operating system image |
| `instance_type` | `t3.micro`, `t3.small`, `t3.medium` | `t3.micro` | Virtual hardware sizing (vCPU/RAM) |
| `volume_gb` | Integer (`8` to `100` GB) | `8` | Elastic Block Store (EBS) root volume |

### 3.3 Hardware Specifications
- **t3.micro**: 2 vCPUs, 1.0 GiB RAM, Low-to-Moderate network bandwidth.
- **t3.small**: 2 vCPUs, 2.0 GiB RAM, Network burst up to 5 Gbps.
- **t3.medium**: 2 vCPUs, 4.0 GiB RAM, Network burst up to 5 Gbps.

### 3.4 How to Use
1. Navigate to **Compute** (`🖥 Compute`).
2. **Review Summary Metrics**: Inspect Total, Running, and Stopped instance counters.
3. **Start / Stop Instance**: Click **"Stop"** on a running machine to pause it without deleting data. Click **"Start"** to resume execution.
4. **Configure AWS EC2**: Click **"+ Configure EC2"**, enter your instance name, select region and instance type, choose volume size, and click **"Generate EC2 Preview"**.
5. **Delete Instance**: Click **"Delete"** to permanently release the compute resource.

### 3.5 REST API Reference
- `GET /vms` — Fetch all virtual machines owned by the authenticated user.
- `POST /vms` — Provision a new virtual machine.
- `PATCH /vms/{id}` — Update VM status (`Running` / `Stopped`).
- `DELETE /vms/{id}` — Terminate and delete VM record.
- `POST /aws/ec2/preview` — Generate validated EC2 instance preview and cost estimation.

---

## 4. Service 3: Cloud Object Storage (Buckets)

### 4.1 Description & Purpose
Provides scalable, S3-compatible cloud object storage abstractions. Enables users to organize files, media, and backups into designated storage buckets with real-time capacity analytics.

### 4.2 Specifications & Parameters
| Field | Type | Validation Rules | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | 1–100 characters, unique | Globally unique bucket name |
| `size_gb` | Integer | Minimum 1 GB | Allocated storage quota in gigabytes |

### 4.3 Automated Aggregate Analytics
- **Total Buckets**: Dynamic count of user buckets.
- **Total Storage Capacity**: Sum of all `size_gb` values ($\sum \text{Capacity}$).
- **Average Bucket Size**: Mean allocation per bucket ($\frac{\text{Total GB}}{N}$).

### 4.4 How to Use
1. Navigate to **Storage** (`▤ Storage`).
2. In the **Create Bucket** form:
   - Enter a distinct bucket name (e.g. `assets-media-bucket`).
   - Enter desired storage size in GB (e.g. `25`).
   - Click **"Create Bucket"**.
3. View the newly created bucket card showing its allocated capacity.
4. To remove a bucket, click **"Delete"** and confirm.

### 4.5 REST API Reference
- `GET /storage/buckets` — List all user buckets.
- `POST /storage/buckets` — Create new bucket allocation.
- `DELETE /storage/buckets/{id}` — Delete storage bucket.

---

## 5. Service 4: MongoDB Database Provisioning

### 5.1 Description & Purpose
Allows developers to provision and manage managed database clusters with dedicated MongoDB support, including live connection testing, URI configuration, and cluster synchronization.

### 5.2 Supported Database Engines
1. **MongoDB**: Document-oriented NoSQL database for flexible JSON/BSON data models, live cluster synchronization, and real-time operations.

### 5.3 Specifications & Parameters
| Field | Type | Validation Rules | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Unique string, 1–100 chars | Database instance name |
| `engine` | Enum | `MongoDB` | Selected database engine (MongoDB only) |
| `status` | Enum | `Active`, `Inactive` | Current operational state |

### 5.4 How to Use
1. Navigate to **Databases** (`▣ Databases`).
2. Review statistics cards: Total, Active, and Inactive databases.
3. In the form:
   - Enter **Database Name** (e.g., `prod_analytics`).
   - The database engine is preset to **MongoDB** (exclusive database engine).
   - Click **"Create Database"**.
4. In the database list:
   - Click **"Deactivate"** to place the database on standby.
   - Click **"Activate"** to return it to active servicing.
   - Click **"Delete"** to drop the database.

### 5.5 REST API Reference
- `GET /databases` — List all provisioned databases.
- `POST /databases` — Provision a new database instance.
- `PATCH /databases/{id}?status={Active|Inactive}` — Update operational status.
- `DELETE /databases/{id}` — Delete database instance.

---

## 6. Service 5: VPC Virtual Networking & IP Routing

### 6.1 Description & Purpose
Enables users to design isolated software-defined virtual networks (Virtual Private Clouds / VPCs), configure CIDR IP addressing blocks, and assign geographic deployment zones.

### 6.2 Pre-Configured CIDR Address Ranges
- **`10.0.0.0/16`**: Class A private network. Provides 65,536 private IP addresses (`10.0.0.0` – `10.0.255.255`). Recommended for large production environments.
- **`172.16.0.0/16`**: Class B private network. Provides 65,536 private IP addresses (`172.16.0.0` – `172.16.255.255`). Suitable for staging and medium enterprise clusters.
- **`192.168.0.0/24`**: Class C private network. Provides 256 private IP addresses (`192.168.0.0` – `192.168.0.255`). Best for microservices and test environments.

### 6.3 How to Use
1. Navigate to **Networking** (`🌐 Networking`).
2. Enter a **Network Name** (e.g., `vpc-apac-prod`).
3. Select an IP **CIDR Block** (`10.0.0.0/16`, `172.16.0.0/16`, or `192.168.0.0/24`).
4. Select a **Geographic Region** (`Asia Pacific`, `US East`, or `Europe`).
5. Click **"+ Create Network"**. The backend verifies subnet syntax using Python's `ipaddress` library before saving.
6. Toggle network status between `Active` and `Inactive` as needed.

### 6.4 REST API Reference
- `GET /networks` — Retrieve all user virtual networks.
- `POST /networks` — Create and validate a new virtual network.
- `PATCH /networks/{id}` — Modify network status.
- `DELETE /networks/{id}` — Delete network routing record.

---

## 7. Service 6: Infrastructure Monitoring & Telemetry

### 7.1 Description & Purpose
Provides continuous observability and infrastructure health monitoring. Simulates live server telemetry and resource utilization to allow proactive capacity planning.

### 7.2 Telemetry Metrics
1. **CPU Usage (%)**: Evaluates computational processing pressure (normal operating range: 20%–70%).
2. **Memory Utilization (%)**: Measures RAM consumption (baseline: 50%–80%).
3. **Network Throughput (Mbps)**: Monitors ingress/egress bandwidth consumption (10 Mbps–80 Mbps).
4. **Server Availability**: Tracks infrastructure uptime percentage (stable at 99.9%).

### 7.3 Refresh Mechanism
- The telemetry polling engine refreshes values every **3,000 milliseconds (3 seconds)**.
- Color-coded progress indicators:
  - 🟣 Indigo: CPU
  - 🔵 Cyan: Memory
  - 🟢 Emerald: Network Throughput
  - 🟡 Amber: System Availability

---

## 8. Service 7: FinOps, Billing & Cost Estimation

### 8.1 Description & Purpose
Helps cloud practitioners implement Financial Operations (FinOps) best practices by delivering transparent cost visibility, service-by-service cost attribution, and monthly expenditure estimations in Indian Rupees (₹).

### 8.2 Default Service Allocation Matrix
| Service Category | Monthly Cost (INR) | Proportional Share | Notes |
| :--- | :--- | :--- | :--- |
| **Compute Engine** | ₹750 | 60.0% | Based on active VM instances & runtime |
| **Cloud Storage** | ₹300 | 24.0% | Based on cumulative allocated gigabytes |
| **Managed Databases** | ₹200 | 16.0% | Engine licensing and provisioned memory |
| **Total Estimated Spend** | **₹1,250** | **100%** | Predictable demo monthly billing estimate |

---

## 9. Service 8: AWS EC2 Simulation & Cloud Gateway

### 9.1 Description & Purpose
Connects CloudNova to Amazon Web Services using the official AWS Boto3 SDK. Features an automated safeguard mode (`AWS_ENABLED=false`) allowing students and developers to practice real AWS configurations without surprise cloud bills.

### 9.2 Operating Modes
1. **Simulation Mode (`AWS_ENABLED=false`)**:
   - Safely parses and validates AWS EC2 instance definitions, regions, operating systems, and EBS volumes.
   - Computes realistic pricing models without calling live AWS EC2 launch APIs.
   - Guaranteed $0.00 cloud invoice risk.
2. **Live Connected Mode (`AWS_ENABLED=true`)**:
   - Uses AWS IAM access keys (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).
   - Performs live region availability checks via `ec2.describe_regions()`.
   - Displays real-time green connection badges on the dashboard.

### 9.3 REST API Reference
- `GET /aws/status` — Returns current AWS provider mode and connection status.
- `POST /aws/ec2/preview` — Generates a validated EC2 launch preview.

---

## 10. Troubleshooting & FAQ

### Q1: Why does the topbar show "API: Offline"?
- **Cause**: The FastAPI backend is initializing or paused on Render.
- **Resolution**: Free Render instances sleep after inactivity. Wait 30–45 seconds for cold start, or refresh the page.

### Q2: Why does an input field shake or reject my CIDR network?
- **Cause**: Invalid IP subnet format.
- **Resolution**: Select one of the standard recommended CIDR blocks (`10.0.0.0/16`, `172.16.0.0/16`, `192.168.0.0/24`).

### Q3: How do I access CloudNova on my smartphone?
- Open [https://cloud-nova-five.vercel.app/](https://cloud-nova-five.vercel.app/) on mobile Safari or Chrome.
- Tap the **Hamburger menu icon (`☰`)** in the top header to reveal the navigation drawer.
- The interface automatically resizes to full mobile width without horizontal overflow.

### Q4: Will I be charged on my credit card for creating EC2 instances?
- **No.** CloudNova operates in safe simulation mode by default. No real instances are launched on AWS unless you explicitly configure live AWS keys in your own environment.
