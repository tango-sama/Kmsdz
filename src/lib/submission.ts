import { createHash } from "node:crypto";
import { getService } from "@/config/services";
import { wilayas } from "@/config/wilayas";
import { guardCell, SHEET_COLUMNS } from "./sheets";
import type { ContactData, QuoteData } from "./validation";

const CUSTOMER_FR = { individual: "Particulier", company: "Entreprise", institution: "Institution / Administration" } as const;
const PROJECT_FR = { residential: "Résidentiel", commercial: "Commercial", industrial: "Industriel", other: "Autre" } as const;

/** Stable 6-char code derived from the browser's idempotency key (same key => same code => no duplicates). */
export function submissionSuffix(idempotencyKey: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = createHash("sha256").update(idempotencyKey).digest();
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

/** Date parts in Algeria time (Africa/Algiers, UTC+1). */
export function algiersParts(d = new Date()) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Algiers",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}:${p.second}`, compact: `${p.year.slice(2)}${p.month}${p.day}` };
}

export function makeReference(idempotencyKey: string, d = new Date()): string {
  return `KMS-${algiersParts(d).compact}-${submissionSuffix(idempotencyKey)}`;
}

type Common = { reference: string; locale: "ar" | "fr"; files: string; now?: Date };

export function buildQuoteRow(data: QuoteData, c: Common): string[] {
  const svc = data.service === "other" ? null : getService(data.service);
  const w = wilayas.find((x) => x.code === data.wilaya);
  const p = algiersParts(c.now);
  const row = [
    c.reference,
    `${p.date} ${p.time}`,
    guardCell(data.fullName),
    data.phone,
    guardCell(data.email),
    CUSTOMER_FR[data.customerType],
    svc ? svc.fr.title : "Autre / non précisé",
    w ? `${w.code} - ${w.fr}` : data.wilaya,
    guardCell(data.commune),
    PROJECT_FR[data.projectType],
    guardCell(data.description),
    guardCell(data.budget),
    data.startDate,
    guardCell(data.notes),
    c.files,
    "New",
    c.locale === "ar" ? "Arabic" : "French",
    "Quote request",
  ];
  if (row.length !== SHEET_COLUMNS.length) throw new Error("Row/column mismatch");
  return row;
}

export function buildContactRow(data: ContactData, c: Common): string[] {
  const p = algiersParts(c.now);
  const row = [
    c.reference,
    `${p.date} ${p.time}`,
    guardCell(data.fullName),
    data.phone,
    guardCell(data.email),
    "", // customer type
    "Contact (general message)",
    "", "", "",
    guardCell(data.message),
    "", "", "",
    c.files,
    "New",
    c.locale === "ar" ? "Arabic" : "French",
    "Contact message",
  ];
  if (row.length !== SHEET_COLUMNS.length) throw new Error("Row/column mismatch");
  return row;
}
