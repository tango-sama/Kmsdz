export type Role = "admin" | "worker";
export type Actor = { id: string; role: Role; username: string; fullName: string; mustChangePassword: boolean };

export const JOB_STATUSES = ["new", "in_progress", "on_hold", "done"] as const;
export const JOB_PRIORITIES = ["normal", "high", "urgent"] as const;
export const FILE_CATEGORIES = ["forms", "plans", "procedures", "safety", "other"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];
export type JobPriority = (typeof JOB_PRIORITIES)[number];
export type FileCategory = (typeof FILE_CATEGORIES)[number];
export type Audience = "all" | "selected";

export class PortalError extends Error {
  constructor(public code: PortalErrorCode, message?: string) {
    super(message || code);
    this.name = "PortalError";
  }
}
export type PortalErrorCode =
  | "VALIDATION" | "FORBIDDEN" | "NOT_FOUND" | "USERNAME_TAKEN" | "WEAK_PASSWORD" | "PASSWORD_MISMATCH"
  | "WRONG_PASSWORD" | "LAST_ADMIN" | "SELF" | "FILE_REQUIRED" | "FILE_TYPE" | "FILE_SIZE"
  | "INVALID_CREDENTIALS" | "LOCKED" | "NOT_CONFIGURED" | "UNKNOWN";

export function assertAdmin(actor: Actor) {
  if (actor.role !== "admin") throw new PortalError("FORBIDDEN");
}

/**
 * SQL fragment deciding whether `actor` may see a row of `table` alias `alias` (jobs/files).
 * Admins see everything; workers see audience='all' rows or rows explicitly granted to them.
 * `paramIndex` is the $-index where the actor id is bound.
 */
export function visibleSql(actor: Actor, kind: "job" | "file", alias: string, paramIndex: number): { sql: string; params: unknown[] } {
  if (actor.role === "admin") return { sql: "true", params: [] };
  return {
    sql: `(${alias}.audience = 'all' or exists (select 1 from grants g where g.kind = '${kind}' and g.item_id = ${alias}.id and g.user_id = $${paramIndex}))`,
    params: [actor.id],
  };
}

export const isUuid = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
