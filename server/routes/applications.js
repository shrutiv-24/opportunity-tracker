const express = require("express");
const db = require("../db");
const { requireAuth } = require("../auth");

const router = express.Router();
router.use(requireAuth);

const TYPES = ["Internship", "Scholarship", "Fellowship", "Competition", "Other"];
const STATUSES = ["Planned", "Applied", "Interview", "Selected", "Rejected"];

function validate(body) {
  const { title, organization, type, status } = body || {};
  if (!title || !title.trim()) return "Title is required";
  if (!organization || !organization.trim()) return "Organization is required";
  if (type && !TYPES.includes(type)) return "Invalid type";
  if (status && !STATUSES.includes(status)) return "Invalid status";
  return null;
}

// List (with optional ?status= & ?type= & ?q=)
router.get("/", (req, res) => {
  const { status, type, q } = req.query;
  let sql = "SELECT * FROM applications WHERE user_id = ?";
  const params = [req.user.id];
  if (status) { sql += " AND status = ?"; params.push(status); }
  if (type) { sql += " AND type = ?"; params.push(type); }
  if (q) {
    sql += " AND (title LIKE ? OR organization LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  sql += " ORDER BY CASE WHEN deadline IS NULL OR deadline = '' THEN 1 ELSE 0 END, deadline ASC, id DESC";
  res.json(db.prepare(sql).all(...params));
});

// Dashboard stats
router.get("/stats", (req, res) => {
  const uid = req.user.id;
  const byStatus = db
    .prepare("SELECT status, COUNT(*) AS count FROM applications WHERE user_id = ? GROUP BY status")
    .all(uid);
  const total = db.prepare("SELECT COUNT(*) AS c FROM applications WHERE user_id = ?").get(uid).c;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = db
    .prepare(
      `SELECT * FROM applications
       WHERE user_id = ? AND deadline >= ? AND status IN ('Planned','Applied')
       ORDER BY deadline ASC LIMIT 5`
    )
    .all(uid, today);
  res.json({ total, byStatus, upcoming });
});

router.post("/", (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  const b = req.body;
  const info = db
    .prepare(
      `INSERT INTO applications (user_id, title, organization, type, status, deadline, link, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      b.title.trim(),
      b.organization.trim(),
      b.type || "Internship",
      b.status || "Planned",
      b.deadline || null,
      b.link || null,
      b.notes || null
    );
  res.status(201).json(db.prepare("SELECT * FROM applications WHERE id = ?").get(info.lastInsertRowid));
});

router.put("/:id", (req, res) => {
  const existing = db
    .prepare("SELECT * FROM applications WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const merged = { ...existing, ...req.body };
  const err = validate(merged);
  if (err) return res.status(400).json({ error: err });

  db.prepare(
    `UPDATE applications
     SET title=?, organization=?, type=?, status=?, deadline=?, link=?, notes=?,
         reminded = CASE WHEN deadline IS NOT ? THEN 0 ELSE reminded END
     WHERE id=? AND user_id=?`
  ).run(
    merged.title.trim(),
    merged.organization.trim(),
    merged.type,
    merged.status,
    merged.deadline || null,
    merged.link || null,
    merged.notes || null,
    merged.deadline || null,
    req.params.id,
    req.user.id
  );
  res.json(db.prepare("SELECT * FROM applications WHERE id = ?").get(req.params.id));
});

router.delete("/:id", (req, res) => {
  const info = db
    .prepare("DELETE FROM applications WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

module.exports = router;
