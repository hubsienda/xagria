import 'server-only';
import {createHmac, createHash, timingSafeEqual, randomBytes} from 'node:crypto';

export const SESSION_COOKIE = 'xagria_desk';
export const SESSION_SECONDS = 8 * 60 * 60;
export const CONFIG_ERROR = 'Private Desk is unavailable. The owner must configure the server authentication settings.';

// Only fixed diagnostic codes reach server logs; never log values or lengths.
let lastConfigFailure = '';

export function getConfig() {
  const passphrase = process.env.XAGRIA_DESK_PASSPHRASE;
  const secret = process.env.XAGRIA_SESSION_SECRET;
  const failures: string[] = [];
  if (!passphrase) failures.push('PASSPHRASE_MISSING_OR_EMPTY');
  else if (passphrase.trim().length < 16) failures.push('PASSPHRASE_BELOW_MINIMUM');
  else if (passphrase.length > 1024) failures.push('PASSPHRASE_ABOVE_MAXIMUM');
  if (!secret) failures.push('SESSION_SECRET_MISSING_OR_EMPTY');
  else if (secret.trim().length < 32) failures.push('SESSION_SECRET_BELOW_MINIMUM');
  else if (secret.length > 4096) failures.push('SESSION_SECRET_ABOVE_MAXIMUM');
  if (passphrase && secret && secret === passphrase) failures.push('CREDENTIALS_IDENTICAL');
  if (!passphrase || !secret || failures.length) {
    const diagnostic = failures.join(',');
    // Suppress repeated identical reports within a warm server instance.
    if (diagnostic !== lastConfigFailure) {
      console.error('[XAGRIA_DESK_CONFIG_INVALID]', diagnostic);
      lastConfigFailure = diagnostic;
    }
    return null;
  }
  lastConfigFailure = '';
  return {passphrase, secret};
}

export function validPassphrase(value: unknown): boolean {
  const config = getConfig();
  if (!config || typeof value !== 'string' || value.length > 1024) return false;
  const hash = (text: string) => createHash('sha256').update(text).digest();
  return timingSafeEqual(hash(value), hash(config.passphrase));
}

function sign(payload: string, config: NonNullable<ReturnType<typeof getConfig>>) {
  // Bind sessions to both credentials so rotating either invalidates them.
  return createHmac('sha256', config.secret).update(config.passphrase).update('\0').update(payload).digest('base64url');
}

export function createSession(now = Math.floor(Date.now() / 1000)): string {
  const config = getConfig();
  if (!config) throw new Error(CONFIG_ERROR);
  const payload = Buffer.from(JSON.stringify({v: 1, iat: now, exp: now + SESSION_SECONDS, nonce: randomBytes(16).toString('hex')})).toString('base64url');
  return `${payload}.${sign(payload, config)}`;
}

export function verifySession(token: string | undefined, now = Math.floor(Date.now() / 1000)): boolean {
  const config = getConfig();
  if (!config || !token || token.length > 1024) return false;
  const parts = token.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return false;
  const expected = Buffer.from(sign(parts[0], config));
  const actual = Buffer.from(parts[1]);
  if (!timingSafeEqual(expected, actual)) return false;
  try {
    const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    return data.v === 1 && Number.isSafeInteger(data.iat) && Number.isSafeInteger(data.exp) &&
      data.iat <= now && data.exp > now && data.exp - data.iat === SESSION_SECONDS &&
      typeof data.nonce === 'string' && /^[a-f0-9]{32}$/.test(data.nonce);
  } catch { return false; }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/desk',
  maxAge: SESSION_SECONDS
};
