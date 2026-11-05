
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
        setStatus(data.status);
        setServer(data.server);
      })
      .catch(() => {
        setStatus("Offline");
        setServer("CloudNova");
      });
  }, []);

  return (
    <div>
      <h3>Backend Connection</h3>
      <p>Server: {server || "CloudNova"}</p>
      <p>Status: {status}</p>
    </div>
  );
}

export default BackendStatus;
