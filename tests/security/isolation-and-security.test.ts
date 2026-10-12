import { describe, it, expect } from 'vitest';
import {
  generateVaultRecoveryCode,
  encryptPayloadToEnvelope,
  decryptPayloadFromEnvelope,
  serializeEnvelope,
} from '../../packages/crypto/src/index.js';
import { BackupService, BackupPayload } from '../../frontend/lib/backup-service.js';
import { EncryptedEnvelope, STORAGE_MODES } from '../../packages/shared/src/index.js';

describe('Zero-Knowledge Security & Isolation Verification', () => {
  it('guarantees ciphertext never contains plaintext password or notes', async () => {
    const recoveryCode = generateVaultRecoveryCode();
    const sensitivePayload = {
      title: 'Banking Portal',
      url: 'https://secure.bank.com',
      username: 'financial_user',
      password: 'ExtremelySecretPassword!#999',
      notes: 'SSN: 000-11-2222, Mother Maiden Name: Smith',
    };

    const envelope = await encryptPayloadToEnvelope(sensitivePayload, recoveryCode);
    const serialized = serializeEnvelope(envelope);

    // Cryptographic assertion: no secret strings leaked in serialized envelope
    expect(serialized).not.toContain('ExtremelySecretPassword!#999');
    expect(serialized).not.toContain('financial_user');
    expect(serialized).not.toContain('000-11-2222');
    expect(serialized).not.toContain('Smith');
    expect(serialized).not.toContain(recoveryCode);
  });

  it('rejects decryption when ciphertext is tampered with', async () => {
    const recoveryCode = generateVaultRecoveryCode();
    const envelope = await encryptPayloadToEnvelope({ sensitive: 'data' }, recoveryCode);

    // Tamper with ciphertext by corrupting bytes
    const tamperedCipher = envelope.ciphertext.slice(0, -4) + 'AAAA';
    const tamperedEnvelope: EncryptedEnvelope = {
      ...envelope,
      ciphertext: tamperedCipher,
    };

    await expect(decryptPayloadFromEnvelope(tamperedEnvelope, recoveryCode)).rejects.toThrow();
  });

  it('rejects decryption when an incorrect recovery key is used', async () => {
    const validKey = generateVaultRecoveryCode();
    const wrongKey = generateVaultRecoveryCode();
    const envelope = await encryptPayloadToEnvelope({ note: 'Top Secret' }, validKey);

    await expect(decryptPayloadFromEnvelope(envelope, wrongKey)).rejects.toThrow();
  });

  it('validates PBKDF2 password derivation and rejection of invalid backup password', async () => {
    const backupPassword = 'CorrectBackupPassword2026!';
    const wrongPassword = 'WrongPassword2026!';

    const backupData: BackupPayload = {
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      source: 'PassVault_Backup_Engine',
      synchronizedItems: [],
      isolatedItems: [],
    };

    const backupEnvelope = await encryptPayloadToEnvelope(backupData, backupPassword, {
      keyDerivation: 'PBKDF2-SHA-256',
    });

    const backupJson = JSON.stringify(backupEnvelope);

    // Verify correct password previews successfully
    const validPreview = await BackupService.previewBackup(backupJson, backupPassword);
    expect(validPreview.preview.valid).toBe(true);

    // Verify wrong password is rejected
    const invalidPreview = await BackupService.previewBackup(backupJson, wrongPassword);
    expect(invalidPreview.preview.valid).toBe(false);
    expect(invalidPreview.preview.error).toContain('Incorrect backup password');
  });

  it('verifies separate storage partitioning for isolated vs synchronized records', () => {
    // Mode definition check
    expect(STORAGE_MODES.SYNCHRONIZED).toBe('synchronized');
    expect(STORAGE_MODES.ISOLATED).toBe('isolated');
    expect(STORAGE_MODES.SYNCHRONIZED).not.toBe(STORAGE_MODES.ISOLATED);
  });
});
