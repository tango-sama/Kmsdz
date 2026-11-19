import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDict } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/page-hero";
import { QuoteForm } from "@/components/quote-form";
import { Section } from "@/components/section";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDict(locale);
  return buildMetadata({ locale, path: "/quote", title: d.seo.quoteTitle, description: d.seo.quoteDescription, keywords: d.seo.keywords });
}

export default async function QuotePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  return (
    <>
      <PageHero locale={locale} title={d.quote.title} lead={d.quote.lead} crumbs={[{ label: d.common.home, href: `/${locale}` }, { label: d.quote.breadcrumb }]} />
      <Section tone="mist" className="!py-10 sm:!py-14">
        <div className="mx-auto max-w-3xl">
          <QuoteForm />
        </div>
      </Section>
    </>
  );
}
