/**
 * Single source of truth for company information.
 * Edit here (or via environment variables) - never hardcode these values in components.
 * Anything not provided by the company is left empty / null on purpose (no invented data).
 */
const digits = (s: string) => s.replace(/\D/g, "");

export const company = {
  legalName: "SARL KAT Multi Services",
  brand: "KMS",
  nameAr: "شركة كات متعددة الخدمات",
  city: { ar: "تقرت", fr: "Touggourt" },
  country: { ar: "الجزائر", fr: "Algérie" },
  countryCode: "DZ",
  /** Street address was not provided: left null on purpose. */
  streetAddress: null as string | null,
  phones: [
    { display: "0661 20 45 90", tel: "+213661204590" },
    { display: "0661 20 45 70", tel: "+213661204570" },
  ],
  email: "contact@kms-dz.com",
  domain: "www.kms-dz.com",
  /** WhatsApp number, international format without "+". Override with NEXT_PUBLIC_WHATSAPP_NUMBER. */
  whatsapp: digits(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "213661204590"),
  /** Google Maps "Embed a map" src URL. Empty = placeholder shown (no invented coordinates). */
  mapsEmbedUrl: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL || "",
  /**
   * Business hours - configurable later. Leave `null` until provided.
   * Example: [{ days: { ar: "من السبت إلى الخميس", fr: "Samedi - Jeudi" }, hours: "08:00 - 17:00" }]
   */
  businessHours: null as null | { days: { ar: string; fr: string }; hours: string }[],
  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
  },
} as const;

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `https://${company.domain}`).replace(/\/$/, "");

export const primaryPhone = company.phones[0];

export function whatsappLink(text?: string) {
  const base = `https://wa.me/${company.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
