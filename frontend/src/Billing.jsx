import React from "react";

const Billing = () => {
  const total = 1250;
  const compute = 750;
  const storage = 300;
  const databases = 200;

  const services = [
    { name: "Compute", amount: compute, color: "#6366f1" },
    { name: "Storage", amount: storage, color: "#06b6d4" },
    { name: "Databases", amount: databases, color: "#10b981" },
  ];

  const cardStyle = {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "clamp(16px, 2.5vw, 22px)",
  };

  return (
    <div style={{ padding: "clamp(16px, 3vw, 30px)", color: "#e2e8f0" }}>
      <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", marginBottom: "8px" }}>
        Billing & Usage
      </h1>

      <p style={{ color: "#94a3b8", marginBottom: "24px" }}>
        View your estimated CloudNova service costs.
      </p>

      <div style={{
        ...cardStyle,
        marginBottom: "22px",
        borderColor: "#6366f1",
      }}>
        <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>
          Estimated Monthly Cost
        </p>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 38px)", margin: "12px 0", color: "#60a5fa" }}>
          ₹{total.toLocaleString("en-IN")}
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "13px", margin: 0 }}>
          Demo estimate — not an actual bill.
        </p>
      </div>

      <h2 style={{ fontSize: "clamp(18px, 2.5vw, 20px)", marginBottom: "16px" }}>
        Service Breakdown
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
        gap: "18px",
      }}>
        {services.map((service) => (
          <div key={service.name} style={cardStyle}>
            <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>
              {service.name}
            </p>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 27px)", margin: "12px 0" }}>
              ₹{service.amount.toLocaleString("en-IN")}
            </h2>

            <div style={{
              height: "8px",
              background: "#334155",
              borderRadius: "10px",
              overflow: "hidden",
            }}>
              <div style={{
                width: `${(service.amount / total) * 100}%`,
                height: "100%",
                background: service.color,
              }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, marginTop: "25px" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "10px" }}>Billing Information</h3>
        <p style={{ color: "#94a3b8", lineHeight: 1.7, fontSize: "14px", margin: 0 }}>
          Billing period: Current month<br />
          Currency: INR (₹)<br />
          Payment status: Demo mode
        </p>
      </div>
    </div>
  );
};

export default Billing;
