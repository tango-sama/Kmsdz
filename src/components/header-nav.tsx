"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import type { Locale } from "@/i18n/config";

type Item = { href: string; label: string };
type Props = {
  locale: Locale;
  items: Item[];
  quoteHref: string;
  labels: { quote: string; openMenu: string; closeMenu: string; menu: string; switchTo: string; switchAria: string; main: string; call: string };
  phone: { display: string; tel: string };
};

export function HeaderNav({ locale, items, quoteHref, labels, phone }: Props) {
  const pathname = usePathname() || "";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === `/${locale}` ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  return (
    <>
      <nav aria-label={labels.main} className="hidden items-center gap-1 lg:flex">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-current={isActive(it.href) ? "page" : undefined}
            className={`rounded-lg px-3.5 py-2 text-[15px] font-bold transition hover:text-brand ${isActive(it.href) ? "text-brand" : "text-ink-700"}`}
          >
            {it.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher locale={locale} label={labels.switchTo} ariaLabel={labels.switchAria} className="hidden sm:inline-flex" />
        <Link href={quoteHref} className="btn btn-primary hidden !py-2.5 lg:inline-flex">
          {labels.quote}
        </Link>
        <a href={`tel:${phone.tel}`} aria-label={`${labels.call} ${phone.display}`} className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-white shadow-glow lg:hidden">
          <Phone className="h-5 w-5" aria-hidden />
        </a>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={labels.openMenu}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="grid h-11 w-11 place-items-center rounded-xl border border-ink/15 text-ink lg:hidden"
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      </div>

      {/* mobile drawer */}
      <div id="mobile-menu" className={`fixed inset-0 z-50 overflow-hidden lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={labels.menu}
          className={`absolute inset-y-0 end-0 flex w-[86%] max-w-sm flex-col bg-ink p-6 text-white shadow-lift transition-transform duration-300 ${
            open ? "translate-x-0" : locale === "ar" ? "-translate-x-full" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-extrabold">{labels.menu}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label={labels.closeMenu} className="grid h-11 w-11 place-items-center rounded-xl bg-white/10" tabIndex={open ? 0 : -1}>
              <X className="h-6 w-6" aria-hidden />
            </button>
          </div>
          <nav className="mt-6 flex flex-col gap-1" aria-label={labels.main}>
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                tabIndex={open ? 0 : -1}
                aria-current={isActive(it.href) ? "page" : undefined}
                className={`rounded-xl px-4 py-3.5 text-lg font-bold transition ${isActive(it.href) ? "bg-brand text-white" : "text-white/90 hover:bg-white/10"}`}
              >
                {it.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-3 pt-8">
            <Link href={quoteHref} tabIndex={open ? 0 : -1} className="btn btn-primary btn-lg w-full">
              {labels.quote}
            </Link>
            <a href={`tel:${phone.tel}`} tabIndex={open ? 0 : -1} className="btn btn-ghost w-full">
              <Phone className="h-5 w-5" aria-hidden />
              <span className="ltr-isolate">{phone.display}</span>
            </a>
            <LanguageSwitcher locale={locale} label={labels.switchTo} ariaLabel={labels.switchAria} className="w-full justify-center !bg-white/10 !text-white" />
          </div>
        </aside>
      </div>
    </>
  );
}
