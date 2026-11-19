import "server-only";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { assertAdmin, isUuid, PortalError, type Actor } from "./types";

export type Comment = { id: string; authorId: string; authorName: string; body: string; createdAt: Date };
export type Post = { id: string; authorId: string; authorName: string; authorRole: "admin" | "worker"; title: string; body: string; pinned: boolean; createdAt: Date; comments: Comment[] };

const postSchema = z.object({ title: z.string().trim().max(120).default(""), body: z.string().trim().min(2).max(4000) });
const commentSchema = z.string().trim().min(1).max(1000);

export async function listPosts(limit = 30): Promise<Post[]> {
  const db = await getDb();
  const posts = await db.query(
    `select p.id, p.author_id, u.full_name as author_name, u.role as author_role, p.title, p.body, p.pinned, p.created_at
       from posts p join users u on u.id = p.author_id
      order by p.pinned desc, p.created_at desc limit $1`,
    [Math.min(limit, 100)],
  );
  if (!posts.length) return [];
  const comments = await db.query(
    `select c.id, c.post_id, c.author_id, u.full_name as author_name, c.body, c.created_at
       from comments c join users u on u.id = c.author_id
      where c.post_id = any($1::uuid[]) order by c.created_at asc`,
    [posts.map((p) => p.id)],
  );
  return posts.map((p) => ({
    id: p.id, authorId: p.author_id, authorName: p.author_name, authorRole: p.author_role, title: p.title, body: p.body, pinned: p.pinned, createdAt: new Date(p.created_at),
    comments: comments.filter((c) => c.post_id === p.id).map((c) => ({ id: c.id, authorId: c.author_id, authorName: c.author_name, body: c.body, createdAt: new Date(c.created_at) })),
  }));
}

export async function createPost(actor: Actor, input: { title?: string; body: string }) {
  const p = postSchema.safeParse(input);
  if (!p.success) throw new PortalError("VALIDATION");
  const db = await getDb();
  const [row] = await db.query<{ id: string }>("insert into posts (author_id, title, body) values ($1,$2,$3) returning id", [actor.id, p.data.title, p.data.body]);
  return row.id;
}

export async function addComment(actor: Actor, postId: string, body: string) {
  const b = commentSchema.safeParse(body);
  if (!b.success || !isUuid(postId)) throw new PortalError("VALIDATION");
  const db = await getDb();
  const rows = await db.query("insert into comments (post_id, author_id, body) select id, $2, $3 from posts where id = $1 returning id", [postId, actor.id, b.data]);
  if (!rows[0]) throw new PortalError("NOT_FOUND");
}

/** Authors can delete their own posts; admins can delete anything. */
export async function deletePost(actor: Actor, postId: string) {
  if (!isUuid(postId)) throw new PortalError("NOT_FOUND");
  const db = await getDb();
  const rows = await db.query("delete from posts where id = $1 and ($2 = 'admin' or author_id = $3) returning id", [postId, actor.role, actor.id]);
  if (!rows[0]) throw new PortalError("FORBIDDEN");
}

export async function deleteComment(actor: Actor, commentId: string) {
  if (!isUuid(commentId)) throw new PortalError("NOT_FOUND");
  const db = await getDb();
  const rows = await db.query("delete from comments where id = $1 and ($2 = 'admin' or author_id = $3) returning id", [commentId, actor.role, actor.id]);
  if (!rows[0]) throw new PortalError("FORBIDDEN");
}

export async function setPinned(actor: Actor, postId: string, pinned: boolean) {
  assertAdmin(actor);
  if (!isUuid(postId)) throw new PortalError("NOT_FOUND");
  const db = await getDb();
  await db.query("update posts set pinned = $2 where id = $1", [postId, pinned]);
}
