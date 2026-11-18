import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { services } from "@/config/services";
import { siteUrl } from "@/config/company";
import { getDict } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { buildMetadata } from "@/lib/seo";
import { CtaBand } from "@/components/cta-band";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/section";
import { ServiceCard } from "@/components/service-card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDict(locale);
  return buildMetadata({ locale, path: "/services", title: d.seo.servicesTitle, description: d.seo.servicesDescription, keywords: d.seo.keywords });
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  return (
    <>
      <PageHero locale={locale} title={d.servicesPage.title} lead={d.servicesPage.lead} crumbs={[{ label: d.common.home, href: `/${locale}` }, { label: d.nav.services }]} />
      <Section tone="mist">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => <ServiceCard key={s.slug} service={s} locale={locale} priority={i < 3} />)}
        </div>
      </Section>
      <CtaBand locale={locale} title={d.servicesPage.ctaTitle} text={d.servicesPage.ctaText} button={d.cta.button} call={d.cta.call} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: services.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s[locale].title, url: `${siteUrl}/${locale}/services/${s.slug}` })),
        }}
      />
    </>
  );
}
