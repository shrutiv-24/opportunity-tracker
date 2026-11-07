import React, { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import AppForm from "../components/AppForm.jsx";

const STATUSES = ["Planned", "Applied", "Interview", "Selected", "Rejected"];
const TYPES = ["Internship", "Scholarship", "Fellowship", "Competition", "Other"];

function daysLeft(deadline) {
  if (!deadline) return null;
  const diff = Math.ceil((new Date(deadline) - new Date(new Date().toDateString())) / 86400000);
  return diff;
}

export default function Dashboard({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, byStatus: [], upcoming: [] });
  const [filters, setFilters] = useState({ q: "", status: "", type: "" });
  const [editing, setEditing] = useState(null); // null | {} (new) | item
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [list, st] = await Promise.all([api.list(filters), api.stats()]);
      setItems(list);
      setStats(st);
      setError("");
    } catch (e) {
      if (e.status === 401) return onLogout();
      setError(e.message);
    }
  }, [filters, onLogout]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  async function save(data) {
    if (data.id) await api.update(data.id, data);
    else await api.create(data);
    setEditing(null);
    load();
  }

  async function changeStatus(item, status) {
    await api.update(item.id, { status });
    load();
  }

  async function remove(item) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await api.remove(item.id);
    load();
  }

  const count = (s) => stats.byStatus.find((x) => x.status === s)?.count || 0;

  return (
    <div className="container">
      <header className="top">
        <div>
          <h1>Hi, {user.name.split(" ")[0]} 👋</h1>
          <p className="muted">Your internship &amp; scholarship pipeline</p>
        </div>
        <div className="row">
          <button className="primary" onClick={() => setEditing({})}>+ Add</button>
          <button onClick={onLogout}>Log out</button>
        </div>
      </header>

      <section className="stats">
        <div className="stat"><b>{stats.total}</b><span>Total</span></div>
        {STATUSES.map((s) => (
          <div key={s} className={`stat s-${s}`}>
            <b>{count(s)}</b><span>{s}</span>
          </div>
        ))}
      </section>

      {stats.upcoming.length > 0 && (
        <section className="card">
          <h3>⏰ Upcoming deadlines</h3>
          <ul className="plain">
            {stats.upcoming.map((u) => {
              const d = daysLeft(u.deadline);
              return (
                <li key={u.id}>
                  <b>{u.title}</b> · {u.organization} —{" "}
                  <span className={d <= 3 ? "danger" : ""}>
                    {d === 0 ? "today" : `${d} day${d === 1 ? "" : "s"} left`} ({u.deadline})
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="filters">
        <input
          placeholder="Search title or organization…"
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </section>

      {error && <div className="error">{error}</div>}

      <section className="list">
        {items.length === 0 && (
          <div className="card muted">Nothing here yet. Click “+ Add” to track your first opportunity.</div>
        )}
        {items.map((it) => {
          const d = daysLeft(it.deadline);
          return (
            <article key={it.id} className="card item">
              <div className="item-main">
                <h3>{it.title}</h3>
                <p className="muted">{it.organization} · {it.type}</p>
                {it.deadline && (
                  <p className={d !== null && d <= 3 && d >= 0 ? "danger" : "muted"}>
                    Deadline: {it.deadline}
                    {d !== null && d >= 0 ? ` (${d}d left)` : d < 0 ? " (passed)" : ""}
                  </p>
                )}
                {it.notes && <p className="notes">{it.notes}</p>}
                {it.link && (
                  <a href={it.link} target="_blank" rel="noreferrer">Open link ↗</a>
                )}
              </div>
              <div className="item-side">
                <select
                  className={`badge s-${it.status}`}
                  value={it.status}
                  onChange={(e) => changeStatus(it, e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <div className="row">
                  <button onClick={() => setEditing(it)}>Edit</button>
                  <button className="danger-btn" onClick={() => remove(it)}>Delete</button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {editing && (
        <AppForm
          initial={editing}
          types={TYPES}
          statuses={STATUSES}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
