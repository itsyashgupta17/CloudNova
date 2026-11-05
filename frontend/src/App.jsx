
import { useState, useEffect } from "react";
import BackendStatus from "./BackendStatus";
import Storage from "./Storage";
import Databases from "./Databases";
import Networking from "./Networking";
import Monitoring from "./Monitoring";
import Billing from "./Billing";
import Login from "./Login";
import Signup from "./Signup";
import AWSStatus from "./AWSStatus";
import API_URL from "./config";
import "./App.css";

const menuItems = [
  { name: "Overview", icon: "▦" },
  { name: "Compute", icon: "🖥" },
  { name: "Storage", icon: "▤" },
  { name: "Databases", icon: "▣" },
  { name: "Networking", icon: "🌐" },
  { name: "Monitoring", icon: "📊" },
  { name: "Billing", icon: "💳" },
];

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [authPage, setAuthPage] = useState("login");

  const [token, setToken] = useState(
    () => localStorage.getItem("cloudnova_token")
  );

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [vms, setVms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [vmName, setVmName] = useState("");
  const [vmSize, setVmSize] = useState("2 vCPU / 4 GB");

  // EC2 configuration states
  const [ec2Name, setEc2Name] = useState("");
  const [ec2Region, setEc2Region] = useState("ap-south-1");
  const [ec2OS, setEc2OS] = useState("Ubuntu Server 24.04 LTS");
  const [ec2Type, setEc2Type] = useState("t3.micro");
  const [ec2Volume, setEc2Volume] = useState(8);

  const [ec2Preview, setEc2Preview] = useState(null);
  const [ec2Loading, setEc2Loading] = useState(false);
  const [ec2Error, setEc2Error] = useState("");

  // Validate saved login token.
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Session expired");
        }

        const userData = await response.json();
        setUser(userData.user);
      } catch (error) {
        localStorage.removeItem("cloudnova_token");
        setToken(null);
        setUser(null);
        console.error("Authentication error:", error);
      } finally {
        setAuthLoading(false);
      }
    }

    validateToken();
  }, [token]);

  // Load VMs for the logged-in user.
  useEffect(() => {
    if (!user || !token) return;

    async function loadVMs() {
      try {
        const response = await fetch(`${API_URL}/vms`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load VMs");
        }

        const data = await response.json();
        setVms(data);
      } catch (error) {
        console.error("VM loading error:", error);
      }
    }

    loadVMs();
  }, [user, token]);

  // Handle successful login.
  async function handleLoginSuccess(newToken) {
    localStorage.setItem("cloudnova_token", newToken);
    setToken(newToken);
  }

  // Logout.
  function handleLogout() {
    localStorage.removeItem("cloudnova_token");
    setToken(null);
    setUser(null);
    setVms([]);
    setShowForm(false);
    setEc2Preview(null);
    setEc2Error("");
    setActivePage("Overview");
    setAuthPage("login");
  }

  const runningCount = vms.filter(
    (vm) => vm.status === "Running"
  ).length;

  // Create demo VM in CloudNova database.
  async function createVM(e) {
    e.preventDefault();

    if (!vmName.trim()) return;

    try {
      const response = await fetch(`${API_URL}/vms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: vmName.trim(),
          size: vmSize,
        }),
      });

      if (!response.ok) {
        throw new Error("VM creation failed");
      }

      const newVM = await response.json();

      setVms((current) => [...current, newVM]);
      setVmName("");
      setShowForm(false);
    } catch (error) {
      alert("Unable to create VM. Please check backend.");
      console.error(error);
    }
  }

  // Generate safe EC2 configuration preview.
  async function previewEC2(e) {
    e.preventDefault();

    setEc2Loading(true);
    setEc2Error("");
    setEc2Preview(null);

    try {
      const response = await fetch(`${API_URL}/aws/ec2/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: ec2Name.trim(),
          region: ec2Region,
          operating_system: ec2OS,
          instance_type: ec2Type,
          volume_gb: Number(ec2Volume),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to generate EC2 preview"
        );
      }

      setEc2Preview(data);
    } catch (error) {
      setEc2Error(error.message);
    } finally {
      setEc2Loading(false);
    }
  }

  // Start or stop demo VM.
  async function toggleVM(id) {
    const vm = vms.find((item) => item.id === id);
    if (!vm) return;

    const newStatus =
      vm.status === "Running" ? "Stopped" : "Running";

    try {
      const response = await fetch(`${API_URL}/vms/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("VM update failed");
      }

      const updatedVM = await response.json();

      setVms((current) =>
        current.map((item) =>
          item.id === id ? updatedVM : item
        )
      );
    } catch (error) {
      alert("Unable to update VM status. Check backend.");
      console.error(error);
    }
  }

  // Delete demo VM.
  async function deleteVM(id) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this VM?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/vms/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("VM deletion failed");
      }

      setVms((current) =>
        current.filter((vm) => vm.id !== id)
      );
    } catch (error) {
      alert("Unable to delete VM. Please check backend.");
      console.error(error);
    }
  }

  // Authentication loading screen.
  if (authLoading) {
    return (
      <div className="auth-container">
        <h2>Loading CloudNova...</h2>
      </div>
    );
  }

  // Login and signup screens.
  if (!user) {
    return authPage === "signup" ? (
      <Signup
        onSwitch={() => setAuthPage("login")}
        onSignupSuccess={() => setAuthPage("login")}
      />
    ) : (
      <Login
        onSwitch={() => setAuthPage("signup")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const pageDescriptions = {
    Storage: "Manage your cloud storage and buckets.",
    Databases: "Manage your cloud databases.",
    Networking: "Manage networks and connections.",
    Monitoring: "Monitor your cloud infrastructure.",
    Billing: "Track your cloud usage and expenses.",
  };

  return (
    <div className="dashboard">
      <BackendStatus />

      <aside className="sidebar">
        <h2 className="logo">☁ CloudNova</h2>

        <p className="menu-title">MAIN MENU</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={
                activePage === item.name ? "active" : ""
              }
              onClick={() => setActivePage(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <a>⚙ Settings</a>
          <a>❔ Help & Support</a>

          <button onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>{activePage}</h2>
            <p>
              Welcome back, {user.name || user.email}!
            </p>
          </div>

          <div className="profile">
            👤 {user.name || "User"}
          </div>
        </header>

        {/* OVERVIEW PAGE */}
        {activePage === "Overview" && (
          <>
            <section className="welcome">
              <h1>Welcome to CloudNova 🚀</h1>
              <p>
                Manage your cloud infrastructure from one place.
              </p>
            </section>

            <AWSStatus />

            <h2 className="section-title">
              Resource Overview
            </h2>

            <section className="cards">
              <div className="card">
                <span>Virtual Machines</span>
                <h1>{vms.length}</h1>
                <p>{runningCount} running resources</p>
              </div>

              <div className="card">
                <span>Storage Used</span>
                <h1>256 GB</h1>
                <p>Cloud storage capacity</p>
              </div>

              <div className="card">
                <span>Databases</span>
                <h1>5</h1>
                <p>All systems operational</p>
              </div>

              <div className="card">
                <span>Monthly Billing</span>
                <h1>$128</h1>
                <p>Current estimated usage</p>
              </div>
            </section>

            <section className="bottom-section">
              <div className="panel">
                <h3>Recent Activity</h3>
                <p>🟢 Virtual Machine management enabled</p>
                <p>🟢 Cloud storage available</p>
                <p>🟢 Database connected</p>
              </div>

              <div className="panel">
                <h3>System Status</h3>
                <h2 className="status">
                  ● All Systems Operational
                </h2>
                <p>
                  Your cloud infrastructure is running smoothly.
                </p>
              </div>
            </section>
          </>
        )}

        {/* COMPUTE PAGE */}
        {activePage === "Compute" && (
          <section className="vm-page">
            <div className="vm-heading">
              <div>
                <h1>Virtual Machines</h1>
                <p>
                  Manage your cloud compute instances.
                </p>
              </div>

              <button
                className="create-btn"
                onClick={() => {
                  setShowForm(!showForm);
                  setEc2Preview(null);
                  setEc2Error("");
                }}
              >
                + Configure EC2
              </button>
            </div>

            <div className="vm-stats">
              <div className="vm-stat">
                <span>Total Machines</span>
                <h2>{vms.length}</h2>
              </div>

              <div className="vm-stat">
                <span>Running</span>
                <h2>{runningCount}</h2>
              </div>

              <div className="vm-stat">
                <span>Stopped</span>
                <h2>{vms.length - runningCount}</h2>
              </div>
            </div>

            {showForm && (
              <form className="vm-form" onSubmit={previewEC2}>
                <h3>Configure AWS EC2 Instance</h3>

                <p>
                  Simulation mode: preview configuration only.
                  No AWS instance will be launched.
                </p>

                <label>Instance Name</label>
                <input
                  value={ec2Name}
                  onChange={(e) => setEc2Name(e.target.value)}
                  placeholder="Enter instance name"
                  required
                />

                <label>AWS Region</label>
                <select
                  value={ec2Region}
                  onChange={(e) => setEc2Region(e.target.value)}
                >
                  <option value="ap-south-1">
                    Asia Pacific (Mumbai) - ap-south-1
                  </option>
                  <option value="ap-south-2">
                    Asia Pacific (Hyderabad) - ap-south-2
                  </option>
                  <option value="us-east-1">
                    US East (N. Virginia) - us-east-1
                  </option>
                </select>

                <label>Operating System</label>
                <select
                  value={ec2OS}
                  onChange={(e) => setEc2OS(e.target.value)}
                >
                  <option>Ubuntu Server 24.04 LTS</option>
                </select>

                <label>Instance Type</label>
                <select
                  value={ec2Type}
                  onChange={(e) => setEc2Type(e.target.value)}
                >
                  <option value="t3.micro">t3.micro</option>
                  <option value="t3.small">t3.small</option>
                  <option value="t3.medium">t3.medium</option>
                </select>

                <label>Storage Volume (GB)</label>
                <input
                  type="number"
                  min="8"
                  max="100"
                  value={ec2Volume}
                  onChange={(e) => setEc2Volume(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  className="create-btn"
                  disabled={ec2Loading}
                >
                  {ec2Loading
                    ? "Generating Preview..."
                    : "Generate EC2 Preview"}
                </button>
              </form>
            )}

            {ec2Error && (
              <div className="panel">
                <p style={{ color: "#f87171" }}>
                  {ec2Error}
                </p>
              </div>
            )}

            {ec2Preview && (
              <div className="panel" style={{ marginTop: "20px" }}>
                <h3>EC2 Configuration Preview</h3>

                <p>
                  <strong>Result:</strong>{" "}
                  {ec2Preview.success ? "Validated" : "Failed"}
                </p>

                <p>
                  <strong>Mode:</strong> {ec2Preview.mode}
                </p>

                <p>{ec2Preview.message}</p>

                {ec2Preview.configuration && (
                  <>
                    <p>
                      <strong>Name:</strong>{" "}
                      {ec2Preview.configuration.name}
                    </p>
                    <p>
                      <strong>Region:</strong>{" "}
                      {ec2Preview.configuration.region}
                    </p>
                    <p>
                      <strong>OS:</strong>{" "}
                      {ec2Preview.configuration.operating_system}
                    </p>
                    <p>
                      <strong>Instance Type:</strong>{" "}
                      {ec2Preview.configuration.instance_type}
                    </p>
                    <p>
                      <strong>Storage:</strong>{" "}
                      {ec2Preview.configuration.volume_gb} GB
                    </p>
                  </>
                )}

                <p>
                  <strong>Estimated Cost:</strong>{" "}
                  {ec2Preview.estimated_cost}
                </p>

                <p style={{ color: "#fbbf24" }}>
                  No real AWS resources have been created.
                </p>
              </div>
            )}

            <div className="vm-table">
              <h3>Existing Virtual Machines</h3>

              <div className="vm-table-head">
                <span>Name</span>
                <span>Configuration</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {vms.map((vm) => (
                <div className="vm-row" key={vm.id}>
                  <strong>{vm.name}</strong>
                  <span>{vm.size}</span>

                  <span
                    className={
                      vm.status === "Running"
                        ? "running"
                        : "stopped"
                    }
                  >
                    ● {vm.status}
                  </span>

                  <div className="vm-actions">
                    <button
                      className="action-btn"
                      onClick={() => toggleVM(vm.id)}
                    >
                      {vm.status === "Running" ? "Stop" : "Start"}
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteVM(vm.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {vms.length === 0 && (
                <p className="empty-state">
                  No virtual machines. Configure your first EC2 preview!
                </p>
              )}
            </div>
          </section>
        )}

        {/* OTHER PAGES */}
        {activePage === "Storage" && <Storage />}
        {activePage === "Databases" && <Databases />}
        {activePage === "Networking" && <Networking />}
        {activePage === "Monitoring" && <Monitoring />}
        {activePage === "Billing" && <Billing />}

        {activePage !== "Overview" &&
          activePage !== "Compute" &&
          activePage !== "Storage" &&
          activePage !== "Databases" &&
          activePage !== "Networking" &&
          activePage !== "Monitoring" &&
          activePage !== "Billing" && (
            <section className="page-content">
              <div className="page-icon">☁️</div>
              <h1>{activePage}</h1>
              <p>{pageDescriptions[activePage]}</p>

              <div className="coming-soon">
                <h3>🚀 {activePage} Management</h3>
                <p>This module is ready for development.</p>
              </div>
            </section>
          )}
      </main>
    </div>
  );
}

export default App;
