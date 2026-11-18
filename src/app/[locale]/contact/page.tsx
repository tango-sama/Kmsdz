import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { company, whatsappLink } from "@/config/company";
import { getDict } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { buildMetadata } from "@/lib/seo";
import { ContactForm } from "@/components/contact-form";
import { WhatsAppIcon } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/section";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = getDict(locale);
  return buildMetadata({ locale, path: "/contact", title: d.seo.contactTitle, description: d.seo.contactDescription, keywords: d.seo.keywords });
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = getDict(locale);
  const c = d.contact;

  return (
    <>
      <PageHero locale={locale} title={c.title} lead={c.lead} crumbs={[{ label: d.common.home, href: `/${locale}` }, { label: c.breadcrumb }]} />
      <Section tone="mist" className="!py-12">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            <div className="card flex gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-white"><Phone className="h-6 w-6" aria-hidden /></span>
              <div>
                <h2 className="font-extrabold">{c.cards.phone}</h2>
                {company.phones.map((p) => (
                  <a key={p.tel} href={`tel:${p.tel}`} className="block font-bold text-ink-700 hover:text-brand"><span className="ltr-isolate">{p.display}</span></a>
                ))}
              </div>
            </div>
            <div className="card flex gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-white"><Mail className="h-6 w-6" aria-hidden /></span>
              <div className="min-w-0">
                <h2 className="font-extrabold">{c.cards.email}</h2>
                <a href={`mailto:${company.email}`} className="block break-all font-bold text-ink-700 hover:text-brand"><span className="ltr-isolate">{company.email}</span></a>
              </div>
            </div>
            <div className="card flex gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand text-white"><MapPin className="h-6 w-6" aria-hidden /></span>
              <div>
                <h2 className="font-extrabold">{c.cards.location}</h2>
                <p className="font-bold text-ink-700">{c.locationValue}</p>
                {company.streetAddress && <p className="text-sm text-ink-500">{company.streetAddress}</p>}
              </div>
            </div>
            <a href={whatsappLink(c.waMessage)} target="_blank" rel="noopener noreferrer" className="card flex gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#25D366] text-white"><WhatsAppIcon className="h-7 w-7" /></span>
              <div>
                <h2 className="font-extrabold">{c.cards.whatsapp}</h2>
                <p className="font-bold text-ink-700">{c.whatsappText}</p>
              </div>
            </a>
            <div className="card p-5">
              <h2 className="mb-3 flex items-center gap-2 font-extrabold"><Clock className="h-5 w-5 text-brand" aria-hidden />{c.hoursTitle}</h2>
              {company.businessHours ? (
                <ul className="space-y-1.5 text-sm">
                  {company.businessHours.map((h) => (
                    <li key={h.days.fr} className="flex justify-between gap-3"><span className="text-ink-500">{h.days[locale]}</span><span className="ltr-isolate font-bold">{h.hours}</span></li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-ink-500">{c.hoursPending}</p>
              )}
            </div>
          </div>
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-4 text-2xl font-extrabold">{c.mapTitle}</h2>
          {company.mapsEmbedUrl ? (
            <iframe
              title={c.mapTitle}
              src={company.mapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-[16/9] w-full rounded-3xl border-0 shadow-card sm:aspect-[21/9]"
              allowFullScreen
            />
          ) : (
            <div className="grid aspect-[16/9] place-items-center rounded-3xl border-2 border-dashed border-ink/20 bg-white p-6 text-center sm:aspect-[21/7]">
              <div>
                <MapPin className="mx-auto h-10 w-10 text-brand" aria-hidden />
                <p className="mt-3 max-w-md text-ink-500">{c.mapPlaceholder}</p>
              </div>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
