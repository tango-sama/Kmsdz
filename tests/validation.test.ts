import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidAlgerianPhone, normalizePhone, formatPhone } from "../src/lib/phone.ts";
import { contactSchema, quoteSchema, validateFiles } from "../src/lib/validation.ts";
import { ar } from "../src/i18n/ar.ts";
import { fr } from "../src/i18n/fr.ts";
import { services } from "../src/config/services.ts";
import { extractSheetId, normalizePrivateKey } from "../src/lib/sheets.ts";

describe("Algerian phone numbers", () => {
  for (const ok of ["0661204590", "0661 20 45 90", "+213 661 20 45 90", "00213661204570", "0555 12 34 56", "0770123456", "029 12 34 56", "٠٦٦١٢٠٤٥٩٠"]) {
    it(`accepts ${ok}`, () => assert.ok(isValidAlgerianPhone(ok)));
  }
  for (const bad of ["", "123", "0861204590", "066120459", "06612045901", "abcdefghij", "+33 6 12 34 56 78"]) {
    it(`rejects "${bad}"`, () => assert.ok(!isValidAlgerianPhone(bad)));
  }
  it("normalises and formats", () => {
    assert.equal(normalizePhone("+213 (661) 20-45-90"), "0661204590");
    assert.equal(formatPhone("0661204590"), "0661 20 45 90");
  });
});

describe("schemas", () => {
  it("accepts a minimal valid contact form", () => {
    assert.ok(contactSchema.safeParse({ fullName: "Ali", phone: "0661204590", message: "Bonjour, un devis svp." }).success);
  });
  it("rejects a bad e-mail but allows an empty one", () => {
    assert.ok(!contactSchema.safeParse({ fullName: "Ali", phone: "0661204590", email: "x@", message: "Bonjour, un devis svp." }).success);
    assert.ok(contactSchema.safeParse({ fullName: "Ali", phone: "0661204590", email: "", message: "Bonjour, un devis svp." }).success);
  });
  it("rejects past start dates", () => {
    const base = { fullName: "Ali", phone: "0661204590", customerType: "company", service: "other", wilaya: "55", commune: "Touggourt", projectType: "other", description: "Description suffisante ici" };
    assert.ok(!quoteSchema.safeParse({ ...base, startDate: "2020-01-01" }).success);
    assert.ok(quoteSchema.safeParse({ ...base, startDate: "" }).success);
  });
  it("limits file count, size and type", () => {
    assert.equal(validateFiles([{ name: "a.exe", size: 10, type: "" }]), "fileType");
    assert.equal(validateFiles([{ name: "a.pdf", size: 5 * 1024 * 1024, type: "application/pdf" }]), "fileSize");
    assert.equal(validateFiles(Array(4).fill({ name: "a.pdf", size: 10, type: "application/pdf" })), "fileCount");
    assert.equal(validateFiles([{ name: "a.PDF", size: 10, type: "application/pdf" }]), null);
  });
});

describe("i18n & content integrity", () => {
  const keys = (o: unknown, p = ""): string[] =>
    typeof o === "object" && o !== null
      ? Object.entries(o).flatMap(([k, v]) => keys(v, `${p}${p ? "." : ""}${k}`))
      : [p];
  it("Arabic and French dictionaries have identical keys", () => {
    const norm = (o: unknown) => [...new Set(keys(o).map((k) => k.replace(/\.\d+/g, "[]")))].sort(); // list lengths may differ per language
    assert.deepEqual(norm(ar), norm(fr));
  });
  it("every validation key used by the schemas has a translation in both languages", () => {
    for (const k of ["required", "name", "phone", "email", "choose", "commune", "description", "tooLong", "date", "pastDate", "fileType", "fileSize", "fileCount", "message", "consent"]) {
      assert.ok((ar.validation as Record<string, string>)[k], `ar.${k}`);
      assert.ok((fr.validation as Record<string, string>)[k], `fr.${k}`);
    }
  });
  it("has exactly nine services with unique slugs and both languages", () => {
    assert.equal(services.length, 9);
    assert.equal(new Set(services.map((s) => s.slug)).size, 9);
    for (const s of services) for (const l of ["ar", "fr"] as const) {
      assert.ok(s[l].title && s[l].intro && s[l].features.length >= 3 && s[l].benefits.length === 3, `${s.slug}/${l}`);
      assert.ok(s[l].seoTitle.length <= 110 && s[l].seoDescription.length <= 220, `${s.slug}/${l} seo length`);
    }
  });
});

describe("sheets helpers", () => {
  it("extracts the ID from a URL or a bare ID", () => {
    assert.equal(extractSheetId("https://docs.google.com/spreadsheets/d/1AbC-dEf_123/edit#gid=0"), "1AbC-dEf_123");
    assert.equal(extractSheetId("1AbC-dEf_123"), "1AbC-dEf_123");
  });
  it("normalises private keys pasted with literal \\n and quotes", () => {
    assert.equal(normalizePrivateKey('"-----BEGIN KEY-----\\nabc\\n-----END KEY-----\\n"'), "-----BEGIN KEY-----\nabc\n-----END KEY-----\n");
  });
});
