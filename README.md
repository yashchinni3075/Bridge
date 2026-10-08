# Bridge

**Where startups, specialized talent, and investors meet — powered by AI.**

Bridge is a full-stack venture networking platform. Startups build verifiable profiles and raise funding, freelancers get matched to roles by an AI match engine, and investors discover vetted startups — with AI pitch-deck evaluation, realtime chat, and a DNS-verified trust layer on top.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Seeding & Demo Data](#seeding--demo-data)
- [API Overview](#api-overview)
- [Realtime Events](#realtime-events)
- [Deployment](#deployment)
- [Security Notes](#security-notes)

---

## Features

### 🔐 Authentication & Trust
- Email **OTP verification** on registration (Nodemailer) and password recovery
- **ID-document verification** reviewed by admins, with per-user **trust scores**
- **DNS TXT domain verification** for startups (challenge/response against your domain's DNS)
- JWT auth with role-based access (`startup`, `investor`, `freelancer`, `admin`) and `requireVerifiedUser` gating on sensitive actions

### 🤖 AI Pitch Evaluation
- Upload pitch decks (**PDF, PPT, PPTX**) to Cloudinary
- Real text extraction from PDF decks, then **Gemini** scores the pitch across weighted categories (problem, solution, market, traction, team, business model, funding ask)
- Returns an overall score plus **strengths, weaknesses, and recommendations** — stored as evaluation history on the startup profile

### 🎯 AI Matchmaking & Discovery
- **Multi-factor deterministic scoring** (skills, domain, sector, stage, budget alignment) combined with **cosine-similarity** tag matching
- Gemini-written match explanations with graceful deterministic fallback
- Engines for freelancer↔startup, investor↔startup, startup discovery (freelancers & investors), and pairwise compatibility scoring
- Cross-role search for startups, freelancers, and investors

### 💼 Hiring & Applications
- Startups publish roles with **PDF job descriptions** (view/download)
- Applicant pipeline with resume viewing, status control, and **engagement stages**
- Freelancers apply, track, and withdraw applications

### 💰 Funding Marketplace
- Startups post funding opportunities with deck uploads and track funding stats
- Investors discover opportunities and **express interest**; startups respond to interests
- Investment history for investors

### 💬 Realtime (Socket.io)
- Direct messaging over connection rooms with **file sharing**, read receipts, and unread counts
- Live notifications (bell) across the app

### 📅 Calendar & Tasks
- Event scheduling (startups) with **RSVPs**, upcoming-event feed, and status control
- Personal task board (create/update/delete)

### 🛡️ Connections, Safety & Admin
- Verified-only connection requests (send / respond / accepted lists)
- Community **reports** with role-specific reasons, plus admin block/unblock/delete
- Admin dashboard with platform stats and verification review queue

### ☁️ Infrastructure
- Cloudinary storage for pitch decks, resumes, startup logos, avatars, and verification documents
- MongoDB Atlas, Express, and Vite/React SPA

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 3, React Router 6, Axios, socket.io-client |
| Backend | Node.js, Express 4 (ESM), Socket.io |
| Database | MongoDB Atlas (Mongoose 8) |
| AI | Google Gemini (`generativelanguage` API) |
| Email | Nodemailer (SMTP / Gmail app password) |
| Storage | Cloudinary |
| Auth | JWT + bcryptjs |

---

## Project Structure

```
.
├── backend/
│   ├── config/           # DB & Cloudinary setup
│   ├── controllers/      # 21 route controllers
│   ├── middleware/       # auth (protect/authorize), uploads, errors, verification
│   ├── models/           # 16 Mongoose models (User, StartupProfile, PitchEvaluation, …)
│   ├── routes/           # 20 route files mounted under /api/*
│   ├── services/         # AI pitch, AI recommendations, matching engine, DNS
│   │                     # verification, notifications, PDF text extraction
│   ├── utils/            # cloudinary, email, token, pagination helpers
│   ├── server.js         # Express + Socket.io entry point
│   ├── seedAdmin.js      # creates the bootstrap admin account
│   ├── seedDatasets.mjs  # bulk demo-data seeder (datasets + credentials report)
│   └── migrate-cloudinary.mjs
└── frontend/
    ├── src/
    │   ├── components/   # Navbar, ChatWindow, modals, VerificationPanel, …
    │   ├── layouts/      # AdminLayout
    │   ├── pages/        # auth, admin, startup, investor, freelancer dashboards
    │   ├── services/     # api, chatApi, calendarApi, notificationApi, socketService
    │   └── context/      # auth state
    ├── tailwind.config.js
    └── vite.config.js
```

---

## Getting Started

### Prerequisites
- **Node.js 18+**
- A **MongoDB Atlas** cluster (or local MongoDB)
- A **Cloudinary** account
- A **Google AI Studio** API key (Gemini)
- A Gmail address with an **App Password** for SMTP

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in your values (see table below)
npm run dev               # nodemon, or: npm start
```

The API listens on `http://localhost:<PORT>` (default `5000`) and serves Socket.io on the same port.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # point VITE_API_URL at your backend
npm run dev               # Vite dev server on http://localhost:5173
```

Production build:

```bash
npm run build             # outputs static site to frontend/dist/
```

---

## Environment Variables

### `backend/.env`

| Variable | Description |
|---|---|
| `PORT` | Express port (keep in sync with `VITE_API_URL`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `CLIENT_URL` | Frontend origin allowed by CORS (e.g. `http://localhost:5173`) |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials |
| `CLOUDINARY_OLD_*` | *(optional)* legacy cloud used by `migrate-cloudinary.mjs` |
| `GEMINI_API_KEY` | Google Gemini API key for pitch evaluation & AI recommendations |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | SMTP server (e.g. `smtp.gmail.com`, `587`, `false`) |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | SMTP account, Gmail **app password**, and From address |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Bootstrap admin created by `seedAdmin.js` |
| `DEV_BYPASS_FREELANCER_VERIFICATION` | **Dev-only** — never enable in production |

### `frontend/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL (default `http://localhost:5000/api`) |
| `VITE_SOCKET_URL` | Socket.io origin (default `http://localhost:5000`) |
| `VITE_DEV_BYPASS_FREELANCER_VERIFICATION` | **Dev-only** Vite flag — inert in production builds |

> `.env` files are intentionally **not** committed. `.env.example` files stay on your machine as templates.

---

## Seeding & Demo Data

```bash
cd backend

node seedAdmin.js         # create the bootstrap admin from ADMIN_* env vars
node seedDatasets.mjs     # bulk-seed demo users from the bundled datasets
```

- `seedDatasets.mjs` reads the bundled datasets (`Freelancers.json`, `investors.json`, `startups.json`) and seeds representative users per role. Generated login credentials are written to `SEED_CREDENTIALS.md` / `SEED_CREDENTIALS.json` **locally only** — never commit them.
- `migrate-cloudinary.mjs` moves media between Cloudinary clouds using the `CLOUDINARY_*` / `CLOUDINARY_OLD_*` pairs.

---

## API Overview

All endpoints are mounted under `/api` and require a `Bearer` token where marked 🔒.

| Prefix | Purpose |
|---|---|
| `/api/auth` | register, OTP verify, login, forgot/reset password, `me` |
| `/api/profiles` | role profile reads/writes |
| `/api/startups` | public startups, dashboard metrics, profile, milestones, pitch deck upload & AI evaluation, team, applications & applicants |
| `/api/freelancer` | freelancer profile, applications, apply/cancel |
| `/api/investor` | investor profile, dashboard, startup discovery, connections, investment history |
| `/api/matching` 🔒 | match engines per role, discovery pools, pair compatibility |
| `/api/matches` | AI recommendations |
| `/api/search` 🔒 | cross-role search |
| `/api/connections` 🔒 | request/respond, sent/received/accepted |
| `/api/applications` 🔒 | my applications, withdraw, per-startup/hiring status |
| `/api/startup-hiring` | hiring CRUD, PDF job description upload/view/download |
| `/api/funding` 🔒 | opportunities CRUD, investor interest & responses, stats |
| `/api/calendar` | events, upcoming, RSVP (writes restricted to startups) |
| `/api/tasks` | personal task CRUD |
| `/api/chat` 🔒 | messages, send, mark read, unread count |
| `/api/notifications` 🔒 | list, mark read, mark all read |
| `/api/verification` 🔒 | verification status, document upload/delete, DNS domain verification |
| `/api/upload` 🔒 | profile image, resume, startup logo, verification doc |
| `/api/admin` 🔒 | dashboard stats, verification review, user management |
| `/api/reports` 🔒 | create report, report count, reasons |

---

## Realtime Events

Client → server: `joinChat`, `leaveChat`, `sendMessage` (text or file), `markAsRead`
Server → client: `newMessage`, `messageNotification`, `messagesRead`

Sockets authenticate via the same JWT (`protectSocket`) and join a personal room (`userId`) plus per-conversation rooms (`chat:<connectionId>`).

---

## Deployment

- **Frontend** — deploy `frontend/dist/` to any static host (Vercel, Netlify, etc.) and set `VITE_API_URL` / `VITE_SOCKET_URL` to your backend origin at build time.
- **Backend** — deploy as a Node service (Render, Railway, VPS). Set every variable from the table above, point `CLIENT_URL` at the deployed frontend, and make sure your host allows **WebSocket** connections for Socket.io.
- Keep `DEV_BYPASS_*` flags off in production.

---

## Security Notes

- Secrets (`.env`, seed credentials, database backups) are **never** committed — keep them local or in your host's environment-variable UI.
- All mutations on sensitive resources require authentication and (where enforced) a **verified** account.
- Uploaded files are stored on Cloudinary, not on the server; only allowed MIME types are accepted.

---

Built with the MERN stack + Gemini. Licensed for use by the Bridge team.
