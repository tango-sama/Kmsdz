import { NextResponse } from "next/server";
import { z } from "zod";
import { buildContactRow, buildQuoteRow, makeReference, submissionSuffix } from "@/lib/submission";
import { appendRow, isSheetsConfigured, SheetsError, submissionExists } from "@/lib/sheets";
import { isStorageConfigured, sniffFile, storeFile } from "@/lib/storage";
import { rateLimit } from "@/lib/ratelimit";
import { isTurnstileEnabled, verifyTurnstile } from "@/lib/turnstile";
import { contactSchema, FILE_LIMITS, issuesToErrors, quoteSchema, validateFiles } from "@/lib/validation";
import type { SubmitErrorCode, SubmitResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BODY = FILE_LIMITS.maxTotalBytes + 256 * 1024;
const MIN_FILL_MS = 2500;
const inflight = new Set<string>();

const statusFor: Record<SubmitErrorCode, number> = {
  NOT_CONFIGURED: 503,
  SERVICE_UNAVAILABLE: 502,
  RATE_LIMITED: 429,
  SPAM: 400,
  TOO_FAST: 400,
  TOO_LARGE: 413,
  FILE_REJECTED: 400,
  VALIDATION: 400,
  TURNSTILE: 400,
  NETWORK: 502,
  UNKNOWN: 500,
};

function fail(code: SubmitErrorCode, fieldErrors?: Record<string, string>, headers?: HeadersInit) {
  const body: SubmitResponse = { ok: false, code, ...(fieldErrors ? { fieldErrors } : {}) };
  return NextResponse.json(body, { status: statusFor[code], headers: { "Cache-Control": "no-store", ...headers } });
}

const metaSchema = z.object({
  kind: z.enum(["quote", "contact"]),
  locale: z.enum(["ar", "fr"]),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9-]{16,64}$/),
  elapsedMs: z.number().finite(),
  hp: z.string().max(200).default(""),
  consent: z.boolean().default(false),
  turnstileToken: z.string().max(4096).default(""),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";

  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > MAX_BODY) return fail("TOO_LARGE");

  const rl = rateLimit(`submit:${ip}`, 6, 10 * 60_000);
  if (!rl.ok) return fail("RATE_LIMITED", undefined, { "Retry-After": String(rl.retryAfter) });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("VALIDATION");
  }

  let meta: z.infer<typeof metaSchema>;
  try {
    const raw = form.get("payload");
    if (typeof raw !== "string" || raw.length > 20_000) return fail("VALIDATION");
    const parsed = metaSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return fail("VALIDATION");
    meta = parsed.data;
  } catch {
    return fail("VALIDATION");
  }

  // --- spam protection -------------------------------------------------------
  if (meta.hp.trim() !== "") {
    console.warn("[submit] honeypot triggered");
    return fail("SPAM");
  }
  if (meta.elapsedMs < MIN_FILL_MS) return fail("TOO_FAST");
  if (isTurnstileEnabled() && !(await verifyTurnstile(meta.turnstileToken, ip))) return fail("TURNSTILE");

  // --- validation ------------------------------------------------------------
  const schema = meta.kind === "quote" ? quoteSchema : contactSchema;
  const parsed = schema.safeParse(meta.data);
  if (!parsed.success) return fail("VALIDATION", issuesToErrors(parsed.error.issues));
  if (meta.kind === "quote" && !meta.consent) return fail("VALIDATION", { consent: "consent" });

  const files = meta.kind === "quote" ? form.getAll("files").filter((f): f is File => typeof f !== "string" && f.size > 0) : [];
  const fileError = validateFiles(files.map((f) => ({ name: f.name, size: f.size, type: f.type })));
  if (fileError) return fail(fileError === "fileSize" ? "TOO_LARGE" : "FILE_REJECTED", { files: fileError });
  for (const f of files) if (!(await sniffFile(f))) return fail("FILE_REJECTED", { files: "fileType" });

  // --- storage must be available BEFORE we accept anything ------------------
  if (!isSheetsConfigured()) {
    console.error("[submit] Google Sheets is not configured (GOOGLE_SHEETS_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_SHEET_NAME)");
    return fail("NOT_CONFIGURED");
  }

  const suffix = submissionSuffix(meta.idempotencyKey);
  const reference = makeReference(meta.idempotencyKey);
  if (inflight.has(suffix)) return fail("RATE_LIMITED");
  inflight.add(suffix);

  try {
    // Duplicate submission (double click / retry with the same key): report the original reference.
    if (await submissionExists(suffix)) {
      return NextResponse.json({ ok: true, reference, duplicate: true, filesStored: true } satisfies SubmitResponse, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    let filesCell = "";
    let filesStored = true;
    if (files.length > 0) {
      if (isStorageConfigured()) {
        const urls: string[] = [];
        for (const f of files) urls.push(await storeFile(reference, f));
        filesCell = urls.join("\n");
      } else {
        filesStored = false;
        filesCell = "NOT STORED (storage not configured): " + files.map((f) => `${f.name} (${Math.round(f.size / 1024)} KB)`).join(", ");
      }
    }

    const common = { reference, locale: meta.locale, files: filesCell };
    const row =
      meta.kind === "quote"
        ? buildQuoteRow(parsed.data as z.output<typeof quoteSchema>, common)
        : buildContactRow(parsed.data as z.output<typeof contactSchema>, common);

    await appendRow(row);

    return NextResponse.json({ ok: true, reference, filesStored } satisfies SubmitResponse, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof SheetsError) {
      console.error(`[submit] Google Sheets error: ${err.code} - ${err.message}`);
      return fail(err.code === "NOT_CONFIGURED" ? "NOT_CONFIGURED" : err.code === "NETWORK" ? "NETWORK" : "SERVICE_UNAVAILABLE");
    }
    console.error("[submit] unexpected error:", err instanceof Error ? err.message : "unknown");
    return fail("SERVICE_UNAVAILABLE");
  } finally {
    inflight.delete(suffix);
  }
}

export function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405, headers: { Allow: "POST" } });
}
