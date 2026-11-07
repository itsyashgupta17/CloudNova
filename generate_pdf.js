const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outputPath = path.join(__dirname, 'documentation', 'CloudNova_Services_User_Manual.pdf');

// Create document with 50pt margins
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 55, bottom: 55, left: 50, right: 50 },
  bufferPages: true,
  autoFirstPage: true
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Colors
const NAVY = '#0f172a';
const BLUE = '#2563eb';
const LIGHT_BLUE = '#3b82f6';
const DARK_GRAY = '#334155';
const MUTED = '#64748b';
const BORDER_COLOR = '#e2e8f0';
const BG_PANEL = '#f8fafc';
const ACCENT_GREEN = '#16a34a';

function drawHeaderFooter(pageNumber, totalPages) {
  if (pageNumber === 1) return; // Skip cover page

  // Header
  doc.save();
  doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold')
    .text('CLOUDNOVA — COMPREHENSIVE SERVICES USER MANUAL', 50, 28, { align: 'left' });
  doc.fontSize(8).fillColor(MUTED).font('Helvetica')
    .text('v1.0.0 | Production', 50, 28, { align: 'right' });
  doc.strokeColor(BORDER_COLOR).lineWidth(0.5).moveTo(50, 40).lineTo(545, 40).stroke();

  // Footer
  doc.strokeColor(BORDER_COLOR).lineWidth(0.5).moveTo(50, 785).lineTo(545, 785).stroke();
  doc.fontSize(8).fillColor(MUTED).font('Helvetica')
    .text('Confidential & Proprietary — CloudNova Cloud Platform', 50, 795, { align: 'left' });
  doc.fontSize(8).fillColor(MUTED).font('Helvetica-Bold')
    .text(`Page ${pageNumber} of ${totalPages}`, 50, 795, { align: 'right' });
  doc.restore();
}

function addSectionTitle(number, title) {
  doc.moveDown(1.2);
  doc.save();
  doc.fontSize(16).fillColor(NAVY).font('Helvetica-Bold')
    .text(`${number}. ${title}`);
  doc.strokeColor(BLUE).lineWidth(2).moveTo(50, doc.y + 4).lineTo(150, doc.y + 4).stroke();
  doc.moveDown(0.8);
  doc.restore();
}

function addSubTitle(title) {
  doc.moveDown(0.6);
  doc.fontSize(12).fillColor(BLUE).font('Helvetica-Bold')
    .text(title);
  doc.moveDown(0.4);
}

function addParagraph(text) {
  doc.fontSize(9.5).fillColor(DARK_GRAY).font('Helvetica').lineGap(3)
    .text(text);
  doc.moveDown(0.5);
}

function addBullet(label, text) {
  doc.fontSize(9.5).fillColor(NAVY).font('Helvetica-Bold')
    .text(`• ${label}: `, { continued: true })
    .font('Helvetica').fillColor(DARK_GRAY)
    .text(text);
  doc.moveDown(0.3);
}

function addCalloutBox(title, body, color = BLUE) {
  const boxTop = doc.y;
  const width = 495;
  doc.save();
  doc.rect(50, boxTop, width, 55).fillAndStroke(BG_PANEL, BORDER_COLOR);
  doc.rect(50, boxTop, 4, 55).fill(color);
  doc.fontSize(9.5).fillColor(NAVY).font('Helvetica-Bold').text(title, 65, boxTop + 10);
  doc.fontSize(9).fillColor(DARK_GRAY).font('Helvetica').text(body, 65, boxTop + 26, { width: 465 });
  doc.restore();
  doc.y = boxTop + 65;
}

// ==========================================
// 1. COVER PAGE
// ==========================================
doc.rect(0, 0, 595, 842).fill('#0b1120');

// Decorative top accent bar
doc.rect(0, 0, 595, 12).fill(BLUE);

// Logo Icon / Text
doc.fontSize(38).fillColor('#60a5fa').font('Helvetica-Bold')
  .text('☁ CloudNova', 50, 160);

doc.fontSize(16).fillColor('#94a3b8').font('Helvetica')
  .text('Unified Cloud Infrastructure Management & Simulation Platform', 50, 210);

