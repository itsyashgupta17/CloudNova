import { useEffect, useState } from "react";
import API_URL from "./config";

export default function Databases() {
  const [databases, setDatabases] = useState([]);
  const [name, setName] = useState("");
  const [engine] = useState("MongoDB");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // MongoDB Connection State
  const [mongoStatus, setMongoStatus] = useState(null);
  const [mongoUri, setMongoUri] = useState("");
  const [testingMongo, setTestingMongo] = useState(false);
  const [savingMongo, setSavingMongo] = useState(false);
  const [mongoFeedback, setMongoFeedback] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  // Get login token.
  const getAuthHeaders = () => {
    const token = localStorage.getItem("cloudnova_token");

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // Check MongoDB connection status.
  const fetchMongoStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/databases/mongodb/status`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setMongoStatus(data);
      }
    } catch {
      // Backend status endpoint not reached
    }
  };

  // Test MongoDB URI.
  const testMongoConnection = async () => {
    if (!mongoUri.trim()) {
      setMongoFeedback({ error: true, message: "Please enter a MongoDB connection URI to test." });
      return;
    }
    setTestingMongo(true);
    setMongoFeedback(null);
    try {
      const response = await fetch(`${API_URL}/databases/mongodb/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ uri: mongoUri.trim() }),
      });
      const data = await response.json();
      if (data.connected) {
        setMongoFeedback({
          success: true,
          message: `Connected successfully! MongoDB Server v${data.version || "active"}`,
        });
      } else {
        setMongoFeedback({
          error: true,
          message: data.error || "Connection failed. Please check your URI and network access.",
        });
      }
    } catch (err) {
      setMongoFeedback({ error: true, message: err.message || "Failed to reach backend." });
    } finally {
      setTestingMongo(false);
    }
  };

  // Save verified MongoDB URI.
  const saveMongoConfig = async () => {
    if (!mongoUri.trim()) {
      setMongoFeedback({ error: true, message: "Please enter a MongoDB connection URI." });
      return;
    }
    setSavingMongo(true);
    setMongoFeedback(null);
    try {
      const response = await fetch(`${API_URL}/databases/mongodb/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ uri: mongoUri.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to save MongoDB configuration.");
      }
      setMongoFeedback({
        success: true,
        message: "MongoDB connected and saved successfully!",
      });
      setMongoUri("");
      setShowConfig(false);
      await fetchMongoStatus();
    } catch (err) {
      setMongoFeedback({ error: true, message: err.message || "Failed to save configuration." });
    } finally {
      setSavingMongo(false);
    }
  };

  // Load databases.
  const fetchDatabases = async () => {
    try {
      const response = await fetch(`${API_URL}/databases`, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load databases");
      }

      setDatabases(data);
    } catch (error) {
      setMessage(error.message || "Unable to connect to backend.");
    }
  };

  useEffect(() => {
    fetchDatabases();
    fetchMongoStatus();
  }, []);

  // Create database.
  const createDatabase = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("Please enter a database name.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/databases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          name: name.trim(),
          engine,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Creation failed");
      }

      setName("");
      setMessage("Database created successfully!");
      await fetchDatabases();
    } catch (error) {
      setMessage(error.message || "Unable to create database.");
    } finally {
      setLoading(false);
    }
  };

  // Activate or deactivate database.
  const toggleStatus = async (database) => {
    const newStatus =
      database.status === "Active" ? "Inactive" : "Active";

    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/databases/${database.id}?status=${newStatus}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Status update failed");
      }

      setMessage(`Database ${newStatus.toLowerCase()} successfully!`);
      await fetchDatabases();
    } catch (error) {
      setMessage(error.message || "Unable to update database.");
    }
  };

  // Delete database.
  const deleteDatabase = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this database?"
      )
    ) {
      return;
    }

    setMessage("");

    try {
      const response = await fetch(`${API_URL}/databases/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Delete failed");
      }

      setMessage("Database deleted successfully!");
      await fetchDatabases();
    } catch (error) {
      setMessage(error.message || "Unable to delete database.");
    }
  };

  const cardStyle = {
    background: "#1e293b",
    padding: "clamp(16px, 2.5vw, 22px)",
    borderRadius: "12px",
    color: "#fff",
    border: "1px solid #334155",
  };

  return (
    <div style={{ padding: "clamp(16px, 3vw, 24px)", color: "#fff" }}>
      <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: "8px" }}>
        MongoDB Database Management
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
        Provision and manage dedicated MongoDB databases with live cluster synchronization.
      </p>

      {/* Database Statistics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
          gap: "16px",
          margin: "24px 0",
        }}
      >
        <div style={cardStyle}>
          <h3 style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "8px" }}>Total Databases</h3>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", color: "#60a5fa", margin: 0 }}>
            {databases.length}
          </h2>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "8px" }}>Active Databases</h3>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", color: "#4ade80", margin: 0 }}>
            {databases.filter((db) => db.status === "Active").length}
          </h2>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "8px" }}>Inactive Databases</h3>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", color: "#f87171", margin: 0 }}>
            {databases.filter((db) => db.status !== "Active").length}
          </h2>
        </div>
      </div>

      {/* MongoDB Integration Card */}
      <div style={{ ...cardStyle, marginBottom: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🍃</span>
              <h2 style={{ fontSize: "18px", margin: 0, fontWeight: "600" }}>
                MongoDB Live Connection
              </h2>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: "6px 0 0 0" }}>
              {mongoStatus?.connected
                ? `Connected to MongoDB (${mongoStatus.uri_masked || "Active Cluster"})`
                : mongoStatus?.configured
                ? "MongoDB configured, but server could not be reached."
                : "No MongoDB connection string configured yet."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "600",
                background: mongoStatus?.connected
                  ? "rgba(74, 222, 128, 0.15)"
                  : "rgba(248, 113, 113, 0.15)",
                color: mongoStatus?.connected ? "#4ade80" : "#f87171",
                border: mongoStatus?.connected
                  ? "1px solid rgba(74, 222, 128, 0.3)"
                  : "1px solid rgba(248, 113, 113, 0.3)",
              }}
            >
              ● {mongoStatus?.connected ? "Connected" : "Not Connected"}
            </span>

            <button
              type="button"
              onClick={() => {
                setShowConfig(!showConfig);
                setMongoFeedback(null);
              }}
              style={{
                padding: "8px 14px",
                background: "#334155",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              {showConfig ? "Close Settings" : "Configure MongoDB"}
            </button>
          </div>
        </div>

        {showConfig && (
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid #334155",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: "#cbd5e1",
                marginBottom: "8px",
              }}
            >
              MongoDB Connection URI (Atlas connection string or local MongoDB):
            </label>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <input
                type="password"
                value={mongoUri}
                onChange={(e) => setMongoUri(e.target.value)}
                placeholder="mongodb+srv://user:password@cluster0.xyz.mongodb.net/?retryWrites=true&w=majority"
                style={{
                  flex: "1 1 300px",
                  padding: "10px 14px",
                  background: "#0f172a",
                  color: "#fff",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              />
              <button
                type="button"
                onClick={testMongoConnection}
                disabled={testingMongo || savingMongo}
                style={{
                  padding: "10px 16px",
                  background: "#0284c7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {testingMongo ? "Testing..." : "Test Connection"}
              </button>
              <button
                type="button"
                onClick={saveMongoConfig}
                disabled={testingMongo || savingMongo}
                style={{
                  padding: "10px 16px",
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                {savingMongo ? "Saving..." : "Save Connection"}
              </button>
            </div>
            {mongoFeedback && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  background: mongoFeedback.success
                    ? "rgba(34, 197, 94, 0.15)"
                    : "rgba(239, 68, 68, 0.15)",
                  color: mongoFeedback.success ? "#4ade80" : "#fca5a5",
                  border: mongoFeedback.success
                    ? "1px solid rgba(34, 197, 94, 0.3)"
                    : "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                {mongoFeedback.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Database Form */}
      <form
        onSubmit={createDatabase}
        style={{
          ...cardStyle,
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
          alignItems: "center",
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="MongoDB database name (e.g. app_production)"
          required
          style={{
            padding: "12px 14px",
            flex: "1 1 200px",
            minWidth: "160px",
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #334155",
            borderRadius: "8px",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />

        <div
          style={{
            padding: "11px 16px",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "8px",
            color: "#4ade80",
            fontWeight: "600",
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxSizing: "border-box",
            minHeight: "44px",
          }}
          title="MongoDB is the dedicated database engine"
        >
          <span>🍃</span>
          <span>Engine: MongoDB</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="create-btn"
          style={{ minHeight: "44px" }}
        >
          {loading ? "Creating..." : "Create MongoDB Database"}
        </button>
      </form>

      {message && (
        <p style={{ color: "#38bdf8", marginBottom: "16px" }}>
          {message}
        </p>
      )}

      {/* Database List */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: "clamp(18px, 2.5vw, 22px)", marginBottom: "16px" }}>
          Your Databases
        </h2>

        {databases.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>No MongoDB databases found. Create your first database above.</p>
        ) : (
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table
              style={{
                width: "100%",
                minWidth: "480px",
                textAlign: "left",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                  <th style={{ padding: "12px 10px" }}>Database Name</th>
                  <th style={{ padding: "12px 10px" }}>Engine</th>
                  <th style={{ padding: "12px 10px" }}>Status</th>
                  <th style={{ padding: "12px 10px" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {databases.map((db) => (
                  <tr key={db.id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "14px 10px", fontWeight: "600" }}>{db.name}</td>
                    <td style={{ padding: "14px 10px", color: "#4ade80", fontWeight: "600" }}>🍃 {db.engine || "MongoDB"}</td>
                    <td style={{ padding: "14px 10px" }}>
                      <span
                        style={{
                          color: db.status === "Active" ? "#4ade80" : "#f87171",
                          fontWeight: "600",
                        }}
                      >
                        ● {db.status}
                      </span>
                    </td>

                    <td style={{ padding: "14px 10px" }}>
                      <button
                        className="action-btn"
                        onClick={() => toggleStatus(db)}
                        style={{ marginRight: "8px" }}
                      >
                        {db.status === "Active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => deleteDatabase(db.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
