
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
    padding: "20px",
    borderRadius: "12px",
    color: "#fff",
  };

  return (
    <div style={{ padding: "24px", color: "#fff" }}>
      <h1>Database Management</h1>

      <p style={{ color: "#94a3b8" }}>
        Create and manage your CloudNova database records.
      </p>

      {/* Database Statistics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          margin: "24px 0",
        }}
      >
        <div style={cardStyle}>
          <h3>Total Databases</h3>
          <h2>{databases.length}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Active Databases</h3>
          <h2>
            {databases.filter((db) => db.status === "Active").length}
          </h2>
        </div>

        <div style={cardStyle}>
          <h3>Inactive Databases</h3>
          <h2>
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
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Database name"
          required
          style={{
            padding: "12px",
            flex: "1",
            minWidth: "180px",
          }}
        />

        <select
          value={engine}
          onChange={(e) => setEngine(e.target.value)}
          style={{ padding: "12px" }}
        >
          <option>PostgreSQL</option>
          <option>MySQL</option>
          <option>MongoDB</option>
          <option>SQLite</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "12px 20px" }}
        >
          {loading ? "Creating..." : "Create Database"}
        </button>
      </form>

      {message && <p>{message}</p>}

      {/* Database List */}
      <div style={cardStyle}>
        <h2>Your Databases</h2>

        {databases.length === 0 ? (
          <p>No databases found. Create your first database above.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                textAlign: "left",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={{ padding: "12px" }}>Name</th>
                  <th style={{ padding: "12px" }}>Engine</th>
                  <th style={{ padding: "12px" }}>Status</th>
                  <th style={{ padding: "12px" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {databases.map((db) => (
                  <tr key={db.id}>
                    <td style={{ padding: "12px" }}>{db.name}</td>
                    <td style={{ padding: "12px" }}>{db.engine}</td>
                    <td style={{ padding: "12px" }}>{db.status}</td>

                    <td style={{ padding: "12px" }}>
                      <button onClick={() => toggleStatus(db)}>
                        {db.status === "Active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>{" "}

                      <button onClick={() => deleteDatabase(db.id)}>
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
