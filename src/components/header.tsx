import { Mail, MapPin, Phone } from "lucide-react";
import { company } from "@/config/company";
import { getDict } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { HeaderNav } from "./header-nav";
import { Logo } from "./logo";

export function Header({ locale }: { locale: Locale }) {
  const d = getDict(locale);
  const items = [
    { href: `/${locale}`, label: d.nav.home },
    { href: `/${locale}/about`, label: d.nav.about },
    { href: `/${locale}/services`, label: d.nav.services },
    { href: `/${locale}/contact`, label: d.nav.contact },
  ];
  return (
    <>
      <div className="hidden bg-ink text-[13px] text-white/80 lg:block">
        <div className="container flex items-center justify-between py-2">
          <div className="flex items-center gap-6">
            {company.phones.map((p) => (
              <a key={p.tel} href={`tel:${p.tel}`} className="flex items-center gap-2 hover:text-brand">
                <Phone className="h-3.5 w-3.5 text-brand" aria-hidden />
                <span className="ltr-isolate">{p.display}</span>
              </a>
            ))}
            <a href={`mailto:${company.email}`} className="flex items-center gap-2 hover:text-brand">
              <Mail className="h-3.5 w-3.5 text-brand" aria-hidden />
              <span className="ltr-isolate">{company.email}</span>
            </a>
          </div>
          <span className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-brand" aria-hidden />
            {d.contact.locationValue}
          </span>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-white/90 backdrop-blur-lg">
        <div className="container flex h-[72px] items-center justify-between gap-4">
          <Logo locale={locale} priority />
          <HeaderNav
            locale={locale}
            items={items}
            quoteHref={`/${locale}/quote`}
            phone={company.phones[0]}
            labels={{
              quote: d.nav.quote,
              openMenu: d.nav.openMenu,
              closeMenu: d.nav.closeMenu,
              menu: d.nav.menu,
              switchTo: d.nav.switchTo,
              switchAria: d.nav.switchAria,
              main: d.nav.main,
              call: d.common.callUs,
            }}
          />
        </div>
      </header>
    </>
  );
}
