"use client";

import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { LOCALE_COOKIE, otherLocale, type Locale } from "@/i18n/config";

/** Swaps the locale segment of the current URL, keeping the page, query string and hash. */
export function LanguageSwitcher({ locale, label, ariaLabel, className = "" }: { locale: Locale; label: string; ariaLabel: string; className?: string }) {
  const pathname = usePathname() || `/${locale}`;
  const target = otherLocale(locale);
  const segments = pathname.split("/");
  segments[1] = target;
  const href = segments.join("/") || `/${target}`;

  return (
    <a
      href={href}
      hrefLang={target}
      lang={target}
      aria-label={ariaLabel}
      onClick={(e) => {
        try {
          document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
          e.currentTarget.href = `${href}${window.location.search}${window.location.hash}`;
        } catch {
          /* cookies blocked: navigation still works */
        }
      }}
      className={`inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-3.5 py-2 text-sm font-bold text-ink transition hover:border-brand hover:text-brand ${className}`}
    >
      <Globe className="h-4 w-4" aria-hidden />
      {label}
    </a>
  );
}
