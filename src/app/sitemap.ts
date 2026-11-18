import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/company";
import { serviceSlugs } from "@/config/services";
import { defaultLocale, locales } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/about", "/services", "/quote", "/contact", ...serviceSlugs.map((s) => `/services/${s}`)];
  const now = new Date();
  return paths.flatMap((p) =>
    locales.map((l) => ({
      url: `${siteUrl}/${l}${p}`,
      lastModified: now,
      changeFrequency: p === "" ? ("weekly" as const) : ("monthly" as const),
      priority: p === "" ? 1 : p.startsWith("/services/") ? 0.7 : 0.8,
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((x) => [x, `${siteUrl}/${x}${p}`])),
          "x-default": `${siteUrl}/${defaultLocale}${p}`,
        },
      },
    })),
  );
}
