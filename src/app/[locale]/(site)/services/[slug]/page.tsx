import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, Phone } from "lucide-react";
import { company, siteUrl } from "@/config/company";
import { getService, serviceSlugs, services } from "@/config/services";
import { getDict } from "@/i18n";
import { isLocale, locales } from "@/i18n/config";
import { buildMetadata } from "@/lib/seo";
import { CtaBand } from "@/components/cta-band";
import { ServiceIconView } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/section";
import { ServiceCard } from "@/components/service-card";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => serviceSlugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = getService(slug);
  if (!isLocale(locale) || !s) return {};
  return buildMetadata({
    locale,
    path: `/services/${slug}`,
    title: s[locale].seoTitle,
    description: s[locale].seoDescription,
    keywords: s.keywords[locale],
    image: s.image,
  });
}

export default async function ServicePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const s = getService(slug);
  if (!isLocale(locale) || !s) notFound();
  const d = getDict(locale);
  const c = s[locale];
  const secondary = s[locale === "ar" ? "fr" : "ar"].title;
  const others = services.filter((x) => x.slug !== slug).slice(0, 3);

  return (
    <>
      <PageHero
        locale={locale}
        title={c.title}
        lead={c.short}
        crumbs={[{ label: d.common.home, href: `/${locale}` }, { label: d.nav.services, href: `/${locale}/services` }, { label: c.title }]}
      >
        <p className="mt-3 text-sm font-semibold text-brand-200">
          <span lang={locale === "ar" ? "fr" : "ar"} dir={locale === "ar" ? "ltr" : "rtl"}>{secondary}</span>
        </p>
      </PageHero>

      <Section>
        <div className="grid gap-10 lg:grid-cols-3 lg:gap-14">
          <div className="lg:col-span-2">
            <div className="relative overflow-hidden rounded-3xl shadow-lift">
              <Image src={s.image} alt={s.imageAlt[locale]} width={800} height={500} priority sizes="(min-width:1024px) 720px, 100vw" className="aspect-[16/10] w-full object-cover" />
              <span className="absolute start-4 top-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-white shadow-glow"><ServiceIconView name={s.icon} className="h-7 w-7" /></span>
            </div>

            <h2 className="mt-10 text-2xl font-extrabold">{d.serviceDetail.overview}</h2>
            <p className="mt-3 text-lg leading-relaxed text-ink-500">{c.intro}</p>

            <h2 className="mt-10 text-2xl font-extrabold">{d.serviceDetail.included}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {c.features.map((f) => (
                <li key={f} className="flex items-start gap-3 rounded-xl bg-mist p-4">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-white"><Check className="h-4 w-4" aria-hidden /></span>
                  <span className="font-semibold text-ink-700">{f}</span>
                </li>
              ))}
            </ul>

            <h2 className="mt-10 text-2xl font-extrabold">{d.serviceDetail.benefitsTitle}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {c.benefits.map((b) => (
                <div key={b.title} className="card p-5">
                  <h3 className="font-extrabold text-ink">{b.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{b.text}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl bg-ink p-7 text-white shadow-lift">
              <h2 className="text-xl font-extrabold">{d.serviceDetail.sideTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{d.serviceDetail.sideText}</p>
              <Link href={`/${locale}/quote?service=${s.slug}`} className="btn btn-primary btn-lg mt-6 w-full">{d.common.requestForService}</Link>
              <p className="mt-6 text-sm text-white/60">{d.serviceDetail.sidePhone}</p>
              {company.phones.map((p) => (
                <a key={p.tel} href={`tel:${p.tel}`} className="mt-2 flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 font-bold transition hover:bg-white/20">
                  <Phone className="h-4 w-4 text-brand" aria-hidden />
                  <span className="ltr-isolate">{p.display}</span>
                </a>
              ))}
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="mist">
        <h2 className="mb-8 text-2xl font-extrabold sm:text-3xl">{d.common.otherServices}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((o) => <ServiceCard key={o.slug} service={o} locale={locale} />)}
        </div>
      </Section>

      <CtaBand locale={locale} title={d.serviceDetail.ctaTitle} text={d.serviceDetail.ctaText} button={d.common.quote} call={d.cta.call} href={`/${locale}/quote?service=${s.slug}`} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: c.title,
          description: c.seoDescription,
          url: `${siteUrl}/${locale}/services/${s.slug}`,
          image: `${siteUrl}${s.image}`,
          areaServed: { "@type": "Country", name: "Algeria" },
          provider: { "@type": "GeneralContractor", "@id": `${siteUrl}/#business`, name: company.legalName },
        }}
      />
    </>
  );
}
