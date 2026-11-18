import { z } from "zod";
import { serviceSlugs } from "@/config/services";
import { wilayaCodes } from "@/config/wilayas";
import { isValidAlgerianPhone, normalizePhone } from "./phone";

/**
 * Shared validation (browser + server). Error messages are KEYS of `dict.validation`,
 * translated at display time - so the same rules produce Arabic or French messages.
 */
export const customerTypes = ["individual", "company", "institution"] as const;
export const projectTypes = ["residential", "commercial", "industrial", "other"] as const;
export const serviceChoices = [...serviceSlugs, "other"] as const;

export const FILE_LIMITS = {
  maxFiles: 3,
  maxTotalBytes: 4 * 1024 * 1024, // Vercel serverless request bodies are capped at ~4.5 MB
  allowedMime: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  allowedExt: ["pdf", "jpg", "jpeg", "png", "webp"],
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const name = z.string().trim().min(2, { message: "name" }).max(80, { message: "tooLong" });
const phone = z
  .string()
  .trim()
  .min(1, { message: "required" })
  .refine((v) => isValidAlgerianPhone(v), { message: "phone" })
  .transform((v) => normalizePhone(v));
const email = z
  .string()
  .trim()
  .max(120, { message: "tooLong" })
  .refine((v) => v === "" || EMAIL.test(v), { message: "email" })
  .default("");

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const optionalDate = z
  .string()
  .trim()
  .default("")
  .superRefine((v, ctx) => {
    if (v === "") return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) {
      ctx.addIssue({ code: "custom", message: "date" });
      return;
    }
    // allow yesterday to absorb timezone differences
    const min = new Date(Date.now() - 36 * 3600 * 1000).toISOString().slice(0, 10);
    if (v < min || v > `${Number(todayIso().slice(0, 4)) + 5}-12-31`) ctx.addIssue({ code: "custom", message: "pastDate" });
  });

export const quoteSchema = z.object({
  fullName: name,
  phone,
  email,
  customerType: z.enum(customerTypes, { message: "choose" }),
  service: z.enum(serviceChoices, { message: "choose" }),
  wilaya: z.enum(wilayaCodes as [string, ...string[]], { message: "choose" }),
  commune: z.string().trim().min(2, { message: "commune" }).max(80, { message: "tooLong" }),
  projectType: z.enum(projectTypes, { message: "choose" }),
  description: z.string().trim().min(10, { message: "description" }).max(2000, { message: "tooLong" }),
  budget: z.string().trim().max(60, { message: "tooLong" }).default(""),
  startDate: optionalDate,
  notes: z.string().trim().max(1000, { message: "tooLong" }).default(""),
});
export type QuoteInput = z.input<typeof quoteSchema>;
export type QuoteData = z.output<typeof quoteSchema>;

export const contactSchema = z.object({
  fullName: name,
  phone,
  email,
  message: z.string().trim().min(10, { message: "message" }).max(2000, { message: "tooLong" }),
});
export type ContactData = z.output<typeof contactSchema>;

/** Which fields belong to each step of the quote form (used for per-step validation). */
export const quoteStepFields: Record<1 | 2 | 3, (keyof QuoteInput)[]> = {
  1: ["fullName", "phone", "email", "customerType"],
  2: ["service", "wilaya", "commune", "projectType", "description"],
  3: ["budget", "startDate", "notes"],
};

export type FieldErrors = Record<string, string>;

export function issuesToErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const out: FieldErrors = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "_");
    if (!(key in out)) out[key] = i.message;
  }
  return out;
}

export function validateFiles(files: { name: string; size: number; type: string }[]): string | null {
  if (files.length > FILE_LIMITS.maxFiles) return "fileCount";
  let total = 0;
  for (const f of files) {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (!FILE_LIMITS.allowedExt.includes(ext) || (f.type && !FILE_LIMITS.allowedMime.includes(f.type))) return "fileType";
    total += f.size;
  }
  if (total > FILE_LIMITS.maxTotalBytes) return "fileSize";
  return null;
}