doc.strokeColor('#334155').lineWidth(1.5).moveTo(50, 250).lineTo(545, 250).stroke();

doc.fontSize(28).fillColor('#ffffff').font('Helvetica-Bold')
  .text('Services User Manual', 50, 280);

doc.fontSize(13).fillColor('#cbd5e1').font('Helvetica')
  .text('Comprehensive Operational & Technical Guide to CloudNova Services', 50, 320);

// Feature tags box
const tagY = 380;
const tags = ['Compute & EC2 Engine', 'S3 Object Storage', 'Multi-Engine DBs', 'VPC Networks', 'Live Telemetry', 'FinOps Billing'];
doc.fontSize(9.5).font('Helvetica-Bold');
let curX = 50;
let curY = tagY;
tags.forEach(tag => {
  doc.rect(curX, curY, 140, 26).fillAndStroke('#1e293b', '#334155');
  doc.fillColor('#60a5fa').text(tag, curX + 10, curY + 8);
  curX += 150;
  if (curX > 400) {
    curX = 50;
    curY += 36;
  }
});

// Meta Information Block
const metaY = 560;
doc.rect(50, metaY, 495, 170).fillAndStroke('#151f32', '#263650');

doc.fontSize(11).fillColor('#60a5fa').font('Helvetica-Bold')
  .text('SYSTEM INFORMATION & DEPLOYMENTS', 70, metaY + 20);

doc.fontSize(9.5).fillColor('#cbd5e1').font('Helvetica');
doc.text('• Live Web Application:', 70, metaY + 45)
  .fillColor('#38bdf8').text('https://cloud-nova-five.vercel.app/', 210, metaY + 45);

doc.fillColor('#cbd5e1').text('• Backend API (Render):', 70, metaY + 68)
  .fillColor('#38bdf8').text('https://cloudnova-api.onrender.com', 210, metaY + 68);

doc.fillColor('#cbd5e1').text('• Interactive Swagger Docs:', 70, metaY + 91)
  .fillColor('#38bdf8').text('https://cloudnova-api.onrender.com/docs', 210, metaY + 91);

doc.fillColor('#cbd5e1').text('• Version & Security Status:', 70, metaY + 114)
  .fillColor('#4ade80').text('v1.0.0 | Enterprise Scrypt & JWT Secured', 210, metaY + 114);

doc.fillColor('#cbd5e1').text('• AWS Safe Mode Guard:', 70, metaY + 137)
  .fillColor('#fbbf24').text('ACTIVE (Zero Cloud Cost Simulation Mode)', 210, metaY + 137);

doc.fontSize(9).fillColor('#64748b').font('Helvetica')
  .text('© 2026 CloudNova Infrastructure Systems. All rights reserved.', 50, 770, { align: 'center' });

// ==========================================
// 2. TABLE OF CONTENTS & ARCHITECTURE
// ==========================================
doc.addPage();

doc.fontSize(20).fillColor(NAVY).font('Helvetica-Bold')
  .text('Table of Contents');
doc.strokeColor(BLUE).lineWidth(2).moveTo(50, doc.y + 4).lineTo(130, doc.y + 4).stroke();
doc.moveDown(1.5);

const tocItems = [
  { num: '1', title: 'Platform Overview & 3-Tier Architecture', page: '2' },
  { num: '2', title: 'Service 1: Authentication & Identity Management (IAM)', page: '3' },
  { num: '3', title: 'Service 2: Compute & Virtual Machines (EC2 Engine)', page: '4' },
  { num: '4', title: 'Service 3: Cloud Object Storage (Buckets Service)', page: '5' },
  { num: '5', title: 'Service 4: Multi-Engine Database Provisioning', page: '6' },
  { num: '6', title: 'Service 5: VPC Virtual Networking & IP Routing', page: '7' },
  { num: '7', title: 'Service 6: Infrastructure Monitoring & Telemetry', page: '8' },
  { num: '8', title: 'Service 7: FinOps, Billing & Cost Estimation', page: '8' },
  { num: '9', title: 'Service 8: AWS EC2 Simulation & Cloud Gateway', page: '9' },
  { num: '10', title: 'Cross-Device Responsiveness (Mobile & Laptop)', page: '9' },
  { num: '11', title: 'Troubleshooting & Frequently Asked Questions (FAQ)', page: '10' }
];

