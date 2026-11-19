import "server-only";
import { getDb } from "@/lib/db";
import { isUuid } from "./types";

/** Replace the list of workers allowed to see an item (only meaningful when audience = 'selected'). */
export async function setGrants(kind: "job" | "file", itemId: string, audience: "all" | "selected", userIds: string[]) {
  const db = await getDb();
  await db.query("delete from grants where kind = $1 and item_id = $2", [kind, itemId]);
  if (audience !== "selected") return;
  const ids = [...new Set(userIds.filter(isUuid))];
  if (!ids.length) return;
  await db.query(
    `insert into grants (kind, item_id, user_id)
     select $1, $2, u.id from users u where u.id = any($3::uuid[]) and u.role = 'worker'`,
    [kind, itemId, ids],
  );
}

export async function getGrantIds(kind: "job" | "file", itemId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.query<{ user_id: string }>("select user_id from grants where kind = $1 and item_id = $2", [kind, itemId]);
  return rows.map((r) => r.user_id);
}
