import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { company } from "@/config/company";
import { services } from "@/config/services";
import { getDict } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { Logo } from "./logo";
import { WhatsAppIcon } from "./icons";
import { whatsappLink } from "@/config/company";

export function Footer({ locale }: { locale: Locale }) {
  const d = getDict(locale);
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ink text-white/80">
      <div className="h-1 bg-gradient-to-r from-brand via-brand to-brand-200" />
      <div className="container grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-5">
          <Logo locale={locale} variant="dark" />
          <p className="max-w-xs text-sm leading-relaxed text-white/70">{d.footer.about}</p>
          <a
            href={whatsappLink(d.contact.waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn !bg-[#25D366] !py-2.5 text-white hover:!bg-[#1fb957]"
          >
            <WhatsAppIcon className="h-5 w-5" />
            {d.common.whatsapp}
          </a>
        </div>

        <div>
          <h2 className="mb-4 text-base font-extrabold text-white">{d.common.quickLinks}</h2>
          <ul className="space-y-2.5 text-sm">
            {[
              [`/${locale}`, d.nav.home],
              [`/${locale}/about`, d.nav.about],
              [`/${locale}/services`, d.nav.services],
              [`/${locale}/quote`, d.nav.quote],
              [`/${locale}/contact`, d.nav.contact],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="transition hover:text-brand">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-1">
          <h2 className="mb-4 text-base font-extrabold text-white">{d.common.ourServices}</h2>
          <ul className="space-y-2.5 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/${locale}/services/${s.slug}`} className="transition hover:text-brand">{s[locale].title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-base font-extrabold text-white">{d.common.contactInfo}</h2>
          <ul className="space-y-3.5 text-sm">
            {company.phones.map((p) => (
              <li key={p.tel}>
                <a href={`tel:${p.tel}`} className="flex items-center gap-3 hover:text-brand">
                  <Phone className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                  <span className="ltr-isolate">{p.display}</span>
                </a>
              </li>
            ))}
            <li>
              <a href={`mailto:${company.email}`} className="flex items-center gap-3 hover:text-brand">
                <Mail className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                <span className="ltr-isolate">{company.email}</span>
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-brand" aria-hidden />
              {d.contact.locationValue}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/55 sm:flex-row">
          <p>
            © {year} {d.footer.legal} (KMS). {d.common.rights}
          </p>
          <p className="ltr-isolate">{company.domain}</p>
        </div>
      </div>
    </footer>
  );
}
