import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isDbConfigured } from "@/lib/db";
import type { Actor } from "@/lib/portal/types";
import type { Locale } from "@/i18n/config";
import { getActorByToken, SESSION_DAYS } from "./session";

// "__Host-" prefix (production): HTTPS only, no Domain attribute, path "/" - cannot be overwritten by sub-domains.
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-kms_session" : "kms_session";

export async function setSessionCookie(token: string, expires: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires, maxAge: SESSION_DAYS * 86400,
  });
}

export async function clearSessionCookie() {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

/** Current signed-in user (memoised per request) or null. */
export const getCurrentActor = cache(async (): Promise<Actor | null> => {
  if (!isDbConfigured()) return null;
  try {
    return await getActorByToken(await getSessionToken());
  } catch (e) {
    console.error("[portal] session lookup failed:", e instanceof Error ? e.message : "unknown");
    return null;
  }
});

export async function requireActor(locale: Locale, opts: { allowMustChange?: boolean } = {}): Promise<Actor> {
  const actor = await getCurrentActor();
  if (!actor) redirect(`/${locale}/portal/login`);
  if (actor.mustChangePassword && !opts.allowMustChange) redirect(`/${locale}/portal/account`);
  return actor;
}

export async function requireAdmin(locale: Locale): Promise<Actor> {
  const actor = await requireActor(locale);
  if (actor.role !== "admin") redirect(`/${locale}/portal`);
  return actor;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}
