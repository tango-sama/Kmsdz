import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Award, Eye, Handshake, Target, Timer, Users, Compass } from "lucide-react";
import { getDict } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { buildMetadata } from "@/lib/seo";
import { CtaBand } from "@/components/cta-band";
import { PageHero } from "@/components/page-hero";
import { Section, SectionHeading } from "@/components/section";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDict(locale);
  return buildMetadata({ locale, path: "/about", title: d.seo.aboutTitle, description: d.seo.aboutDescription, keywords: d.seo.keywords });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  const cardIcons = [Target, Eye, Compass];
  const commitIcons = [Award, Timer, Users, Handshake];

  return (
    <>
      <PageHero locale={locale} title={d.about.title} lead={d.about.lead} crumbs={[{ label: d.common.home, href: `/${locale}` }, { label: d.nav.about }]} />

      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow={d.about.whoTitle} title={d.site.tagline} />
            <div className="-mt-4 space-y-4 text-lg leading-relaxed text-ink-500">
              {d.about.whoText.map((p) => <p key={p}>{p}</p>)}
            </div>
          </div>
          <div className="relative">
            <div aria-hidden className="absolute -end-3 -top-3 h-full w-full rounded-3xl bg-brand/15" />
            <Image src="/images/about.webp" alt={d.intro.imageAlt} width={1400} height={510} sizes="(min-width:1024px) 600px, 100vw" className="relative aspect-[4/3] w-full rounded-3xl object-cover shadow-lift" />
          </div>
        </div>
      </Section>

      <Section tone="mist">
        <div className="grid gap-6 md:grid-cols-3">
          {d.about.cards.map((c, i) => {
            const Icon = cardIcons[i];
            return (
              <div key={c.title} className="card p-7">
                <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand text-white shadow-glow"><Icon className="h-7 w-7" aria-hidden /></span>
                <h2 className="text-xl font-extrabold">{c.title}</h2>
                <p className="mt-3 leading-relaxed text-ink-500">{c.text}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section tone="dark">
        <SectionHeading title={d.about.commitmentsTitle} invert />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {d.about.commitments.map((c, i) => {
            const Icon = commitIcons[i];
            return (
              <div key={c.title} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                <Icon className="mb-4 h-9 w-9 text-brand" aria-hidden />
                <h3 className="text-lg font-extrabold">{c.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/70">{c.text}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">{d.about.keywordsTitle}</h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">{d.about.keywordsText}</p>
        </div>
      </Section>

      <CtaBand locale={locale} title={d.about.ctaTitle} text={d.cta.text} button={d.cta.button} call={d.cta.call} />
    </>
  );
}