tocItems.forEach(item => {
  doc.fontSize(10).fillColor(NAVY).font('Helvetica-Bold')
    .text(`${item.num}. ${item.title}`, 60, doc.y, { continued: true })
    .fillColor(MUTED).font('Helvetica')
    .text(` .......................................................................................... Page ${item.page}`, { align: 'right' });
  doc.moveDown(0.4);
});

doc.moveDown(1.5);
addSectionTitle('1', 'Platform Overview & 3-Tier Architecture');

addParagraph('CloudNova is a production-ready, full-stack cloud management platform designed to unify resource provisioning, telemetry observability, and financial modeling across simulated and live cloud environments.');

addSubTitle('Architecture Stack');
addBullet('Presentation Layer', 'React 19 with Vite 8. Highly optimized bundle served over Vercel Edge CDN with sub-second hot-reloads and responsive CSS layout.');
addBullet('Application API Layer', 'FastAPI (Python 3.10+). Asynchronous ASGI architecture delivering sub-15ms response latency, strict Pydantic v2 data models, and automatic OpenAPI schema generation.');
addBullet('Data Storage Layer', 'SQLite 3 with Write-Ahead Logging (WAL) and foreign key constraints, providing complete ACID compliance and multi-user relational safety.');
addBullet('Cloud SDK Gateway', 'Amazon Web Services (AWS) Boto3 and Botocore Python SDK with automated development safeguards.');

addCalloutBox(
  'Security & Cost Zero-Risk Safeguard',
  'CloudNova includes an integrated AWS safety lock (AWS_ENABLED=false) guaranteeing that all student and developer testing operates within a $0.00 cloud invoice ceiling.',
  ACCENT_GREEN
);

// ==========================================
// 3. SERVICE 1: AUTHENTICATION & IAM
// ==========================================
doc.addPage();
addSectionTitle('2', 'Service 1: Authentication & Identity Management (IAM)');

addParagraph('The CloudNova IAM service provides cryptographic authentication, user isolation, and brute-force intrusion prevention. Every cloud resource (VM, database, bucket, network) is bound strictly to the owner\'s identity.');

addSubTitle('Key Specifications & Technical Security');
addBullet('Password Hashing Algorithm', 'Scrypt Key Derivation Function (KDF) using N=16384, r=8, p=1 and 16-byte cryptographically secure random salts. Stored as salt_hex:hash_hex.');
addBullet('Stateless Token Security', 'JSON Web Tokens (JWT) using HMAC-SHA256 (HS256) encryption with a 30-minute expiration window.');
addBullet('Brute-Force Rate Limiter', 'In-memory sliding window algorithm monitoring (IP, Email) pairs. Exceeding 5 failed attempts locks authentication for 15 minutes with HTTP 429 Too Many Requests.');

addSubTitle('Step-by-Step Usage Instructions');
doc.fontSize(9.5).fillColor(DARK_GRAY).font('Helvetica')
  .text('1. Open CloudNova at https://cloud-nova-five.vercel.app/. If not logged in, the Authentication screen opens.\n' +
        '2. Click "Sign Up" at the bottom of the card.\n' +
        '3. Enter your Full Name, Email Address, and Password (minimum 8 characters).\n' +
        '4. Click "Sign Up" to register. The backend verifies uniqueness and saves the encrypted credentials.\n' +
        '5. Log in with your email and password. Upon successful verification, your JWT token is stored in localStorage.');

doc.moveDown(0.8);
addSubTitle('REST API Endpoints Reference');
doc.fontSize(9).font('Courier').fillColor(NAVY)
  .text('POST /signup                 - Body: { name, email, password } -> Creates account\n' +
        'POST /login                  - Body: { email, password } -> Returns { access_token, token_type }\n' +
        'GET  /me                     - Headers: Authorization: Bearer <token> -> Returns user identity');

