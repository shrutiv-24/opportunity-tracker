const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { sign, requireAuth } = require("../auth");

const router = express.Router();
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password)
    return res.status(400).json({ error: "Name, email and password are required" });
  if (!emailRe.test(email)) return res.status(400).json({ error: "Invalid email" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: "Email already registered" });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name.trim(), email.toLowerCase(), hash);
  const user = { id: info.lastInsertRowid, name: name.trim(), email: email.toLowerCase() };
  res.status(201).json({ token: sign(user), user });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  if (!row || !bcrypt.compareSync(password, row.password_hash))
    return res.status(401).json({ error: "Wrong email or password" });

  const user = { id: row.id, name: row.name, email: row.email };
  res.json({ token: sign(user), user });
});

router.get("/me", requireAuth, (req, res) => {
  const row = db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(req.user.id);
  if (!row) return res.status(404).json({ error: "User not found" });
  res.json({ user: row });
});

module.exports = router;
