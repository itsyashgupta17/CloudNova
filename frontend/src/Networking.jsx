
import { useEffect, useState } from "react";

import API_URL from "./config";

export default function Networking() {
  const [networks, setNetworks] = useState([]);
  const [name, setName] = useState("");
  const [cidr, setCidr] = useState("10.0.0.0/16");
  const [region, setRegion] = useState("Asia Pacific");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("cloudnova_token");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Load networks from backend
  const fetchNetworks = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/networks`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Session expired. Please login again."
            : "Unable to load networks."
        );
      }

      const data = await response.json();
      setNetworks(data);
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
  }, []);

  // Create network
  const createNetwork = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name.trim()) {
      setMessage("Please enter a network name.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/networks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          cidr,
          region,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create network.");
      }

      setNetworks((current) => [...current, data]);
      setName("");
      setMessage("Network created successfully!");
    } catch (error) {
      setMessage(error.message || "Unable to create network.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete network
  const deleteNetwork = async (id) => {
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/networks/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete network.");
      }

      setNetworks((current) =>
        current.filter((network) => network.id !== id)
      );

      setMessage("Network deleted successfully!");
    } catch (error) {
      setMessage(error.message || "Unable to delete network.");
    }
  };

  // Activate / Deactivate network
  const toggleNetwork = async (network) => {
    setMessage("");

    const newStatus =
      network.status === "Active" ? "Inactive" : "Active";

    try {
      const response = await fetch(
        `${API_URL}/networks/${network.id}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update network.");
      }

      setNetworks((current) =>
        current.map((item) =>
          item.id === network.id ? data : item
        )
      );

      setMessage(`Network ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      setMessage(error.message || "Unable to update network.");
    }
  };

  const activeCount = networks.filter(
    (network) => network.status === "Active"
  ).length;

  const inactiveCount = networks.filter(
    (network) => network.status === "Inactive"
  ).length;

  return (
    <div style={{ padding: "24px", color: "#fff" }}>
      <h1>Networking Management</h1>

      <p style={{ color: "#94a3b8" }}>
        Manage your virtual networks and IP address ranges.
      </p>

      {/* Network Statistics */}
      <div style={statsGridStyle}>
        <div style={cardStyle}>
          <h3>Total Networks</h3>
          <h2>{networks.length}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Active Networks</h3>
          <h2>{activeCount}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Inactive Networks</h3>
          <h2>{inactiveCount}</h2>
        </div>
      </div>

      {/* Create Network Form */}
      <form
        onSubmit={createNetwork}
        style={{ ...cardStyle, marginBottom: "24px" }}
      >
        <h2>Create Virtual Network</h2>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Network name"
          maxLength={100}
          required
          style={inputStyle}
        />

        <select
          value={cidr}
          onChange={(e) => setCidr(e.target.value)}
          style={inputStyle}
        >
          <option value="10.0.0.0/16">10.0.0.0/16</option>
          <option value="172.16.0.0/16">172.16.0.0/16</option>
          <option value="192.168.0.0/24">192.168.0.0/24</option>
        </select>

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={inputStyle}
        >
          <option>Asia Pacific</option>
          <option>US East</option>
          <option>Europe</option>
        </select>

        <button
          type="submit"
          style={buttonStyle}
          disabled={submitting}
        >
          {submitting ? "Creating..." : "+ Create Network"}
        </button>
      </form>

      {/* Messages */}
      {message && (
        <p style={{ color: "#38bdf8", marginBottom: "16px" }}>
          {message}
        </p>
      )}

      {/* Network List */}
      <div style={cardStyle}>
        <h2>Your Networks</h2>

        {loading ? (
          <p>Loading networks...</p>
        ) : networks.length === 0 ? (
          <p>No networks created yet.</p>
        ) : (
          networks.map((network) => (
            <div key={network.id} style={networkRowStyle}>
              <div>
                <strong>{network.name}</strong>

                <p style={{ color: "#94a3b8" }}>
                  {network.cidr} · {network.region}
                </p>

                <span
                  style={{
                    color:
                      network.status === "Active"
                        ? "#22c55e"
                        : "#f87171",
                  }}
                >
                  {network.status}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  style={buttonStyle}
                  onClick={() => toggleNetwork(network)}
                >
                  {network.status === "Active"
                    ? "Deactivate"
                    : "Activate"}
                </button>

                <button
                  style={deleteStyle}
                  onClick={() => deleteNetwork(network.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


// =====================================
// STYLES
// =====================================

const cardStyle = {
  background: "#1e293b",
  padding: "20px",
  borderRadius: "12px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  margin: "24px 0",
};

const inputStyle = {
  padding: "12px",
  margin: "8px 8px 8px 0",
  borderRadius: "6px",
};

const buttonStyle = {
  padding: "10px 16px",
  cursor: "pointer",
};

const deleteStyle = {
  ...buttonStyle,
  background: "#dc2626",
  color: "#fff",
  border: "none",
};

const networkRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  padding: "16px 0",
  borderBottom: "1px solid #334155",
};