// ==========================================
// 4. SERVICE 2: COMPUTE & VIRTUAL MACHINES
// ==========================================
doc.addPage();
addSectionTitle('3', 'Service 2: Compute & Virtual Machines (EC2 Engine)');

addParagraph('The Compute service provides complete lifecycle control over virtual machine instances and generates validated AWS EC2 instance deployment previews.');

addSubTitle('Supported Virtual Machine Specifications');
addBullet('t3.micro', '2 vCPUs, 1.0 GiB RAM, baseline burst performance. Ideal for microservices and test web servers.');
addBullet('t3.small', '2 vCPUs, 2.0 GiB RAM, network bursts up to 5 Gbps. Suitable for staging and moderate databases.');
addBullet('t3.medium', '2 vCPUs, 4.0 GiB RAM, dual vCPU capacity. Recommended for production application workloads.');

addSubTitle('AWS EC2 Instance Preview Parameters');
addBullet('Instance Name', 'Custom identifier adhering to AWS naming guidelines (e.g. Web-Cluster-Prod-01).');
addBullet('Geographic Regions', 'ap-south-1 (Mumbai), ap-south-2 (Hyderabad), us-east-1 (N. Virginia).');
addBullet('Operating System', 'Ubuntu Server 24.04 LTS (x86_64 architecture).');
addBullet('Storage Disk', 'General Purpose SSD (gp3) volume sizing from 8 GB up to 100 GB.');

addSubTitle('Step-by-Step Usage Guide');
doc.fontSize(9.5).fillColor(DARK_GRAY).font('Helvetica')
  .text('1. Navigate to "Compute" (🖥 Compute) in the sidebar or mobile menu.\n' +
        '2. Review the summary metrics: Total Machines, Running instances, and Stopped instances.\n' +
        '3. To stop a running machine: Click the blue "Stop" button. The status switches to "● Stopped".\n' +
        '4. To restart a machine: Click "Start". The status immediately updates to "● Running".\n' +
        '5. To delete a machine: Click "Delete" and confirm the deletion dialog.\n' +
        '6. To configure a new EC2 instance: Click "+ Configure EC2". Enter the instance name, choose the region and instance type, enter disk size in GB, and click "Generate EC2 Preview".\n' +
        '7. The system generates an immediate validation report with estimated hourly and monthly operating costs.');

doc.moveDown(0.8);
addSubTitle('REST API Endpoints Reference');
doc.fontSize(9).font('Courier').fillColor(NAVY)
  .text('GET    /vms                  - Returns list of user virtual machines\n' +
        'POST   /vms                  - Body: { name, size } -> Creates new VM\n' +
        'PATCH  /vms/{id}             - Body: { status } -> Updates VM status (Running/Stopped)\n' +
        'DELETE /vms/{id}             - Permanently deletes VM record\n' +
        'POST   /aws/ec2/preview      - Body: { name, region, operating_system, instance_type, volume_gb }');

// ==========================================
// 5. SERVICE 3: CLOUD STORAGE
// ==========================================
doc.addPage();
addSectionTitle('4', 'Service 3: Cloud Object Storage (Buckets Service)');

addParagraph('The Cloud Storage service mimics Amazon S3 and Google Cloud Storage buckets, enabling organized cloud storage quotas with dynamic capacity calculation.');

addSubTitle('Storage Analytics Engine');
addBullet('Total Buckets', 'Dynamic tally of all active storage buckets assigned to the authenticated user.');
addBullet('Total Storage Capacity', 'Cumulative sum of all allocated storage gigabytes across the fleet.');
addBullet('Average Bucket Size', 'Calculated arithmetic mean (Total Storage GB ÷ Total Buckets).');

addSubTitle('Step-by-Step Usage Guide');
doc.fontSize(9.5).fillColor(DARK_GRAY).font('Helvetica')
  .text('1. Click "Storage" (▤ Storage) from the navigation panel.\n' +
        '2. Inspect the analytics cards at the top of the view.\n' +
        '3. In the "Create Bucket" form, enter a unique bucket name (e.g., "customer-invoices-2026").\n' +
        '4. Enter the storage size in gigabytes (e.g., 50).\n' +
        '5. Click "Create Bucket". The backend persists the bucket and instantly refreshes total capacity.\n' +
        '6. To remove an obsolete bucket, click "Delete" on the target bucket row.');

