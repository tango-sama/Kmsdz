import { generateKeyPairSync } from "node:crypto";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });

export function configureSheetsEnv() {
  process.env.GOOGLE_SHEETS_ID = "https://docs.google.com/spreadsheets/d/TEST_SHEET_ID_123/edit#gid=0";
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "bot@test-project.iam.gserviceaccount.com";
  process.env.GOOGLE_PRIVATE_KEY = privateKey.replace(/\n/g, "\\n"); // as pasted into Vercel
  process.env.GOOGLE_SHEET_NAME = "Demandes";
  delete process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.TURNSTILE_SECRET_KEY;
}

export function clearSheetsEnv() {
  for (const k of ["GOOGLE_SHEETS_ID", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_PRIVATE_KEY", "GOOGLE_SHEET_NAME"]) delete process.env[k];
}

export type Call = { url: string; method: string; body?: string };

/** Fake Google (OAuth + Sheets). `rows` is the in-memory sheet. */
export function mockGoogle(opts: { failAppend?: number; failAuth?: boolean } = {}) {
  const calls: Call[] = [];
  const sheet: string[][] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method || "GET").toUpperCase();
    const body = init?.body ? String(init.body) : undefined;
    calls.push({ url, method, body });
    const json = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
    if (url.startsWith("https://oauth2.googleapis.com/token")) {
      if (opts.failAuth) return json(400, { error: "invalid_grant" });
      return json(200, { access_token: "tok", expires_in: 3600 });
    }
    if (url.includes("sheets.googleapis.com/v4/spreadsheets/TEST_SHEET_ID_123")) {
      if (url.includes(":append")) {
        if (opts.failAppend) return json(opts.failAppend, { error: { message: "boom" } });
        sheet.push(...(JSON.parse(body!).values as string[][]));
        return json(200, { updates: { updatedRows: 1 } });
      }
      if (method === "PUT") {
        sheet.unshift(...(JSON.parse(body!).values as string[][]));
        return json(200, {});
      }
      if (url.includes("A1%3AR1")) return json(200, sheet.length ? { values: [sheet[0]] } : {});
      if (url.includes("!A%3AA")) return json(200, { values: sheet.map((r) => [r[0]]) });
    }
    return json(404, { error: { message: "unexpected url " + url } });
  }) as typeof fetch;
  return { calls, sheet, restore: () => { globalThis.fetch = original; } };
}

export function quotePayload(over: Record<string, unknown> = {}, meta: Record<string, unknown> = {}) {
  return {
    kind: "quote",
    locale: "ar",
    idempotencyKey: "11111111-2222-3333-4444-555555555555",
    elapsedMs: 20000,
    hp: "",
    consent: true,
    turnstileToken: "",
    data: {
      fullName: "محمد بن علي",
      phone: "0661 20 45 90",
      email: "client@example.com",
      customerType: "individual",
      service: "electricite-installation",
      wilaya: "55",
      commune: "تقرت",
      projectType: "residential",
      description: "تركيب لوحة كهربائية جديدة لمنزل من طابقين",
      budget: "300000 DA",
      startDate: "",
      notes: "",
      ...over,
    },
    ...meta,
  };
}

export function makeRequest(payload: unknown, files: File[] = [], ip = "10.0.0.1") {
  const fd = new FormData();
  fd.append("payload", JSON.stringify(payload));
  for (const f of files) fd.append("files", f);
  return new Request("http://localhost/api/submit", { method: "POST", body: fd, headers: { "x-forwarded-for": ip } });
}
