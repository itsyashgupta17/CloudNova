import React, { useState } from "react";
import API_URL from "./config";
import "./Auth.css";

function Signup({ onSwitch, onSignupSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Signup failed");
      }

      setMessage("Account created successfully!");
      onSignupSuccess?.(form.email);
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
        <h2>Create Account</h2>
        <p>Start your cloud journey today.</p>

        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password (minimum 8 characters)"
          value={form.password}
          onChange={handleChange}
          minLength={8}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        {message && <div className="auth-message">{message}</div>}

        <div className="auth-switch">
          Already have an account?{" "}
          <span onClick={onSwitch}>Login</span>
        </div>
      </form>
    </div>
  );
}

export default Signup;