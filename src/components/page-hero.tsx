import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import type { Locale } from "@/i18n/config";

/** Compact dark banner used by inner pages (title + breadcrumb). */
export function PageHero({ locale, title, lead, crumbs, children }: { locale: Locale; title: string; lead?: string; crumbs: Crumb[]; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-ink text-white">
      <div aria-hidden className="absolute inset-y-0 end-0 w-1/2 -skew-x-12 bg-gradient-to-l from-brand/25 to-transparent rtl:skew-x-12" />
      <div aria-hidden className="absolute -bottom-px start-0 h-1 w-40 bg-brand" />
      <div className="container relative py-12 sm:py-16">
        <Breadcrumbs locale={locale} items={crumbs} />
        <h1 className="mt-5 max-w-3xl text-3xl font-extrabold sm:text-5xl">{title}</h1>
        {lead && <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{lead}</p>}
        {children}
      </div>
    </div>
  );
}
