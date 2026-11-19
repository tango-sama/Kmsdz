import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const N = 2 ** 15, R = 8, P = 1, KEYLEN = 32;
const OPTS = { N, r: R, p: P, maxmem: 128 * N * R * 2 };

/** scrypt$N$r$p$salt$hash (base64). Salted, memory-hard, constant-time compare. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEYLEN, OPTS);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, "base64");
  try {
    const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltB64, "base64"), expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 128 * Number(n) * Number(r) * 2,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Used when the username does not exist, so response time does not reveal valid usernames. */
let dummy: Promise<string> | null = null;
export async function burnPasswordCheck(password: string) {
  dummy ??= hashPassword("dummy-password-for-timing");
  await verifyPassword(password, await dummy);
}

export const PASSWORD_MIN = 8;
export function passwordProblem(password: string, username?: string): "WEAK_PASSWORD" | null {
  if (password.length < PASSWORD_MIN || password.length > 128) return "WEAK_PASSWORD";
  if (username && password.toLowerCase().includes(username.toLowerCase())) return "WEAK_PASSWORD";
  if (/^(.)\1+$/.test(password) || /^(12345678|password|motdepasse|azertyui)/i.test(password)) return "WEAK_PASSWORD";
  return null;
}

/** Readable temporary password (no 0/O/1/l/I). */
export function generatePassword(length = 12): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}
