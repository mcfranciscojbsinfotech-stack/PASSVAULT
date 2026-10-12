# PassVault REST API Specification

Base URL: `http://localhost:4000/api`

## Authentication (`/api/auth`)

### `POST /api/auth/register`
- **Request Body:** `{ email: string, password: string }`
- **Response:** `{ message: string, user: UserProfile }`
- **Status:** 201 Created

### `POST /api/auth/login`
- **Request Body:** `{ email: string, password: string }`
- **Response:** `{ message: string, user: UserProfile }` OR `{ mfaRequired: true, tempToken: string }`
- **Sets Cookie:** `passvault_session` (HTTP-only, SameSite=Lax)

### `POST /api/auth/verify-mfa`
- **Request Body:** `{ tempToken: string, code: string, isBackupCode?: boolean }`
- **Response:** `{ message: string, user: UserProfile }`

### `POST /api/auth/logout`
- **Clears Cookie:** `passvault_session`

### `GET /api/auth/me`
- **Headers:** Session cookie or `Authorization: Bearer <token>`
- **Response:** `{ user: UserProfile }`

---

## Two-Factor Authentication (`/api/mfa`)

### `POST /api/mfa/setup`
- Generates TOTP secret and QR code data URL.

### `POST /api/mfa/enable`
- **Request Body:** `{ token: string }`
- Verifies 6-digit TOTP code and returns 8 single-use emergency backup codes.

### `POST /api/mfa/disable`
- **Request Body:** `{ password: string }`
- Requires account password to disable MFA.

---

## Zero-Knowledge Sync (`/api/sync`)

### `POST /api/sync/push`
- **Request Body:** `{ items: [{ itemId: UUID, encryptedPayload: string, revision: number, isDeleted: boolean, clientUpdatedAt: ISOString }] }`
- Stores encrypted envelope ciphertext.

### `GET /api/sync/pull`
- **Query Params:** `?since=ISOString`
- Returns remote ciphertext envelopes.

### `GET /api/sync/status`
- Returns count of active and tombstoned cloud encrypted items.

---

## Administration (`/api/admin`) (Requires ADMIN role)

### `GET /api/admin/users`
- List user accounts with active session counts.

### `PATCH /api/admin/users/:id`
- Update account role or suspension status.

### `POST /api/admin/users/:id/revoke-sessions`
- Revoke all active sessions for a user.

### `GET /api/admin/audit-logs`
- Filterable operational audit logs.

### `GET /api/admin/monitoring`
- Real-time API uptime, database status, and active session metrics.
