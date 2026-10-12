import { describe, it, expect } from 'vitest';
import {
  generateVaultRecoveryCode,
  validateRecoveryCode,
  normalizeRecoveryCode,
  formatRecoveryCode,
} from './root-key.js';
import {
  encryptPayloadToEnvelope,
  decryptPayloadFromEnvelope,
  serializeEnvelope,
  deserializeEnvelope,
} from './encryption-envelope.js';
import { generatePassword, evaluatePasswordStrength } from './password-generator.js';

describe('Vault Recovery Code & Root Key', () => {
  it('generates a valid 25-character formatted recovery code', () => {
    const code = generateVaultRecoveryCode();
    expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}(-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{5}){4}$/);
    expect(validateRecoveryCode(code)).toBe(true);
  });

  it('normalizes formatted and lowercase recovery codes', () => {
    const code = generateVaultRecoveryCode();
    const lower = code.toLowerCase();
    expect(validateRecoveryCode(lower)).toBe(true);
    const normalized = normalizeRecoveryCode(lower);
    expect(normalized.length).toBe(25);
  });

  it('rejects invalid recovery codes', () => {
    expect(validateRecoveryCode('SHORT-CODE')).toBe(false);
    expect(validateRecoveryCode('11111-22222-33333-44444-55555')).toBe(false); // contains '1' (invalid in Crockford Base32)
    expect(validateRecoveryCode('OOOOO-22222-33333-44444-55555')).toBe(false); // contains 'O' (invalid in Crockford Base32)
  });
});

describe('AES-256-GCM Envelope Encryption & Decryption', () => {
  it('encrypts and decrypts payload with recovery code successfully', async () => {
    const code = generateVaultRecoveryCode();
    const sensitiveData = {
      title: 'GitHub Work Account',
      url: 'https://github.com',
      username: 'dev_user',
      password: 'SuperSecretPassword!987',
      notes: 'Contains MFA backup keys',
    };

    const envelope = await encryptPayloadToEnvelope(sensitiveData, code);

    expect(envelope.version).toBe(1);
    expect(envelope.algorithm).toBe('AES-GCM-256');
    expect(envelope.keyDerivation).toBe('HKDF-SHA-256');
    expect(envelope.iv).toBeDefined();
    expect(envelope.ciphertext).toBeDefined();
    expect(envelope.salt).toBeDefined();

    // Verify plaintext is NOT visible anywhere in the envelope
    const serialized = serializeEnvelope(envelope);
    expect(serialized).not.toContain('SuperSecretPassword!987');
    expect(serialized).not.toContain('dev_user');

    // Decrypt
    const decrypted = await decryptPayloadFromEnvelope<typeof sensitiveData>(envelope, code);
    expect(decrypted).toEqual(sensitiveData);
  });

  it('generates a unique IV for consecutive encryptions of the same data', async () => {
    const code = generateVaultRecoveryCode();
    const data = { secret: 'identical data' };

    const env1 = await encryptPayloadToEnvelope(data, code);
    const env2 = await encryptPayloadToEnvelope(data, code);

    expect(env1.iv).not.toEqual(env2.iv);
    expect(env1.ciphertext).not.toEqual(env2.ciphertext);
  });

  it('rejects decryption when an incorrect recovery code is provided', async () => {
    const code1 = generateVaultRecoveryCode();
    const code2 = generateVaultRecoveryCode();
    const sensitive = { note: 'Confidential' };

    const envelope = await encryptPayloadToEnvelope(sensitive, code1);

    await expect(decryptPayloadFromEnvelope(envelope, code2)).rejects.toThrow();
  });

  it('detects tampering of ciphertext and rejects decryption', async () => {
    const code = generateVaultRecoveryCode();
    const envelope = await encryptPayloadToEnvelope({ test: 'integrity' }, code);

    // Tamper with ciphertext by altering a base64 character
    const rawCipher = atob(envelope.ciphertext);
    const tamperedCipher = rawCipher.substring(0, rawCipher.length - 2) + String.fromCharCode(rawCipher.charCodeAt(rawCipher.length - 2) ^ 1);
    envelope.ciphertext = btoa(tamperedCipher);

    await expect(decryptPayloadFromEnvelope(envelope, code)).rejects.toThrow();
  });

  it('supports password-based derivation (PBKDF2) for user backups', async () => {
    const password = 'UserChosenBackupPassword2026!';
    const data = { backupItems: [1, 2, 3] };

    const envelope = await encryptPayloadToEnvelope(data, password, {
      keyDerivation: 'PBKDF2-SHA-256',
    });

    expect(envelope.keyDerivation).toBe('PBKDF2-SHA-256');

    const decrypted = await decryptPayloadFromEnvelope<typeof data>(envelope, password);
    expect(decrypted).toEqual(data);

    // Reject wrong password
    await expect(decryptPayloadFromEnvelope(envelope, 'WrongPassword123')).rejects.toThrow();
  });
});

describe('Password Generator', () => {
  it('generates passwords of requested length and character sets', () => {
    const pwd = generatePassword({
      length: 24,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });

    expect(pwd.length).toBe(24);
    expect(/[A-Z]/.test(pwd)).toBe(true);
    expect(/[a-z]/.test(pwd)).toBe(true);
    expect(/[0-9]/.test(pwd)).toBe(true);
    expect(/[^A-Za-z0-9]/.test(pwd)).toBe(true);
  });

  it('evaluates password strength score and entropy accurately', () => {
    const weak = evaluatePasswordStrength('abc');
    expect(weak.score).toBeLessThanOrEqual(1);

    const strong = evaluatePasswordStrength('X9#mK2$pQ8!vL5@wR1');
    expect(strong.score).toBeGreaterThanOrEqual(3);
    expect(strong.entropyBits).toBeGreaterThan(60);
  });
});
