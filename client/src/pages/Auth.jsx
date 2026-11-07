import React, { useState } from "react";
import { api } from "../api.js";

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data =
        mode === "login"
          ? await api.login({ email: form.email, password: form.password })
          : await api.register(form);
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="center">
      <form className="card auth" onSubmit={submit}>
        <h1>Opportunity Tracker</h1>
        <p className="muted">
          Track internships, scholarships and deadlines in one place.
        </p>

        {mode === "register" && (
          <input placeholder="Full name" value={form.name} onChange={set("name")} required />
        )}
        <input type="email" placeholder="Email" value={form.email} onChange={set("email")} required />
        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={form.password}
          onChange={set("password")}
          required
        />

        {error && <div className="error">{error}</div>}

        <button className="primary" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>

        <p className="muted small">
          {mode === "login" ? "New here? " : "Already have an account? "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setError("");
              setMode(mode === "login" ? "register" : "login");
            }}
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </a>
        </p>
      </form>
    </div>
  );
}
