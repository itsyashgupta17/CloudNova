
import { useEffect, useState } from "react";

function AWSStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAWSStatus = async () => {
      try {
        const token = localStorage.getItem("cloudnova_token");

        const response = await fetch("http://127.0.0.1:8000/aws/status", {
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
      padding: "20px",
      borderRadius: "12px",
      marginBottom: "20px",
      border: "1px solid #334155"
    }}>
      <h3 style={{ marginTop: 0 }}>AWS EC2 Integration</h3>

      {loading && <p>Checking AWS status...</p>}

      {error && (
        <p style={{ color: "#f87171" }}>{error}</p>
      )}

      {status && (
        <>
          <p>
            Provider: <strong>{status.provider}</strong>
          </p>
          <p>
            Mode: <strong>{status.mode}</strong>
          </p>
          <p>
            Connection:{" "}
            <strong style={{
              color: status.connected ? "#4ade80" : "#fbbf24"
            }}>
              {status.connected ? "Connected" : "Simulation Mode"}
            </strong>
          </p>
          <p style={{ color: "#94a3b8", fontSize: "13px" }}>
            {status.message}
          </p>
        </>
      )}
    </div>
  );
}

export default AWSStatus;
