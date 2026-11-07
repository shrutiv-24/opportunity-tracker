import React, { useState } from "react";

export default function AppForm({ initial, types, statuses, onSave, onClose }) {
  const [f, setF] = useState({
    title: "",
    organization: "",
    type: "Internship",
    status: "Planned",
    deadline: "",
    link: "",
    notes: "",
    ...initial,
    deadline: initial.deadline || "",
    link: initial.link || "",
    notes: initial.notes || "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(f);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="card modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{f.id ? "Edit opportunity" : "Add opportunity"}</h2>

        <label>Title
          <input value={f.title} onChange={set("title")} placeholder="e.g. Summer Research Internship" required />
        </label>
        <label>Organization
          <input value={f.organization} onChange={set("organization")} placeholder="e.g. IIT Bombay" required />
        </label>

        <div className="grid2">
          <label>Type
            <select value={f.type} onChange={set("type")}>
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>Status
            <select value={f.status} onChange={set("status")}>
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <label>Deadline
          <input type="date" value={f.deadline} onChange={set("deadline")} />
        </label>
        <label>Link
          <input type="url" value={f.link} onChange={set("link")} placeholder="https://…" />
        </label>
        <label>Notes
          <textarea rows="3" value={f.notes} onChange={set("notes")} placeholder="Documents needed, contacts, etc." />
        </label>

        {error && <div className="error">{error}</div>}

        <div className="row end">
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
