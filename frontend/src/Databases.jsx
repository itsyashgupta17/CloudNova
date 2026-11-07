import { useEffect, useState } from "react";
import API_URL from "./config";

export default function Databases() {
  const [databases, setDatabases] = useState([]);
  const [name, setName] = useState("");
  const [engine, setEngine] = useState("PostgreSQL");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Get login token.
  const getAuthHeaders = () => {
    const token = localStorage.getItem("cloudnova_token");

    return {
      Authorization: `Bearer ${token}`,
    };
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
        Database Management
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
        Create and manage your CloudNova database records.
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
          placeholder="Database name"
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

        <select
          value={engine}
          onChange={(e) => setEngine(e.target.value)}
          style={{
            padding: "12px 14px",
            flex: "1 1 140px",
            minWidth: "140px",
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #334155",
            borderRadius: "8px",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        >
          <option>PostgreSQL</option>
          <option>MySQL</option>
          <option>MongoDB</option>
          <option>SQLite</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="create-btn"
          style={{ minHeight: "44px" }}
        >
          {loading ? "Creating..." : "Create Database"}
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
          <p style={{ color: "#94a3b8" }}>No databases found. Create your first database above.</p>
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
                  <th style={{ padding: "12px 10px" }}>Name</th>
                  <th style={{ padding: "12px 10px" }}>Engine</th>
                  <th style={{ padding: "12px 10px" }}>Status</th>
                  <th style={{ padding: "12px 10px" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {databases.map((db) => (
                  <tr key={db.id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "14px 10px", fontWeight: "600" }}>{db.name}</td>
                    <td style={{ padding: "14px 10px", color: "#cbd5e1" }}>{db.engine}</td>
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
