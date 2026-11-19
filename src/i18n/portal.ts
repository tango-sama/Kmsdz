import type { Locale } from "./config";
import { portalAr, type PortalDict } from "./portal-ar";
import { portalFr } from "./portal-fr";

export function getPortalDict(locale: Locale): PortalDict {
  return locale === "ar" ? portalAr : portalFr;
}
export type { PortalDict };

/** Dates in Algeria time; Latin digits in Arabic too (the usual convention in Algeria). */
export function fmtDate(d: Date | string | null, locale: Locale, withTime = false): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d.length === 10 ? d + "T12:00:00Z" : d) : d;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ-u-nu-latn" : "fr-DZ", {
    timeZone: "Africa/Algiers", day: "2-digit", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function fmtSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
