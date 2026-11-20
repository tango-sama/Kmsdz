import "server-only";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { PortalError, type Actor } from "@/lib/portal/types";
import { hashPassword, passwordProblem } from "./password";
import { createSession } from "./session";

const schema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().max(254).email(),
});

/**
 * Public sign-up. The role is hard-coded to "customer": nothing the visitor sends can create an admin or a worker
 * (those accounts exist only through users.createUser, which requires an administrator).
 * The e-mail address is the login name; staff usernames cannot contain "@", so the two can never collide.
 */
export async function registerCustomer(
  input: { fullName: string; email: string; password: string; confirm: string },
  _ip?: string,
): Promise<{ token: string; expires: Date; actor: Actor }> {
  const parsed = schema.safeParse({ fullName: input.fullName, email: input.email });
  if (!parsed.success) throw new PortalError("VALIDATION");
  const { fullName, email } = parsed.data;
  if (input.password !== input.confirm) throw new PortalError("PASSWORD_MISMATCH");
  if (passwordProblem(input.password, email.split("@")[0])) throw new PortalError("WEAK_PASSWORD");

  const db = await getDb();
  const rows = await db.query<{ id: string }>(
    `insert into users (username, full_name, role, password_hash, must_change_password)
     values ($1, $2, 'customer', $3, false) on conflict (username) do nothing returning id`,
    [email, fullName, await hashPassword(input.password)],
  );
  if (!rows[0]) throw new PortalError("EMAIL_TAKEN");
  await db.query("update users set last_login_at = now() where id = $1", [rows[0].id]);
  const { token, expires } = await createSession(rows[0].id);
  return { token, expires, actor: { id: rows[0].id, username: email, fullName, role: "customer", mustChangePassword: false } };
}
