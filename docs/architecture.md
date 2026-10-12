# PassVault Architecture & System Design

## 1. System Overview

PassVault is an academic Web Development and System Administration password manager built around two core architectural principles:
1. **Zero-Knowledge Client-Side Encryption:** All sensitive credential data is encrypted directly on the user's browser device before it ever leaves memory or enters network storage.
2. **Isolate Mode (Partitioned Storage):** Users can explicitly mark high-risk, critical credentials as *Isolated*. Isolated records reside in a physically segregated local IndexedDB database and are strictly prohibited from entering the cloud synchronization pipeline or communicating with backend sync APIs.

---

## 2. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                                BROWSER CLIENT                                 |
|                                                                               |
|  +---------------------------+             +-------------------------------+  |
|  |     Personal Vault UI     |             |      Isolate Mode UI          |  |
|  | (Dashboard, Vault, Gen)   |             | (Local Only - Not Synced)     |  |
|  +-------------+-------------+             +---------------+---------------+  |
|                |                                           |                  |
|                v                                           v                  |
|  +---------------------------+             +-------------------------------+  |
|  | @passvault/crypto Engine  |             | @passvault/crypto Engine      |  |
|  | - 25-Char Recovery Key    |             | - 25-Char Recovery Key        |  |
|  | - HKDF-SHA-256 Derivation |             | - HKDF-SHA-256 Derivation     |  |
|  | - AES-256-GCM + 96-bit IV |             | - AES-256-GCM + 96-bit IV     |  |
|  +-------------+-------------+             +---------------+---------------+  |
|                |                                           |                  |
|                v                                           v                  |
|  +---------------------------+             +-------------------------------+  |
|  |   PassVault_SyncDb        |             |   PassVault_IsolatedDb        |  |
|  | (Dexie IndexedDB Store 1) |             | (Dexie IndexedDB Store 2)     |  |
|  +-------------+-------------+             +-------------------------------+  |
|                |                               (Strictly Local Only)          |
|                v                                                              |
|  +---------------------------+                                                |
|  |  Sync Engine (SyncService)|                                                |
|  | (Pushes/Pulls Ciphertext) |                                                |
|  +-------------+-------------+                                                |
+----------------|--------------------------------------------------------------+
                 | HTTPS / Cookie-Auth
                 v
+-------------------------------------------------------------------------------+
|                              FASTIFY BACKEND API                              |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  | REST API Endpoints:                                                     |  |
|  | - /api/auth   : Argon2id Authentication, Server Sessions, Email Verify  |  |
|  | - /api/mfa    : TOTP 2FA Verification & Emergency Recovery Codes        |  |
|  | - /api/sync   : Zero-Knowledge Encrypted Envelopes (Ciphertext Only)    |  |
|  | - /api/admin  : Role-Based Access Control, Monitoring, Audit Logging    |  |
|  +-------------------------------------+-----------------------------------+  |
|                                        |                                      |
|                                        v                                      |
|  +-------------------------------------------------------------------------+  |
|  |                          Prisma ORM Client                              |  |
|  |   - Users, Sessions, MFA Configs, Ciphertext Items, Audit Events        |  |
|  +-------------------------------------+-----------------------------------+  |
+----------------------------------------|--------------------------------------+
                                         v
+-------------------------------------------------------------------------------+
|                                DATABASE TIER                                  |
|            - SQLite (Default for zero-setup local dev & test)                 |
|            - PostgreSQL (Production cloud deployment target)                  |
+-------------------------------------------------------------------------------+
```

---

## 3. Cryptographic Key Hierarchy

- **25-Character Vault Recovery Code:**
  Generated on the client device using `crypto.getRandomValues` and an unbiased selection over Crockford Base32 (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`, excluding ambiguous characters). Yields 125 bits of uniform cryptographic entropy.
- **Master AES-256 Encryption Key:**
  Derived locally from the 25-character recovery code using **HKDF-SHA-256** with a per-vault 16-byte random salt and context string `"passvault-vault-root-v1"`.
- **AES-256-GCM Authenticated Encryption:**
  Every record payload (Title, Username, Password, URL, Notes) is encrypted with a fresh, unique 96-bit (12-byte) initialization vector (IV) and 128-bit authentication tag.
- **Backup Key Derivation:**
  User-chosen backup passwords use **PBKDF2-SHA-256** with 600,000 iterations to resist offline brute-force attacks.

---

## 4. Dual-Store Storage Partitioning (Isolate Mode)

To provide defense-in-depth:
1. `PassVault_SyncRepository`: IndexedDB table for credentials intended for multi-device synchronization.
2. `PassVault_IsolatedRepository_LocalOnly`: Segregated IndexedDB table for critical credentials that must never leave the machine.

The synchronization client possesses zero code references or imports to `PassVault_IsolatedRepository_LocalOnly`.
