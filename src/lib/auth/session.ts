import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import type { Actor } from "@/lib/portal/types";

export const SESSION_DAYS = 7;

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

/** The browser only ever holds a random token; the DB stores its SHA-256 (a DB leak cannot be replayed). */
export async function createSession(userId: string): Promise<{ token: string; expires: Date }> {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.query("delete from sessions where expires_at < now()");
  await db.query("insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)", [hashToken(token), userId, expires.toISOString()]);
  return { token, expires };
}

type ActorRow = { id: string; username: string; full_name: string; role: Actor["role"]; must_change_password: boolean };

/** Valid only if the session is unexpired AND the account is still active (deactivation takes effect immediately). */
export async function getActorByToken(token: string | undefined | null): Promise<Actor | null> {
  if (!token || token.length < 20 || token.length > 100) return null;
  const db = await getDb();
  const rows = await db.query<ActorRow>(
    `select u.id, u.username, u.full_name, u.role, u.must_change_password
       from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now() and u.active = true`,
    [hashToken(token)],
  );
  const r = rows[0];
  return r ? { id: r.id, username: r.username, fullName: r.full_name, role: r.role, mustChangePassword: r.must_change_password } : null;
}

export async function deleteSession(token: string) {
  const db = await getDb();
  await db.query("delete from sessions where token_hash = $1", [hashToken(token)]);
}

export async function deleteUserSessions(userId: string, exceptToken?: string) {
  const db = await getDb();
  if (exceptToken) await db.query("delete from sessions where user_id = $1 and token_hash <> $2", [userId, hashToken(exceptToken)]);
  else await db.query("delete from sessions where user_id = $1", [userId]);
}
