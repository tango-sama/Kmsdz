import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { siteUrl } from "@/config/company";
import { JsonLd } from "./json-ld";
import type { Locale } from "@/i18n/config";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ locale, items, tone = "dark" }: { locale: Locale; items: Crumb[]; tone?: "dark" | "light" }) {
  const Sep = locale === "ar" ? ChevronLeft : ChevronRight;
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.label,
      ...(it.href ? { item: `${siteUrl}${it.href}` } : {}),
    })),
  };
  return (
    <nav aria-label={locale === "ar" ? "مسار التنقل" : "Fil d'Ariane"} className={`text-sm ${tone === "dark" ? "text-white/70" : "text-ink-500"}`}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {it.href ? (
              <Link href={it.href} className="transition hover:text-brand">{it.label}</Link>
            ) : (
              <span aria-current="page" className={`font-bold ${tone === "dark" ? "text-white" : "text-ink"}`}>{it.label}</span>
            )}
            {i < items.length - 1 && <Sep className="h-3.5 w-3.5 opacity-60" aria-hidden />}
          </li>
        ))}
      </ol>
      <JsonLd data={ld} />
    </nav>
  );
}
