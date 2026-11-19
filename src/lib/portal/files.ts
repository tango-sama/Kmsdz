import "server-only";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { checkFile, isInlineMime } from "./filetypes";
import { getGrantIds, setGrants } from "./grants";
import { assertAdmin, FILE_CATEGORIES, isUuid, PortalError, visibleSql, type Actor } from "./types";

export type FileItem = {
  id: string; title: string; description: string; category: string; filename: string; mime: string; size: number;
  jobId: string | null; jobTitle: string | null; audience: "all" | "selected"; createdAt: Date; inline: boolean;
};

const fileSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(""),
  category: z.enum(FILE_CATEGORIES).default("other"),
  jobId: z.string().default(""),
  audience: z.enum(["all", "selected"]).default("all"),
  userIds: z.array(z.string()).default([]),
});
export type FileInput = z.input<typeof fileSchema>;

// NB: the `data` column is never selected in listings.
// The linked job's title is only returned when the actor may see that job (no leaking hidden job names).
const cols = (actor: Actor, idx: number) =>
  `f.id, f.title, f.description, f.category, f.filename, f.mime, f.size, f.job_id,
   case when ${visibleSql(actor, "job", "j", idx).sql} then j.title end as job_title, f.audience, f.created_at`;

const map = (r: any): FileItem => ({
  id: r.id, title: r.title, description: r.description, category: r.category, filename: r.filename, mime: r.mime, size: r.size,
  jobId: r.job_id, jobTitle: r.job_title, audience: r.audience, createdAt: new Date(r.created_at), inline: isInlineMime(r.mime),
});

export async function listFiles(actor: Actor, opts: { category?: string; q?: string; jobId?: string; limit?: number } = {}): Promise<FileItem[]> {
  const db = await getDb();
  const vis = visibleSql(actor, "file", "f", 1);
  const params: unknown[] = [...vis.params];
  let where = vis.sql;
  if (opts.category && (FILE_CATEGORIES as readonly string[]).includes(opts.category)) {
    params.push(opts.category);
    where += ` and f.category = $${params.length}`;
  }
  if (opts.jobId && isUuid(opts.jobId)) {
    params.push(opts.jobId);
    where += ` and f.job_id = $${params.length}`;
  }
  if (opts.q && opts.q.trim()) {
    params.push(`%${opts.q.trim().slice(0, 80).replace(/[%_\\]/g, (c) => "\\" + c)}%`);
    where += ` and (f.title ilike $${params.length} or f.description ilike $${params.length} or f.filename ilike $${params.length})`;
  }
  const limit = Math.min(opts.limit ?? 200, 500);
  const rows = await db.query(
    `select ${cols(actor, 1)} from files f left join jobs j on j.id = f.job_id where ${where} order by f.created_at desc limit ${limit}`,
    params,
  );
  return rows.map(map);
}

export async function getFileMeta(actor: Actor, id: string): Promise<FileItem | null> {
  if (!isUuid(id)) return null;
  const db = await getDb();
  const vis = visibleSql(actor, "file", "f", 2);
  const rows = await db.query(`select ${cols(actor, 2)} from files f left join jobs j on j.id = f.job_id where f.id = $1 and ${vis.sql}`, [id, ...vis.params]);
  return rows[0] ? map(rows[0]) : null;
}

export async function getFileAudience(actor: Actor, id: string): Promise<string[]> {
  assertAdmin(actor);
  return getGrantIds("file", id);
}

/** Authorisation happens in the same query as the read: hidden files return null (=> 404). */
export async function getFileForDownload(actor: Actor, id: string): Promise<{ filename: string; mime: string; data: Buffer; inline: boolean } | null> {
  if (!isUuid(id)) return null;
  const db = await getDb();
  const vis = visibleSql(actor, "file", "f", 2);
  const rows = await db.query(`select f.filename, f.mime, encode(f.data, 'base64') as b64 from files f where f.id = $1 and ${vis.sql}`, [id, ...vis.params]);
  const r = rows[0];
  return r ? { filename: r.filename, mime: r.mime, data: Buffer.from(r.b64, "base64"), inline: isInlineMime(r.mime) } : null;
}

export async function createFile(actor: Actor, input: FileInput, file: { name: string; bytes: Uint8Array }): Promise<string> {
  assertAdmin(actor);
  const p = fileSchema.safeParse(input);
  if (!p.success) throw new PortalError("VALIDATION");
  const chk = checkFile(file.name, file.bytes);
  if (!chk.ok) throw new PortalError(chk.code);
  const d = p.data;
  const jobId = isUuid(d.jobId) ? d.jobId : null;
  const db = await getDb();
  const [row] = await db.query<{ id: string }>(
    `insert into files (title, description, category, filename, mime, size, data, job_id, audience, uploaded_by)
     values ($1,$2,$3,$4,$5,$6,decode($7,'base64'),$8,$9,$10) returning id`,
    [d.title, d.description, d.category, file.name.slice(-200), chk.mime, file.bytes.length, Buffer.from(file.bytes).toString("base64"), jobId, d.audience, actor.id],
  );
  await setGrants("file", row.id, d.audience, d.userIds);
  return row.id;
}

export async function updateFile(actor: Actor, id: string, input: FileInput) {
  assertAdmin(actor);
  if (!isUuid(id)) throw new PortalError("NOT_FOUND");
  const p = fileSchema.safeParse(input);
  if (!p.success) throw new PortalError("VALIDATION");
  const d = p.data;
  const db = await getDb();
  const rows = await db.query(
    "update files set title=$2, description=$3, category=$4, job_id=$5, audience=$6 where id=$1 returning id",
    [id, d.title, d.description, d.category, isUuid(d.jobId) ? d.jobId : null, d.audience],
  );
  if (!rows[0]) throw new PortalError("NOT_FOUND");
  await setGrants("file", id, d.audience, d.userIds);
}

export async function deleteFile(actor: Actor, id: string) {
  assertAdmin(actor);
  if (!isUuid(id)) throw new PortalError("NOT_FOUND");
  const db = await getDb();
  await db.query("delete from grants where kind = 'file' and item_id = $1", [id]);
  await db.query("delete from files where id = $1", [id]);
}
