import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/company";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/ar/quote/confirmation", "/fr/quote/confirmation", "/ar/portal", "/fr/portal"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
