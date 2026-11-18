import type { SubmitResponse } from "./types";

export type SubmitArgs = {
  kind: "quote" | "contact";
  locale: "ar" | "fr";
  data: Record<string, unknown>;
  files?: File[];
  idempotencyKey: string;
  /** performance.now() captured when the form was mounted - used for the "too fast" bot check */
  mountedAt: number;
  hp: string;
  consent?: boolean;
  turnstileToken?: string;
};

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

/** POSTs to /api/submit. Never throws: network/parse problems become explicit failure responses. */
export async function postSubmission(a: SubmitArgs): Promise<SubmitResponse> {
  const body = new FormData();
  body.append(
    "payload",
    JSON.stringify({
      kind: a.kind,
      locale: a.locale,
      idempotencyKey: a.idempotencyKey,
      elapsedMs: Math.round(performance.now() - a.mountedAt),
      hp: a.hp,
      consent: !!a.consent,
      turnstileToken: a.turnstileToken || "",
      data: a.data,
    }),
  );
  for (const f of a.files || []) body.append("files", f, f.name);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45_000);
  try {
    const res = await fetch("/api/submit", { method: "POST", body, signal: ctrl.signal });
    const json = (await res.json().catch(() => null)) as SubmitResponse | null;
    if (json && typeof json === "object" && "ok" in json) {
      // Only an explicit ok:true from a 2xx response counts as success
      if (json.ok === true && res.ok && typeof json.reference === "string") return json;
      if (json.ok === false) return json;
    }
    return { ok: false, code: "UNKNOWN" };
  } catch {
    return { ok: false, code: "NETWORK" };
  } finally {
    clearTimeout(timer);
  }
}

export const LAST_SUBMISSION_KEY = "kms-last-submission";
