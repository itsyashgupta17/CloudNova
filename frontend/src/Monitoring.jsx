
import React, { useEffect, useState } from "react";

const Monitoring = () => {
  const [metrics, setMetrics] = useState({
    cpu: 42,
    memory: 65,
    network: 28,
    uptime: 99.9,
  });

  // Demo metrics: values update automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 50) + 20,
        memory: Math.floor(Math.random() * 30) + 50,
        network: Math.floor(Math.random() * 70) + 10,
        uptime: 99.9,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const cards = [
    { name: "CPU Usage", value: metrics.cpu, unit: "%", color: "#6366f1" },
    { name: "Memory Usage", value: metrics.memory, unit: "%", color: "#06b6d4" },
    { name: "Network Traffic", value: metrics.network, unit: " Mbps", color: "#10b981" },
    { name: "Server Uptime", value: metrics.uptime, unit: "%", color: "#f59e0b" },
  ];

  const container = {
    padding: "30px",
    color: "#e2e8f0",
  };

  const cardStyle = {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "22px",
  };

  return (
    <div style={container}>
      <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>
        Monitoring
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: "28px" }}>
        Monitor your CloudNova resource performance.
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px",
      }}>
        {cards.map((card) => (
          <div key={card.name} style={cardStyle}>
            <p style={{ color: "#94a3b8", margin: 0 }}>{card.name}</p>

            <h2 style={{ fontSize: "30px", margin: "15px 0" }}>
              {card.value}{card.unit}
            </h2>

            {card.name !== "Server Uptime" && (
              <div style={{
                height: "8px",
                background: "#334155",
                borderRadius: "10px",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${card.value}%`,
                  height: "100%",
                  background: card.color,
                  borderRadius: "10px",
                  transition: "width 0.5s",
                }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        ...cardStyle,
        marginTop: "25px",
      }}>
        <h3>System Health</h3>
        <p style={{ color: "#10b981" }}>
          ● All demo monitoring indicators are operational
        </p>
        <p style={{ color: "#94a3b8", fontSize: "13px" }}>
          Metrics refresh every 3 seconds. These are simulated values,
          not measurements from a real server.
        </p>
      </div>
    </div>
  );
};

export default Monitoring;
