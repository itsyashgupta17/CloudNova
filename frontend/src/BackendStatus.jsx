import { useEffect, useState } from "react";
import API_URL from "./config";

function BackendStatus() {
  const [status, setStatus] = useState("Checking...");
  const [server, setServer] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/status`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data) => {
        setStatus(data.status || "Online");
        setServer(data.server || "CloudNova");
      })
      .catch(() => {
        setStatus("Offline");
        setServer("CloudNova");
      });
  }, []);

  const isOnline = status === "Online";
  const isChecking = status === "Checking...";

  return (
    <div
      className="backend-status-pill"
      title={`Server: ${server || "CloudNova"} (${API_URL})`}
    >
      <span
        className={`status-dot ${
          isOnline ? "online" : isChecking ? "checking" : "offline"
        }`}
      />
      <span className="status-label">API: {status}</span>
    </div>
  );
}

export default BackendStatus;
