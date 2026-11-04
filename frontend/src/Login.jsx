import React, { useState } from "react";
import "./Auth.css";

function Login({ onSwitch, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("cloudnova_token", data.access_token);
      onLoginSuccess?.(data.access_token);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>CloudNova</h1>
        <h2>Welcome Back</h2>
        <p>Login to access your cloud dashboard.</p>

        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging In..." : "Login"}
        </button>

        {message && <div className="auth-message">{message}</div>}

        <div className="auth-switch">
          Don't have an account?{" "}
          <span onClick={onSwitch}>Sign Up</span>
        </div>
      </form>
    </div>
  );
}

export default Login;