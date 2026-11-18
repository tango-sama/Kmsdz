/** API contract between the browser and /api/submit. */
export type SubmitErrorCode =
  | "NOT_CONFIGURED" | "SERVICE_UNAVAILABLE" | "RATE_LIMITED" | "SPAM" | "TOO_FAST"
  | "TOO_LARGE" | "FILE_REJECTED" | "VALIDATION" | "TURNSTILE" | "NETWORK" | "UNKNOWN";

export type SubmitSuccess = { ok: true; reference: string; duplicate?: boolean; filesStored: boolean };
export type SubmitFailure = { ok: false; code: SubmitErrorCode; fieldErrors?: Record<string, string> };
export type SubmitResponse = SubmitSuccess | SubmitFailure;
