import { getRandomBytes } from './utils.js';

/**
 * Crockford Base32 alphabet (32 characters, excluding ambiguous 0, O, 1, I).
 * Each character represents exactly 5 bits of cryptographic entropy.
 */
export const CROCKFORD_BASE32_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates an unbiased, cryptographically secure 25-character vault recovery code.
 * Standard format: 5 blocks of 5 characters separated by dashes (e.g. "ABCDE-FGHIJ-KLMNO-PQRST-UVWXY").
 */
export function generateVaultRecoveryCode(): string {
  const codeLength = 25;
  const alphabetLength = CROCKFORD_BASE32_ALPHABET.length; // 32
  // We use uniform random selection: since 32 is a power of 2 (2^5),
  // taking (byte & 31) is completely unbiased without rejection sampling.
  const randomBytes = getRandomBytes(codeLength);
  let rawCode = '';

  for (let i = 0; i < codeLength; i++) {
    const index = randomBytes[i] & (alphabetLength - 1);
    rawCode += CROCKFORD_BASE32_ALPHABET[index];
  }

  // Format into 5 groups of 5 characters
  return formatRecoveryCode(rawCode);
}

/**
 * Formats a 25-character raw recovery code into standard 5x5 blocks.
 */
export function formatRecoveryCode(raw: string): string {
  const clean = normalizeRecoveryCode(raw);
  if (clean.length !== 25) {
    throw new Error(`Invalid recovery code length: expected 25 characters, got ${clean.length}`);
  }
  return clean.match(/.{1,5}/g)?.join('-') ?? clean;
}

/**
 * Strips formatting (dashes, spaces) and standardizes to uppercase.
 */
export function normalizeRecoveryCode(input: string): string {
  if (!input) return '';
  return input.replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Validates that a recovery code contains exactly 25 valid Crockford Base32 characters.
 */
export function validateRecoveryCode(input: string): boolean {
  const normalized = normalizeRecoveryCode(input);
  if (normalized.length !== 25) return false;

  const validCharSet = new Set(CROCKFORD_BASE32_ALPHABET);
  for (const char of normalized) {
    if (!validCharSet.has(char)) {
      return false;
    }
  }
  return true;
}
