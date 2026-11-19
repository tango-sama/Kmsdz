import "server-only";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { generatePassword, hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { deleteUserSessions } from "@/lib/auth/session";
import { normalizeUsername } from "@/lib/auth/login";
import { assertAdmin, isUuid, PortalError, type Actor, type Role } from "./types";

export type UserRow = { id: string; username: string; fullName: string; role: Role; active: boolean; mustChangePassword: boolean; createdAt: Date; lastLoginAt: Date | null };

const createSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,32}$/),
  fullName: z.string().trim().min(2).max(80),
  role: z.enum(["admin", "worker"]),
});

export async function listUsers(actor: Actor): Promise<UserRow[]> {
  assertAdmin(actor);
  const db = await getDb();
  const rows = await db.query(
    "select id, username, full_name, role, active, must_change_password, created_at, last_login_at from users order by role, full_name",
  );
  return rows.map((r) => ({
    id: r.id, username: r.username, fullName: r.full_name, role: r.role, active: r.active,
    mustChangePassword: r.must_change_password, createdAt: new Date(r.created_at), lastLoginAt: r.last_login_at ? new Date(r.last_login_at) : null,
  }));
}

/** Active workers, for the "visible to" pickers. */
export async function listWorkers(actor: Actor): Promise<{ id: string; fullName: string; username: string }[]> {
  assertAdmin(actor);
  const db = await getDb();
  const rows = await db.query("select id, full_name, username from users where role = 'worker' and active = true order by full_name");
  return rows.map((r) => ({ id: r.id, fullName: r.full_name, username: r.username }));
}

/** Creates an account with a generated temporary password (shown once to the admin). */
export async function createUser(actor: Actor, input: { username: string; fullName: string; role: string }): Promise<{ id: string; tempPassword: string }> {
  assertAdmin(actor);
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) throw new PortalError("VALIDATION");
  const db = await getDb();
  const tempPassword = generatePassword();
  const rows = await db.query<{ id: string }>(
    `insert into users (username, full_name, role, password_hash, must_change_password)
     values ($1, $2, $3, $4, true) on conflict (username) do nothing returning id`,
    [parsed.data.username, parsed.data.fullName, parsed.data.role, await hashPassword(tempPassword)],
  );
  if (!rows[0]) throw new PortalError("USERNAME_TAKEN");
  return { id: rows[0].id, tempPassword };
}

async function activeAdminCount(excludeId?: string): Promise<number> {
  const db = await getDb();
  const [r] = await db.query<{ c: number }>(
    "select count(*)::int as c from users where role = 'admin' and active = true and ($1::uuid is null or id <> $1::uuid)",
    [excludeId ?? null],
  );
  return r.c;
}

export async function setActive(actor: Actor, userId: string, active: boolean) {
  assertAdmin(actor);
  if (!isUuid(userId)) throw new PortalError("NOT_FOUND");
  if (userId === actor.id && !active) throw new PortalError("SELF");
  const db = await getDb();
  const [u] = await db.query<{ role: Role }>("select role from users where id = $1", [userId]);
  if (!u) throw new PortalError("NOT_FOUND");
  if (!active && u.role === "admin" && (await activeAdminCount(userId)) === 0) throw new PortalError("LAST_ADMIN");
  await db.query("update users set active = $2 where id = $1", [userId, active]);
  if (!active) await deleteUserSessions(userId); // kicked out immediately
}

export async function resetPassword(actor: Actor, userId: string): Promise<string> {
  assertAdmin(actor);
  if (!isUuid(userId)) throw new PortalError("NOT_FOUND");
  const db = await getDb();
  const tempPassword = generatePassword();
  const rows = await db.query("update users set password_hash = $2, must_change_password = true where id = $1 returning id", [userId, await hashPassword(tempPassword)]);
  if (!rows[0]) throw new PortalError("NOT_FOUND");
  await deleteUserSessions(userId);
  return tempPassword;
}

export async function deleteUser(actor: Actor, userId: string) {
  assertAdmin(actor);
  if (!isUuid(userId)) throw new PortalError("NOT_FOUND");
  if (userId === actor.id) throw new PortalError("SELF");
  const db = await getDb();
  const [u] = await db.query<{ role: Role; active: boolean }>("select role, active from users where id = $1", [userId]);
  if (!u) throw new PortalError("NOT_FOUND");
  if (u.role === "admin" && u.active && (await activeAdminCount(userId)) === 0) throw new PortalError("LAST_ADMIN");
  await db.query("delete from users where id = $1", [userId]); // cascades to sessions, grants, posts, comments
}

export async function changeOwnPassword(actor: Actor, current: string, next: string, confirm: string, keepToken?: string) {
  if (next !== confirm) throw new PortalError("PASSWORD_MISMATCH");
  if (passwordProblem(next, actor.username)) throw new PortalError("WEAK_PASSWORD");
  const db = await getDb();
  const [u] = await db.query<{ password_hash: string }>("select password_hash from users where id = $1", [actor.id]);
  if (!u || !(await verifyPassword(current, u.password_hash))) throw new PortalError("WRONG_PASSWORD");
  if (current === next) throw new PortalError("WEAK_PASSWORD");
  await db.query("update users set password_hash = $2, must_change_password = false where id = $1", [actor.id, await hashPassword(next)]);
  await deleteUserSessions(actor.id, keepToken); // other devices are signed out
}

export { normalizeUsername };
