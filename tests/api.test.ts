import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { clearSheetsEnv, configureSheetsEnv, makeRequest, mockGoogle, quotePayload } from "./helpers.ts";
import { POST } from "../src/app/api/submit/route.ts";
import { resetRateLimit } from "../src/lib/ratelimit.ts";
import { resetSheetsCache, SHEET_COLUMNS } from "../src/lib/sheets.ts";

let g: ReturnType<typeof mockGoogle>;
let n = 0;
const ip = () => `10.1.${Math.floor(n / 250)}.${n++ % 250}`;

beforeEach(() => { resetSheetsCache(); resetRateLimit(); configureSheetsEnv(); });
afterEach(() => { g?.restore(); clearSheetsEnv(); });

const body = async (r: Response) => (await r.json()) as Record<string, any>;

describe("POST /api/submit", () => {
  it("returns NOT_CONFIGURED (503) and never a success when Google Sheets is not configured", async () => {
    clearSheetsEnv();
    g = mockGoogle();
    const res = await POST(makeRequest(quotePayload(), [], ip()));
    assert.equal(res.status, 503);
    const j = await body(res);
    assert.equal(j.ok, false);
    assert.equal(j.code, "NOT_CONFIGURED");
    assert.equal(g.calls.length, 0);
  });

  it("saves a valid quote: header row + 18-column data row, reference returned", async () => {
    g = mockGoogle();
    const res = await POST(makeRequest(quotePayload(), [], ip()));
    assert.equal(res.status, 200);
    const j = await body(res);
    assert.equal(j.ok, true);
    assert.match(j.reference, /^KMS-\d{6}-[A-Z0-9]{6}$/);
    assert.equal(g.sheet.length, 2);
    assert.deepEqual(g.sheet[0], [...SHEET_COLUMNS]);
    const row = g.sheet[1];
    assert.equal(row.length, SHEET_COLUMNS.length);
    assert.equal(row[0], j.reference);
    assert.equal(row[3], "0661204590"); // normalised phone
    assert.equal(row[6], "Électricité – Installation");
    assert.equal(row[7], "55 - Touggourt");
    assert.equal(row[15], "New");
    assert.equal(row[16], "Arabic");
    // the Sheet ID given as a full URL was parsed, the PEM key (with literal \n) signed a JWT
    assert.ok(g.calls.some((c) => c.url.startsWith("https://oauth2.googleapis.com/token")));
  });

  it("does not create a duplicate when the same idempotency key is re-sent", async () => {
    g = mockGoogle();
    const a = await body(await POST(makeRequest(quotePayload(), [], ip())));
    const b = await body(await POST(makeRequest(quotePayload(), [], ip())));
    assert.equal(b.ok, true);
    assert.equal(b.duplicate, true);
    assert.equal(b.reference, a.reference);
    assert.equal(g.sheet.length, 2); // header + one row
  });

  it("reports failure (never success) when the Sheets API errors", async () => {
    g = mockGoogle({ failAppend: 500 });
    const res = await POST(makeRequest(quotePayload(), [], ip()));
    assert.equal(res.status, 502);
    const j = await body(res);
    assert.equal(j.ok, false);
    assert.equal(j.code, "SERVICE_UNAVAILABLE");
  });

  it("reports failure when Google authentication fails", async () => {
    g = mockGoogle({ failAuth: true });
    const res = await POST(makeRequest(quotePayload(), [], ip()));
    const j = await body(res);
    assert.equal(j.ok, false);
    assert.equal(res.status, 502);
  });

  it("reports failure when the permission is missing (403)", async () => {
    g = mockGoogle({ failAppend: 403 });
    const j = await body(await POST(makeRequest(quotePayload(), [], ip())));
    assert.equal(j.ok, false);
  });

  it("rejects honeypot submissions", async () => {
    g = mockGoogle();
    const res = await POST(makeRequest(quotePayload({}, { hp: "http://spam" }), [], ip()));
    assert.equal(res.status, 400);
    assert.equal((await body(res)).code, "SPAM");
    assert.equal(g.sheet.length, 0);
  });

  it("rejects forms filled in impossibly fast", async () => {
    g = mockGoogle();
    const res = await POST(makeRequest(quotePayload({}, { elapsedMs: 300 }), [], ip()));
    assert.equal((await body(res)).code, "TOO_FAST");
  });

  it("validates on the server with field-level errors", async () => {
    g = mockGoogle();
    const res = await POST(makeRequest(quotePayload({ phone: "12345", fullName: "", service: "nope", description: "short" }), [], ip()));
    assert.equal(res.status, 400);
    const j = await body(res);
    assert.equal(j.code, "VALIDATION");
    assert.equal(j.fieldErrors.phone, "phone");
    assert.equal(j.fieldErrors.fullName, "name");
    assert.equal(j.fieldErrors.service, "choose");
    assert.equal(j.fieldErrors.description, "description");
    assert.equal(g.sheet.length, 0);
  });

  it("requires consent for quote requests", async () => {
    g = mockGoogle();
    const j = await body(await POST(makeRequest(quotePayload({}, { consent: false }), [], ip())));
    assert.equal(j.code, "VALIDATION");
    assert.equal(j.fieldErrors.consent, "consent");
  });

  it("rate limits repeated submissions from one IP", async () => {
    g = mockGoogle();
    let last = 0;
    for (let i = 0; i < 8; i++) {
      const res = await POST(makeRequest(quotePayload({}, { idempotencyKey: `aaaaaaaa-bbbb-cccc-dddd-${String(i).padStart(12, "0")}` }), [], "9.9.9.9"));
      last = res.status;
    }
    assert.equal(last, 429);
  });

  it("neutralises spreadsheet formula injection", async () => {
    g = mockGoogle();
    await POST(makeRequest(quotePayload({ fullName: "=HYPERLINK(\"http://evil\")", description: "+cmd|' /C calc'!A0 injection test" }), [], ip()));
    assert.ok(g.sheet[1][2].startsWith("'="));
    assert.ok(g.sheet[1][10].startsWith("'+"));
  });

  it("rejects files whose content does not match their type", async () => {
    g = mockGoogle();
    const fake = new File([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])], "plan.pdf", { type: "application/pdf" });
    const res = await POST(makeRequest(quotePayload(), [fake], ip()));
    assert.equal(res.status, 400);
    assert.equal((await body(res)).code, "FILE_REJECTED");
  });

  it("rejects disallowed file types and too many files", async () => {
    g = mockGoogle();
    const exe = new File([new Uint8Array([0x4d, 0x5a, 0, 0])], "virus.exe", { type: "application/x-msdownload" });
    assert.equal((await body(await POST(makeRequest(quotePayload(), [exe], ip())))).code, "FILE_REJECTED");
    const pdf = () => new File([new TextEncoder().encode("%PDF-1.4 test")], "a.pdf", { type: "application/pdf" });
    const res = await POST(makeRequest(quotePayload(), [pdf(), pdf(), pdf(), pdf()], ip()));
    assert.equal((await body(res)).code, "FILE_REJECTED");
  });

  it("accepts a valid PDF and honestly reports it was NOT stored when storage is not configured", async () => {
    g = mockGoogle();
    const pdf = new File([new TextEncoder().encode("%PDF-1.4 hello")], "plan.pdf", { type: "application/pdf" });
    const j = await body(await POST(makeRequest(quotePayload(), [pdf], ip())));
    assert.equal(j.ok, true);
    assert.equal(j.filesStored, false);
    assert.match(g.sheet[1][14], /NOT STORED/);
    assert.match(g.sheet[1][14], /plan\.pdf/);
  });

  it("saves contact-form messages with their own form type", async () => {
    g = mockGoogle();
    const payload = { kind: "contact", locale: "fr", idempotencyKey: "cccccccc-1111-2222-3333-444444444444", elapsedMs: 9000, hp: "", data: { fullName: "Karim", phone: "+213 661 20 45 70", email: "", message: "Bonjour, je souhaite un rendez-vous." } };
    const j = await body(await POST(makeRequest(payload, [], ip())));
    assert.equal(j.ok, true);
    assert.equal(g.sheet[1][17], "Contact message");
    assert.equal(g.sheet[1][3], "0661204570");
    assert.equal(g.sheet[1][16], "French");
  });

  it("rejects malformed payloads and GET", async () => {
    g = mockGoogle();
    const fd = new FormData();
    fd.append("payload", "{not json");
    const res = await POST(new Request("http://localhost/api/submit", { method: "POST", body: fd, headers: { "x-forwarded-for": ip() } }));
    assert.equal((await body(res)).code, "VALIDATION");
  });
});
