# PassVault Deployment Guide

## 1. Production Architecture Overview

- **Frontend:** Next.js deployed on Vercel, Node.js server, or container.
- **Backend API:** Fastify REST API deployed on a Node.js runtime, Railway, Render, Fly.io, or AWS ECS/EC2.
- **Database:** Managed PostgreSQL (AWS RDS, Neon, Supabase, Railway, etc.).

---

## 2. Environment Variables Configuration

Set these environment variables in production:

```env
# Database
DATABASE_URL="postgresql://user:password@db-host:5432/passvault?schema=public"

# Server Ports & Host
PORT=4000
HOST="0.0.0.0"
API_BASE_URL="https://api.yourdomain.com"
APP_BASE_URL="https://yourdomain.com"

# Session & Cookies
SESSION_SECRET="generate-a-strong-random-64-character-hex-string"
COOKIE_DOMAIN=".yourdomain.com"
NODE_ENV="production"

# Email Integration (e.g. Resend / Sendgrid API key)
EMAIL_PROVIDER_API_KEY="re_1234567890"
EMAIL_FROM="security@yourdomain.com"
```

---

## 3. Database Deployment

Run Prisma migrations on your production database:

```bash
# Push schema or deploy migrations to PostgreSQL
npx prisma db push
```

---

## 4. Build and Start Commands

```bash
# Build monorepo packages, backend, and frontend
pnpm build

# Start Fastify REST API
pnpm --filter backend start

# Start Next.js Frontend
pnpm --filter frontend start
```
