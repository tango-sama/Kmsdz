import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/company";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/ar/quote/confirmation", "/fr/quote/confirmation", "/ar/portal", "/fr/portal", "/ar/login", "/fr/login", "/ar/signup", "/fr/signup", "/ar/account", "/fr/account"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