doc.moveDown(0.8);
addSubTitle('REST API Endpoints Reference');
doc.fontSize(9).font('Courier').fillColor(NAVY)
  .text('GET    /storage/buckets      - List all buckets with allocated size_gb\n' +
        'POST   /storage/buckets      - Body: { name, size_gb } -> Allocates new bucket\n' +
        'DELETE /storage/buckets/{id} - Removes bucket from database');

// ==========================================
// 6. SERVICE 4: MULTI-ENGINE DATABASES
// ==========================================
addSectionTitle('5', 'Service 4: Multi-Engine Database Provisioning');

addParagraph('CloudNova provides multi-engine database cluster management supporting relational SQL and unstructured NoSQL document architectures.');

addSubTitle('Supported Database Engines');
addBullet('PostgreSQL', 'Enterprise object-relational SQL database with strong consistency and JSONB support.');
addBullet('MySQL', 'High-throughput relational SQL database optimized for web workloads and read scalability.');
addBullet('MongoDB', 'Distributed document-oriented NoSQL database supporting flexible BSON/JSON schemas.');
addBullet('SQLite', 'Lightweight serverless embedded relational engine for micro-services and testing.');

addSubTitle('Operational Lifecycle Management');
doc.fontSize(9.5).fillColor(DARK_GRAY).font('Helvetica')
  .text('1. Open "Databases" (▣ Databases).\n' +
        '2. Enter a Database Name (e.g. "inventory_db") and select an engine.\n' +
        '3. Click "Create Database". The new database appears in the overview table.\n' +
        '4. Toggle database availability: Click "Deactivate" to suspend connections, or "Activate" to restore.\n' +
        '5. Click "Delete" to permanently drop the database cluster.');

// ==========================================
// 7. SERVICE 5: VPC NETWORKING
// ==========================================
doc.addPage();
addSectionTitle('6', 'Service 5: VPC Virtual Networking & IP Routing');

addParagraph('The Networking service provisions software-defined Virtual Private Clouds (VPC) with strict IPv4 CIDR subnet validation and multi-region routing.');

addSubTitle('Pre-Validated Network CIDR Ranges');
addBullet('10.0.0.0/16', 'Class A private IP block (65,536 addresses). Default for corporate enterprise cloud architectures.');
addBullet('172.16.0.0/16', 'Class B private IP block (65,536 addresses). Suitable for staging clusters and development suites.');
addBullet('192.168.0.0/24', 'Class C private subnet (256 addresses). Optimal for microservices and isolated testing environments.');

addSubTitle('Subnet Validation Engine');
addParagraph('All submitted CIDR notations are parsed through Python\'s native ipaddress.ip_network() library. Invalid IP masks or malformed addresses are automatically rejected before database insertion.');

addSubTitle('Step-by-Step Usage Guide');
doc.fontSize(9.5).fillColor(DARK_GRAY).font('Helvetica')
  .text('1. Navigate to "Networking" (🌐 Networking).\n' +
        '2. Enter your Network Name (e.g., "prod-vpc-mumbai").\n' +
        '3. Select your CIDR range from the dropdown menu.\n' +
        '4. Choose your deployment region (Asia Pacific, US East, or Europe).\n' +
        '5. Click "+ Create Network". The validated VPC is stored and active.\n' +
        '6. Toggle between "Active" and "Inactive" status, or delete expired networks.');

// ==========================================
// 8. SERVICE 6 & 7: MONITORING & BILLING
// ==========================================
doc.moveDown(1.2);
addSectionTitle('7', 'Service 6: Infrastructure Monitoring & Telemetry');

addParagraph('Provides real-time system observability. Telemetry values update dynamically every 3 seconds to reflect fluctuating computational pressure.');

