import { normalizeRecoveryCode, validateRecoveryCode } from './root-key.js';
import { getRandomBytes, stringToBuffer } from './utils.js';

export const HKDF_INFO_VAULT_ROOT = 'passvault-vault-root-v1';
export const DEFAULT_SALT_BYTES = 16;
export const PBKDF2_ITERATIONS = 600_000;

export function generateSalt(length = DEFAULT_SALT_BYTES): Uint8Array {
  return getRandomBytes(length);
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a 25-character recovery code using HKDF-SHA-256.
 */
export async function deriveKeyFromRecoveryCode(
  recoveryCode: string,
  salt: Uint8Array,
  extractable = false
): Promise<CryptoKey> {
  const normalized = normalizeRecoveryCode(recoveryCode);
  if (!validateRecoveryCode(normalized)) {
    throw new Error('Invalid recovery code format: must be 25 Crockford Base32 characters');
  }

  const rawSecretBytes = stringToBuffer(normalized);

  // Import raw secret as HKDF master key material
  const baseKey = await crypto.subtle.importKey(
    'raw',
    rawSecretBytes as unknown as BufferSource,
    { name: 'HKDF' },
    false,
    ['deriveKey']
  );

  const infoBytes = stringToBuffer(HKDF_INFO_VAULT_ROOT);

  // Derive 256-bit AES-GCM key
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: salt as unknown as BufferSource,
      info: infoBytes as unknown as BufferSource,
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    extractable,
    ['encrypt', 'decrypt']
  );

  return aesKey;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a user-chosen backup password using PBKDF2-SHA-256.
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS,
  extractable = false
): Promise<CryptoKey> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }

  const passwordBytes = stringToBuffer(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBytes as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt as unknown as BufferSource,
      iterations: iterations,
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    extractable,
    ['encrypt', 'decrypt']
  );

  return aesKey;
}
