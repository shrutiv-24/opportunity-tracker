const cron = require("node-cron");
const nodemailer = require("nodemailer");
const db = require("./db");

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function runReminders() {
  const today = new Date();
  const in3 = new Date(today.getTime() + 3 * 86400000).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  const due = db
    .prepare(
      `SELECT a.*, u.email, u.name AS user_name
       FROM applications a JOIN users u ON u.id = a.user_id
       WHERE a.deadline BETWEEN ? AND ?
         AND a.status IN ('Planned','Applied')
         AND a.reminded = 0`
    )
    .all(todayStr, in3);

  const transport = getTransport();
  for (const a of due) {
    const text = `Hi ${a.user_name}, the deadline for "${a.title}" at ${a.organization} is on ${a.deadline}.`;
    try {
      if (transport) {
        await transport.sendMail({
          from: process.env.MAIL_FROM,
          to: a.email,
          subject: `Deadline reminder: ${a.title}`,
          text,
        });
      } else {
        console.log("[reminder]", a.email, "-", text);
      }
      db.prepare("UPDATE applications SET reminded = 1 WHERE id = ?").run(a.id);
    } catch (e) {
      console.error("Reminder failed:", e.message);
    }
  }
}

function startReminders() {
  // every day at 9:00 AM server time
  cron.schedule("0 9 * * *", runReminders);
  console.log("Deadline reminders scheduled (daily 9:00).");
}

module.exports = { startReminders, runReminders };
