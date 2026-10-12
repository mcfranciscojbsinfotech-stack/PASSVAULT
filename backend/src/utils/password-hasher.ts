import crypto from 'crypto';

let argon2Module: typeof import('@node-rs/argon2') | null = null;
let argon2Checked = false;

async function getArgon2() {
  if (argon2Checked) return argon2Module;
  try {
    argon2Module = await import('@node-rs/argon2');
  } catch {
    argon2Module = null;
  }
  argon2Checked = true;
  return argon2Module;
}

/**
 * Hashes an authentication password using Argon2id (or high-work-factor scrypt fallback).
 */
export async function hashPassword(password: string): Promise<string> {
  const argon2 = await getArgon2();
  if (argon2) {
    return argon2.hash(password, {
      algorithm: argon2.Algorithm.Argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  // Cryptographically secure scrypt fallback (N=32768, r=8, p=1)
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, { N: 32768, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verifies a candidate password against an Argon2id or scrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('$argon2')) {
    const argon2 = await getArgon2();
    if (argon2) {
      try {
        return await argon2.verify(hash, password);
      } catch {
        return false;
      }
    }
  }

  if (hash.startsWith('scrypt:')) {
    const parts = hash.split(':');
    if (parts.length !== 3) return false;
    const [, salt, originalKeyHex] = parts;

    return new Promise((resolve) => {
      crypto.scrypt(password, salt, 64, { N: 32768, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) return resolve(false);
        const originalBuf = Buffer.from(originalKeyHex, 'hex');
        if (derivedKey.length !== originalBuf.length) return resolve(false);
        resolve(crypto.timingSafeEqual(derivedKey, originalBuf));
      });
    });
  }

  return false;
}
