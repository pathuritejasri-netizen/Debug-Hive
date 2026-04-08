import crypto from 'crypto';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  // Simple password hashing - in production use bcrypt
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const [salt, originalHash] = hash.split(':');
  const newHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return newHash === originalHash;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