addBullet('CPU Usage (%)', 'Real-time microprocessor consumption with dynamic load simulation (20% – 70%).');
addBullet('Memory Usage (%)', 'Active RAM utilization tracker with capacity alerts (50% – 80%).');
addBullet('Network Traffic (Mbps)', 'Inbound and outbound bandwidth throughput monitoring (10 – 80 Mbps).');
addBullet('Server Uptime (%)', 'Service availability tracker maintained at 99.9% uptime SLA.');

doc.moveDown(1.2);
addSectionTitle('8', 'Service 7: FinOps, Billing & Cost Estimation');

addParagraph('Enables cloud financial management (FinOps) by attributing estimated monthly costs in Indian Rupees (₹).');

doc.fontSize(9).font('Courier').fillColor(NAVY)
  .text('+------------------------+------------------+-----------------+\n' +
        '| Service Category       | Monthly Cost (₹) | Percentage      |\n' +
        '+------------------------+------------------+-----------------+\n' +
        '| Compute Engine         | ₹750             | 60.0%           |\n' +
        '| Cloud Storage          | ₹300             | 24.0%           |\n' +
        '| Managed Databases      | ₹200             | 16.0%           |\n' +
        '+------------------------+------------------+-----------------+\n' +
        '| TOTAL ESTIMATED SPEND  | ₹1,250 / month   | 100.0%          |\n' +
        '+------------------------+------------------+-----------------+');

// ==========================================
// 9. SERVICE 8 & RESPONSIVE DESIGN
// ==========================================
doc.addPage();
addSectionTitle('9', 'Service 8: AWS EC2 Simulation & Cloud Gateway');

addParagraph('CloudNova integrates with Amazon Web Services through the official Boto3 SDK, guarded by an automatic simulation switch.');

addSubTitle('Safe Mode vs. Live AWS Mode');
addBullet('Simulation Mode (AWS_ENABLED=false)', 'Default operational mode. Evaluates instance configurations, valid operating systems, and disk volumes without invoking live AWS billing APIs. Guaranteed $0 cloud invoice.');
addBullet('Live Connected Mode (AWS_ENABLED=true)', 'Uses configured AWS IAM credentials to query active AWS region endpoints via ec2.describe_regions().');

doc.moveDown(1.2);
addSectionTitle('10', 'Cross-Device Responsiveness (Mobile & Laptop)');

addParagraph('CloudNova is engineered using mobile-first CSS architecture with fluid viewport typography:');

addBullet('Desktop & Laptop (Width >= 992px)', 'Permanent docked navigation sidebar (250px), multi-column resource overview cards, spacious tables, and instant menu access.');
addBullet('Smartphone & Tablet (Width < 992px)', 'Full-width 100% viewport utilization. Sidebar transitions into an off-canvas slide-out drawer accessible via the top hamburger button (☰). Includes dark backdrop blur, touch-close button (✕), and horizontal scrollable tables (-webkit-overflow-scrolling: touch).');

// ==========================================
// 10. TROUBLESHOOTING & FAQ
// ==========================================
doc.moveDown(1.2);
addSectionTitle('11', 'Troubleshooting & Frequently Asked Questions (FAQ)');

addBullet('Q: Topbar shows "API: Offline"?', 'Render free-tier instances sleep when inactive. Please allow 30–45 seconds for backend cold start, then refresh the browser.');
addBullet('Q: How do I test on my smartphone?', 'Open https://cloud-nova-five.vercel.app/ on your phone browser. Tap the ☰ icon in the top header to reveal the navigation menu.');
addBullet('Q: Will generating EC2 instances charge my card?', 'No. CloudNova operates in zero-cost simulation mode by default. No real instances are created on AWS.');
addBullet('Q: How do I run automated unit tests?', 'Run "pytest backend/tests -v" from the repository. All 23 automated unit and integration tests will execute.');

// Draw header and footers across all buffered pages
const totalPages = doc.bufferedPageRange().count;
for (let i = 0; i < totalPages; i++) {
  doc.switchToPage(i);
  drawHeaderFooter(i + 1, totalPages);
}

doc.end();

writeStream.on('finish', () => {
  console.log(`PDF successfully created at: ${outputPath}`);
});
