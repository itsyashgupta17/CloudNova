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
    <div style={{ padding: "clamp(16px, 3vw, 24px)", color: "#fff" }}>
      <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: "8px" }}>
        Networking Management
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
        Manage your virtual networks and IP address ranges.
      </p>

      {/* Network Statistics */}
      <div style={statsGridStyle}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "8px" }}>Total Networks</h3>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", color: "#60a5fa", margin: 0 }}>{networks.length}</h2>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "8px" }}>Active Networks</h3>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", color: "#4ade80", margin: 0 }}>{activeCount}</h2>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "8px" }}>Inactive Networks</h3>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", color: "#f87171", margin: 0 }}>{inactiveCount}</h2>
        </div>
      </div>

      {/* Create Network Form */}
      <form
        onSubmit={createNetwork}
        style={{
          ...cardStyle,
          marginBottom: "24px",
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", marginBottom: "4px" }}>
          <h2 style={{ fontSize: "clamp(18px, 2.5vw, 20px)", margin: 0 }}>Create Virtual Network</h2>
        </div>

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
          className="create-btn"
          disabled={submitting}
          style={{ minHeight: "44px" }}
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
        <h2 style={{ fontSize: "clamp(18px, 2.5vw, 22px)", marginBottom: "16px" }}>Your Networks</h2>

        {loading ? (
          <p style={{ color: "#94a3b8" }}>Loading networks...</p>
        ) : networks.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>No networks created yet.</p>
        ) : (
          networks.map((network) => (
            <div key={network.id} style={networkRowStyle}>
              <div>
                <strong style={{ fontSize: "16px", color: "#f1f5f9" }}>{network.name}</strong>

                <p style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0" }}>
                  {network.cidr} · {network.region}
                </p>

                <span
                  style={{
                    color:
                      network.status === "Active"
                        ? "#4ade80"
                        : "#f87171",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  ● {network.status}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  className="action-btn"
                  onClick={() => toggleNetwork(network)}
                >
                  {network.status === "Active"
                    ? "Deactivate"
                    : "Activate"}
                </button>

                <button
                  className="delete-btn"
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
  padding: "clamp(16px, 2.5vw, 22px)",
  borderRadius: "12px",
  border: "1px solid #334155",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
  gap: "16px",
  margin: "24px 0",
};

const inputStyle = {
  padding: "12px 14px",
  flex: "1 1 180px",
  minWidth: "150px",
  background: "#0f172a",
  color: "#fff",
  border: "1px solid #334155",
  borderRadius: "8px",
  fontSize: "16px",
  boxSizing: "border-box",
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
