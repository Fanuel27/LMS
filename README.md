# National Exam Prep Ethiopia — LMS Platform

A full-stack Learning Management System designed for Ethiopian National Exam preparation. The platform supports three roles: **Admin**, **Teacher**, and **Student**, each with their own dashboard and capabilities.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Production Deployment](#production-deployment)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Deployment Recommendations](#backend-deployment-recommendations)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 8, Tailwind CSS, React Router v7, TanStack Query v5, Recharts |
| **Backend** | Node.js, Express 4, Prisma 6 (ORM) |
| **Database** | PostgreSQL |
| **Auth** | JWT (HttpOnly cookie-based) |
| **Security** | Helmet, CORS, express-rate-limit, compression, Zod validation |
| **File Storage** | Local disk (`/uploads`), served via Express static |

---

## Features

- 🔐 Role-based authentication (Admin / Teacher / Student)
- 👨‍🏫 Teacher: subject management, question bank, notes upload (PDF), mock exam creation
- 🎓 Student: practice mode (adaptive), timed mock exams, study notes, progress tracking
- 🛡️ Admin: full user management, analytics, announcements, audit logs, backup & restore, system settings, contact messages
- 📬 Contact form with admin notifications
- 📊 Rich analytics dashboards with charts

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **PostgreSQL** v14 or higher

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/Fanuel27/LMS.git
cd LMS
```

### 2. Configure environment variables

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env and fill in your DATABASE_URL, JWT_SECRET, COOKIE_SECRET, etc.
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Default values work for local development — no changes needed.
```

### 3. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 4. Set up the database

```bash
cd backend
npx prisma migrate dev     # Runs all migrations, applies schema
npx prisma db seed         # Seeds initial admin account and sample data
```

### 5. Start development servers

**Backend** (runs on port 3001):
```bash
cd backend
npm run dev
```

**Frontend** (runs on port 5173, proxies `/api` to backend):
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | ❌ | Server port (default: `3001`) |
| `NODE_ENV` | ✅ | `development` or `production` |
| `JWT_SECRET` | ✅ | JWT signing key — **minimum 32 characters** |
| `JWT_EXPIRES_IN` | ❌ | Token lifetime (default: `7d`) |
| `COOKIE_SECRET` | ✅ | Cookie signing key — separate from JWT secret |
| `FRONTEND_URL` | ✅ | Allowed CORS origin (e.g., `https://your-app.vercel.app`) |
| `MAX_FILE_SIZE` | ❌ | Max upload size in bytes (default: `10485760` = 10 MB) |
| `UPLOAD_PATH` | ❌ | Directory for uploaded files (default: `uploads`) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ❌ | Backend URL for local dev (default: `http://localhost:3001`) |

---

## Database Setup

### Run Migrations

```bash
cd backend
npx prisma migrate deploy   # Production: applies all pending migrations
npx prisma migrate dev      # Development: applies + creates new migrations
```

### Seed Initial Data

```bash
cd backend
npx prisma db seed
```

This creates a default admin account. Check `backend/prisma/seed.js` for credentials.

### Prisma Studio (Database GUI)

```bash
cd backend
npm run db:studio
```

---

## Production Deployment

### Build the Frontend

```bash
cd frontend
npm run build
```

This generates optimized files in `frontend/dist/`. Deploy this directory to your hosting provider.

### Backend Production Start

```bash
cd backend
NODE_ENV=production npm start
```

**Important production environment variables to set:**
- `NODE_ENV=production`
- `DATABASE_URL` — your production database connection string
- `JWT_SECRET` — a long, random, secure string (minimum 64 characters recommended)
- `COOKIE_SECRET` — another long, random, secure string
- `FRONTEND_URL` — your deployed frontend URL (e.g., `https://your-app.vercel.app`)

---

## Frontend Deployment (Vercel)

1. Push your code to GitHub.
2. Connect the repository to [Vercel](https://vercel.com).
3. Set the **Root Directory** to `frontend`.
4. Vercel will auto-detect Vite and use `npm run build` + `dist` output directory.
5. Add environment variables in the Vercel dashboard if needed (typically none for the frontend).
6. Add a `vercel.json` in the `frontend/` directory for SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Backend Deployment Recommendations

### Option A — Railway (Recommended for simplicity)

1. Create a new project on [Railway](https://railway.app).
2. Add a **PostgreSQL** service and copy the `DATABASE_URL`.
3. Deploy the `backend` directory.
4. Set all environment variables in the Railway dashboard.
5. Railway will automatically detect `npm start`.

### Option B — Render

1. Create a new **Web Service** on [Render](https://render.com).
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to `npm install && npx prisma generate`.
4. Set **Start Command** to `node server.js`.
5. Add a **PostgreSQL** database service and link the connection string.

### Option C — VPS (Ubuntu / Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Clone and setup
git clone https://github.com/Fanuel27/LMS.git
cd LMS/backend
npm install
npx prisma migrate deploy

# Start with PM2
pm2 start server.js --name "lms-backend" --env production
pm2 save
pm2 startup
```

Use **Nginx** as a reverse proxy to forward traffic from port 80/443 to the Node.js server on port 3001.

### File Uploads

The `uploads/` directory (inside `backend/`) stores PDF notes. On production servers:
- Ensure this directory is **persistent** across deployments.
- Consider migrating to **cloud storage** (AWS S3, Cloudflare R2) for scalable file storage.
- The directory is gitignored — you must create it on the server or ensure the app creates it on startup (it does automatically).

---

## Security Hardening Notes

- All secrets must be **at least 32 characters** and **randomly generated** in production.
- JWT tokens are stored in **HttpOnly, Secure, SameSite=Strict** cookies — not `localStorage`.
- Rate limiting is applied: 20 login attempts per 15 minutes, 500 general API calls per 15 minutes.
- CORS is restricted to the exact `FRONTEND_URL` in production.
- File uploads are validated for MIME type (PDF only) and capped at 10 MB.
- Helmet is enabled with production-grade content security policies.
- All inputs are validated server-side using **Zod** schemas before database interaction.
- Prisma handles SQL injection protection via parameterized queries.

---

## Default Admin Account

After seeding, the default admin credentials are stored in `backend/prisma/seed.js`. **Change the admin password immediately after first login in production.**

---

*Built with ❤️ for Ethiopian students preparing for national examinations.*
