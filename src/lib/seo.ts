import type { Metadata } from "next";
import { company, siteUrl } from "@/config/company";
import { locales, localeMeta, type Locale, defaultLocale } from "@/i18n/config";

export function url(locale: Locale, path = "") {
  return `${siteUrl}/${locale}${path === "/" ? "" : path}`;
}

type Args = {
  locale: Locale;
  path?: string; // "" | "/about" | "/services/x"
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  noindex?: boolean;
};

export function buildMetadata({ locale, path = "", title, description, keywords, image = "/og.jpg", noindex }: Args): Metadata {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = url(l, path);
  languages["x-default"] = url(defaultLocale, path);
  const imgUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url(locale, path), languages },
    openGraph: {
      type: "website",
      siteName: `${company.legalName} (${company.brand})`,
      title,
      description,
      url: url(locale, path),
      locale: localeMeta[locale].ogLocale,
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeMeta[l].ogLocale),
      images: [{ url: imgUrl, width: 1200, height: 630, alt: company.legalName }],
    },
    twitter: { card: "summary_large_image", title, description, images: [imgUrl] },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
