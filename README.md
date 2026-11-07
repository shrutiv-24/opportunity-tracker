# Opportunity Tracker (Internship & Scholarship Tracker)

A full-stack web app to track internships, scholarships, fellowships and
competitions: add applications, update their status, see upcoming deadlines,
and get email reminders.

## Tech stack
- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express (REST API)
- **Database:** SQLite (via better-sqlite3)
- **Auth:** JWT + bcrypt password hashing
- **Extras:** node-cron + Nodemailer for daily deadline reminders

## Features
- Sign up / log in (JWT, 7-day sessions)
- Full CRUD for applications (title, organization, type, status, deadline, link, notes)
- Dashboard stats by status + "upcoming deadlines" panel
- Search and filter by type / status
- Daily 9:00 AM reminder for deadlines within 3 days (email or console log)
- Every user only sees their own data

## Project structure
```
tracker/
├── server/
│   ├── index.js            # Express app entry
│   ├── db.js               # SQLite setup + tables
│   ├── auth.js             # JWT helpers + middleware
│   ├── reminders.js        # cron + email reminders
│   └── routes/
│       ├── auth.js         # register / login / me
│       └── applications.js # CRUD + stats
└── client/
    ├── index.html
    ├── vite.config.js      # proxies /api -> :5000
    └── src/
        ├── main.jsx, App.jsx, api.js, styles.css
        ├── pages/Auth.jsx, pages/Dashboard.jsx
        └── components/AppForm.jsx
```

## How to run
Requires Node.js 18+.

**1. Backend**
```bash
cd server
npm install
cp .env.example .env      # then set JWT_SECRET to any long random string
npm start                 # http://localhost:5000
```

**2. Frontend** (new terminal)
```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

Open http://localhost:5173, create an account, and start adding opportunities.

## API reference
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in, returns token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/applications?q=&type=&status=` | List/filter |
| GET | `/api/applications/stats` | Totals + upcoming deadlines |
| POST | `/api/applications` | Create |
| PUT | `/api/applications/:id` | Update |
| DELETE | `/api/applications/:id` | Delete |

All `/api/applications` routes need `Authorization: Bearer <token>`.

## Email reminders (optional)
Fill the `SMTP_*` values in `server/.env` (e.g. a Gmail app password). If left
blank, reminders are printed in the server console instead.

## Ideas to extend
- Calendar (.ics) export
- Drag-and-drop kanban board
- Document uploads per application
- Deploy: Render/Railway (API) + Vercel/Netlify (client)
