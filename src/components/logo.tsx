import Image from "next/image";
import Link from "next/link";
import { company } from "@/config/company";
import type { Locale } from "@/i18n/config";
import { getDict } from "@/i18n";

export function Logo({ locale, variant = "light", priority = false }: { locale: Locale; variant?: "light" | "dark"; priority?: boolean }) {
  const d = getDict(locale);
  return (
    <Link href={`/${locale}`} className="flex items-center gap-3" aria-label={`${company.brand} - ${d.nav.home}`}>
      <Image
        src={`/images/brand/logo-${variant}.png`}
        alt=""
        width={648}
        height={487}
        className="h-11 w-auto sm:h-12"
        priority={priority}
      />
      <span className="leading-tight">
        <span className={`block text-[15px] font-extrabold sm:text-base ${variant === "dark" ? "text-white" : "text-ink"}`}>
          {locale === "ar" ? company.nameAr : (
            <>Sarl <span className="text-brand">Kat</span> Multi Services</>
          )}
        </span>
        <span className={`block text-xs font-medium ${variant === "dark" ? "text-white/65" : "text-ink-500"}`}>
          {locale === "ar" ? "Sarl Kat Multi Services" : company.nameAr}
        </span>
      </span>
    </Link>
  );
}
