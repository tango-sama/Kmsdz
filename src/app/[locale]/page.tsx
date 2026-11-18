import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Award, Building2, Check, Clock, Handshake, Home, Landmark, Layers, Mail, MapPin, Phone, Timer, Users, Wrench, ArrowLeft, ArrowRight, Compass,
} from "lucide-react";
import { company, whatsappLink } from "@/config/company";
import { getService, services } from "@/config/services";
import { getDict } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { buildMetadata } from "@/lib/seo";
import { CtaBand } from "@/components/cta-band";
import { WhatsAppIcon, ServiceIconView } from "@/components/icons";
import { Section, SectionHeading } from "@/components/section";
import { ServiceCard } from "@/components/service-card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDict(locale);
  return buildMetadata({ locale, title: d.seo.homeTitle, description: d.seo.homeDescription, keywords: d.seo.keywords });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const badgeIcons = [Award, Timer, Users, Handshake];
  const whyIcons = [Award, Clock, Users, Wrench, Layers, Handshake];
  const stepIcons = [Compass, Layers, Building2, Wrench, Handshake];
  const audienceIcons = [Home, Building2, Landmark, Users];
  const featured = ["construction-batiment", "energie-solaire", "securite-videosurveillance"].map((s) => getService(s)!);

  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <Image src="/images/hero.webp" alt={d.hero.imageAlt} fill priority sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/35 rtl:bg-gradient-to-l" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-ink/80 to-transparent" />
        <div className="container py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl animate-fade-up">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold backdrop-blur">
              <MapPin className="h-4 w-4 text-brand" aria-hidden />
              {d.site.nameLatin} · {d.hero.kicker}
            </p>
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl">{d.hero.title}</h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">{d.hero.text}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={`/${locale}/services`} className="btn btn-primary btn-lg">{d.hero.cta1}</Link>
              <Link href={`/${locale}/quote`} className="btn btn-ghost btn-lg">{d.hero.cta2}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* COMMITMENT STRIP */}
      <div className="container relative z-10 -mt-8 sm:-mt-10">
        <ul className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-3 shadow-lift ring-1 ring-ink/5 sm:gap-4 sm:p-4 lg:grid-cols-4">
          {d.hero.badges.map((b, i) => {
            const Icon = badgeIcons[i];
            return (
              <li key={b} className="flex items-center gap-3 rounded-xl bg-mist px-3 py-3 sm:px-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand text-white"><Icon className="h-5 w-5" aria-hidden /></span>
                <span className="text-sm font-extrabold text-ink sm:text-[15px]">{b}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* INTRO */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <div aria-hidden className="absolute -start-3 -top-3 h-full w-full rounded-3xl border-2 border-brand/40" />
            <Image src="/images/about.webp" alt={d.intro.imageAlt} width={1400} height={510} sizes="(min-width:1024px) 600px, 100vw" className="relative aspect-[4/3] w-full rounded-3xl object-cover shadow-lift" />
          </div>
          <div>
            <SectionHeading eyebrow={d.intro.eyebrow} title={d.intro.title} text={d.intro.text} />
            <ul className="-mt-4 space-y-3">
              {d.intro.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-ink-700">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-brand"><Check className="h-4 w-4" aria-hidden /></span>
                  <span className="font-semibold">{p}</span>
                </li>
              ))}
            </ul>
            <Link href={`/${locale}/about`} className="btn btn-outline mt-8">
              {d.intro.more}
              <Arrow className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </Section>

      {/* SERVICES OVERVIEW */}
      <Section tone="mist" id="services">
        <SectionHeading eyebrow={d.servicesSection.eyebrow} title={d.servicesSection.title} text={d.servicesSection.text} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <ServiceCard key={s.slug} service={s} locale={locale} priority={i < 3} />
          ))}
        </div>
      </Section>

      {/* WHY KMS */}
      <Section tone="dark">
        <SectionHeading eyebrow={d.why.eyebrow} title={d.why.title} invert />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {d.why.items.map((it, i) => {
            const Icon = whyIcons[i];
            return (
              <div key={it.title} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:bg-white/10">
                <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand text-white shadow-glow"><Icon className="h-6 w-6" aria-hidden /></span>
                <h3 className="text-lg font-extrabold">{it.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/70">{it.text}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* METHOD */}
      <Section>
        <SectionHeading eyebrow={d.method.eyebrow} title={d.method.title} text={d.method.text} center />
        <ol className="grid gap-6 md:grid-cols-5">
          {d.method.steps.map((s, i) => {
            const Icon = stepIcons[i];
            return (
              <li key={s.title} className="relative rounded-2xl bg-mist p-5 text-center">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-white text-brand shadow-card ring-2 ring-brand/30"><Icon className="h-6 w-6" aria-hidden /></span>
                <span className="absolute end-4 top-3 text-3xl font-extrabold text-ink/10">{i + 1}</span>
                <h3 className="text-base font-extrabold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.text}</p>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* FEATURED */}
      <Section tone="mist">
        <SectionHeading eyebrow={d.featured.eyebrow} title={d.featured.title} />
        <div className="space-y-10 lg:space-y-14">
          {featured.map((s, i) => {
            const c = s[locale];
            return (
              <article key={s.slug} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
                <div className={i % 2 ? "lg:order-2" : ""}>
                  <div className="relative overflow-hidden rounded-3xl shadow-lift">
                    <Image src={s.image} alt={s.imageAlt[locale]} width={800} height={500} sizes="(min-width:1024px) 560px, 100vw" className="aspect-[16/10] w-full object-cover" />
                    <span className="absolute start-4 top-4 grid h-12 w-12 place-items-center rounded-xl bg-brand text-white shadow-glow"><ServiceIconView name={s.icon} className="h-6 w-6" /></span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold sm:text-3xl">{c.title}</h3>
                  <p className="mt-3 leading-relaxed text-ink-500">{c.intro}</p>
                  <ul className="mt-5 space-y-2.5">
                    {c.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-ink-700">
                        <Check className="mt-1 h-5 w-5 shrink-0 text-brand" aria-hidden />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link href={`/${locale}/quote?service=${s.slug}`} className="btn btn-primary">{d.common.quote}</Link>
                    <Link href={`/${locale}/services/${s.slug}`} className="btn btn-outline">{d.common.readMore}<Arrow className="h-4 w-4" aria-hidden /></Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      {/* AUDIENCE */}
      <Section>
        <SectionHeading eyebrow={d.audience.eyebrow} title={d.audience.title} center />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {d.audience.items.map((a, i) => {
            const Icon = audienceIcons[i];
            return (
              <li key={a} className="flex items-center gap-4 rounded-2xl border border-ink/10 p-5 transition hover:border-brand hover:shadow-card">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><Icon className="h-6 w-6" aria-hidden /></span>
                <span className="font-extrabold text-ink">{a}</span>
              </li>
            );
          })}
        </ul>
      </Section>

      <CtaBand locale={locale} title={d.cta.title} text={d.cta.text} button={d.cta.button} call={d.cta.call} />

      {/* CONTACT */}
      <Section tone="mist">
        <SectionHeading eyebrow={d.contactStrip.eyebrow} title={d.contactStrip.title} text={d.contactStrip.text} center />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="card p-6">
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand text-white"><Phone className="h-5 w-5" aria-hidden /></span>
            <h3 className="font-extrabold">{d.common.phone}</h3>
            <div className="mt-2 space-y-1">
              {company.phones.map((p) => (
                <a key={p.tel} href={`tel:${p.tel}`} className="block font-bold text-ink-700 hover:text-brand"><span className="ltr-isolate">{p.display}</span></a>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand text-white"><Mail className="h-5 w-5" aria-hidden /></span>
            <h3 className="font-extrabold">{d.common.email}</h3>
            <a href={`mailto:${company.email}`} className="mt-2 block break-all font-bold text-ink-700 hover:text-brand"><span className="ltr-isolate">{company.email}</span></a>
          </div>
          <div className="card p-6">
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand text-white"><MapPin className="h-5 w-5" aria-hidden /></span>
            <h3 className="font-extrabold">{d.common.location}</h3>
            <p className="mt-2 font-bold text-ink-700">{d.contact.locationValue}</p>
          </div>
          <a href={whatsappLink(d.contact.waMessage)} target="_blank" rel="noopener noreferrer" className="card flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-lift">
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-[#25D366] text-white"><WhatsAppIcon className="h-6 w-6" /></span>
            <h3 className="font-extrabold">{d.common.whatsapp}</h3>
            <p className="mt-2 font-bold text-ink-700">{d.contact.whatsappText}</p>
          </a>
        </div>
      </Section>
    </>
  );
}
