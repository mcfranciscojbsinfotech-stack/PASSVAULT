import { EncryptedEnvelope, EncryptedEnvelopeSchema } from '@passvault/shared';
import { deriveKeyFromRecoveryCode, deriveKeyFromPassword, generateSalt } from './key-derivation.js';
import { encryptAesGcm, decryptAesGcm } from './aes-gcm.js';
import {
  bufferToBase64,
  base64ToBuffer,
  stringToBuffer,
  bufferToString,
} from './utils.js';

export interface EnvelopeOptions {
  keyDerivation?: 'HKDF-SHA-256' | 'PBKDF2-SHA-256';
  aad?: string;
  salt?: Uint8Array;
}

/**
 * Encrypts arbitrary serializable payload into a versioned EncryptedEnvelope.
 */
export async function encryptPayloadToEnvelope(
  payload: unknown,
  secret: string,
  options: EnvelopeOptions = {}
): Promise<EncryptedEnvelope> {
  const keyDerivation = options.keyDerivation ?? 'HKDF-SHA-256';
  const salt = options.salt ?? generateSalt();

  let key: CryptoKey;
  if (keyDerivation === 'HKDF-SHA-256') {
    key = await deriveKeyFromRecoveryCode(secret, salt, false);
  } else {
    key = await deriveKeyFromPassword(secret, salt, undefined, false);
  }

  const plaintextJson = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const plaintextBytes = stringToBuffer(plaintextJson);

  const aadBytes = options.aad ? stringToBuffer(options.aad) : undefined;
  const { ciphertext, iv } = await encryptAesGcm(key, plaintextBytes, aadBytes);

  const envelope: EncryptedEnvelope = {
    version: 1,
    algorithm: 'AES-GCM-256',
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    ciphertext: bufferToBase64(ciphertext),
    tagLength: 128,
    keyDerivation: keyDerivation,
    aad: options.aad,
  };

  return envelope;
}

/**
 * Decrypts an EncryptedEnvelope and parses the resulting payload.
 * Validates envelope schema, derives key, checks authentication tag, and returns decrypted data.
 */
export async function decryptPayloadFromEnvelope<T = unknown>(
  envelope: EncryptedEnvelope,
  secret: string
): Promise<T> {
  // Validate envelope structure with Zod
  const validated = EncryptedEnvelopeSchema.parse(envelope);

  const saltBytes = base64ToBuffer(validated.salt);
  const ivBytes = base64ToBuffer(validated.iv);
  const ciphertextBytes = base64ToBuffer(validated.ciphertext);
  const aadBytes = validated.aad ? stringToBuffer(validated.aad) : undefined;

  let key: CryptoKey;
  if (validated.keyDerivation === 'HKDF-SHA-256') {
    key = await deriveKeyFromRecoveryCode(secret, saltBytes, false);
  } else {
    key = await deriveKeyFromPassword(secret, saltBytes, undefined, false);
  }

  const decryptedBytes = await decryptAesGcm(key, ciphertextBytes, ivBytes, aadBytes);
  const decryptedString = bufferToString(decryptedBytes);

  try {
    return JSON.parse(decryptedString) as T;
  } catch {
    return decryptedString as unknown as T;
  }
}

/**
 * Serializes an envelope to a JSON string for network sync or local storage.
 */
export function serializeEnvelope(envelope: EncryptedEnvelope): string {
  return JSON.stringify(envelope);
}

/**
 * Parses and validates an envelope from a JSON string.
 */
export function deserializeEnvelope(jsonString: string): EncryptedEnvelope {
  const parsed = JSON.parse(jsonString);
  return EncryptedEnvelopeSchema.parse(parsed);
}
