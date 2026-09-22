import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  if (!storedHash || typeof storedHash !== 'string') return false;

  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return storedHash === password;
  }

  const derivedKey = scryptSync(password, salt, 64);
  const originalHash = Buffer.from(hash, 'hex');

  if (derivedKey.length !== originalHash.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, originalHash);
}
