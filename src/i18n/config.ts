export const locales = ["ar", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ar";
export const LOCALE_COOKIE = "kms-lang";

export const localeMeta: Record<Locale, { dir: "rtl" | "ltr"; htmlLang: string; ogLocale: string; label: string }> = {
  ar: { dir: "rtl", htmlLang: "ar-DZ", ogLocale: "ar_DZ", label: "العربية" },
  fr: { dir: "ltr", htmlLang: "fr-DZ", ogLocale: "fr_DZ", label: "Français" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function otherLocale(l: Locale): Locale {
  return l === "ar" ? "fr" : "ar";
}
