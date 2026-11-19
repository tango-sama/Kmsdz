import "server-only";
import { getDb } from "@/lib/db";
import { PortalError, type Actor } from "@/lib/portal/types";
import { burnPasswordCheck, hashPassword, verifyPassword } from "./password";
import { createSession } from "./session";

const WINDOW_MIN = 15;
const MAX_FAILS_PER_USER = 5;
const MAX_FAILS_PER_IP = 25;

export const normalizeUsername = (u: string) => u.trim().toLowerCase();

async function isLocked(username: string, ip: string): Promise<boolean> {
  const db = await getDb();
  const [u] = await db.query<{ c: number }>(
    `select count(*)::int as c from login_attempts where username = $1 and at > now() - ($2 || ' minutes')::interval`,
    [username, String(WINDOW_MIN)],
  );
  const [i] = await db.query<{ c: number }>(
    `select count(*)::int as c from login_attempts where ip = $1 and at > now() - ($2 || ' minutes')::interval`,
    [ip, String(WINDOW_MIN)],
  );
  return u.c >= MAX_FAILS_PER_USER || i.c >= MAX_FAILS_PER_IP;
}

/** First run only: create the first administrator from ADMIN_USERNAME / ADMIN_PASSWORD when the users table is empty. */
export async function ensureBootstrapAdmin() {
  const db = await getDb();
  const [{ c }] = await db.query<{ c: number }>("select count(*)::int as c from users");
  if (c > 0) return;
  const dev = process.env.NODE_ENV !== "production";
  const username = normalizeUsername(process.env.ADMIN_USERNAME || (dev ? "admin" : ""));
  const password = process.env.ADMIN_PASSWORD || (dev ? "ChangeMe123!" : "");
  if (!username || !password) throw new PortalError("NOT_CONFIGURED");
  await db.query(
    `insert into users (username, full_name, role, password_hash, must_change_password)
     values ($1, $2, 'admin', $3, true) on conflict (username) do nothing`,
    [username, "Administrateur", await hashPassword(password)],
  );
}

export async function login(usernameRaw: string, password: string, ip: string): Promise<{ token: string; expires: Date; actor: Actor }> {
  const db = await getDb();
  await ensureBootstrapAdmin();
  const username = normalizeUsername(usernameRaw);
  if (!username || !password || username.length > 64 || password.length > 128) throw new PortalError("INVALID_CREDENTIALS");
  if (await isLocked(username, ip)) throw new PortalError("LOCKED");

  const rows = await db.query<{ id: string; password_hash: string; full_name: string; role: "admin" | "worker"; must_change_password: boolean; active: boolean }>(
    "select id, password_hash, full_name, role, must_change_password, active from users where username = $1",
    [username],
  );
  const u = rows[0];
  const ok = u ? await verifyPassword(password, u.password_hash) : (await burnPasswordCheck(password), false);
  if (!u || !ok || !u.active) {
    await db.query("insert into login_attempts (username, ip) values ($1, $2)", [username, ip]);
    await db.query("delete from login_attempts where at < now() - interval '2 days'");
    throw new PortalError("INVALID_CREDENTIALS"); // identical for unknown user / wrong password / disabled account
  }
  await db.query("delete from login_attempts where username = $1", [username]);
  await db.query("update users set last_login_at = now() where id = $1", [u.id]);
  const { token, expires } = await createSession(u.id);
  return { token, expires, actor: { id: u.id, username, fullName: u.full_name, role: u.role, mustChangePassword: u.must_change_password } };
}
