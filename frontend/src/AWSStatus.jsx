import { useEffect, useState } from "react";
import API_URL from "./config";

function AWSStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAWSStatus = async () => {
      try {
        const token = localStorage.getItem("cloudnova_token");

        const response = await fetch(`${API_URL}/aws/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unable to fetch AWS status");
        }

        const data = await response.json();
        setStatus(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAWSStatus();
  }, []);

  return (
    <div style={{
      background: "#172033",
      color: "white",
      padding: "clamp(16px, 2.5vw, 22px)",
      borderRadius: "12px",
      marginBottom: "20px",
      border: "1px solid #334155",
      overflowWrap: "anywhere",
    }}>
      <h3 style={{ marginTop: 0, fontSize: "clamp(16px, 2.2vw, 18px)" }}>AWS EC2 Integration</h3>

      {loading && <p style={{ color: "#94a3b8", fontSize: "14px" }}>Checking AWS status...</p>}

      {error && (
        <p style={{ color: "#f87171", fontSize: "14px" }}>{error}</p>
      )}

      {status && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
          <p style={{ margin: 0, fontSize: "14px" }}>
            Provider: <strong>{status.provider}</strong>
          </p>
          <p style={{ margin: 0, fontSize: "14px" }}>
            Mode: <strong>{status.mode}</strong>
          </p>
          <p style={{ margin: 0, fontSize: "14px" }}>
            Connection:{" "}
            <strong style={{
              color: status.connected ? "#4ade80" : "#fbbf24"
            }}>
              {status.connected ? "Connected" : "Simulation Mode"}
            </strong>
          </p>
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0 0" }}>
            {status.message}
          </p>
        </div>
      )}
    </div>
  );
}

export default AWSStatus;
