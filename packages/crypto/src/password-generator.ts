import { getRandomBytes } from './utils.js';

export interface PasswordGeneratorOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  excludeAmbiguous?: boolean;
}

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS_CHARS = new Set(['0', 'O', 'o', '1', 'l', 'I', '|']);

/**
 * Generates a cryptographically secure random password using crypto.getRandomValues.
 */
export function generatePassword(options: PasswordGeneratorOptions = {}): string {
  const {
    length = 20,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false,
  } = options;

  let pool = '';
  const requiredChars: string[] = [];

  const filterAmbiguous = (str: string) => {
    if (!excludeAmbiguous) return str;
    return str
      .split('')
      .filter((char) => !AMBIGUOUS_CHARS.has(char))
      .join('');
  };

  const uPool = filterAmbiguous(UPPERCASE_CHARS);
  const lPool = filterAmbiguous(LOWERCASE_CHARS);
  const nPool = filterAmbiguous(NUMBER_CHARS);
  const sPool = filterAmbiguous(SYMBOL_CHARS);

  if (uppercase && uPool.length > 0) {
    pool += uPool;
    requiredChars.push(getRandomChar(uPool));
  }
  if (lowercase && lPool.length > 0) {
    pool += lPool;
    requiredChars.push(getRandomChar(lPool));
  }
  if (numbers && nPool.length > 0) {
    pool += nPool;
    requiredChars.push(getRandomChar(nPool));
  }
  if (symbols && sPool.length > 0) {
    pool += sPool;
    requiredChars.push(getRandomChar(sPool));
  }

  if (pool.length === 0) {
    throw new Error('At least one character set must be selected');
  }

  const remainingLength = Math.max(0, length - requiredChars.length);
  const resultChars = [...requiredChars];

  // Pick remaining characters using unbiased selection
  const randomBytes = getRandomBytes(remainingLength);
  for (let i = 0; i < remainingLength; i++) {
    resultChars.push(pool[randomBytes[i] % pool.length]);
  }

  // Fisher-Yates shuffle using cryptographically secure random values
  const shuffleBytes = getRandomBytes(resultChars.length);
  for (let i = resultChars.length - 1; i > 0; i--) {
    const j = shuffleBytes[i] % (i + 1);
    [resultChars[i], resultChars[j]] = [resultChars[j], resultChars[i]];
  }

  return resultChars.join('');
}

function getRandomChar(set: string): string {
  const byte = getRandomBytes(1)[0];
  return set[byte % set.length];
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4; // 0=very weak, 4=very strong
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  entropyBits: number;
  suggestions: string[];
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Very Weak', entropyBits: 0, suggestions: ['Enter a password'] };
  }

  let poolSize = 0;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasNumber) poolSize += 10;
  if (hasSymbol) poolSize += 32;

  const entropyBits = Math.floor(password.length * Math.log2(Math.max(2, poolSize)));
  const suggestions: string[] = [];

  if (password.length < 12) suggestions.push('Use at least 12 characters');
  if (!hasUpper) suggestions.push('Add uppercase letters');
  if (!hasLower) suggestions.push('Add lowercase letters');
  if (!hasNumber) suggestions.push('Add numbers');
  if (!hasSymbol) suggestions.push('Add special symbols');

  let score: 0 | 1 | 2 | 3 | 4 = 0;
  let label: PasswordStrength['label'] = 'Very Weak';

  if (entropyBits >= 80 && password.length >= 14) {
    score = 4;
    label = 'Very Strong';
  } else if (entropyBits >= 60 && password.length >= 12) {
    score = 3;
    label = 'Strong';
  } else if (entropyBits >= 40 && password.length >= 8) {
    score = 2;
    label = 'Fair';
  } else if (entropyBits >= 24) {
    score = 1;
    label = 'Weak';
  }

  return { score, label, entropyBits, suggestions };
}
