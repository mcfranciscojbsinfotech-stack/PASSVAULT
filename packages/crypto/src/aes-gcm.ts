import { getRandomBytes } from './utils.js';

export const GCM_IV_LENGTH_BYTES = 12; // 96 bits
export const GCM_TAG_LENGTH_BITS = 128;

export interface AesGcmResult {
  ciphertext: Uint8Array;
  iv: Uint8Array;
}

/**
 * Encrypts data using AES-256-GCM with a fresh, cryptographically secure 96-bit IV.
 */
export async function encryptAesGcm(
  key: CryptoKey,
  plaintext: Uint8Array,
  additionalData?: Uint8Array
): Promise<AesGcmResult> {
  // Always generate a fresh 96-bit IV per encryption operation
  const iv = getRandomBytes(GCM_IV_LENGTH_BYTES);

  const algorithm: AesGcmParams = {
    name: 'AES-GCM',
    iv: iv as unknown as BufferSource,
    tagLength: GCM_TAG_LENGTH_BITS,
  };

  if (additionalData && additionalData.byteLength > 0) {
    algorithm.additionalData = additionalData as unknown as BufferSource;
  }

  const ciphertextBuffer = await crypto.subtle.encrypt(
    algorithm,
    key,
    plaintext as unknown as BufferSource
  );
  const ciphertext = new Uint8Array(ciphertextBuffer);

  return {
    ciphertext,
    iv,
  };
}

/**
 * Decrypts AES-256-GCM ciphertext, validating the authentication tag and additional data.
 * Throws on tampering, invalid key, or corrupted payload.
 */
export async function decryptAesGcm(
  key: CryptoKey,
  ciphertext: Uint8Array,
  iv: Uint8Array,
  additionalData?: Uint8Array
): Promise<Uint8Array> {
  if (iv.byteLength !== GCM_IV_LENGTH_BYTES) {
    throw new Error(`Invalid IV length: expected ${GCM_IV_LENGTH_BYTES} bytes, got ${iv.byteLength}`);
  }

  const algorithm: AesGcmParams = {
    name: 'AES-GCM',
    iv: iv as unknown as BufferSource,
    tagLength: GCM_TAG_LENGTH_BITS,
  };

  if (additionalData && additionalData.byteLength > 0) {
    algorithm.additionalData = additionalData as unknown as BufferSource;
  }

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      algorithm,
      key,
      ciphertext as unknown as BufferSource
    );
    return new Uint8Array(decryptedBuffer);
  } catch (err) {
    throw new Error('Decryption failed: authentication tag mismatch, corrupted ciphertext, or incorrect key');
  }
}
