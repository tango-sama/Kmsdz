import "server-only";
import { SCHEMA_STATEMENTS } from "./schema";

/**
 * Minimal Postgres adapter shared by:
 *  - production: Neon serverless Postgres over HTTPS (DATABASE_URL / POSTGRES_URL)
 *  - local preview & tests: PGlite (real Postgres compiled to WASM, stored in ./.data/pglite)
 * Every query is parameterised ($1, $2...). Never concatenate user input into SQL.
 */
export type Row = Record<string, any>;
export interface Db {
  query<T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]>;
}

const g = globalThis as unknown as { __kmsDb?: Promise<Db>; __kmsDbOverride?: Db };

export function databaseUrl(): string {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

/** In production a real DATABASE_URL is required. In development/tests the embedded PGlite is used. */
export function isDbConfigured(): boolean {
  return !!g.__kmsDbOverride || !!databaseUrl() || process.env.NODE_ENV !== "production";
}

async function connect(): Promise<Db> {
  const url = databaseUrl();
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    return { query: async (text, params = []) => (await sql.query(text, params as unknown[])) as never };
  }
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is not set");
  const { PGlite } = await import("@electric-sql/pglite");
  let pg: InstanceType<typeof PGlite>;
  if (process.env.KMS_DB === "memory") pg = new PGlite();
  else {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(".data", { recursive: true }); // PGlite creates the last folder only
    pg = new PGlite(".data/pglite");
  }
  await pg.waitReady;
  return { query: async (text, params = []) => (await pg.query(text, params as unknown[])).rows as never };
}

async function init(db: Db) {
  for (const stmt of SCHEMA_STATEMENTS) {
    try {
      await db.query(stmt);
    } catch {
      // two cold starts creating the same object at once: the loser retries once
      await db.query(stmt);
    }
  }
}

export function getDb(): Promise<Db> {
  if (g.__kmsDbOverride) return Promise.resolve(g.__kmsDbOverride);
  if (!g.__kmsDb) {
    g.__kmsDb = (async () => {
      const db = await connect();
      await init(db);
      return db;
    })().catch((e) => {
      g.__kmsDb = undefined; // allow retry on the next request
      throw e;
    });
  }
  return g.__kmsDb;
}

/** Tests only: use a fresh in-memory database. */
export async function useTestDb(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite();
  await pg.waitReady;
  const db: Db = { query: async (text, params = []) => (await pg.query(text, params as unknown[])).rows as never };
  await init(db);
  g.__kmsDbOverride = db;
  return db;
}
