# PassVault Threat Model & Security Analysis

## 1. Assets Protected

1. **Vault Plaintext Credentials:** Website passwords, usernames, sensitive notes, API keys.
2. **Cryptographic Root Keys:** 25-character vault recovery codes, derived AES-256 keys.
3. **Account Authentication Credentials:** Login email and Argon2id password hashes.
4. **Active Session Tokens:** HTTP-only session cookies.

---

## 2. Threat Scenarios & Mitigations

| Threat | Risk Level | PassVault Mitigation Strategy |
| :--- | :---: | :--- |
| **Backend Database Compromise** | High | Zero-knowledge architecture: Backend only stores AES-256-GCM encrypted envelopes. Plaintext credentials and encryption keys never exist on server disk or memory. |
| **Man-in-the-Middle (MitM) Network Attack** | High | HTTPS/TLS transport encryption combined with client-side authenticated encryption (AES-256-GCM) with 128-bit authentication tags. |
| **Credential Stuffing & Brute Force** | High | Argon2id password hashing (64 MB memory cost, 3 rounds) + Fastify IP rate-limiting + optional TOTP 2FA. |
| **Inadvertent Cloud Sync of Sensitive Keys** | Critical | **Isolate Mode:** Physical partitioning in a segregated IndexedDB database (`PassVault_IsolatedRepository_LocalOnly`) completely excluded from sync services. |
| **Tampered Ciphertext Envelopes** | Medium | AES-256-GCM authentication tags fail decryption immediately upon any bit modification. |
| **Session Hijacking via XSS** | Medium | Session tokens stored in `httpOnly`, `SameSite=Lax`, `Secure` cookies inaccessible to malicious JavaScript. |
| **Clipboard Snooping** | Low | Clipboard auto-clearing feedback mechanism with user warnings regarding OS clipboard manager persistence. |

---

## 3. Acknowledged Browser & Security Limitations

1. **Compromised Host Device / Malware:** Browser-side cryptography protects data at rest on servers, but cannot protect against keyloggers or memory scrapers operating on a compromised client device.
2. **Malicious Browser Extensions:** Extensions with broad DOM permissions could attempt to read form fields prior to encryption.
3. **Raw USB Hardware Verification:** Standard browsers cannot reliably inspect raw USB hardware serials across all operating systems without native desktop companion runtimes (such as Tauri or Electron). PassVault provides encrypted file exports as the standard cross-platform solution.
