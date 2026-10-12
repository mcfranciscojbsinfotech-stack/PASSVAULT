# PassVault Backup & Disaster Recovery Guide

## 1. Export Formats

PassVault supports two portable export formats:
1. **Encrypted ZIP Archive (`.zip`):** Contains `passvault-backup-encrypted.json` and verification instructions.
2. **Encrypted JSON File (`.json`):** Versioned JSON container containing serialized AES-256-GCM credential envelopes.

---

## 2. Password Protection & Key Derivation

- Backups are encrypted using **PBKDF2-SHA-256** with 600,000 iterations from a user-chosen backup password.
- The backup password is kept distinct from the user's account password and vault recovery code.
- If the backup password is lost, the backup file cannot be decrypted or restored.

---

## 3. Restoration & Safety Preview

Before any local database records are modified, PassVault performs:
1. **Cryptographic Validation:** Verifies authentication tag and PBKDF2 key. Rejects wrong passwords or altered files immediately.
2. **Format Inspection:** Verifies version header and payload structure.
3. **Restore Preview:** Displays count of Synchronized items and Isolated items found in the archive.
4. **Preservation Option:** Defaults to merging and preserving existing credentials rather than overwriting without confirmation.
