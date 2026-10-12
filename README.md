# PassVault: Web-Based Password Manager with Online Synchronization and Isolated Local Storage

PassVault is an academic Web Development and System Administration project implementing a full-stack, zero-knowledge password manager with client-side authenticated encryption, isolated local storage partitioning, selective cloud synchronization, and a system administration dashboard.

---

## Key Features

- **Client-Side AES-256-GCM Authenticated Encryption:** Every credential record is sealed locally using the browser's Web Crypto API with a unique 96-bit IV before saving or uploading.
- **Standardized 25-Character Vault Recovery Code:** Unbiased Crockford Base32 key generation with HKDF-SHA-256 root key derivation.
- **Isolate Mode (Partitioned Local Storage):** High-risk credentials reside in a physically segregated IndexedDB database (`PassVault_IsolatedRepository_LocalOnly`) and are strictly excluded from normal online synchronization.
- **Selective Cloud Synchronization:** Synchronizes only non-isolated credentials across authorized devices via zero-knowledge encrypted payloads (ciphertext only).
- **Two-Way Encrypt/Decrypt Tool:** Standalone client utility for encrypting and decrypting arbitrary text payloads with authentication tag validation and tampering detection.
- **Cryptographic Password Generator:** Unbiased random password generation with configurable lengths, symbols, and entropy metrics.
- **Encrypted Backup & Recovery:** Password-protected JSON and ZIP archive export/import using PBKDF2-SHA-256 (600,000 rounds) + AES-256-GCM with restore previews.
- **Authentication & Security:** Argon2id password hashing, TOTP Two-Factor Authentication (with QR codes and backup codes), server-managed HTTP-only sessions, and rate limiting.
- **System Administration Application:** Role-based access control (RBAC), user directory management, account suspension, session revocation, real-time API uptime monitoring, storage metrics, and structured audit logs.

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Dexie (IndexedDB), Web Crypto API.
- **Backend:** Node.js, Fastify REST API, TypeScript, Prisma ORM, Argon2id, otplib.
- **Database:** SQLite (default for instant zero-dependency local dev & testing) / PostgreSQL ready.
- **Monorepo:** pnpm workspaces (`frontend/`, `backend/`, `packages/crypto/`, `packages/shared/`).

---

## Quickstart Guide

### 1. Install Dependencies

```bash
# Approve built dependencies for pnpm
pnpm approve-builds --all

# Install workspace dependencies
pnpm install
```

### 2. Initialize Database

```bash
# Generate Prisma client and initialize database
pnpm db:generate
pnpm db:push
pnpm db:seed
```

**Default Admin Credentials:**
- Email: `admin@passvault.local`
- Password: `PassVaultAdmin123!`

### 3. Run Development Servers

```bash
# Concurrently start backend (port 4000) and frontend (port 3000)
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Automated Test Suites

All 22 automated unit, integration, and security tests pass:

```bash
# Run all test suites
pnpm test

# Run client cryptography tests
pnpm test:crypto

# Run backend API & authentication tests
pnpm test:backend

# Run zero-knowledge security and isolation tests
pnpm test:security
```

---

## Documentation Links

- [System Architecture](docs/architecture.md)
- [Setup & Running Guide](docs/setup.md)
- [Database Schema & Models](docs/database.md)
- [REST API Reference](docs/api.md)
- [Threat Model & Limitations](docs/threat-model.md)
- [Backup & Disaster Recovery](docs/backup-recovery.md)
- [Production Deployment](docs/deployment.md)
