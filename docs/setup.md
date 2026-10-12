# PassVault Setup & Execution Guide

## Prerequisites

- **Node.js**: v20+ (Tested on Node v24)
- **pnpm**: v9+ (Tested on pnpm v12)

---

## 1. Quick Installation

Clone or open the project root directory and install dependencies:

```bash
# Approve built dependencies for pnpm
pnpm approve-builds --all

# Install monorepo dependencies
pnpm install
```

---

## 2. Database Initialization

PassVault comes configured out-of-the-box with SQLite for seamless development and testing.

```bash
# Generate the Prisma client
pnpm db:generate

# Synchronize the database schema
pnpm db:push

# Optional: Seed initial administrator
pnpm db:seed
```

Default Development Administrator Credentials:
- **Email**: `admin@passvault.local`
- **Password**: `PassVaultAdmin123!`

---

## 3. Running Development Servers

You can run both backend and frontend concurrently:

```bash
# Start backend API (Port 4000) and Next.js frontend (Port 3000)
pnpm dev
```

Or run them individually in separate terminals:

```bash
# Terminal 1: Backend Fastify API
pnpm dev:backend

# Terminal 2: Frontend Next.js Web App
pnpm dev:frontend
```

Open your browser to:
- **Frontend Application**: `http://localhost:3000`
- **API Health Check**: `http://localhost:4000/api/health`

---

## 4. Running Automated Tests

```bash
# Run all automated tests (crypto, security, API)
pnpm test

# Run cryptographic unit tests only
pnpm test:crypto

# Run backend API & auth tests
pnpm test:backend

# Run zero-knowledge security & isolation tests
pnpm test:security
```
