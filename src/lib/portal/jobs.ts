import "server-only";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getGrantIds, setGrants } from "./grants";
import { assertAdmin, isUuid, JOB_PRIORITIES, JOB_STATUSES, PortalError, visibleSql, type Actor, type JobPriority, type JobStatus } from "./types";

export type Job = {
  id: string; title: string; description: string; location: string; client: string;
  status: JobStatus; priority: JobPriority; startDate: string | null; dueDate: string | null;
  audience: "all" | "selected"; createdAt: Date; updatedAt: Date; fileCount: number;
};

const date = z.string().trim().refine((v) => v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))));
const jobSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(4000).default(""),
  location: z.string().trim().max(120).default(""),
  client: z.string().trim().max(120).default(""),
  status: z.enum(JOB_STATUSES).default("new"),
  priority: z.enum(JOB_PRIORITIES).default("normal"),
  startDate: date.default(""),
  dueDate: date.default(""),
  audience: z.enum(["all", "selected"]).default("all"),
  userIds: z.array(z.string()).default([]),
});
export type JobInput = z.input<typeof jobSchema>;

const COLS = `j.id, j.title, j.description, j.location, j.client, j.status, j.priority, j.start_date::text as start_date,
  j.due_date::text as due_date, j.audience, j.created_at, j.updated_at,
  (select count(*)::int from files f where f.job_id = j.id) as file_count`;

const map = (r: any): Job => ({
  id: r.id, title: r.title, description: r.description, location: r.location, client: r.client, status: r.status, priority: r.priority,
  startDate: r.start_date, dueDate: r.due_date, audience: r.audience, createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at), fileCount: r.file_count,
});

export async function listJobs(actor: Actor, opts: { status?: string; limit?: number } = {}): Promise<Job[]> {
  const db = await getDb();
  const vis = visibleSql(actor, "job", "j", 1);
  const params: unknown[] = [...vis.params];
  let where = vis.sql;
  if (opts.status && (JOB_STATUSES as readonly string[]).includes(opts.status)) {
    params.push(opts.status);
    where += ` and j.status = $${params.length}`;
  }
  const limit = Math.min(opts.limit ?? 200, 500);
  const rows = await db.query(
    `select ${COLS} from jobs j where ${where}
      order by (j.status = 'done') asc,
               case j.priority when 'urgent' then 0 when 'high' then 1 else 2 end,
               j.due_date asc nulls last, j.created_at desc
      limit ${limit}`,
    params,
  );
  return rows.map(map);
}

/** Returns null when the job does not exist OR is hidden from this worker (callers answer 404 either way). */
export async function getJob(actor: Actor, id: string): Promise<Job | null> {
  if (!isUuid(id)) return null;
  const db = await getDb();
  const vis = visibleSql(actor, "job", "j", 2);
  const rows = await db.query(`select ${COLS} from jobs j where j.id = $1 and ${vis.sql}`, [id, ...vis.params]);
  return rows[0] ? map(rows[0]) : null;
}

export async function getJobAudience(actor: Actor, id: string): Promise<string[]> {
  assertAdmin(actor);
  return getGrantIds("job", id);
}

export async function createJob(actor: Actor, input: JobInput): Promise<string> {
  assertAdmin(actor);
  const p = jobSchema.safeParse(input);
  if (!p.success) throw new PortalError("VALIDATION");
  const d = p.data;
  const db = await getDb();
  const [row] = await db.query<{ id: string }>(
    `insert into jobs (title, description, location, client, status, priority, start_date, due_date, audience, created_by)
     values ($1,$2,$3,$4,$5,$6,nullif($7,'')::date,nullif($8,'')::date,$9,$10) returning id`,
    [d.title, d.description, d.location, d.client, d.status, d.priority, d.startDate, d.dueDate, d.audience, actor.id],
  );
  await setGrants("job", row.id, d.audience, d.userIds);
  return row.id;
}

export async function updateJob(actor: Actor, id: string, input: JobInput) {
  assertAdmin(actor);
  if (!isUuid(id)) throw new PortalError("NOT_FOUND");
  const p = jobSchema.safeParse(input);
  if (!p.success) throw new PortalError("VALIDATION");
  const d = p.data;
  const db = await getDb();
  const rows = await db.query(
    `update jobs set title=$2, description=$3, location=$4, client=$5, status=$6, priority=$7,
            start_date=nullif($8,'')::date, due_date=nullif($9,'')::date, audience=$10, updated_at=now()
      where id=$1 returning id`,
    [id, d.title, d.description, d.location, d.client, d.status, d.priority, d.startDate, d.dueDate, d.audience],
  );
  if (!rows[0]) throw new PortalError("NOT_FOUND");
  await setGrants("job", id, d.audience, d.userIds);
}

export async function setJobStatus(actor: Actor, id: string, status: string) {
  assertAdmin(actor);
  if (!isUuid(id) || !(JOB_STATUSES as readonly string[]).includes(status)) throw new PortalError("VALIDATION");
  const db = await getDb();
  const rows = await db.query("update jobs set status = $2, updated_at = now() where id = $1 returning id", [id, status]);
  if (!rows[0]) throw new PortalError("NOT_FOUND");
}

export async function deleteJob(actor: Actor, id: string) {
  assertAdmin(actor);
  if (!isUuid(id)) throw new PortalError("NOT_FOUND");
  const db = await getDb();
  await db.query("delete from grants where kind = 'job' and item_id = $1", [id]);
  await db.query("delete from jobs where id = $1", [id]); // files linked to it stay (job_id set null)
}

/** Light list for the "related job" select on the file form (admin). */
export async function listJobOptions(actor: Actor): Promise<{ id: string; title: string }[]> {
  assertAdmin(actor);
  const db = await getDb();
  return db.query<{ id: string; title: string }>("select id, title from jobs where status <> 'done' order by created_at desc limit 100");
}
