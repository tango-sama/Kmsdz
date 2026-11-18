import "server-only";
import { createSign } from "node:crypto";

/**
 * Google Sheets integration (server-side only, no SDK dependency).
 * Auth: service account -> signed JWT -> OAuth access token -> Sheets REST API.
 * Credentials come exclusively from environment variables and never reach the browser.
 */

export const SHEET_COLUMNS = [
  "Submission ID",
  "Submission Date",
  "Customer Name",
  "Phone Number",
  "Email",
  "Customer Type",
  "Requested Service",
  "Wilaya",
  "Municipality",
  "Project Type",
  "Project Description",
  "Estimated Budget",
  "Expected Start Date",
  "Additional Notes",
  "Attached Files",
  "Submission Status",
  "Language",
  "Form Type",
] as const;

export type SheetsErrorCode = "NOT_CONFIGURED" | "AUTH" | "FORBIDDEN" | "NOT_FOUND" | "QUOTA" | "NETWORK" | "UNKNOWN";

export class SheetsError extends Error {
  constructor(public code: SheetsErrorCode, message: string) {
    super(message);
    this.name = "SheetsError";
  }
}

type Config = { sheetId: string; email: string; privateKey: string; sheetName: string };

/** Accepts either the bare spreadsheet ID or the full Google Sheets URL. */
export function extractSheetId(value: string): string {
  const m = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return (m ? m[1] : value).trim();
}

export function normalizePrivateKey(raw: string): string {
  let k = raw.trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) k = k.slice(1, -1);
  return k.replace(/\\n/g, "\n");
}

export function getConfig(env: NodeJS.ProcessEnv = process.env): Config | null {
  const sheetId = extractSheetId(env.GOOGLE_SHEETS_ID || "");
  const email = (env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").trim();
  const privateKey = normalizePrivateKey(env.GOOGLE_PRIVATE_KEY || "");
  const sheetName = (env.GOOGLE_SHEET_NAME || "").trim();
  if (!sheetId || !email || !privateKey || !sheetName) return null;
  return { sheetId, email, privateKey, sheetName };
}

export function isSheetsConfigured(): boolean {
  return getConfig() !== null;
}

const b64url = (input: Buffer | string) =>
  Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

let tokenCache: { token: string; exp: number; key: string } | null = null;

async function timedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(12_000), cache: "no-store" });
  } catch {
    throw new SheetsError("NETWORK", "Network error or timeout while contacting Google");
  }
}

async function getAccessToken(cfg: Config): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.key === cfg.email && tokenCache.exp - 60 > now) return tokenCache.token;

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: cfg.email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  let signature: string;
  try {
    signature = b64url(createSign("RSA-SHA256").update(`${header}.${claim}`).sign(cfg.privateKey));
  } catch {
    throw new SheetsError("AUTH", "GOOGLE_PRIVATE_KEY is not a valid PEM private key");
  }
  const res = await timedFetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${signature}`,
    }),
  });
  if (!res.ok) throw new SheetsError("AUTH", `Google token request failed (${res.status})`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new SheetsError("AUTH", "Google token response had no access_token");
  tokenCache = { token: json.access_token, exp: now + (json.expires_in || 3600), key: cfg.email };
  return json.access_token;
}

async function sheetsRequest(cfg: Config, path: string, init: RequestInit = {}) {
  const token = await getAccessToken(cfg);
  const res = await timedFetch(`https://sheets.googleapis.com/v4/spreadsheets/${cfg.sheetId}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (res.ok) return res.json();
  if (res.status === 401) tokenCache = null;
  const code: SheetsErrorCode =
    res.status === 401 ? "AUTH" : res.status === 403 ? "FORBIDDEN" : res.status === 404 ? "NOT_FOUND" : res.status === 429 ? "QUOTA" : "UNKNOWN";
  let detail = "";
  try {
    detail = ((await res.json()) as { error?: { message?: string } }).error?.message || "";
  } catch {}
  throw new SheetsError(code, `Sheets API ${res.status}: ${detail}`.trim());
}

const q = (sheetName: string) => `'${sheetName.replace(/'/g, "''")}'`;
const lastCol = String.fromCharCode(64 + SHEET_COLUMNS.length); // 18 -> R
let headerVerified = false;

async function ensureHeader(cfg: Config) {
  if (headerVerified) return;
  const range = encodeURIComponent(`${q(cfg.sheetName)}!A1:${lastCol}1`);
  const data = (await sheetsRequest(cfg, `/values/${range}`)) as { values?: string[][] };
  if (!data.values || !data.values[0] || data.values[0].every((c) => !c)) {
    await sheetsRequest(cfg, `/values/${range}?valueInputOption=RAW`, {
      method: "PUT",
      body: JSON.stringify({ values: [[...SHEET_COLUMNS]] }),
    });
  }
  headerVerified = true;
}

/** Returns true when a row whose ID ends with `idSuffix` is already stored (duplicate protection). */
export async function submissionExists(idSuffix: string): Promise<boolean> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsError("NOT_CONFIGURED", "Google Sheets is not configured");
  await ensureHeader(cfg);
  const range = encodeURIComponent(`${q(cfg.sheetName)}!A:A`);
  const data = (await sheetsRequest(cfg, `/values/${range}`)) as { values?: string[][] };
  return (data.values || []).some((r) => typeof r[0] === "string" && r[0].endsWith(`-${idSuffix}`));
}

/** Neutralise spreadsheet formula injection for free-text fields. */
export function guardCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export async function appendRow(row: string[]): Promise<void> {
  const cfg = getConfig();
  if (!cfg) throw new SheetsError("NOT_CONFIGURED", "Google Sheets is not configured");
  if (row.length !== SHEET_COLUMNS.length) throw new Error("Row/column count mismatch");
  await ensureHeader(cfg);
  const range = encodeURIComponent(`${q(cfg.sheetName)}!A:${lastCol}`);
  await sheetsRequest(cfg, `/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST",
    body: JSON.stringify({ values: [row] }),
  });
}

/** Test helper: clear module-level caches. */
export function resetSheetsCache() {
  tokenCache = null;
  headerVerified = false;
}
